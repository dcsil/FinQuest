"""
Pytest fixtures shared across FinQuest API tests.
"""
from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from finquest_api.main import app


@pytest.fixture
def anyio_backend():
    """Force anyio-based tests to run with asyncio only."""
    return "asyncio"


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Provide a FastAPI test client for API tests."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_supabase(monkeypatch) -> MagicMock:
    """Replace Supabase client with a MagicMock for API endpoint tests."""
    mock_client = MagicMock()
    monkeypatch.setattr("finquest_api.supabase_client.supabase", mock_client)
    monkeypatch.setattr("finquest_api.routers.auth.supabase", mock_client)
    return mock_client
