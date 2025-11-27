"""
Gamification service for XP, levels, streaks, and badges.
"""
from __future__ import annotations

from datetime import date, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from ..db.models import (
    UserGamificationStats,
    BadgeDefinition,
    UserBadge,
    ModuleCompletion,
    Transaction,
    Portfolio,
)


# XP Rewards (fixed values)
XP_REWARDS = {
    "login": 10,
    "module_completed": 25,
    "module_completed_first_time": 50,
    "quiz_completed_high": 35,  # score >= 80%
    "quiz_completed_low": 20,  # score < 80%
    "portfolio_position_added": 40,
    "portfolio_position_updated": 20,
    "streak_bonus": 2,  # per streak day increment
}

# Level thresholds
LEVEL_THRESHOLDS = [
    (1, 0),
    (2, 200),
    (3, 400),
    (4, 600),
    (5, 800),
    (6, 1000),
    (7, 1500),
    (8, 2000),
    (9, 2500),
    (10, 3000),
]


def compute_level(total_xp: int) -> int:
    """
    Calculate user level based on total XP.
    Levels 1-5: 200 XP per level
    Levels 6-10: 500 XP per level
    Max level: 10
    """
    level = 1
    for lvl, threshold in LEVEL_THRESHOLDS:
        if total_xp >= threshold:
            level = lvl
        else:
            break
    return min(level, 10)  # Cap at level 10


def get_xp_to_next_level(total_xp: int, level: int) -> int:
    """Calculate XP needed to reach next level."""
    if level >= 10:
        return 0
    
    next_level_threshold = next(
        (threshold for lvl, threshold in LEVEL_THRESHOLDS if lvl == level + 1),
        None
    )
    if next_level_threshold is None:
        return 0
    
    return next_level_threshold - total_xp


def get_or_create_stats(db: Session, user_id: UUID) -> UserGamificationStats:
    """Get or create user gamification stats."""
    stats = db.query(UserGamificationStats).filter(
        UserGamificationStats.user_id == user_id
    ).first()
    
    if not stats:
        stats = UserGamificationStats(
            user_id=user_id,
            total_xp=0,
            level=1,
            current_streak=0,
            total_modules_completed=0,
            total_quizzes_completed=0,
            total_portfolio_positions=0,
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return stats


def update_streak(
    db: Session,
    stats: UserGamificationStats,
    quiz_date: date
) -> bool:
    """
    Update streak based on quiz completion date.
    Returns True if streak was incremented, False otherwise.
    """
    if stats.last_streak_date is None:
        # First streak
        stats.current_streak = 1
        stats.last_streak_date = quiz_date
        return True
    
    if stats.last_streak_date == quiz_date:
        # Already counted today
        return False
    
    if stats.last_streak_date == quiz_date - timedelta(days=1):
        # Consecutive day
        stats.current_streak += 1
        stats.last_streak_date = quiz_date
        return True
    else:
        # Streak broken, reset to 1
        stats.current_streak = 1
        stats.last_streak_date = quiz_date
        return True


def evaluate_badges(
    db: Session,
    user_id: UUID,
    stats: UserGamificationStats
) -> list[dict]:
    """
    Evaluate badge conditions and award new badges.
    Returns list of newly awarded badge dictionaries.
    """
    # Get existing badge codes for this user
    existing_badges = db.query(BadgeDefinition.code).join(UserBadge).filter(
        UserBadge.user_id == user_id
    ).all()
    existing_codes = {badge[0] for badge in existing_badges}
    
    new_badges = []
    
    # Learning badges
    if stats.total_modules_completed >= 5 and "MODULE_5" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "MODULE_5").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    if stats.total_modules_completed >= 10 and "MODULE_10" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "MODULE_10").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    if stats.total_modules_completed >= 20 and "MODULE_20" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "MODULE_20").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    # Streak badges
    if stats.current_streak >= 7 and "STREAK_7" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "STREAK_7").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    if stats.current_streak >= 30 and "STREAK_30" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "STREAK_30").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    # Portfolio badges
    if stats.total_portfolio_positions >= 1 and "PORTFOLIO_CREATOR" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "PORTFOLIO_CREATOR").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    if stats.total_portfolio_positions >= 3 and "DIVERSIFIER" not in existing_codes:
        badge = db.query(BadgeDefinition).filter(BadgeDefinition.code == "DIVERSIFIER").first()
        if badge and badge.is_active:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append({
                "code": badge.code,
                "name": badge.name,
                "description": badge.description,
            })
    
    return new_badges


def check_module_first_time(db: Session, user_id: UUID, module_id: UUID) -> bool:
    """Check if this is the first time user completed this module."""
    existing = db.query(ModuleCompletion).filter(
        ModuleCompletion.user_id == user_id,
        ModuleCompletion.module_id == module_id
    ).first()
    return existing is None


def get_portfolio_position_count(db: Session, user_id: UUID) -> int:
    """Get count of distinct portfolio positions for user."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user_id,
        Portfolio.deleted_at.is_(None)
    ).first()
    
    if not portfolio:
        return 0
    
    # Count distinct instruments in transactions
    from sqlalchemy import distinct
    
    count = db.query(distinct(Transaction.instrument_id)).filter(
        Transaction.portfolio_id == portfolio.id,
        Transaction.deleted_at.is_(None)
    ).count()
    
    return count

