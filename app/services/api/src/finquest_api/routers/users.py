"""
User management and onboarding endpoints
"""
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..auth_utils import get_current_user
from ..db.models import User, OnboardingResponse, Suggestion
from ..db.session import get_session, SessionLocal, get_engine
from ..schemas import UpdateProfileRequest, SuggestionResponse
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

@router.post("/financial-profile", status_code=status.HTTP_201_CREATED)
async def update_financial_profile(
    request: UpdateProfileRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    suggestion_generator: SuggestionGenerator = Depends(get_suggestion_generator)
):
    """
    Update user's financial profile (onboarding data).
    Triggers initial suggestion generation in background.
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
        # Fetch existing suggestions
        suggestions = db.query(Suggestion).filter(
            Suggestion.user_id == user.id,
            Suggestion.status == "shown"
        ).order_by(Suggestion.confidence.desc()).all()
        
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
