"""
Additional tests for authentication router endpoints
"""
import pytest
from unittest.mock import Mock

from finquest_api.routers.auth import (
    sign_up, sign_in, sign_out, refresh_token, get_me, google_sign_in
)
from finquest_api.routers.auth import SignUpRequest, SignInRequest, RefreshRequest, GoogleSignInRequest


class TestSignUp:
    """Additional tests for signup endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_signup_without_full_name(self, mock_supabase):
        """Test signup without full_name"""
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        mock_user.user_metadata = {}
        
        mock_session = Mock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        mock_session.expires_in = 3600
        
        mock_response = Mock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase.auth.sign_up.return_value = mock_response
        
        request = SignUpRequest(email="test@example.com", password="password123")
        result = await sign_up(request)
        
        assert result["access_token"] == "test-access-token"
        assert result["user"]["email"] == "test@example.com"
    
    @pytest.mark.anyio("asyncio")
    async def test_signup_generic_exception(self, mock_supabase):
        """Test signup with generic exception"""
        mock_supabase.auth.sign_up.side_effect = Exception("Generic error")
        
        request = SignUpRequest(email="test@example.com", password="password123")
        
        with pytest.raises(Exception) as exc_info:
            await sign_up(request)
        
        assert exc_info.value.status_code == 400
        assert "Sign up failed" in exc_info.value.detail


class TestSignIn:
    """Additional tests for signin endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_signin_generic_exception(self, mock_supabase):
        """Test signin with generic exception"""
        mock_supabase.auth.sign_in_with_password.side_effect = Exception("Generic error")
        
        request = SignInRequest(email="test@example.com", password="password123")
        
        with pytest.raises(Exception) as exc_info:
            await sign_in(request)
        
        assert exc_info.value.status_code == 401
        assert "Sign in failed" in exc_info.value.detail


class TestSignOut:
    """Tests for signout endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_signout_success(self, mock_supabase):
        """Test successful signout"""
        mock_user = Mock()
        mock_supabase.auth.sign_out.return_value = None
        
        result = await sign_out(mock_user)
        
        assert result["message"] == "Successfully signed out"
        mock_supabase.auth.sign_out.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_signout_failure(self, mock_supabase):
        """Test signout with exception"""
        mock_user = Mock()
        mock_supabase.auth.sign_out.side_effect = Exception("Sign out error")
        
        with pytest.raises(Exception) as exc_info:
            await sign_out(mock_user)
        
        assert exc_info.value.status_code == 400
        assert "Sign out failed" in exc_info.value.detail


class TestRefreshToken:
    """Additional tests for refresh token endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_refresh_token_generic_exception(self, mock_supabase):
        """Test refresh token with generic exception"""
        mock_supabase.auth.refresh_session.side_effect = Exception("Generic error")
        
        request = RefreshRequest(refresh_token="old-refresh-token")
        
        with pytest.raises(Exception) as exc_info:
            await refresh_token(request)
        
        assert exc_info.value.status_code == 401
        assert "Token refresh failed" in exc_info.value.detail


class TestGetMe:
    """Tests for /me endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_me_success(self, mock_supabase):
        """Test successful get_me"""
        mock_auth_user = Mock()
        mock_auth_user.id = "test-user-id"
        mock_auth_user.email = "test@example.com"
        mock_auth_user.user_metadata = {"full_name": "Test User"}
        mock_auth_user.created_at = "2024-01-01T00:00:00Z"
        
        mock_response = Mock()
        mock_response.user = mock_auth_user
        
        mock_supabase.auth.get_user.return_value = mock_response
        
        mock_user = Mock()
        result = await get_me(mock_user)
        
        assert result["id"] == "test-user-id"
        assert result["email"] == "test@example.com"
        assert result["full_name"] == "Test User"
    
    @pytest.mark.anyio("asyncio")
    async def test_get_me_user_not_found(self, mock_supabase):
        """Test get_me when user not found"""
        mock_supabase.auth.get_user.return_value = None
        
        mock_user = Mock()
        
        with pytest.raises(Exception) as exc_info:
            await get_me(mock_user)
        
        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail
    
    @pytest.mark.anyio("asyncio")
    async def test_get_me_generic_exception(self, mock_supabase):
        """Test get_me with generic exception"""
        mock_supabase.auth.get_user.side_effect = Exception("Generic error")
        
        mock_user = Mock()
        
        with pytest.raises(Exception) as exc_info:
            await get_me(mock_user)
        
        assert exc_info.value.status_code == 400
        assert "Failed to get user" in exc_info.value.detail


class TestGoogleSignIn:
    """Tests for Google sign in endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_google_sign_in_success(self, mock_supabase):
        """Test successful Google sign in"""
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        mock_user.user_metadata = {"full_name": "Test User"}
        
        mock_session = Mock()
        mock_session.access_token = "test-access-token"
        mock_session.refresh_token = "test-refresh-token"
        mock_session.expires_in = 3600
        
        mock_response = Mock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase.auth.sign_in_with_id_token.return_value = mock_response
        
        request = GoogleSignInRequest(id_token="google-id-token")
        result = await google_sign_in(request)
        
        assert result["access_token"] == "test-access-token"
        assert result["user"]["email"] == "test@example.com"
        mock_supabase.auth.sign_in_with_id_token.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_google_sign_in_failed(self, mock_supabase):
        """Test Google sign in failure"""
        mock_response = Mock()
        mock_response.user = None
        mock_response.session = None
        
        mock_supabase.auth.sign_in_with_id_token.return_value = mock_response
        
        request = GoogleSignInRequest(id_token="invalid-token")
        
        with pytest.raises(Exception) as exc_info:
            await google_sign_in(request)
        
        assert exc_info.value.status_code == 401
        assert "Google sign in failed" in exc_info.value.detail
    
    @pytest.mark.anyio("asyncio")
    async def test_google_sign_in_generic_exception(self, mock_supabase):
        """Test Google sign in with generic exception"""
        mock_supabase.auth.sign_in_with_id_token.side_effect = Exception("Generic error")
        
        request = GoogleSignInRequest(id_token="google-id-token")
        
        with pytest.raises(Exception) as exc_info:
            await google_sign_in(request)
        
        assert exc_info.value.status_code == 401
        assert "Google sign in failed" in exc_info.value.detail

