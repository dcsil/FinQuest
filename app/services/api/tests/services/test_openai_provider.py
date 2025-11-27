"""
Tests for OpenAI provider
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from pydantic import SecretStr

from finquest_api.services.llm.providers.openai import OpenAIChatClient
from finquest_api.services.llm.client_base import ProviderNotConfiguredError, ProviderRequestError
from finquest_api.services.llm.models import LLMCompletionRequest, LLMMessage
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
async def test_openai_client_requires_api_key():
    """Ensure missing API keys raise a helpful error"""
    settings = LLMSettings(provider="openai", model="gpt-4")
    client = OpenAIChatClient(settings)
    request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])
    
    with pytest.raises(ProviderNotConfiguredError):
        await client.acomplete(request)


@pytest.mark.anyio("asyncio")
async def test_openai_client_sends_expected_payload(monkeypatch):
    """Verify payload transformation and response parsing"""
    response_body = {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677652288,
        "model": "gpt-4",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Hello! How can I help you?"
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 7,
            "total_tokens": 17
        }
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
        base_url="https://api.openai.com/v1",
    )
    client = OpenAIChatClient(settings)
    request = LLMCompletionRequest(
        messages=[
            LLMMessage(role="system", content="You are helpful."),
            LLMMessage(role="user", content="Hi"),
        ],
        temperature=0.7,
        max_output_tokens=100,
    )
    
    result = await client.acomplete(request)
    
    sent = DummyAsyncClient.last_request
    assert sent["url"] == "/chat/completions"
    assert sent["headers"]["Authorization"] == "Bearer test-key"
    assert sent["json"]["model"] == "gpt-4"
    assert sent["json"]["messages"][0]["role"] == "system"
    assert sent["json"]["messages"][1]["role"] == "user"
    assert sent["json"]["temperature"] == 0.7
    assert sent["json"]["max_tokens"] == 100
    
    assert result.message.role == "assistant"
    assert result.message.content == "Hello! How can I help you?"
    assert result.usage.prompt_tokens == 10
    assert result.usage.completion_tokens == 7


@pytest.mark.anyio("asyncio")
async def test_openai_client_handles_error_response(monkeypatch):
    """Test error handling from OpenAI API"""
    DummyAsyncClient.response = DummyResponse(
        status_code=400,
        text="Invalid request",
    )
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
    
    with pytest.raises(ProviderRequestError) as exc_info:
        await client.acomplete(request)
    
    assert exc_info.value.status_code == 400
    assert "OpenAI API error" in str(exc_info.value)


@pytest.mark.anyio("asyncio")
async def test_openai_client_with_organization(monkeypatch):
    """Test OpenAI client with organization header"""
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
        organization="org-123",
    )
    client = OpenAIChatClient(settings)
    request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])
    
    await client.acomplete(request)
    
    sent = DummyAsyncClient.last_request
    assert sent["headers"]["OpenAI-Organization"] == "org-123"


