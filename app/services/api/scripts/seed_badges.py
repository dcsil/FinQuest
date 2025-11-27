"""
Seed badge definitions into the database.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables before importing database modules
# Note: pydantic-settings will also load .env automatically, but we try dotenv first
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"Loaded environment from {env_path}")
    else:
        print(f"Note: .env file not found at {env_path}")
        print("Using environment variables or pydantic-settings will load .env")
except ImportError:
    print("Note: python-dotenv not available, relying on pydantic-settings for .env loading")

print("Importing database modules...")
try:
    from sqlalchemy.orm import Session
    from finquest_api.db.session import get_engine, SessionLocal
    from finquest_api.db.models import BadgeDefinition
    print("Database modules imported successfully")
except Exception as e:
    print(f"❌ Error importing database modules: {e}")
    print("This might be due to missing SUPABASE_DB_URL environment variable")
    import traceback
    traceback.print_exc()
    sys.exit(1)


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
    try:
        print("Getting database engine...")
        engine = get_engine()
        print("Creating database session...")
        db: Session = SessionLocal(bind=engine)
        
        print(f"Seeding {len(BADGE_DEFINITIONS)} badge definitions...")
        added_count = 0
        skipped_count = 0
        
        for badge_data in BADGE_DEFINITIONS:
            existing = db.query(BadgeDefinition).filter(
                BadgeDefinition.code == badge_data["code"]
            ).first()
            
            if existing:
                print(f"  ⏭️  Badge {badge_data['code']} already exists, skipping...")
                skipped_count += 1
                continue
            
            badge = BadgeDefinition(**badge_data)
            db.add(badge)
            print(f"  ✅ Added badge: {badge_data['code']} - {badge_data['name']}")
            added_count += 1
        
        db.commit()
        print(f"\n✅ Successfully seeded badge definitions!")
        print(f"   Added: {added_count}, Skipped: {skipped_count}")
        
    except RuntimeError as e:
        if "SUPABASE_DB_URL" in str(e):
            print(f"\n❌ Database configuration error: {e}")
            print("\nPlease set SUPABASE_DB_URL in your environment or .env file")
            sys.exit(1)
        raise
    except Exception as e:
        if db:
            db.rollback()
        print(f"\n❌ Error seeding badges: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        if 'db' in locals():
            db.close()


if __name__ == "__main__":
    seed_badges()

