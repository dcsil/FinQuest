"""
Extended tests for OpenAI provider to cover missing lines
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from pydantic import SecretStr
import json

from finquest_api.services.llm.providers.openai import OpenAIChatClient
from finquest_api.services.llm.models import LLMCompletionRequest, LLMMessage, StructuredOutputConfig
from finquest_api.config import LLMSettings


class DummyResponse:
    """Lightweight httpx.Response stand-in for OpenAI"""
    
    def __init__(self, status_code=200, json_data=None, text=""):
        self.status_code = status_code
        self._json = json_data or {}
        self.text = text
    
    def json(self):
        return self._json


class DummyAsyncClient:
    """Captures outgoing HTTP requests made by OpenAI provider"""
    
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
    
    async def post(self, url, json=None, headers=None):
        DummyAsyncClient.last_request = {
            "url": url,
            "json": json,
            "headers": headers,
        }
        return DummyAsyncClient.response


@pytest.mark.anyio("asyncio")
async def test_openai_build_payload_with_user_identifier(monkeypatch):
    """Test building payload with user_identifier (line 69)"""
    response_body = {
        "id": "chatcmpl-123",
        "choices": [{"message": {"role": "assistant", "content": "OK"}}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.openai.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="openai",
        model="gpt-4",
        api_key=SecretStr("test-key"),
    )
    client = OpenAIChatClient(settings)
    request = LLMCompletionRequest(
        messages=[LLMMessage(role="user", content="Hi")],
        user_identifier="user-123",
    )
    
    await client.acomplete(request)
    
    sent = DummyAsyncClient.last_request
    assert sent["json"]["user"] == "user-123"


@pytest.mark.anyio("asyncio")
async def test_openai_build_payload_with_structured_output(monkeypatch):
    """Test building payload with structured output (line 71)"""
    response_body = {
        "id": "chatcmpl-123",
        "choices": [{"message": {"role": "assistant", "content": '{"answer": "Yes"}'}}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.openai.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="openai",
        model="gpt-4",
        api_key=SecretStr("test-key"),
    )
    client = OpenAIChatClient(settings)
    structured = StructuredOutputConfig(
        type="json_schema",
        json_schema={"type": "object", "properties": {"answer": {"type": "string"}}},
    )
    request = LLMCompletionRequest(
        messages=[LLMMessage(role="user", content="Answer yes/no")],
        structured_output=structured,
    )
    
    await client.acomplete(request)
    
    sent = DummyAsyncClient.last_request
    assert "response_format" in sent["json"]
    assert sent["json"]["response_format"]["type"] == "json_schema"


@pytest.mark.anyio("asyncio")
async def test_openai_parse_completion_no_choices(monkeypatch):
    """Test parsing completion when no choices returned (line 87)"""
    response_body = {
        "id": "chatcmpl-123",
        "choices": [],
        "usage": {"prompt_tokens": 1, "completion_tokens": 0, "total_tokens": 1},
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.openai.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="openai",
        model="gpt-4",
        api_key=SecretStr("test-key"),
    )
    client = OpenAIChatClient(settings)
    request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])
    
    from finquest_api.services.llm.client_base import ProviderRequestError
    
    with pytest.raises(ProviderRequestError) as exc_info:
        await client.acomplete(request)
    
    assert "no completion choices" in str(exc_info.value).lower()


@pytest.mark.anyio("asyncio")
async def test_openai_parse_structured_output_success(monkeypatch):
    """Test parsing structured output successfully (lines 105-108)"""
    response_body = {
        "id": "chatcmpl-123",
        "choices": [{"message": {"role": "assistant", "content": '{"answer": "Yes"}'}}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.openai.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="openai",
        model="gpt-4",
        api_key=SecretStr("test-key"),
    )
    client = OpenAIChatClient(settings)
    structured = StructuredOutputConfig(
        type="json_schema",
        json_schema={"type": "object", "properties": {"answer": {"type": "string"}}},
    )
    request = LLMCompletionRequest(
        messages=[LLMMessage(role="user", content="Answer yes/no")],
        structured_output=structured,
    )
    
    result = await client.acomplete(request)
    
    assert result.structured_output == {"answer": "Yes"}


@pytest.mark.anyio("asyncio")
async def test_openai_parse_structured_output_invalid_json(monkeypatch):
    """Test parsing structured output with invalid JSON"""
    response_body = {
        "id": "chatcmpl-123",
        "choices": [{"message": {"role": "assistant", "content": "Not valid JSON"}}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    }
    DummyAsyncClient.response = DummyResponse(json_data=response_body)
    monkeypatch.setattr(
        "finquest_api.services.llm.providers.openai.httpx.AsyncClient",
        DummyAsyncClient,
    )
    
    settings = LLMSettings(
        provider="openai",
        model="gpt-4",
        api_key=SecretStr("test-key"),
    )
    client = OpenAIChatClient(settings)
    structured = StructuredOutputConfig(
        type="json_schema",
        json_schema={"type": "object"},
    )
    request = LLMCompletionRequest(
        messages=[LLMMessage(role="user", content="Answer")],
        structured_output=structured,
    )
    
    result = await client.acomplete(request)
    
    # Should handle JSON decode error gracefully
    assert result.structured_output is None


