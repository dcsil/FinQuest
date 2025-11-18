"""
FastAPI dependency wiring helpers for the LLM service.
"""
from functools import lru_cache

from finquest_api.config import settings
from .service import LLMService


@lru_cache
def _singleton_llm_service() -> LLMService:
    """Ensure the app reuses a single LLMService instance for connection pooling."""
    return LLMService(settings.llm)


async def get_llm_service() -> LLMService:
    """Async dependency callable to inject the shared LLMService."""
    return _singleton_llm_service()
