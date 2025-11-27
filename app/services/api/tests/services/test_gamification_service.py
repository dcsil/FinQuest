"""
Tests for gamification service functions
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from datetime import date, timedelta

from finquest_api.services.gamification import (
    compute_level,
    get_xp_to_next_level,
    get_or_create_stats,
    update_streak,
    evaluate_badges,
    check_module_first_time,
    get_portfolio_position_count,
    XP_REWARDS,
    LEVEL_THRESHOLDS,
)
from finquest_api.db.models import (
    UserGamificationStats,
    BadgeDefinition,
    UserBadge,
    ModuleCompletion,
    Portfolio,
    Transaction,
)


class TestComputeLevel:
    """Tests for compute_level function"""
    
    def test_compute_level_1(self):
        """Test level 1 (0 XP)"""
        assert compute_level(0) == 1
        assert compute_level(100) == 1
    
    def test_compute_level_2(self):
        """Test level 2 (200 XP)"""
        assert compute_level(200) == 2
        assert compute_level(300) == 2
    
    def test_compute_level_5(self):
        """Test level 5 (800 XP)"""
        assert compute_level(800) == 5
        assert compute_level(900) == 5
    
    def test_compute_level_10(self):
        """Test level 10 (3000+ XP)"""
        assert compute_level(3000) == 10
        assert compute_level(5000) == 10  # Capped at 10


class TestGetXpToNextLevel:
    """Tests for get_xp_to_next_level function"""
    
    def test_xp_to_next_level_1(self):
        """Test XP needed from level 1 to 2"""
        assert get_xp_to_next_level(0, 1) == 200
        assert get_xp_to_next_level(100, 1) == 100
    
    def test_xp_to_next_level_5(self):
        """Test XP needed from level 5 to 6"""
        assert get_xp_to_next_level(800, 5) == 200
        assert get_xp_to_next_level(900, 5) == 100
    
    def test_xp_to_next_level_10(self):
        """Test XP needed at max level"""
        assert get_xp_to_next_level(3000, 10) == 0
        assert get_xp_to_next_level(5000, 10) == 0


class TestGetOrCreateStats:
    """Tests for get_or_create_stats function"""
    
    def test_get_existing_stats(self):
        """Test getting existing stats"""
        mock_db = MagicMock()
        mock_stats = Mock(spec=UserGamificationStats)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_stats
        
        user_id = uuid4()
        result = get_or_create_stats(mock_db, user_id)
        
        assert result == mock_stats
        mock_db.add.assert_not_called()
    
    def test_create_new_stats(self):
        """Test creating new stats"""
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        new_stats = Mock(spec=UserGamificationStats)
        with patch('finquest_api.services.gamification.UserGamificationStats', return_value=new_stats):
            user_id = uuid4()
            result = get_or_create_stats(mock_db, user_id)
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()


class TestUpdateStreak:
    """Tests for update_streak function"""
    
    def test_first_streak(self):
        """Test first streak"""
        mock_db = MagicMock()
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.last_streak_date = None
        mock_stats.current_streak = 0
        
        quiz_date = date.today()
        result = update_streak(mock_db, mock_stats, quiz_date)
        
        assert result is True
        assert mock_stats.current_streak == 1
        assert mock_stats.last_streak_date == quiz_date
    
    def test_consecutive_day(self):
        """Test consecutive day streak"""
        mock_db = MagicMock()
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.last_streak_date = date.today() - timedelta(days=1)
        mock_stats.current_streak = 5
        
        quiz_date = date.today()
        result = update_streak(mock_db, mock_stats, quiz_date)
        
        assert result is True
        assert mock_stats.current_streak == 6
        assert mock_stats.last_streak_date == quiz_date
    
    def test_same_day(self):
        """Test same day (no increment)"""
        mock_db = MagicMock()
        mock_stats = Mock(spec=UserGamificationStats)
        today = date.today()
        mock_stats.last_streak_date = today
        mock_stats.current_streak = 5
        
        result = update_streak(mock_db, mock_stats, today)
        
        assert result is False
        assert mock_stats.current_streak == 5
    
    def test_streak_broken(self):
        """Test streak broken (reset to 1)"""
        mock_db = MagicMock()
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.last_streak_date = date.today() - timedelta(days=3)
        mock_stats.current_streak = 10
        
        quiz_date = date.today()
        result = update_streak(mock_db, mock_stats, quiz_date)
        
        assert result is True
        assert mock_stats.current_streak == 1
        assert mock_stats.last_streak_date == quiz_date


class TestEvaluateBadges:
    """Tests for evaluate_badges function"""
    
    def test_module_5_badge(self):
        """Test MODULE_5 badge evaluation"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 5
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 0
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "MODULE_5"
        mock_badge.name = "5 Modules"
        mock_badge.description = "Complete 5 modules"
        mock_badge.is_active = True
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition query
        mock_badge_query = Mock()
        mock_badge_query.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "MODULE_5"
        mock_db.add.assert_called_once()
    
    def test_streak_7_badge(self):
        """Test STREAK_7 badge evaluation"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 0
        mock_stats.current_streak = 7
        mock_stats.total_portfolio_positions = 0
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "STREAK_7"
        mock_badge.name = "7 Day Streak"
        mock_badge.description = "7 day streak"
        mock_badge.is_active = True
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition query
        mock_badge_query = Mock()
        mock_badge_query.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "STREAK_7"
    
    def test_portfolio_creator_badge(self):
        """Test PORTFOLIO_CREATOR badge evaluation"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 0
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 1
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "PORTFOLIO_CREATOR"
        mock_badge.name = "Portfolio Creator"
        mock_badge.description = "Add first position"
        mock_badge.is_active = True
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition query
        mock_badge_query = Mock()
        mock_badge_query.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "PORTFOLIO_CREATOR"
    
    def test_no_new_badges(self):
        """Test when no new badges are earned"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 0
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 0
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        mock_db.query.return_value = mock_existing_query
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 0


class TestCheckModuleFirstTime:
    """Tests for check_module_first_time function"""
    
    def test_first_time_true(self):
        """Test first time completion"""
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        user_id = uuid4()
        module_id = uuid4()
        
        result = check_module_first_time(mock_db, user_id, module_id)
        
        assert result is True
    
    def test_first_time_false(self):
        """Test not first time completion"""
        mock_db = MagicMock()
        mock_completion = Mock(spec=ModuleCompletion)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_completion
        
        user_id = uuid4()
        module_id = uuid4()
        
        result = check_module_first_time(mock_db, user_id, module_id)
        
        assert result is False


class TestGetPortfolioPositionCount:
    """Tests for get_portfolio_position_count function"""
    
    def test_no_portfolio(self):
        """Test when user has no portfolio"""
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        user_id = uuid4()
        result = get_portfolio_position_count(mock_db, user_id)
        
        assert result == 0
    
    def test_with_positions(self):
        """Test counting positions"""
        mock_db = MagicMock()
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        # Mock portfolio query
        mock_portfolio_query = Mock()
        mock_portfolio_query.filter.return_value.first.return_value = mock_portfolio
        
        # Mock transaction query
        mock_transaction_query = Mock()
        mock_transaction_query.filter.return_value.count.return_value = 3
        
        mock_db.query.side_effect = [mock_portfolio_query, mock_transaction_query]
        
        user_id = uuid4()
        result = get_portfolio_position_count(mock_db, user_id)
        
        assert result == 3

