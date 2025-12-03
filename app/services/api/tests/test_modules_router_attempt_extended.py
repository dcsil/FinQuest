"""
Extended tests for module attempt endpoint to cover missing lines
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from uuid import uuid4

from finquest_api.routers.modules import submit_module_attempt
from finquest_api.db.models import User, ModuleAttempt, Suggestion
from finquest_api.schemas import ModuleAttemptRequest


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


class TestSubmitModuleAttemptExtended:
    """Extended tests for submit_module_attempt"""
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_all_suggestions_completed(self, mock_user, mock_db):
        """Test submitting attempt when all suggestions are completed (lines 99-100, 117)"""
        module_id = str(uuid4())
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        request = ModuleAttemptRequest(
            score=85,
            max_score=100,
            passed=True,
            answers={}
        )
        
        mock_attempt = Mock(spec=ModuleAttempt)
        mock_attempt.id = uuid4()
        
        # Mock existing completion check (no existing)
        mock_completion_query = Mock()
        mock_completion_query.filter.return_value.first.return_value = None
        
        # Mock suggestion update
        mock_suggestion = Mock(spec=Suggestion)
        mock_suggestion.status = "shown"
        mock_suggestion_query = Mock()
        mock_suggestion_query.filter.return_value.first.return_value = mock_suggestion
        
        # Mock all suggestions query - all completed
        mock_all_suggestions = Mock(spec=Suggestion)
        mock_all_suggestions.status = "completed"
        mock_all_suggestions_query = Mock()
        mock_all_suggestions_query.filter.return_value.all.return_value = [mock_all_suggestions]
        
        mock_db.query.side_effect = [
            mock_completion_query,
            mock_suggestion_query,
            mock_all_suggestions_query,
        ]
        
        with patch('finquest_api.routers.modules.ModuleAttempt', return_value=mock_attempt):
            result = await submit_module_attempt(
                module_id,
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
            
            assert result.status == "ok"
            assert result.completed is True
            # Should trigger background task since all suggestions are completed
            mock_background_tasks.add_task.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_some_suggestions_not_completed(self, mock_user, mock_db):
        """Test submitting attempt when some suggestions are not completed"""
        module_id = str(uuid4())
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        request = ModuleAttemptRequest(
            score=85,
            max_score=100,
            passed=True,
            answers={}
        )
        
        mock_attempt = Mock(spec=ModuleAttempt)
        mock_attempt.id = uuid4()
        
        # Mock existing completion check (no existing)
        mock_completion_query = Mock()
        mock_completion_query.filter.return_value.first.return_value = None
        
        # Mock suggestion update
        mock_suggestion = Mock(spec=Suggestion)
        mock_suggestion.status = "shown"
        mock_suggestion_query = Mock()
        mock_suggestion_query.filter.return_value.first.return_value = mock_suggestion
        
        # Mock all suggestions query - mix of completed and shown
        mock_suggestion1 = Mock(spec=Suggestion)
        mock_suggestion1.status = "completed"
        mock_suggestion2 = Mock(spec=Suggestion)
        mock_suggestion2.status = "shown"
        mock_all_suggestions_query = Mock()
        mock_all_suggestions_query.filter.return_value.all.return_value = [mock_suggestion1, mock_suggestion2]
        
        mock_db.query.side_effect = [
            mock_completion_query,
            mock_suggestion_query,
            mock_all_suggestions_query,
        ]
        
        with patch('finquest_api.routers.modules.ModuleAttempt', return_value=mock_attempt):
            result = await submit_module_attempt(
                module_id,
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
            
            assert result.status == "ok"
            # Should not trigger background task since not all are completed
            mock_background_tasks.add_task.assert_not_called()



