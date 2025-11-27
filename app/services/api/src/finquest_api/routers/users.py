"""
User management and onboarding endpoints
"""
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..auth_utils import get_current_user
from ..db.models import User, OnboardingResponse, Suggestion, LearningPathway, LearningPathwayItem, Module
from ..db.session import get_session, SessionLocal, get_engine
from ..schemas import UpdateProfileRequest, SuggestionResponse, UserProfile
from ..services.llm.service import LLMService
from ..services.module_generator import ModuleGenerator
from ..services.suggestion_generator import SuggestionGenerator
from ..config import settings

router = APIRouter()

# Dependency for SuggestionGenerator
def get_suggestion_generator():
    llm_service = LLMService(settings.llm)
    module_generator = ModuleGenerator(llm_service)
    return SuggestionGenerator(llm_service, module_generator)

# Dependency for ModuleGenerator
def get_module_generator():
    llm_service = LLMService(settings.llm)
    return ModuleGenerator(llm_service)

async def generate_suggestions_task(
    suggestion_generator: SuggestionGenerator,
    user_id: str
):
    """Background task to generate suggestions"""
    db = SessionLocal(bind=get_engine())
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            await suggestion_generator.generate_suggestions_for_user(db, user)
    except Exception as e:
        print(f"Error generating suggestions in background: {e}")
    finally:
        db.close()

async def populate_initial_pathway_task(
    module_generator: ModuleGenerator,
    user_id: str
):
    """Background task to populate initial learning pathway with starter modules"""
    db = SessionLocal(bind=get_engine())
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Check if user already has a learning pathway
        existing_pathway = db.query(LearningPathway).filter(
            LearningPathway.user_id == user.id,
            LearningPathway.status == "active"
        ).first()
        
        if existing_pathway:
            # User already has a pathway, skip
            return
        
        # Get onboarding data to personalize modules
        onboarding = db.query(OnboardingResponse).filter(
            OnboardingResponse.user_id == user.id
        ).order_by(OnboardingResponse.submitted_at.desc()).first()
        
        # Define starter topics based on experience level
        experience_level = 1  # Default to beginner
        if onboarding and onboarding.answers:
            experience_level = onboarding.answers.get('investingExperience', 1)
        
        # Choose starter topics based on experience
        if experience_level <= 1:  # Beginner
            starter_topics = [
                ("Introduction to Investing", "Learn the basics of investing and why it matters for your financial future"),
                ("Understanding Risk and Return", "Discover how risk and return work together in investing"),
                ("Building Your First Portfolio", "Get started with creating a diversified investment portfolio")
            ]
        elif experience_level <= 2:  # Intermediate
            starter_topics = [
                ("Portfolio Diversification Strategies", "Learn advanced techniques for diversifying your investments"),
                ("Asset Allocation Fundamentals", "Understand how to allocate assets based on your goals"),
                ("Market Analysis Basics", "Introduction to analyzing market trends and opportunities")
            ]
        else:  # Advanced
            starter_topics = [
                ("Advanced Portfolio Management", "Deep dive into sophisticated portfolio management techniques"),
                ("Risk Management Strategies", "Learn advanced risk management and hedging strategies"),
                ("Tax-Efficient Investing", "Optimize your investments for tax efficiency")
            ]
        
        # Create learning pathway
        pathway = LearningPathway(
            user_id=user.id,
            status="active",
            source="onboarding",
            rationale="Initial learning pathway created after onboarding completion"
        )
        db.add(pathway)
        db.flush()  # Get pathway ID
        
        # Generate modules and add to pathway, and create suggestions
        created_modules = []
        for order_index, (topic, reason) in enumerate(starter_topics):
            try:
                module = await module_generator.generate_module_from_profile(
                    db=db,
                    user=user,
                    topic=topic,
                    reason=reason
                )
                
                # Add module to pathway
                pathway_item = LearningPathwayItem(
                    pathway_id=pathway.id,
                    module_id=module.id,
                    order_index=order_index
                )
                db.add(pathway_item)
                
                # Create a suggestion for this module so it appears in the frontend
                suggestion = Suggestion(
                    user_id=user.id,
                    reason=reason,
                    confidence=0.9,  # High confidence for initial onboarding modules
                    module_id=module.id,
                    status="shown",
                    metadata_json={"type": "education", "topic": topic}
                )
                db.add(suggestion)
                created_modules.append(module)
            except Exception as e:
                print(f"Error generating module '{topic}' for user {user_id}: {e}")
                # Continue with other modules even if one fails
                continue
        
        db.commit()
        print(f"Successfully created initial learning pathway with {len(created_modules)} modules for user {user_id}")
        
    except Exception as e:
        print(f"Error populating initial pathway in background: {e}")
        if db:
            db.rollback()
    finally:
        db.close()

