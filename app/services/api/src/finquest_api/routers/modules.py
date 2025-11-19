"""
Learning modules endpoints
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..auth_utils import get_current_user
from ..db.models import User, Module, ModuleVersion, ModuleQuestion, ModuleChoice, ModuleAttempt, ModuleCompletion, Suggestion
from ..db.session import get_session
from ..schemas import (
    ModuleContent, 
    ModuleQuestion as SchemaModuleQuestion, 
    ModuleChoice as SchemaModuleChoice,
    ModuleAttemptRequest,
    ModuleAttemptResponse
)

router = APIRouter()


@router.post("/{module_id}/attempt", response_model=ModuleAttemptResponse)
async def submit_module_attempt(
    module_id: str,
    attempt: ModuleAttemptRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Record a quiz attempt and mark module as completed if passed.
    """
    try:
        module_uuid = UUID(module_id)
        
        # Create attempt record
        # Note: In a real app we would validate the answers against the DB
        # For MVP we trust the client's score calculation
        db_attempt = ModuleAttempt(
            user_id=user.id,
            module_id=module_uuid,
            score_pct=(attempt.score / attempt.max_score * 100) if attempt.max_score > 0 else 0,
            passed=attempt.passed,
            passing_score_pct=70 # Default
        )
        db.add(db_attempt)
        db.flush() # Get ID
        
        is_completed = False
        
        if attempt.passed:
            # Check if already completed
            existing_completion = db.query(ModuleCompletion).filter(
                ModuleCompletion.user_id == user.id,
                ModuleCompletion.module_id == module_uuid
            ).first()
            
            if not existing_completion:
                completion = ModuleCompletion(
                    user_id=user.id,
                    module_id=module_uuid,
                    attempt_id=db_attempt.id
                )
                db.add(completion)
                is_completed = True
                
                # Update suggestion status if exists
                suggestion = db.query(Suggestion).filter(
                    Suggestion.user_id == user.id,
                    Suggestion.module_id == module_uuid
                ).first()
                
                if suggestion:
                    suggestion.status = "completed"
                    db.add(suggestion)
        
        db.commit()
        
        return ModuleAttemptResponse(
            status="ok",
            attempt_id=str(db_attempt.id),
            completed=is_completed
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid module ID"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record attempt: {str(e)}"
        )


@router.get("/{module_id}", response_model=ModuleContent)
async def get_module(
    module_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Get full content for a specific module.
    """
    try:
        module_uuid = UUID(module_id)
        module = db.query(Module).filter(Module.id == module_uuid).first()
        
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
            
        # Get latest version
        version = db.query(ModuleVersion).filter(
            ModuleVersion.module_id == module.id
        ).order_by(ModuleVersion.version.desc()).first()
        
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module content not found"
            )
            
        # Get questions
        questions = db.query(ModuleQuestion).filter(
            ModuleQuestion.module_id == module.id
        ).order_by(ModuleQuestion.order_index).all()
        
        schema_questions = []
        for q in questions:
            choices = db.query(ModuleChoice).filter(
                ModuleChoice.question_id == q.id
            ).all()
            
            schema_choices = [
                SchemaModuleChoice(text=c.text_markdown, isCorrect=c.is_correct)
                for c in choices
            ]
            
            schema_questions.append(
                SchemaModuleQuestion(
                    question=q.prompt_markdown,
                    choices=schema_choices,
                    explanation=q.explanation_markdown
                )
            )
            
        return ModuleContent(
            id=str(module.id),
            title=module.title,
            body=version.content_markdown,
            questions=schema_questions
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid module ID"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get module: {str(e)}"
        )
