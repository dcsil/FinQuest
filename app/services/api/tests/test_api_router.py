"""
Tests for API router endpoints
"""
import pytest
from finquest_api.routers.api import api_root


class TestApiRoot:
    """Tests for /api/v1/ endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_api_root(self):
        """Test API root endpoint"""
        result = await api_root()
        
        assert result["message"] == "FinQuest API v1"
        assert result["version"] == "0.1.0"

