"""
Tests for gamification router endpoints
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from datetime import datetime

from finquest_api.routers.gamification import (
    handle_gamification_event,
    get_gamification_state,
    get_all_badges,
    GamificationEventRequest,
)
from finquest_api.db.models import User, UserGamificationStats, BadgeDefinition


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


class TestHandleGamificationEvent:
    """Tests for /event endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_login_event(self, mock_user, mock_stats, mock_db):
        """Test login event"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                event = GamificationEventRequest(event_type="login")
                result = await handle_gamification_event(event, mock_user, mock_db)
                
                assert result.xp_gained == 10
                assert result.total_xp == 110
                mock_db.commit.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_module_completed_event(self, mock_user, mock_stats, mock_db):
        """Test module completed event"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.check_module_first_time', return_value=False):
                    event = GamificationEventRequest(
                        event_type="module_completed",
                        module_id=str(uuid4())
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    assert result.xp_gained == 25
                    assert result.total_xp == 125
                    assert mock_stats.total_modules_completed == 1
    
    @pytest.mark.anyio("asyncio")
    async def test_module_completed_first_time(self, mock_user, mock_stats, mock_db):
        """Test module completed first time event"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.check_module_first_time', return_value=True):
                    event = GamificationEventRequest(
                        event_type="module_completed",
                        module_id=str(uuid4()),
                        is_first_time_for_module=True
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    assert result.xp_gained == 75  # 25 + 50
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_high_score(self, mock_user, mock_stats, mock_db):
        """Test quiz completed with high score"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.update_streak', return_value=True):
                    event = GamificationEventRequest(
                        event_type="quiz_completed",
                        quiz_score=85.0,
                        quiz_completed_at=datetime.utcnow().isoformat()
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    assert result.xp_gained >= 35
                    assert mock_stats.total_quizzes_completed == 1
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_low_score(self, mock_user, mock_stats, mock_db):
        """Test quiz completed with low score"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.update_streak', return_value=True):
                    event = GamificationEventRequest(
                        event_type="quiz_completed",
                        quiz_score=75.0,
                        quiz_completed_at=datetime.utcnow().isoformat()
                    )
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    assert result.xp_gained >= 20
    
    @pytest.mark.anyio("asyncio")
    async def test_quiz_completed_below_threshold(self, mock_user, mock_stats, mock_db):
        """Test quiz completed below passing threshold"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                event = GamificationEventRequest(
                    event_type="quiz_completed",
                    quiz_score=50.0
                )
                result = await handle_gamification_event(event, mock_user, mock_db)
                
                assert result.xp_gained == 0
                assert mock_stats.total_quizzes_completed == 0
    
    @pytest.mark.anyio("asyncio")
    async def test_portfolio_position_added(self, mock_user, mock_stats, mock_db):
        """Test portfolio position added event"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.get_portfolio_position_count', return_value=5):
                    event = GamificationEventRequest(event_type="portfolio_position_added")
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    assert result.xp_gained == 40
                    assert mock_stats.total_portfolio_positions == 5
    
    @pytest.mark.anyio("asyncio")
    async def test_portfolio_position_updated(self, mock_user, mock_stats, mock_db):
        """Test portfolio position updated event"""
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                event = GamificationEventRequest(event_type="portfolio_position_updated")
                result = await handle_gamification_event(event, mock_user, mock_db)
                
                assert result.xp_gained == 20
    
    @pytest.mark.anyio("asyncio")
    async def test_level_up(self, mock_user, mock_stats, mock_db):
        """Test level up scenario"""
        mock_stats.total_xp = 150
        mock_stats.level = 1
        
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=[]):
                with patch('finquest_api.routers.gamification.compute_level', return_value=2):
                    event = GamificationEventRequest(event_type="login")
                    result = await handle_gamification_event(event, mock_user, mock_db)
                    
                    assert result.level_up is True
    
    @pytest.mark.anyio("asyncio")
    async def test_new_badges(self, mock_user, mock_stats, mock_db):
        """Test new badges awarded"""
        new_badges = [
            {"code": "first_module", "name": "First Module", "description": "Complete your first module"}
        ]
        
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            with patch('finquest_api.routers.gamification.evaluate_badges', return_value=new_badges):
                event = GamificationEventRequest(event_type="login")
                result = await handle_gamification_event(event, mock_user, mock_db)
                
                assert len(result.new_badges) == 1
                assert result.new_badges[0].code == "first_module"


class TestGetGamificationState:
    """Tests for /me endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_gamification_state(self, mock_user, mock_stats, mock_db):
        """Test getting gamification state"""
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.code = "test_badge"
        mock_badge.name = "Test Badge"
        mock_badge.description = "Test description"
        
        mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = [mock_badge]
        
        with patch('finquest_api.routers.gamification.get_or_create_stats', return_value=mock_stats):
            result = await get_gamification_state(mock_user, mock_db)
            
            assert result.total_xp == 100
            assert result.level == 1
            assert len(result.badges) == 1


class TestGetAllBadges:
    """Tests for /badges endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_all_badges(self, mock_user, mock_db):
        """Test getting all badges"""
        mock_badge1 = Mock(spec=BadgeDefinition)
        mock_badge1.id = uuid4()
        mock_badge1.code = "badge1"
        mock_badge1.name = "Badge 1"
        mock_badge1.description = "Description 1"
        mock_badge1.category = "learning"
        mock_badge1.is_active = True
        
        mock_badge2 = Mock(spec=BadgeDefinition)
        mock_badge2.id = uuid4()
        mock_badge2.code = "badge2"
        mock_badge2.name = "Badge 2"
        mock_badge2.description = "Description 2"
        mock_badge2.category = "streak"
        mock_badge2.is_active = True
        
        # Mock query for all badges
        mock_query_all = Mock()
        mock_query_all.all.return_value = [mock_badge1, mock_badge2]
        
        # Mock query for earned badges
        mock_query_earned = Mock()
        mock_query_earned.filter.return_value.all.return_value = [(mock_badge1.id,)]
        
        mock_db.query.side_effect = [mock_query_all, mock_query_earned]
        
        result = await get_all_badges(mock_user, mock_db)
        
        assert len(result) == 2
        assert result[0].code == "badge1"
        assert result[0].earned is True
        assert result[1].code == "badge2"
        assert result[1].earned is False



