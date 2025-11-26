"""
Configuration settings for FinQuest API
"""
from typing import List, Optional

from pydantic import BaseModel, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LLMSettings(BaseModel):
    """Configuration required to communicate with a Large Language Model provider."""

    provider: str = "gemini"
    base_url: Optional[str] = None
    model: str = "gemini-2.0-flash"
    api_key: Optional[SecretStr] = None
    organization: Optional[str] = None
    default_timeout_seconds: float = 30.0
    max_retries: int = 2

class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

    # API Configuration
    API_NAME: str = "FinQuest API"
    API_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://tryfinquest.vercel.app",
    ]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse comma-separated string to list if needed"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Supabase Postgres / SQLAlchemy
    SUPABASE_DB_URL: Optional[str] = None
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_POOL_SIZE: int = 5
    SQLALCHEMY_MAX_OVERFLOW: int = 10
    SQLALCHEMY_POOL_TIMEOUT: int = 30

    # LLM Provider Configuration
    LLM_PROVIDER: str = "gemini"
    LLM_BASE_URL: Optional[str] = "https://generativelanguage.googleapis.com/v1beta"
    LLM_MODEL: str = "gemini-2.0-flash"
    LLM_API_KEY: Optional[SecretStr] = None
    LLM_ORG_ID: Optional[str] = None
    LLM_TIMEOUT_SECONDS: float = 30.0
    LLM_MAX_RETRIES: int = 2

    @property
    def llm(self) -> LLMSettings:
        """Expose consolidated LLM configuration as a strongly typed object."""
        return LLMSettings(
            provider=self.LLM_PROVIDER,
            base_url=self.LLM_BASE_URL,
            model=self.LLM_MODEL,
            api_key=self.LLM_API_KEY,
            organization=self.LLM_ORG_ID,
            default_timeout_seconds=self.LLM_TIMEOUT_SECONDS,
            max_retries=self.LLM_MAX_RETRIES,
        )


settings = Settings()
