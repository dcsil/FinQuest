"""
Service for generating educational modules using LLM
"""
import json

from sqlalchemy.orm import Session

from ..db.models import User, Module, ModuleVersion, ModuleQuestion, ModuleChoice
from ..schemas import ModuleContent
from .llm.service import LLMService
from .llm.models import LLMMessage, StructuredOutputConfig
from .llm.utils import get_gemini_compatible_schema


class ModuleGenerator:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def generate_module_from_profile(
        self,
        db: Session,
        user: User,
        topic: str,
        reason: str
    ) -> Module:
        """
        Generate a tailored learning module for a user based on their profile and a specific topic.
        """
        # Gather Context
        # We'll use the user's profile data (goals, experience, etc.)
        # and their portfolio summary if available.
        
        # Get onboarding data
        from ..db.models import OnboardingResponse
        onboarding = db.query(OnboardingResponse).filter(
            OnboardingResponse.user_id == user.id
        ).order_by(OnboardingResponse.submitted_at.desc()).first()
        
        profile_context = "User Profile:\n"
        if onboarding:
            answers = onboarding.answers
            profile_context += f"- Financial Goal: {answers.get('financialGoals', 'Not specified')}\n"
            profile_context += f"- Experience Level: {answers.get('investingExperience', 'Not specified')}\n"
            profile_context += f"- Risk Tolerance: {answers.get('riskTolerance', 'Not specified')}\n"
            profile_context += f"- Investment Horizon: {answers.get('investmentHorizon', 'Not specified')}\n"
        else:
            profile_context += "No specific profile data available.\n"

        # Get portfolio context
        portfolio_context = "Portfolio Context:\n"
        if user.portfolio:
            # Fetch latest valuation snapshot
            from ..db.models import PortfolioValuationSnapshot
            latest_snapshot = db.query(PortfolioValuationSnapshot).filter(
                PortfolioValuationSnapshot.portfolio_id == user.portfolio.id
            ).order_by(PortfolioValuationSnapshot.as_of.desc()).first()

            if latest_snapshot:
                portfolio_context += f"- Total Value: {latest_snapshot.total_value:,.2f} {user.base_currency}\n"
                
                if latest_snapshot.allocation_by_type:
                    portfolio_context += "- Asset Allocation:\n"
                    for asset_type, pct in latest_snapshot.allocation_by_type.items():
                        portfolio_context += f"  * {asset_type}: {pct:.1f}%\n"
                
                if latest_snapshot.allocation_by_sector:
                    # Sort sectors by percentage descending and take top 3
                    sorted_sectors = sorted(
                        latest_snapshot.allocation_by_sector.items(), 
                        key=lambda x: x[1], 
                        reverse=True
                    )[:3]
                    portfolio_context += "- Top Sectors:\n"
                    for sector, pct in sorted_sectors:
                        portfolio_context += f"  * {sector}: {pct:.1f}%\n"
            else:
                 portfolio_context += f"- Portfolio created but no valuation data available yet.\n"
        else:
            portfolio_context += "No portfolio created yet.\n"

        # Construct Prompt
        system_prompt = (
            "You are an expert financial educator. Your goal is to create a personalized, "
            "short, and engaging learning module for a user based on their financial profile and current situation.\n"
            "The module should explain a specific concept, why it matters to THEM specifically, "
            "and provide actionable takeaways.\n"
            "The tone should be encouraging, clear, and jargon-free (unless explained).\n"
            "Output MUST be valid JSON matching the specified schema."
        )

        user_prompt = (
            f"Create a learning module about: '{topic}'.\n"
            f"Reason for recommendation: {reason}\n\n"
            f"{profile_context}\n"
            f"{portfolio_context}\n\n"
            "Requirements:\n"
            "1. Title: Catchy and relevant.\n"
            "2. Body: Markdown format. Use headers, bullet points, and bold text. "
            "Explain the concept using the user's specific context (e.g. 'Since your goal is X...'). "
            "Keep it under 500 words.\n"
            "3. Questions: Exactly 3 multiple-choice questions to test understanding. "
            "Each question must have 3-4 choices, one correct."
        )

        # Call LLM
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=user_prompt),
        ]

        # Define the schema for structured output
        # We use the Pydantic schema we defined earlier
        structured_config = StructuredOutputConfig(
            type="json_schema",
            json_schema=get_gemini_compatible_schema(ModuleContent)
        )

        completion = await self.llm.acomplete(
            messages=messages,
            temperature=0.4,  # Lower temperature for more consistent educational content
            structured_output=structured_config
        )

        # Parse Output
        try:
            content_dict = json.loads(completion.message.content)
            module_content = ModuleContent(**content_dict)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback or retry logic could go here
            raise ValueError(f"Failed to parse LLM output: {e}")

        # Save to Database
        # Create Module
        import uuid
        import hashlib

        # Generate a short hash for uniqueness to prevent truncation collisions
        content_hash = hashlib.md5(f"{user.id}-{topic}-{uuid.uuid4()}".encode()).hexdigest()[:8]
        slug = f"generated-{topic.lower().replace(' ', '-')[:50]}-{content_hash}"
        
        new_module = Module(
            slug=slug,
            title=module_content.title,
            description=f"Personalized lesson on {topic}",
            is_active=True
        )
        db.add(new_module)
        db.flush() # Get ID

        # Create Module Version
        new_version = ModuleVersion(
            module_id=new_module.id,
            version=1,
            content_markdown=module_content.body,
            assets={}
        )
        db.add(new_version)

        # Create Questions
        for i, q in enumerate(module_content.questions):
            new_question = ModuleQuestion(
                module_id=new_module.id,
                order_index=i,
                type="multiple_choice",
                prompt_markdown=q.question,
                explanation_markdown=q.explanation,
                shuffle_choices=True
            )
            db.add(new_question)
            db.flush() # Get ID

            for choice in q.choices:
                new_choice = ModuleChoice(
                    question_id=new_question.id,
                    text_markdown=choice.text,
                    is_correct=choice.isCorrect
                )
                db.add(new_choice)

        db.commit()
        db.refresh(new_module)
        
        return new_module
