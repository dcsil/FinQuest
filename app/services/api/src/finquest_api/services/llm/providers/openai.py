"""
OpenAI chat completion provider implementation.
"""
from __future__ import annotations

from typing import Any, Dict, List

import json

import httpx

from ..client_base import LLMClient, ProviderNotConfiguredError, ProviderRequestError
from ..models import LLMCompletion, LLMCompletionRequest, LLMMessage, LLMUsage


class OpenAIChatClient(LLMClient):
    """Thin wrapper over OpenAI's Chat Completions REST API."""

    _DEFAULT_BASE_URL = "https://api.openai.com/v1"

    def __init__(self, settings):
        super().__init__(settings)
        self._base_url = settings.base_url or self._DEFAULT_BASE_URL
        self._default_model = settings.model

    async def acomplete(self, request: LLMCompletionRequest) -> LLMCompletion:
        """Execute a chat completion request against OpenAI."""
        if not self._settings.api_key:
            raise ProviderNotConfiguredError(
                "Missing OpenAI API key. Set LLM_API_KEY in the API service environment."
            )

        payload = self._build_payload(request)
        headers = self._build_headers()

        timeout = self._settings.default_timeout_seconds or 30.0
        async with httpx.AsyncClient(base_url=self._base_url, timeout=timeout) as client:
            response = await client.post("/chat/completions", json=payload, headers=headers)

        if response.status_code >= 400:
            raise ProviderRequestError(
                f"OpenAI API error ({response.status_code}): {response.text}",
                status_code=response.status_code,
            )

        data = response.json()
        return self._parse_completion(data, request)

    def _build_headers(self) -> Dict[str, str]:
        """Prepare headers expected by OpenAI."""
        headers = {
            "Authorization": f"Bearer {self._settings.api_key.get_secret_value()}",
            "Content-Type": "application/json",
        }
        if self._settings.organization:
            headers["OpenAI-Organization"] = self._settings.organization
        return headers

    def _build_payload(self, request: LLMCompletionRequest) -> Dict[str, Any]:
        """Map the normalized request into OpenAI's payload format."""
        payload: Dict[str, Any] = {
            "model": request.model or self._default_model,
            "messages": [msg.model_dump() for msg in request.messages],
            "temperature": request.temperature,
        }
        if request.max_output_tokens:
            payload["max_tokens"] = request.max_output_tokens
        if request.user_identifier:
            payload["user"] = request.user_identifier
        if request.structured_output:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "schema": request.structured_output.json_schema,
                },
            }
        return payload

    def _parse_completion(
        self,
        response: Dict[str, Any],
        request: LLMCompletionRequest,
    ) -> LLMCompletion:
        """Create a normalized LLMCompletion object from OpenAI's response."""
        choices: List[Dict[str, Any]] = response.get("choices") or []
        if not choices:
            raise ProviderRequestError("OpenAI returned no completion choices.")

        first_choice = choices[0]
        message_payload = first_choice.get("message") or {}
        message = LLMMessage(
            role=message_payload.get("role", "assistant"),
            content=message_payload.get("content", ""),
        )

        usage_payload = response.get("usage") or {}
        usage = LLMUsage(
            prompt_tokens=usage_payload.get("prompt_tokens", 0),
            completion_tokens=usage_payload.get("completion_tokens", 0),
            total_tokens=usage_payload.get("total_tokens", 0),
        )

        structured_data = None
        if message_payload.get("content") and request.structured_output:
            try:
                structured_data = json.loads(message_payload["content"])
            except (json.JSONDecodeError, TypeError):
                structured_data = None

        return LLMCompletion(
            message=message,
            usage=usage,
            finish_reason=first_choice.get("finish_reason"),
            provider_response_id=response.get("id"),
            raw_response=response,
            structured_output=structured_data,
        )
