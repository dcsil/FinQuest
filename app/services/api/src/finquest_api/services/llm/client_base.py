"""
Abstract client interfaces used to normalize provider-specific integrations.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from finquest_api.config import LLMSettings
from .models import LLMCompletion, LLMCompletionRequest, LLMError


class LLMClient(ABC):
    """Abstract base class for provider-specific chat completion clients."""

    def __init__(self, settings: LLMSettings):
        self._settings = settings

    @abstractmethod
    async def acomplete(self, request: LLMCompletionRequest) -> LLMCompletion:
        """Execute a chat completion request."""


class ProviderNotConfiguredError(LLMError):
    """Raised when mandatory provider configuration is missing."""


class ProviderRequestError(LLMError):
    """Raised if the provider returned an error response."""
