"""
Extended tests for gamification router to cover missing lines
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from datetime import datetime

from finquest_api.routers.gamification import (
    handle_gamification_event,
    GamificationEventRequest,
)
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


class TestGamificationEventExtended:
    """Extended tests to cover missing lines"""
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_invalid_date_format(self, mock_user, mock_stats, mock_db):
        """Test quiz completed with invalid date format (line 95-96)"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.update_streak', return_value=True):
                    event = GamificationEventRequest(
                        event_type="quiz_completed",
                        quiz_score=85.0,
                        quiz_completed_at="invalid-date-format"
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    # Should use current date as fallback
                    assert result.xp_gained >= 35
    
    @pytest.mark.anyio("asyncio")
    async def test_module_completed_with_exception(self, mock_user, mock_stats, mock_db):
        """Test module completed with exception in UUID parsing (line 111-112)"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.check_module_first_time', side_effect=Exception("Error")):
                    event = GamificationEventRequest(
                        event_type="module_completed",
                        module_id="invalid-uuid"
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    # Should handle exception and set is_first_time to False
                    assert result.xp_gained == 25
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_no_date_provided(self, mock_user, mock_stats, mock_db):
        """Test quiz completed without date (line 131)"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.update_streak', return_value=True):
                    event = GamificationEventRequest(
                        event_type="quiz_completed",
                        quiz_score=85.0,
                        quiz_completed_at=None
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    # Should use current date
                    assert result.xp_gained >= 35
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_streak_not_incremented(self, mock_user, mock_stats, mock_db):
        """Test quiz completed where streak doesn't increment (line 137)"""
        mock_stats.current_streak = 5  # Same as previous
        
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.update_streak', return_value=False):
                    event = GamificationEventRequest(
                        event_type="quiz_completed",
                        quiz_score=85.0,
                        quiz_completed_at=datetime.utcnow().isoformat()
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    # Should not add streak bonus
                    assert result.streak_incremented is False



