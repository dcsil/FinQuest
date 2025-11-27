"""
Tests for authentication utilities
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from jose import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from finquest_api.auth_utils import verify_token, get_current_user
from finquest_api.config import settings
from finquest_api.db.models import User


@pytest.fixture
def mock_token_payload():
    """Create a mock JWT token payload"""
    return {
        "sub": str(uuid4()),
        "email": "test@example.com",
        "aud": "authenticated"
    }


@pytest.fixture
def mock_user():
    """Create a mock user"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.auth_user_id = uuid4()
    user.email = "test@example.com"
    user.deleted_at = None
    return user


class TestVerifyToken:
    """Tests for verify_token function"""
    
    @pytest.mark.anyio("asyncio")
    async def test_verify_token_success(self, mock_token_payload):
        """Test successful token verification"""
        token = jwt.encode(
            mock_token_payload,
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256"
        )
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        payload = await verify_token(credentials)
        assert payload["sub"] == mock_token_payload["sub"]
        assert payload["email"] == mock_token_payload["email"]
    
    @pytest.mark.anyio("asyncio")
    async def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid-token"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await verify_token(credentials)
        
        assert exc_info.value.status_code == 401
        assert "Invalid authentication credentials" in exc_info.value.detail
    
    @pytest.mark.anyio("asyncio")
    async def test_verify_token_wrong_secret(self, mock_token_payload):
        """Test token verification with wrong secret"""
        token = jwt.encode(
            mock_token_payload,
            "wrong-secret",
            algorithm="HS256"
        )
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await verify_token(credentials)
        
        assert exc_info.value.status_code == 401


class TestGetCurrentUser:
    """Tests for get_current_user function"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_current_user_existing(self, mock_token_payload, mock_user):
        """Test getting existing user from database"""
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        user = await get_current_user(mock_token_payload, mock_db)
        
        assert user == mock_user
        mock_db.query.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_get_current_user_create_new(self, mock_token_payload):
        """Test creating new user when doesn't exist"""
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        new_user = Mock(spec=User)
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        with patch('finquest_api.auth_utils.User', return_value=new_user):
            user = await get_current_user(mock_token_payload, mock_db)
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_get_current_user_missing_sub(self):
        """Test get_current_user with missing sub in token"""
        token_payload = {"email": "test@example.com"}
        mock_db = MagicMock()
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token_payload, mock_db)
        
        assert exc_info.value.status_code == 401
        assert "Invalid token payload" in exc_info.value.detail
    
    @pytest.mark.anyio("asyncio")
    async def test_get_current_user_invalid_uuid(self):
        """Test get_current_user with invalid UUID format"""
        token_payload = {"sub": "not-a-valid-uuid"}
        mock_db = MagicMock()
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token_payload, mock_db)
        
        assert exc_info.value.status_code == 401
        assert "Invalid user ID format" in exc_info.value.detail

