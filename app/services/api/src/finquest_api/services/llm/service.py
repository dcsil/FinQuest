"""
Facade that exposes the provider-agnostic LLM interface to the rest of the app.
"""
from __future__ import annotations

from typing import Optional, Sequence

from finquest_api.config import LLMSettings
from .factory import build_llm_client
from .models import LLMCompletion, LLMCompletionRequest, LLMMessage


class LLMService:
    """High-level service orchestrating prompt submissions to the configured LLM provider."""

    def __init__(self, settings: LLMSettings):
        self._settings = settings
        self._client = build_llm_client(settings)

    async def acomplete(
        self,
        messages: Sequence[LLMMessage],
        *,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = None,
        model: Optional[str] = None,
        user_identifier: Optional[str] = None,
    ) -> LLMCompletion:
        """
        Convenience helper that builds and dispatches a request composed of chat messages.
        """
        request = LLMCompletionRequest(
            messages=list(messages),
            model=model or self._settings.model,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            user_identifier=user_identifier,
        )
        return await self._client.acomplete(request)

    async def acomplete_request(self, request: LLMCompletionRequest) -> LLMCompletion:
        """
        Execute a fully constructed LLMCompletionRequest.
        This allows advanced callers to control every option on the DTO.
        """
        return await self._client.acomplete(request)
