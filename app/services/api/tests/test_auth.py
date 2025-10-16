"""
Tests for authentication endpoints
"""
from unittest.mock import Mock


class TestSignUp:
    """Tests for /api/v1/auth/signup endpoint"""
    
    def test_signup_success(self, client, mock_supabase):
        """Test successful user signup"""
        # Mock Supabase response
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
        
        mock_supabase.auth.sign_up.return_value = mock_response
        
        # Make request
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User"
            }
        )
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data["access_token"] == "test-access-token"
        assert data["refresh_token"] == "test-refresh-token"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["full_name"] == "Test User"
    
    def test_signup_duplicate_email(self, client, mock_supabase):
        """Test signup with already registered email"""
        mock_supabase.auth.sign_up.side_effect = Exception("User already registered")
        
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "existing@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_signup_invalid_email(self, client):
        """Test signup with invalid email format"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )
        
        assert response.status_code == 422  # Validation error


class TestSignIn:
    """Tests for /api/v1/auth/signin endpoint"""
    
    def test_signin_success(self, client, mock_supabase):
        """Test successful signin"""
        # Mock Supabase response
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
        
        mock_supabase.auth.sign_in_with_password.return_value = mock_response
        
        # Make request
        response = client.post(
            "/api/v1/auth/signin",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "test-access-token"
        assert data["user"]["email"] == "test@example.com"
    
    def test_signin_invalid_credentials(self, client, mock_supabase):
        """Test signin with invalid credentials"""
        mock_response = Mock()
        mock_response.user = None
        mock_response.session = None
        
        mock_supabase.auth.sign_in_with_password.return_value = mock_response
        
        response = client.post(
            "/api/v1/auth/signin",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()


class TestRefreshToken:
    """Tests for /api/v1/auth/refresh endpoint"""
    
    def test_refresh_success(self, client, mock_supabase):
        """Test successful token refresh"""
        mock_user = Mock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        mock_user.user_metadata = {"full_name": "Test User"}
        
        mock_session = Mock()
        mock_session.access_token = "new-access-token"
        mock_session.refresh_token = "new-refresh-token"
        mock_session.expires_in = 3600
        
        mock_response = Mock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        
        mock_supabase.auth.refresh_session.return_value = mock_response
        
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "old-refresh-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "new-access-token"
    
    def test_refresh_invalid_token(self, client, mock_supabase):
        """Test refresh with invalid token"""
        mock_response = Mock()
        mock_response.session = None
        
        mock_supabase.auth.refresh_session.return_value = mock_response
        
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"}
        )
        
        assert response.status_code == 401
        assert "invalid refresh token" in response.json()["detail"].lower()


class TestHealthEndpoints:
    """Tests for health check endpoints"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to FinQuest API"
        assert data["version"] == "0.1.0"
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_readiness_check(self, client):
        """Test readiness check endpoint"""
        response = client.get("/ready")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
