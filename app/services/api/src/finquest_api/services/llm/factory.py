"""
Helpers to instantiate the correct provider client.
"""
from __future__ import annotations

from finquest_api.config import LLMSettings
from .client_base import LLMClient
from .models import LLMError
from .providers import GeminiChatClient, OpenAIChatClient


def build_llm_client(settings: LLMSettings) -> LLMClient:
    """Construct the appropriate LLM client based on configuration."""
    provider = (settings.provider or "").lower()

    if provider == "gemini":
        return GeminiChatClient(settings)

    if provider == "openai":
        return OpenAIChatClient(settings)

    raise LLMError(f"Unsupported LLM provider '{settings.provider}'.")
