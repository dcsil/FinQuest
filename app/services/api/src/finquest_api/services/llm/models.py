"""
Pydantic schemas shared by the LLM client abstractions.
"""
from __future__ import annotations

from typing import Any, Literal, Optional, Sequence

from pydantic import BaseModel, Field


RoleLiteral = Literal["system", "user", "assistant"]


class LLMMessage(BaseModel):
    """A single chat-completion style message."""

    role: RoleLiteral
    content: str = Field(..., description="Rendered prompt content in markdown/plain text.")


class LLMUsage(BaseModel):
    """Token/cost usage metadata normalized across providers."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    unit_cost_usd: Optional[float] = Field(
        default=None,
        description="Optional resolved USD cost for accounting, when available.",
    )


class LLMCompletionRequest(BaseModel):
    """Normalized request payload for the LLM service."""

    messages: Sequence[LLMMessage]
    model: Optional[str] = None
    temperature: float = 0.2
    max_output_tokens: Optional[int] = Field(default=None, ge=16, description="Upper bound for completion tokens.")
    user_identifier: Optional[str] = Field(
        default=None,
        description="Optional user identifier to thread provider level metadata and rate-limits.",
    )


class LLMCompletion(BaseModel):
    """Standardized completion response returned by the LLM service."""

    message: LLMMessage
    usage: LLMUsage = Field(default_factory=LLMUsage)
    finish_reason: Optional[str] = None
    provider_response_id: Optional[str] = None
    raw_response: Optional[Any] = Field(
        default=None,
        description="Provider-specific response body for observability/debugging.",
    )


class LLMError(Exception):
    """Base exception for LLM service failures."""

    def __init__(self, message: str, *, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code
