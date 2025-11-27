"""
Tests for missing line in gamification router
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from datetime import datetime

from finquest_api.routers.gamification import handle_gamification_event, GamificationEventRequest
from finquest_api.db.models import User, UserGamificationStats


@pytest.fixture
def mock_user():
    """Create a mock user"""
    user = Mock(spec=User)
    user.id = uuid4()
    return user


@pytest.fixture
def mock_stats():
    """Create mock gamification stats"""
    stats = Mock(spec=UserGamificationStats)
    stats.id = uuid4()
    stats.user_id = uuid4()
    stats.total_xp = 100
    stats.level = 1
    stats.current_streak = 0
    stats.total_modules_completed = 0
    stats.total_quizzes_completed = 0
    stats.total_portfolio_positions = 0
    stats.last_streak_date = None
    return stats


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    db = MagicMock()
    return db


class TestGamificationEventMissingLine:
    """Tests for missing line in handle_gamification_event"""
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_streak_incremented_true(self, mock_user, mock_stats, mock_db):
        """Test quiz completed when streak is incremented (line 137)"""
        # Set initial streak
        mock_stats.current_streak = 5
        
        # Create a new stats object that will have increased streak after update_streak
        def update_streak_side_effect(db, stats, quiz_date):
            # Simulate streak increment
            stats.current_streak = 6
            return True
        
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.update_streak', side_effect=update_streak_side_effect):
                    event = GamificationEventRequest(
                        event_type="quiz_completed",
                        quiz_score=85.0,
                        quiz_completed_at=datetime.utcnow().isoformat()
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    # Should add streak bonus
                    assert result.streak_incremented is True
                    # XP should include streak bonus
                    assert result.xp_gained >= 35 + 2  # quiz + streak bonus

