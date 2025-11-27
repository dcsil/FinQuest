"""
Tests for configuration settings
"""
import pytest
from pydantic import SecretStr
from finquest_api.config import Settings, LLMSettings


class TestLLMSettings:
    """Tests for LLMSettings model"""
    
    def test_llm_settings_defaults(self):
        """Test LLMSettings with default values"""
        settings = LLMSettings()
        
        assert settings.provider == "gemini"
        assert settings.model == "gemini-2.0-flash"
        assert settings.api_key is None
        assert settings.default_timeout_seconds == 30.0
        assert settings.max_retries == 2
    
    def test_llm_settings_custom(self):
        """Test LLMSettings with custom values"""
        settings = LLMSettings(
            provider="openai",
            model="gpt-4",
            api_key=SecretStr("test-key"),
            base_url="https://api.openai.com",
            default_timeout_seconds=60.0,
            max_retries=3
        )
        
        assert settings.provider == "openai"
        assert settings.model == "gpt-4"
        assert settings.api_key.get_secret_value() == "test-key"
        assert settings.base_url == "https://api.openai.com"
        assert settings.default_timeout_seconds == 60.0
        assert settings.max_retries == 3


class TestSettings:
    """Tests for Settings model"""
    
    def test_settings_defaults(self):
        """Test Settings with default values"""
        settings = Settings()
        
        assert settings.API_NAME == "FinQuest API"
        assert settings.API_VERSION == "0.1.0"
        assert settings.DEBUG is True
        assert settings.HOST == "0.0.0.0"
        assert settings.PORT == 8000
    
    def test_allowed_origins_list(self):
        """Test allowed_origins_list property"""
        settings = Settings(ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001")
        
        origins = settings.allowed_origins_list
        assert len(origins) == 2
        assert "http://localhost:3000" in origins
        assert "http://localhost:3001" in origins
    
    def test_allowed_origins_list_empty(self):
        """Test allowed_origins_list with empty string"""
        settings = Settings(ALLOWED_ORIGINS="")
        
        origins = settings.allowed_origins_list
        assert origins == []
    
    def test_allowed_origins_list_with_spaces(self):
        """Test allowed_origins_list with spaces"""
        settings = Settings(ALLOWED_ORIGINS=" http://localhost:3000 , http://localhost:3001 ")
        
        origins = settings.allowed_origins_list
        assert len(origins) == 2
        assert "http://localhost:3000" in origins
        assert "http://localhost:3001" in origins
    
    def test_allowed_origins_list_removes_trailing_slash(self):
        """Test allowed_origins_list removes trailing slashes"""
        settings = Settings(ALLOWED_ORIGINS="http://localhost:3000/,https://example.com/")
        
        origins = settings.allowed_origins_list
        assert "http://localhost:3000" in origins
        assert "https://example.com" in origins
    
    def test_llm_property(self):
        """Test llm property returns LLMSettings"""
        settings = Settings(
            LLM_PROVIDER="openai",
            LLM_MODEL="gpt-4",
            LLM_API_KEY=SecretStr("test-key"),
            LLM_BASE_URL="https://api.openai.com",
            LLM_TIMEOUT_SECONDS=60.0,
            LLM_MAX_RETRIES=3
        )
        
        llm_settings = settings.llm
        assert isinstance(llm_settings, LLMSettings)
        assert llm_settings.provider == "openai"
        assert llm_settings.model == "gpt-4"
        assert llm_settings.api_key.get_secret_value() == "test-key"
        assert llm_settings.base_url == "https://api.openai.com"
        assert llm_settings.default_timeout_seconds == 60.0
        assert llm_settings.max_retries == 3

