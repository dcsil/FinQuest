"""
Pytest configuration and fixtures
"""
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Set test environment variables before importing app
os.environ['SUPABASE_URL'] = 'http://test.supabase.co'
os.environ['SUPABASE_KEY'] = 'test-key'
os.environ['SUPABASE_JWT_SECRET'] = 'test-secret'


@pytest.fixture
def client():
    """FastAPI test client"""
    # Mock supabase client before importing to avoid initialization errors
    with patch('finquest_api.supabase_client.create_client'):
        from finquest_api.main import app
        return TestClient(app)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing"""
    with patch('finquest_api.routers.auth.supabase') as mock:
        yield mock
