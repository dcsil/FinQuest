"""
Tests for LLM factory
"""
import pytest
from pydantic import SecretStr
from finquest_api.services.llm.factory import build_llm_client
from finquest_api.services.llm.models import LLMError
from finquest_api.config import LLMSettings


class TestBuildLLMClient:
    """Tests for build_llm_client function"""
    
    def test_build_gemini_client(self):
        """Test building Gemini client"""
        settings = LLMSettings(
            provider="gemini",
            model="gemini-2.0-flash",
            api_key=SecretStr("test-key")
        )
        
        client = build_llm_client(settings)
        
        assert client is not None
        from finquest_api.services.llm.providers.gemini import GeminiChatClient
        assert isinstance(client, GeminiChatClient)
    
    def test_build_openai_client(self):
        """Test building OpenAI client"""
        settings = LLMSettings(
            provider="openai",
            model="gpt-4",
            api_key=SecretStr("test-key")
        )
        
        client = build_llm_client(settings)
        
        assert client is not None
        from finquest_api.services.llm.providers.openai import OpenAIChatClient
        assert isinstance(client, OpenAIChatClient)
    
    def test_build_unsupported_provider(self):
        """Test building with unsupported provider"""
        settings = LLMSettings(
            provider="unsupported",
            model="test-model"
        )
        
        with pytest.raises(LLMError) as exc_info:
            build_llm_client(settings)
        
        assert "Unsupported LLM provider" in str(exc_info.value)
    
    def test_build_case_insensitive_provider(self):
        """Test provider matching is case insensitive"""
        settings = LLMSettings(
            provider="GEMINI",
            model="gemini-2.0-flash",
            api_key=SecretStr("test-key")
        )
        
        client = build_llm_client(settings)
        
        assert client is not None
        from finquest_api.services.llm.providers.gemini import GeminiChatClient
        assert isinstance(client, GeminiChatClient)



