"""
Pytest fixtures shared across FinQuest API tests.
"""
import pytest


@pytest.fixture
def anyio_backend():
    """Force anyio-based tests to run with asyncio only."""
    return "asyncio"
