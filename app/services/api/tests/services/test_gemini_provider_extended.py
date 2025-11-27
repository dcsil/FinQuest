"""
Extended tests for Gemini provider to cover missing lines
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from pydantic import SecretStr
import json

from finquest_api.services.llm.providers.gemini import GeminiChatClient
from finquest_api.services.llm.client_base import ProviderRequestError
from finquest_api.services.llm.models import LLMCompletionRequest, LLMMessage, StructuredOutputConfig
from finquest_api.config import LLMSettings


class DummyResponse:
    """Lightweight httpx.Response stand-in."""
    
    def __init__(self, status_code=200, json_data=None, text=""):
        self.status_code = status_code
        self._json = json_data or {}
        self.text = text
    
    def json(self):
        return self._json


class DummyAsyncClient:
    """Captures outgoing HTTP requests made by the provider."""
    
    response: DummyResponse = DummyResponse()
    last_request = None
    
    def __init__(self, *args, **kwargs):
        self._entered = False
    
    async def __aenter__(self):
        self._entered = True
        return self
    
    async def __aexit__(self, exc_type, exc, tb):
        self._entered = False
        return False
    
    async def post(self, url, params=None, json=None, headers=None):
        DummyAsyncClient.last_request = {
            "url": url,
            "params": params,
            "json": json,
            "headers": headers,
        }
        return DummyAsyncClient.response


@pytest.mark.anyio("asyncio")
async def test_gemini_client_no_candidates(monkeypatch):
    """Test Gemini client when no candidates returned (line 106)"""
    response_body = {
        "candidates": [],
        "usageMetadata": {
            "promptTokenCount": 1,
            "candidatesTokenCount": 0,
            "totalTokenCount": 1,
        },
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.gemini.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="gemini",
        model="gemini-2.0-flash",
        api_key=SecretStr("test-key"),
    )
    client = GeminiChatClient(settings)
    request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])
    
    with pytest.raises(ProviderRequestError) as exc_info:
        await client.acomplete(request)
    
    assert "no completion candidates" in str(exc_info.value).lower()


@pytest.mark.anyio("asyncio")
async def test_gemini_client_invalid_json_structured(monkeypatch):
    """Test Gemini client with invalid JSON in structured output (lines 122-123)"""
    response_body = {
        "candidates": [
            {
                "content": {
                    "role": "model",
                    "parts": [{"text": "Not valid JSON"}],
                },
                "finishReason": "STOP",
            }
        ],
        "usageMetadata": {
            "promptTokenCount": 1,
            "candidatesTokenCount": 1,
            "totalTokenCount": 2,
        },
        "responseId": "resp-invalid",
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.gemini.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="gemini",
        model="gemini-2.0-flash",
        api_key=SecretStr("test-key"),
    )
    client = GeminiChatClient(settings)
    structured = StructuredOutputConfig(
        type="json_schema",
        json_schema={"type": "object", "properties": {"answer": {"type": "string"}}},
    )
    request = LLMCompletionRequest(
        messages=[LLMMessage(role="user", content="Answer")],
        structured_output=structured,
    )
    
    result = await client.acomplete(request)
    
    # Should handle JSON decode error gracefully
    assert result.structured_output is None


@pytest.mark.anyio("asyncio")
async def test_gemini_client_empty_content(monkeypatch):
    """Test Gemini client with empty content (line 45)"""
    response_body = {
        "candidates": [
            {
                "content": {
                    "role": "model",
                    "parts": [],
                },
                "finishReason": "STOP",
            }
        ],
        "usageMetadata": {
            "promptTokenCount": 1,
            "candidatesTokenCount": 0,
            "totalTokenCount": 1,
        },
        "responseId": "resp-empty",
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.gemini.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="gemini",
        model="gemini-2.0-flash",
        api_key=SecretStr("test-key"),
    )
    client = GeminiChatClient(settings)
    request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])
    
    result = await client.acomplete(request)
    
    assert result.message.content == ""

