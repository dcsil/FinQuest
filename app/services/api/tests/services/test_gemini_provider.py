"""
Tests for the Gemini provider adapter.
"""
import pytest
from pydantic import SecretStr

from finquest_api.config import LLMSettings
from finquest_api.services.llm.client_base import ProviderNotConfiguredError
from finquest_api.services.llm.models import (
    LLMCompletionRequest,
    LLMMessage,
    StructuredOutputConfig,
)
from finquest_api.services.llm.providers.gemini import GeminiChatClient


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
async def test_gemini_client_sends_expected_payload(monkeypatch):
    """Verify payload transformation and response parsing."""

    response_body = {
        "candidates": [
            {
                "content": {"role": "model", "parts": [{"text": "Generated reply"}]},
                "finishReason": "STOP",
            }
        ],
        "usageMetadata": {
            "promptTokenCount": 11,
            "candidatesTokenCount": 7,
            "totalTokenCount": 18,
        },
        "responseId": "resp-123",
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
        base_url="https://example.com",
    )
    client = GeminiChatClient(settings)
    request = LLMCompletionRequest(
        messages=[
            LLMMessage(role="system", content="You are concise."),
            LLMMessage(role="user", content="Hi"),
            LLMMessage(role="assistant", content="Hello"),
        ],
        temperature=0.4,
        max_output_tokens=128,
    )

    result = await client.acomplete(request)

    sent = DummyAsyncClient.last_request
    assert sent["url"] == "/models/gemini-2.0-flash:generateContent"
    assert sent["params"]["key"] == "test-key"
    assert sent["json"]["system_instruction"]["parts"][0]["text"] == "You are concise."
    assert sent["json"]["contents"][0]["role"] == "user"
    assert sent["json"]["contents"][1]["role"] == "model"
    assert sent["json"]["generationConfig"]["temperature"] == 0.4
    assert sent["json"]["generationConfig"]["maxOutputTokens"] == 128

    assert result.message.role == "assistant"
    assert result.message.content == "Generated reply"
    assert result.usage.prompt_tokens == 11
    assert result.usage.completion_tokens == 7
    assert result.provider_response_id == "resp-123"


@pytest.mark.anyio("asyncio")
async def test_gemini_client_requires_api_key():
    """Ensure missing API keys raise a helpful error before HTTP calls."""

    settings = LLMSettings(provider="gemini", model="gemini-2.0-flash")
    client = GeminiChatClient(settings)
    request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])

    with pytest.raises(ProviderNotConfiguredError):
        await client.acomplete(request)


@pytest.mark.anyio("asyncio")
async def test_gemini_client_handles_structured_output(monkeypatch):
    """Ensure structured response configuration flows through and response is parsed."""

    response_body = {
        "candidates": [
            {
                "content": {
                    "role": "model",
                    "parts": [{"text": '{"answer": "Yes"}'}],
                },
                "finishReason": "STOP",
            }
        ],
        "usageMetadata": {
            "promptTokenCount": 1,
            "candidatesTokenCount": 1,
            "totalTokenCount": 2,
        },
        "responseId": "resp-structured",
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
        messages=[LLMMessage(role="user", content="Answer with yes/no")],
        structured_output=structured,
    )

    result = await client.acomplete(request)

    sent = DummyAsyncClient.last_request
    assert sent["json"]["generationConfig"]["responseMimeType"] == "application/json"
    assert sent["json"]["generationConfig"]["responseSchema"] == structured.json_schema
    assert result.structured_output == {"answer": "Yes"}
