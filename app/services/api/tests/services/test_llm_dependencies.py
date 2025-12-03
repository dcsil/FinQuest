"""
Tests for LLM dependencies
"""
import pytest
from finquest_api.services.llm.dependencies import get_llm_service, _singleton_llm_service
from finquest_api.services.llm.service import LLMService


class TestGetLLMService:
    """Tests for get_llm_service dependency"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_llm_service(self):
        """Test getting LLM service"""
        service = await get_llm_service()
        
        assert isinstance(service, LLMService)
    
    @pytest.mark.anyio("asyncio")
    async def test_get_llm_service_singleton(self):
        """Test that service is singleton"""
        service1 = await get_llm_service()
        service2 = await get_llm_service()
        
        # Should be the same instance due to lru_cache
        assert service1 is service2


class TestSingletonLLMService:
    """Tests for _singleton_llm_service function"""
    
    def test_singleton_llm_service(self):
        """Test singleton service creation"""
        service = _singleton_llm_service()
        
        assert isinstance(service, LLMService)
    
    def test_singleton_cached(self):
        """Test that singleton is cached"""
        service1 = _singleton_llm_service()
        service2 = _singleton_llm_service()
        
        # Should be the same instance due to lru_cache
        assert service1 is service2



