"""
Service for generating personalized suggestions using LLM
"""
import json
from typing import List
from sqlalchemy.orm import Session

from ..db.models import User, Suggestion, OnboardingResponse
from .llm.service import LLMService
from .llm.models import LLMMessage, StructuredOutputConfig
from .llm.utils import get_gemini_compatible_schema
from .module_generator import ModuleGenerator
from pydantic import BaseModel

class SuggestionItem(BaseModel):
    reason: str
    topic: str
    confidence: float
    type: str # "education", "investment", "warning"

class SuggestionList(BaseModel):
    suggestions: List[SuggestionItem]

class SuggestionGenerator:
    def __init__(self, llm_service: LLMService, module_generator: ModuleGenerator):
        self.llm = llm_service
        self.module_generator = module_generator

    async def generate_suggestions_for_user(
        self,
        db: Session,
        user: User
    ) -> List[Suggestion]:
        """
        Analyze user profile and portfolio to generate actionable suggestions.
        If a suggestion requires learning, it triggers module generation.
        """
        # Gather Context
        # Get existing suggestions (shown or completed) to avoid duplicates
        existing_suggestions = db.query(Suggestion).filter(
            Suggestion.user_id == user.id,
            Suggestion.status.in_(["shown", "completed"])
        ).all()
        
        existing_topics = {s.metadata_json.get("topic", "").lower() for s in existing_suggestions if s.metadata_json}

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
            country = answers.get('country', 'US')
            profile_context += f"- Country: {country}\n"
        else:
            profile_context += "No specific profile data available.\n"
            country = 'US'  # Default to US if no profile data

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
                 portfolio_context += "- Portfolio created but no valuation data available yet.\n"
        else:
            portfolio_context += "No portfolio created yet.\n"

        # Construct Prompt
        system_prompt = (
            "You are an expert financial advisor AI. Your goal is to analyze a user's financial profile "
            "and portfolio to identify gaps, risks, or opportunities.\n"
            "Generate 1-3 specific, actionable suggestions.\n"
            "For each suggestion, identify a 'topic' that the user should learn about to address the issue.\n"
            "Output MUST be valid JSON matching the specified schema.\n"
            "IMPORTANT: Do NOT suggest topics that the user has already seen. "
            f"Avoid these topics: {', '.join(existing_topics) if existing_topics else 'None'}"
        )

        # Get country for context
        country = onboarding.answers.get('country', 'US') if onboarding else 'US'
        country_name = {
            'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'AU': 'Australia',
            'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
            'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway',
            'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland', 'PT': 'Portugal', 'PL': 'Poland',
            'CZ': 'Czech Republic', 'GR': 'Greece', 'JP': 'Japan', 'CN': 'China', 'IN': 'India',
            'SG': 'Singapore', 'HK': 'Hong Kong', 'KR': 'South Korea', 'TW': 'Taiwan', 'NZ': 'New Zealand',
            'BR': 'Brazil', 'MX': 'Mexico', 'AR': 'Argentina', 'ZA': 'South Africa', 'AE': 'United Arab Emirates',
            'IL': 'Israel', 'TR': 'Turkey', 'RU': 'Russia'
        }.get(country, country)

        user_prompt = (
            f"Analyze this user:\n\n"
            f"{profile_context}\n"
            f"{portfolio_context}\n\n"
            f"IMPORTANT: The user is based in {country_name} ({country}). "
            "Tailor all suggestions to their country's financial regulations, tax systems, investment options, "
            "and market practices. Use country-specific examples, regulations, and financial products where relevant.\n\n"
            "Generate suggestions. If the user is a beginner or has no portfolio, focus on foundational concepts "
            "relevant to their goals and country. If they have a portfolio, look for concentration risk, diversification issues, "
            "or alignment with their risk tolerance, considering their country's market context."
        )

        # Call LLM
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=user_prompt),
        ]

        structured_config = StructuredOutputConfig(
            type="json_schema",
            json_schema=get_gemini_compatible_schema(SuggestionList)
        )

        completion = await self.llm.acomplete(
            messages=messages,
            temperature=0.3,
            structured_output=structured_config
        )

        # Parse Output & Generate Modules
        try:
            content_dict = json.loads(completion.message.content)
            suggestion_list = SuggestionList(**content_dict)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback logic
            print(f"Error parsing suggestions: {e}")
            return []

        # Re-fetch existing suggestions to avoid race conditions with parallel tasks
        # (e.g. if user updated profile and then immediately loaded dashboard)
        existing_suggestions_refresh = db.query(Suggestion).filter(
            Suggestion.user_id == user.id,
            Suggestion.status.in_(["shown", "completed"])
        ).all()
        existing_topics_refresh = {s.metadata_json.get("topic", "").lower() for s in existing_suggestions_refresh if s.metadata_json}

        new_suggestions = []
        seen_topics = set()
        
        for item in suggestion_list.suggestions:
            # Deduplicate within the current batch and against existing topics
            topic_key = item.topic.lower()
            if topic_key in existing_topics_refresh or topic_key in seen_topics:
                continue
            seen_topics.add(topic_key)

            # Generate a module for this suggestion
            # In a real app, we might check if a similar module already exists to reuse it
            module = await self.module_generator.generate_module_from_profile(
                db=db,
                user=user,
                topic=item.topic,
                reason=item.reason
            )

            # Create Suggestion record
            suggestion = Suggestion(
                user_id=user.id,
                reason=item.reason,
                confidence=item.confidence,
                module_id=module.id,
                status="shown",
                metadata_json={"type": item.type, "topic": item.topic}
            )
            db.add(suggestion)
            new_suggestions.append(suggestion)

        db.commit()
        for s in new_suggestions:
            db.refresh(s)
            
        return new_suggestions
