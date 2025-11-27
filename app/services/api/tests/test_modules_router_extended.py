"""
Extended tests for modules router to cover missing lines
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from uuid import uuid4

from finquest_api.routers.modules import get_suggestion_generator, generate_suggestions_task
from finquest_api.db.models import User


class TestModuleDependencies:
    """Tests for module dependencies"""
    
    def test_get_suggestion_generator(self):
        """Test get_suggestion_generator dependency (lines 25-28)"""
        generator = get_suggestion_generator()
        
        assert generator is not None
        # Verify it creates the expected components
        assert hasattr(generator, 'generate_suggestions_for_user')
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_suggestions_task_success(self):
        """Test generate_suggestions_task background task (lines 30-43)"""
        mock_generator = AsyncMock()
        mock_user_obj = Mock(spec=User)
        mock_user_obj.id = uuid4()
        
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj
        
        with patch('finquest_api.routers.modules.SessionLocal', return_value=mock_db):
            with patch('finquest_api.routers.modules.get_engine', return_value=Mock()):
                await generate_suggestions_task(mock_generator, str(mock_user_obj.id))
                
                mock_generator.generate_suggestions_for_user.assert_called_once()
                mock_db.close.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_suggestions_task_no_user(self):
        """Test generate_suggestions_task when user not found"""
        mock_generator = AsyncMock()
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with patch('finquest_api.routers.modules.SessionLocal', return_value=mock_db):
            with patch('finquest_api.routers.modules.get_engine', return_value=Mock()):
                # Should not raise exception
                await generate_suggestions_task(mock_generator, str(uuid4()))
                
                mock_generator.generate_suggestions_for_user.assert_not_called()
                mock_db.close.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_suggestions_task_exception(self):
        """Test generate_suggestions_task with exception"""
        mock_generator = AsyncMock()
        mock_generator.generate_suggestions_for_user.side_effect = Exception("Error")
        mock_user_obj = Mock(spec=User)
        mock_user_obj.id = uuid4()
        
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_obj
        
        with patch('finquest_api.routers.modules.SessionLocal', return_value=mock_db):
            with patch('finquest_api.routers.modules.get_engine', return_value=Mock()):
                # Should handle exception gracefully
                await generate_suggestions_task(mock_generator, str(mock_user_obj.id))
                
                mock_db.close.assert_called_once()


