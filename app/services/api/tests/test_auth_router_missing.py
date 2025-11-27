"""
Tests for missing line in auth router
"""
import pytest
from unittest.mock import Mock, MagicMock

from finquest_api.routers.auth import sign_up
from finquest_api.routers.auth import SignUpRequest


@pytest.fixture
def mock_supabase(monkeypatch):
    """Replace Supabase client with a MagicMock"""
    mock_client = MagicMock()
    monkeypatch.setattr("finquest_api.supabase_client.supabase", mock_client)
    monkeypatch.setattr("finquest_api.routers.auth.supabase", mock_client)
    return mock_client


class TestSignUpMissingLine:
    """Tests for missing line in sign_up"""
    
    @pytest.mark.anyio("asyncio")
    async def test_signup_no_user_response(self, mock_supabase):
        """Test signup when response.user is None (line 57)"""
        mock_response = Mock()
        mock_response.user = None
        mock_response.session = None
        
        mock_supabase.auth.sign_up.return_value = mock_response
        
        request = SignUpRequest(email="test@example.com", password="password123")
        
        with pytest.raises(Exception) as exc_info:
            await sign_up(request)
        
        assert exc_info.value.status_code == 400
        assert "Failed to create user" in exc_info.value.detail

