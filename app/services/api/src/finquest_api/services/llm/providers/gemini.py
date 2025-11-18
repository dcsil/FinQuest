"""
Google Gemini chat completion provider implementation.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Sequence

import httpx

from finquest_api.config import LLMSettings

from ..client_base import LLMClient, ProviderNotConfiguredError, ProviderRequestError
from ..models import LLMCompletion, LLMCompletionRequest, LLMMessage, LLMUsage


class GeminiChatClient(LLMClient):
    """Adapter for the Google Generative Language (Gemini) REST API."""

    _DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, settings: LLMSettings):
        super().__init__(settings)
        self._base_url = settings.base_url or self._DEFAULT_BASE_URL
        self._default_model = settings.model

    async def acomplete(self, request: LLMCompletionRequest) -> LLMCompletion:
        """Execute a content generation call against Gemini."""
        if not self._settings.api_key:
            raise ProviderNotConfiguredError(
                "Missing Gemini API key. Set LLM_API_KEY in the API service environment."
            )

        model = request.model or self._default_model
        payload = self._build_payload(request.messages, request)
        timeout = self._settings.default_timeout_seconds or 30.0

        api_key = self._settings.api_key.get_secret_value()
        endpoint = f"/models/{model}:generateContent"

        async with httpx.AsyncClient(base_url=self._base_url, timeout=timeout) as client:
            response = await client.post(endpoint, params={"key": api_key}, json=payload)

        if response.status_code >= 400:
            raise ProviderRequestError(
                f"Gemini API error ({response.status_code}): {response.text}",
                status_code=response.status_code,
            )

        data = response.json()
        return self._parse_completion(data, request)

    def _build_payload(
        self,
        messages: Sequence[LLMMessage],
        request: LLMCompletionRequest,
    ) -> Dict[str, Any]:
        """Translate normalized messages into Gemini's generateContent payload."""
        system_instruction_parts: List[str] = []
        contents: List[Dict[str, Any]] = []

        for message in messages:
            if message.role == "system":
                system_instruction_parts.append(message.content.strip())
                continue

            role = "user" if message.role == "user" else "model"
            contents.append(
                {
                    "role": role,
                    "parts": [{"text": message.content}],
                }
            )

        payload: Dict[str, Any] = {"contents": contents}

        if system_instruction_parts:
            payload["system_instruction"] = {
                "parts": [{"text": "\n".join(system_instruction_parts)}]
            }

        generation_config: Dict[str, Any] = {
            "temperature": request.temperature,
            **(
                {"maxOutputTokens": request.max_output_tokens}
                if request.max_output_tokens
                else {}
            ),
        }
        if request.structured_output:
            generation_config["responseMimeType"] = "application/json"
            generation_config["responseSchema"] = request.structured_output.json_schema

        payload["generationConfig"] = generation_config

        return payload

    def _parse_completion(
        self,
        response: Dict[str, Any],
        request: LLMCompletionRequest,
    ) -> LLMCompletion:
        """Normalize Gemini responses to the shared schema."""
        candidates: List[Dict[str, Any]] = response.get("candidates") or []
        if not candidates:
            raise ProviderRequestError("Gemini returned no completion candidates.")

        first_candidate = candidates[0]
        content_payload = first_candidate.get("content") or {}
        parts = content_payload.get("parts") or []
        text = "".join(part.get("text", "") for part in parts)

        # Gemini returns "model" for assistant completions, so map accordingly.
        role = content_payload.get("role", "model")
        normalized_role = "assistant" if role == "model" else role

        message = LLMMessage(role=normalized_role, content=text)
        structured_data = None
        if request.structured_output and text:
            try:
                structured_data = json.loads(text)
            except json.JSONDecodeError:
                structured_data = None

        usage_payload = response.get("usageMetadata") or {}
        usage = LLMUsage(
            prompt_tokens=usage_payload.get("promptTokenCount", 0),
            completion_tokens=usage_payload.get("candidatesTokenCount", 0),
            total_tokens=usage_payload.get("totalTokenCount", 0),
        )

        return LLMCompletion(
            message=message,
            usage=usage,
            finish_reason=first_candidate.get("finishReason"),
            provider_response_id=response.get("responseId"),
            raw_response=response,
            structured_output=structured_data,
        )
