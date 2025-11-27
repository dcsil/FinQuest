"""
Gamification API endpoints.
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth_utils import get_current_user
from ..db.models import User, BadgeDefinition, UserBadge
from ..db.session import get_session
from ..services.gamification import (
    get_or_create_stats,
    compute_level,
    get_xp_to_next_level,
    update_streak,
    evaluate_badges,
    check_module_first_time,
    get_portfolio_position_count,
    XP_REWARDS,
)

router = APIRouter()


# Request/Response Models
class GamificationEventRequest(BaseModel):
    event_type: str  # "login", "module_completed", "quiz_completed", "portfolio_position_added", "portfolio_position_updated"
    module_id: Optional[str] = None
    quiz_score: Optional[float] = None
    quiz_completed_at: Optional[str] = None  # ISO datetime string
    portfolio_position_id: Optional[str] = None
    is_first_time_for_module: Optional[bool] = None


class BadgeInfo(BaseModel):
    code: str
    name: str
    description: str


class GamificationEventResponse(BaseModel):
    total_xp: int
    level: int
    current_streak: int
    xp_gained: int
    level_up: bool
    streak_incremented: bool
    new_badges: list[BadgeInfo]
    xp_to_next_level: int


class GamificationStateResponse(BaseModel):
    total_xp: int
    level: int
    current_streak: int
    xp_to_next_level: int
    badges: list[BadgeInfo]


class BadgeDefinitionResponse(BaseModel):
    code: str
    name: str
    description: str
    category: str
    is_active: bool
    earned: bool


@router.post("/event", response_model=GamificationEventResponse)
async def handle_gamification_event(
    event: GamificationEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Handle a gamification event and update user stats.
    """
    stats = get_or_create_stats(db, current_user.id)
    
    xp_gained = 0
    streak_incremented = False
    previous_level = stats.level
    previous_streak = stats.current_streak
    
    # Parse quiz date if provided
    quiz_date: Optional[date] = None
    if event.quiz_completed_at:
        try:
            quiz_datetime = datetime.fromisoformat(event.quiz_completed_at.replace("Z", "+00:00"))
            quiz_date = quiz_datetime.date()
        except Exception:
            quiz_date = datetime.utcnow().date()
    
    # Handle different event types
    if event.event_type == "login":
        xp_gained += XP_REWARDS["login"]
    
    elif event.event_type == "module_completed":
        xp_gained += XP_REWARDS["module_completed"]
        stats.total_modules_completed += 1
        
        # Check if first time (if module_id provided)
        if event.module_id and event.is_first_time_for_module is None:
            try:
                module_uuid = UUID(event.module_id)
                is_first_time = check_module_first_time(db, current_user.id, module_uuid)
            except (ValueError, Exception):
                is_first_time = False
        else:
            is_first_time = event.is_first_time_for_module or False
        
        if is_first_time:
            xp_gained += XP_REWARDS["module_completed_first_time"]
    
    elif event.event_type == "quiz_completed":
        stats.total_quizzes_completed += 1
        
        if event.quiz_score is not None:
            if event.quiz_score >= 80:
                xp_gained += XP_REWARDS["quiz_completed_high"]
            else:
                xp_gained += XP_REWARDS["quiz_completed_low"]
        else:
            xp_gained += XP_REWARDS["quiz_completed_low"]
        
        # Update streak
        if quiz_date is None:
            quiz_date = datetime.utcnow().date()
        
        streak_incremented = update_streak(db, stats, quiz_date)
        # Only count as incremented if streak actually increased
        streak_incremented = streak_incremented and stats.current_streak > previous_streak
        if streak_incremented:
            xp_gained += XP_REWARDS["streak_bonus"]
    
    elif event.event_type == "portfolio_position_added":
        xp_gained += XP_REWARDS["portfolio_position_added"]
        # Update position count
        stats.total_portfolio_positions = get_portfolio_position_count(db, current_user.id)
    
    elif event.event_type == "portfolio_position_updated":
        xp_gained += XP_REWARDS["portfolio_position_updated"]
    
    # Apply XP and level
    stats.total_xp += xp_gained
    stats.level = compute_level(stats.total_xp)
    level_up = stats.level > previous_level
    
    # Evaluate badges
    new_badges = evaluate_badges(db, current_user.id, stats)
    
    # Save changes
    db.commit()
    db.refresh(stats)
    
    xp_to_next = get_xp_to_next_level(stats.total_xp, stats.level)
    
    return GamificationEventResponse(
        total_xp=stats.total_xp,
        level=stats.level,
        current_streak=stats.current_streak,
        xp_gained=xp_gained,
        level_up=level_up,
        streak_incremented=streak_incremented,
        new_badges=[BadgeInfo(**badge) for badge in new_badges],
        xp_to_next_level=xp_to_next,
    )


@router.get("/me", response_model=GamificationStateResponse)
async def get_gamification_state(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Get current gamification state for logged-in user.
    """
    stats = get_or_create_stats(db, current_user.id)
    
    xp_to_next = get_xp_to_next_level(stats.total_xp, stats.level)
    
    # Get user's badges
    user_badges = db.query(BadgeDefinition).join(UserBadge).filter(
        UserBadge.user_id == current_user.id
    ).all()
    
    badges = [
        BadgeInfo(
            code=badge.code,
            name=badge.name,
            description=badge.description,
        )
        for badge in user_badges
    ]
    
    return GamificationStateResponse(
        total_xp=stats.total_xp,
        level=stats.level,
        current_streak=stats.current_streak,
        xp_to_next_level=xp_to_next,
        badges=badges,
    )


@router.get("/badges", response_model=list[BadgeDefinitionResponse])
async def get_all_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Get all badge definitions and which are earned by the user.
    """
    all_badges = db.query(BadgeDefinition).all()
    
    # Get user's earned badge IDs
    earned_badge_ids = {
        badge_id for badge_id, in db.query(UserBadge.badge_id).filter(
            UserBadge.user_id == current_user.id
        ).all()
    }
    
    return [
        BadgeDefinitionResponse(
            code=badge.code,
            name=badge.name,
            description=badge.description,
            category=badge.category,
            is_active=badge.is_active,
            earned=badge.id in earned_badge_ids,
        )
        for badge in all_badges
    ]

