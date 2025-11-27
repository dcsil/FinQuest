"""
Seed badge definitions into the database.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from finquest_api.db.session import get_engine, SessionLocal
from finquest_api.db.models import BadgeDefinition


BADGE_DEFINITIONS = [
    # Learning badges
    {
        "code": "MODULE_5",
        "name": "Module Apprentice",
        "description": "Completed 5 modules",
        "category": "learning",
        "is_active": True,
    },
    {
        "code": "MODULE_10",
        "name": "Module Scholar",
        "description": "Completed 10 modules",
        "category": "learning",
        "is_active": True,
    },
    {
        "code": "MODULE_20",
        "name": "Module Master",
        "description": "Completed 20 modules",
        "category": "learning",
        "is_active": True,
    },
    {
        "code": "QUIZ_CHAMP",
        "name": "Quiz Champ",
        "description": "Achieved ≥90% on any quiz",
        "category": "learning",
        "is_active": True,
    },
    # Note: Category Finisher badges would need category tracking - skipping for MVP
    
    # Portfolio badges
    {
        "code": "PORTFOLIO_CREATOR",
        "name": "Portfolio Creator",
        "description": "Added first portfolio position",
        "category": "portfolio",
        "is_active": True,
    },
    {
        "code": "DIVERSIFIER",
        "name": "Diversifier",
        "description": "Have 3 or more distinct positions",
        "category": "portfolio",
        "is_active": True,
    },
    {
        "code": "RISK_MANAGER",
        "name": "Risk Manager",
        "description": "Performed a rebalance action",
        "category": "portfolio",
        "is_active": False,  # Not implemented yet
    },
    {
        "code": "LONG_TERM_THINKER",
        "name": "Long-Term Thinker",
        "description": "Kept a position for at least 30 days",
        "category": "portfolio",
        "is_active": False,  # Not implemented yet
    },
    {
        "code": "ANALYST",
        "name": "Analyst",
        "description": "Completed 5 stock analysis actions",
        "category": "portfolio",
        "is_active": False,  # Not implemented yet
    },
    
    # Streak badges
    {
        "code": "STREAK_7",
        "name": "7-Day Streak",
        "description": "Reached a 7-day streak",
        "category": "streak",
        "is_active": True,
    },
    {
        "code": "STREAK_30",
        "name": "30-Day Streak",
        "description": "Reached a 30-day streak",
        "category": "streak",
        "is_active": True,
    },
]


def seed_badges():
    """Seed badge definitions into the database."""
    engine = get_engine()
    db: Session = SessionLocal(bind=engine)
    
    try:
        for badge_data in BADGE_DEFINITIONS:
            existing = db.query(BadgeDefinition).filter(
                BadgeDefinition.code == badge_data["code"]
            ).first()
            
            if existing:
                print(f"Badge {badge_data['code']} already exists, skipping...")
                continue
            
            badge = BadgeDefinition(**badge_data)
            db.add(badge)
            print(f"Added badge: {badge_data['code']} - {badge_data['name']}")
        
        db.commit()
        print("\n✅ Successfully seeded badge definitions!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding badges: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_badges()

