"""
Tests for missing lines in gamification service
"""
import pytest
from unittest.mock import Mock, MagicMock
from uuid import uuid4

from finquest_api.services.gamification import (
    get_xp_to_next_level,
    evaluate_badges,
)
from finquest_api.db.models import UserGamificationStats, BadgeDefinition, UserBadge


class TestGetXpToNextLevelMissing:
    """Tests for missing line in get_xp_to_next_level"""
    
    def test_get_xp_to_next_level_no_next_threshold(self):
        """Test get_xp_to_next_level when next threshold is None (line 75)"""
        # This tests the case where next_level_threshold is None
        # This happens when level is already at max or beyond thresholds
        result = get_xp_to_next_level(5000, 11)  # Level beyond max
        
        assert result == 0


class TestEvaluateBadgesMissing:
    """Tests for missing lines in evaluate_badges"""
    
    def test_evaluate_badges_module_10(self):
        """Test MODULE_10 badge evaluation (lines 164-168)"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 10
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 0
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "MODULE_10"
        mock_badge.name = "10 Modules"
        mock_badge.description = "Complete 10 modules"
        mock_badge.is_active = True
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition queries - MODULE_5 check first (returns None), then MODULE_10
        mock_badge_query_mod5 = Mock()
        mock_badge_query_mod5.filter.return_value.first.return_value = None
        
        mock_badge_query_mod10 = Mock()
        mock_badge_query_mod10.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query_mod5, mock_badge_query_mod10]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "MODULE_10"
    
    def test_evaluate_badges_module_20(self):
        """Test MODULE_20 badge evaluation (lines 175-179)"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 20
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 0
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "MODULE_20"
        mock_badge.name = "20 Modules"
        mock_badge.description = "Complete 20 modules"
        mock_badge.is_active = True
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition queries - MODULE_5, MODULE_10 checks first (return None), then MODULE_20
        mock_badge_query_mod5 = Mock()
        mock_badge_query_mod5.filter.return_value.first.return_value = None
        
        mock_badge_query_mod10 = Mock()
        mock_badge_query_mod10.filter.return_value.first.return_value = None
        
        mock_badge_query_mod20 = Mock()
        mock_badge_query_mod20.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query_mod5, mock_badge_query_mod10, mock_badge_query_mod20]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "MODULE_20"
    
    def test_evaluate_badges_streak_30(self):
        """Test STREAK_30 badge evaluation (lines 198-202)"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 0
        mock_stats.current_streak = 30
        mock_stats.total_portfolio_positions = 0
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "STREAK_30"
        mock_badge.name = "30 Day Streak"
        mock_badge.description = "30 day streak"
        mock_badge.is_active = True
        
        # Mock existing badges query - include STREAK_7 so it's skipped
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = [("STREAK_7",)]  # STREAK_7 already exists
        
        # Mock badge definition queries
        # Since total_modules_completed=0, MODULE_5/10/20 checks are skipped
        # Since STREAK_7 is in existing_codes, STREAK_7 check is skipped
        # Only STREAK_30 will be checked
        mock_badge_query_streak30 = Mock()
        mock_badge_query_streak30.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [
            mock_existing_query, 
            mock_badge_query_streak30  # Only STREAK_30 query (others skipped due to conditions)
        ]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "STREAK_30"
    
    def test_evaluate_badges_diversifier(self):
        """Test DIVERSIFIER badge evaluation (lines 221-225)"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 0
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 3
        
        mock_badge = Mock(spec=BadgeDefinition)
        mock_badge.id = uuid4()
        mock_badge.code = "DIVERSIFIER"
        mock_badge.name = "Diversifier"
        mock_badge.description = "Add 3 positions"
        mock_badge.is_active = True
        
        # Mock existing badges query - include PORTFOLIO_CREATOR so it's skipped
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = [("PORTFOLIO_CREATOR",)]  # PORTFOLIO_CREATOR already exists
        
        # Mock badge definition queries
        # Since total_modules_completed=0, MODULE_5/10/20 checks are skipped
        # Since current_streak=0, STREAK_7/30 checks are skipped
        # Since PORTFOLIO_CREATOR is in existing_codes, PORTFOLIO_CREATOR check is skipped
        # Only DIVERSIFIER will be checked
        mock_badge_query_diversifier = Mock()
        mock_badge_query_diversifier.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [
            mock_existing_query, 
            mock_badge_query_diversifier  # Only DIVERSIFIER query (others skipped due to conditions)
        ]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        assert len(result) == 1
        assert result[0]["code"] == "DIVERSIFIER"
    
    def test_evaluate_badges_inactive_badge(self):
        """Test badge evaluation when badge is inactive"""
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
        mock_badge.is_active = False  # Inactive badge
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition query
        mock_badge_query = Mock()
        mock_badge_query.filter.return_value.first.return_value = mock_badge
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        # Should not award inactive badge
        assert len(result) == 0
    
    def test_evaluate_badges_badge_not_found(self):
        """Test badge evaluation when badge definition not found"""
        mock_db = MagicMock()
        user_id = uuid4()
        
        mock_stats = Mock(spec=UserGamificationStats)
        mock_stats.total_modules_completed = 5
        mock_stats.current_streak = 0
        mock_stats.total_portfolio_positions = 0
        
        # Mock existing badges query (empty)
        mock_existing_query = Mock()
        mock_existing_query.join.return_value.filter.return_value.all.return_value = []
        
        # Mock badge definition query returns None
        mock_badge_query = Mock()
        mock_badge_query.filter.return_value.first.return_value = None
        
        mock_db.query.side_effect = [mock_existing_query, mock_badge_query]
        
        result = evaluate_badges(mock_db, user_id, mock_stats)
        
        # Should not award badge if definition not found
        assert len(result) == 0

