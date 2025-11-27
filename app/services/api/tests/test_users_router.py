"""
Tests for users router endpoints
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from uuid import uuid4

from finquest_api.routers.users import (
    get_onboarding_status,
    get_financial_profile,
    update_financial_profile,
    get_suggestions,
)
from finquest_api.db.models import User, OnboardingResponse, Suggestion
from finquest_api.schemas import UpdateProfileRequest, UserProfile


@pytest.fixture
def mock_user():
    """Create a mock user"""
    user = Mock(spec=User)
    user.id = uuid4()
    return user


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    db = MagicMock()
    return db


class TestGetOnboardingStatus:
    """Tests for /onboarding-status endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_onboarding_completed(self, mock_user, mock_db):
        """Test when onboarding is completed"""
        mock_response = Mock(spec=OnboardingResponse)
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_response
        
        result = await get_onboarding_status(mock_user, mock_db)
        
        assert result["completed"] is True
    
    @pytest.mark.anyio("asyncio")
    async def test_onboarding_not_completed(self, mock_user, mock_db):
        """Test when onboarding is not completed"""
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        
        result = await get_onboarding_status(mock_user, mock_db)
        
        assert result["completed"] is False
    
    @pytest.mark.anyio("asyncio")
    async def test_onboarding_status_exception(self, mock_user, mock_db):
        """Test exception handling"""
        mock_db.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception) as exc_info:
            await get_onboarding_status(mock_user, mock_db)
        
        assert exc_info.value.status_code == 500


class TestGetFinancialProfile:
    """Tests for /financial-profile endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_financial_profile_with_data(self, mock_user, mock_db):
        """Test getting financial profile with data"""
        mock_response = Mock(spec=OnboardingResponse)
        mock_response.answers = {
            "risk_tolerance": "moderate",
            "investment_goals": ["retirement"]
        }
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_response
        
        result = await get_financial_profile(mock_user, mock_db)
        
        assert isinstance(result, UserProfile)
    
    @pytest.mark.anyio("asyncio")
    async def test_get_financial_profile_empty(self, mock_user, mock_db):
        """Test getting financial profile when no data exists"""
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        
        result = await get_financial_profile(mock_user, mock_db)
        
        assert isinstance(result, UserProfile)
    
    @pytest.mark.anyio("asyncio")
    async def test_get_financial_profile_exception(self, mock_user, mock_db):
        """Test exception handling"""
        mock_db.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception) as exc_info:
            await get_financial_profile(mock_user, mock_db)
        
        assert exc_info.value.status_code == 500


class TestUpdateFinancialProfile:
    """Tests for /financial-profile POST endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_update_financial_profile_success(self, mock_user, mock_db):
        """Test successful profile update"""
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        request = UpdateProfileRequest(risk_tolerance="moderate")
        
        with patch('finquest_api.routers.users.OnboardingResponse') as mock_response_class:
            mock_response = Mock(spec=OnboardingResponse)
            mock_response.id = uuid4()
            mock_response_class.return_value = mock_response
            
            result = await update_financial_profile(
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
            
            assert result["status"] == "ok"
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_background_tasks.add_task.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_update_financial_profile_exception(self, mock_user, mock_db):
        """Test exception handling"""
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        mock_db.add.side_effect = Exception("Database error")
        
        request = UpdateProfileRequest(risk_tolerance="moderate")
        
        with pytest.raises(Exception) as exc_info:
            await update_financial_profile(
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
        
        assert exc_info.value.status_code == 500
        mock_db.rollback.assert_called_once()


class TestGetSuggestions:
    """Tests for /suggestions endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_suggestions_with_data(self, mock_user, mock_db):
        """Test getting suggestions when they exist"""
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        mock_suggestion = Mock(spec=Suggestion)
        mock_suggestion.id = uuid4()
        mock_suggestion.reason = "Test reason"
        mock_suggestion.confidence = 0.85
        mock_suggestion.module_id = uuid4()
        mock_suggestion.status = "shown"
        mock_suggestion.metadata_json = {}
        mock_suggestion.created_at = None
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_suggestion]
        
        result = await get_suggestions(mock_background_tasks, mock_user, mock_db, mock_suggestion_generator)
        
        assert len(result) == 1
        assert result[0].reason == "Test reason"
    
    @pytest.mark.anyio("asyncio")
    async def test_get_suggestions_empty(self, mock_user, mock_db):
        """Test getting suggestions when none exist"""
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
        
        result = await get_suggestions(mock_background_tasks, mock_user, mock_db, mock_suggestion_generator)
        
        assert result == []
        mock_background_tasks.add_task.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_get_suggestions_exception(self, mock_user, mock_db):
        """Test exception handling"""
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        mock_db.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception) as exc_info:
            await get_suggestions(mock_background_tasks, mock_user, mock_db, mock_suggestion_generator)
        
        assert exc_info.value.status_code == 500

