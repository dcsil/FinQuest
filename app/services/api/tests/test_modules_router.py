"""
Tests for modules router endpoints
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from uuid import uuid4

from finquest_api.routers.modules import get_module, submit_module_attempt
from finquest_api.db.models import User, Module, ModuleVersion, ModuleQuestion, ModuleChoice, ModuleAttempt, ModuleCompletion
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


class TestGetModule:
    """Tests for GET /{module_id} endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_module_success(self, mock_user, mock_db):
        """Test successful module retrieval"""
        module_id = str(uuid4())
        mock_module = Mock(spec=Module)
        mock_module.id = uuid4()
        mock_module.title = "Test Module"
        
        mock_version = Mock(spec=ModuleVersion)
        mock_version.content_markdown = "# Test Content"
        
        mock_question = Mock(spec=ModuleQuestion)
        mock_question.id = uuid4()
        mock_question.prompt_markdown = "Test question?"
        mock_question.explanation_markdown = "Explanation"
        mock_question.order_index = 0
        
        mock_choice = Mock(spec=ModuleChoice)
        mock_choice.text_markdown = "Choice 1"
        mock_choice.is_correct = True
        
        # Mock queries
        mock_module_query = Mock()
        mock_module_query.filter.return_value.first.return_value = mock_module
        
        mock_version_query = Mock()
        mock_version_query.filter.return_value.order_by.return_value.first.return_value = mock_version
        
        mock_question_query = Mock()
        mock_question_query.filter.return_value.order_by.return_value.all.return_value = [mock_question]
        
        mock_choice_query = Mock()
        mock_choice_query.filter.return_value.all.return_value = [mock_choice]
        
        mock_db.query.side_effect = [
            mock_module_query,
            mock_version_query,
            mock_question_query,
            mock_choice_query,
        ]
        
        result = await get_module(module_id, mock_user, mock_db)
        
        assert result.title == "Test Module"
        assert result.body == "# Test Content"
        assert len(result.questions) == 1
    
    @pytest.mark.anyio("asyncio")
    async def test_get_module_not_found(self, mock_user, mock_db):
        """Test module not found"""
        module_id = str(uuid4())
        # Mock the query chain properly
        mock_filter = Mock()
        mock_filter.first.return_value = None
        mock_query = Mock()
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        with pytest.raises(Exception) as exc_info:
            await get_module(module_id, mock_user, mock_db)
        
        assert exc_info.value.status_code == 404
        assert "Module not found" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_get_module_no_version(self, mock_user, mock_db):
        """Test module without version"""
        module_id = str(uuid4())
        mock_module = Mock(spec=Module)
        mock_module.id = uuid4()
        
        # Mock module query
        mock_module_filter = Mock()
        mock_module_filter.first.return_value = mock_module
        mock_module_query = Mock()
        mock_module_query.filter.return_value = mock_module_filter
        
        # Mock version query
        mock_version_order_by = Mock()
        mock_version_order_by.first.return_value = None
        mock_version_filter = Mock()
        mock_version_filter.order_by.return_value = mock_version_order_by
        mock_version_query = Mock()
        mock_version_query.filter.return_value = mock_version_filter
        
        mock_db.query.side_effect = [mock_module_query, mock_version_query]
        
        with pytest.raises(Exception) as exc_info:
            await get_module(module_id, mock_user, mock_db)
        
        assert exc_info.value.status_code == 404
        assert "Module content not found" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_get_module_invalid_id(self, mock_user, mock_db):
        """Test invalid module ID"""
        with pytest.raises(Exception) as exc_info:
            await get_module("invalid-uuid", mock_user, mock_db)
        
        assert exc_info.value.status_code == 400
    
    @pytest.mark.anyio("asyncio")
    async def test_get_module_exception(self, mock_user, mock_db):
        """Test exception handling"""
        module_id = str(uuid4())
        mock_db.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception) as exc_info:
            await get_module(module_id, mock_user, mock_db)
        
        assert exc_info.value.status_code == 500


class TestSubmitModuleAttempt:
    """Tests for POST /{module_id}/attempt endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_passed(self, mock_user, mock_db):
        """Test submitting a passed attempt"""
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
        
        # Mock no existing completion
        mock_completion_query = Mock()
        mock_completion_query.filter.return_value.first.return_value = None
        
        # Mock no existing suggestion
        mock_suggestion_query = Mock()
        mock_suggestion_query.filter.return_value.first.return_value = None
        
        # Mock all suggestions query
        mock_all_suggestions_query = Mock()
        mock_all_suggestions_query.filter.return_value.all.return_value = []
        
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
            mock_db.add.assert_called()
            mock_db.commit.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_failed(self, mock_user, mock_db):
        """Test submitting a failed attempt"""
        module_id = str(uuid4())
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        request = ModuleAttemptRequest(
            score=50,
            max_score=100,
            passed=False,
            answers={}
        )
        
        mock_attempt = Mock(spec=ModuleAttempt)
        mock_attempt.id = uuid4()
        
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
            assert result.completed is False
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_already_completed(self, mock_user, mock_db):
        """Test submitting attempt when already completed"""
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
        
        mock_existing_completion = Mock(spec=ModuleCompletion)
        mock_completion_query = Mock()
        mock_completion_query.filter.return_value.first.return_value = mock_existing_completion
        
        mock_db.query.return_value = mock_completion_query
        
        with patch('finquest_api.routers.modules.ModuleAttempt', return_value=mock_attempt):
            result = await submit_module_attempt(
                module_id,
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
            
            assert result.completed is False
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_invalid_id(self, mock_user, mock_db):
        """Test invalid module ID"""
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        request = ModuleAttemptRequest(
            score=85,
            max_score=100,
            passed=True,
            answers={}
        )
        
        with pytest.raises(Exception) as exc_info:
            await submit_module_attempt(
                "invalid-uuid",
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
        
        assert exc_info.value.status_code == 400
    
    @pytest.mark.anyio("asyncio")
    async def test_submit_attempt_exception(self, mock_user, mock_db):
        """Test exception handling"""
        module_id = str(uuid4())
        mock_background_tasks = Mock()
        mock_suggestion_generator = AsyncMock()
        
        request = ModuleAttemptRequest(
            score=85,
            max_score=100,
            passed=True,
            answers={}
        )
        
        mock_db.add.side_effect = Exception("Database error")
        
        with pytest.raises(Exception) as exc_info:
            await submit_module_attempt(
                module_id,
                request,
                mock_background_tasks,
                mock_user,
                mock_db,
                mock_suggestion_generator
            )
        
        assert exc_info.value.status_code == 500
        mock_db.rollback.assert_called_once()