@router.get("/onboarding-status")
async def get_onboarding_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Check if user has completed onboarding.
    Returns True if user has an onboarding response, False otherwise.
    """
    try:
        onboarding_response = db.query(OnboardingResponse).filter(
            OnboardingResponse.user_id == user.id
        ).order_by(OnboardingResponse.submitted_at.desc()).first()
        
        return {
            "completed": onboarding_response is not None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check onboarding status: {str(e)}"
        )


@router.get("/financial-profile", response_model=UserProfile)
async def get_financial_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Get user's financial profile (onboarding data).
    Returns the most recent onboarding response data.
    """
    try:
        onboarding_response = db.query(OnboardingResponse).filter(
            OnboardingResponse.user_id == user.id
        ).order_by(OnboardingResponse.submitted_at.desc()).first()
        
        if not onboarding_response or not onboarding_response.answers:
            # Return empty profile if no onboarding data exists
            return UserProfile()
        
        # Convert answers dict to UserProfile
        return UserProfile(**onboarding_response.answers)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get financial profile: {str(e)}"
        )


@router.post("/financial-profile", status_code=status.HTTP_201_CREATED)
async def update_financial_profile(
    request: UpdateProfileRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    suggestion_generator: SuggestionGenerator = Depends(get_suggestion_generator),
    module_generator: ModuleGenerator = Depends(get_module_generator)
):
    """
    Update user's financial profile (onboarding data).
    Triggers initial learning pathway population and suggestion generation in background.
    """
    try:
        # Create onboarding response
        # We store the entire request model as the answers JSON
        onboarding_response = OnboardingResponse(
            user_id=user.id,
            answers=request.model_dump(exclude_none=True)
        )
        
        db.add(onboarding_response)
        db.commit()
        db.refresh(onboarding_response)
        
        # Trigger initial learning pathway population in background
        background_tasks.add_task(populate_initial_pathway_task, module_generator, str(user.id))
        
        # Trigger initial suggestion generation in background
        background_tasks.add_task(generate_suggestions_task, suggestion_generator, str(user.id))
        
        return {
            "status": "ok",
            "message": "Financial profile updated successfully",
            "id": str(onboarding_response.id)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save onboarding data: {str(e)}"
        )


@router.get("/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    suggestion_generator: SuggestionGenerator = Depends(get_suggestion_generator)
):
    """
    Get personalized suggestions for the user.
    If no suggestions exist, triggers generation in background and returns empty list.
    """
    try:
        # Fetch existing suggestions (including completed ones to show in pathway)
        # Order by creation time to preserve the natural sequence in the pathway
        suggestions = db.query(Suggestion).filter(
            Suggestion.user_id == user.id,
            Suggestion.status.in_(["shown", "completed"])
        ).order_by(Suggestion.created_at.asc()).all()
        
        # If no suggestions, generate them in background
        if not suggestions:
            background_tasks.add_task(generate_suggestions_task, suggestion_generator, str(user.id))
            return []

        return [
            SuggestionResponse(
                id=str(s.id),
                reason=s.reason,
                confidence=float(s.confidence) if s.confidence else None,
                moduleId=str(s.module_id) if s.module_id else None,
                status=s.status,
                metadata=s.metadata_json
            )
            for s in suggestions
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}"
        )
