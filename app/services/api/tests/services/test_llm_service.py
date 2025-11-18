"""
Tests for the LLMService façade.
"""
import pytest
from pydantic import SecretStr

from finquest_api.config import LLMSettings
from finquest_api.services.llm import service as service_module
from finquest_api.services.llm.client_base import LLMClient
from finquest_api.services.llm.models import (
    LLMCompletion,
    LLMMessage,
    LLMUsage,
    StructuredOutputConfig,
)


class FakeLLMClient(LLMClient):
    """Simple fake client that records incoming requests."""

    def __init__(self, settings: LLMSettings):
        super().__init__(settings)
        self.requests = []

    async def acomplete(self, request):
        self.requests.append(request)
        return LLMCompletion(
            message=LLMMessage(role="assistant", content="ok"),
            usage=LLMUsage(prompt_tokens=1, completion_tokens=1, total_tokens=2),
        )


@pytest.mark.anyio("asyncio")
async def test_llm_service_forwards_parameters(monkeypatch):
    """Ensure the service constructs completion requests using provided kwargs."""

    fake_container = {}

    def fake_build_llm_client(settings: LLMSettings) -> FakeLLMClient:
        client = FakeLLMClient(settings)
        fake_container["client"] = client
        return client

    monkeypatch.setattr(service_module, "build_llm_client", fake_build_llm_client)

    settings = LLMSettings(
        provider="gemini",
        model="gemini-2.0-flash",
        api_key=SecretStr("test"),
    )
    service = service_module.LLMService(settings)

    messages = [LLMMessage(role="user", content="Hello")]
    structured = StructuredOutputConfig(
        type="json_schema",
        json_schema={"type": "object", "properties": {"answer": {"type": "string"}}},
    )

    result = await service.acomplete(
        messages,
        temperature=0.5,
        max_output_tokens=256,
        user_identifier="user-123",
        structured_output=structured,
    )

    assert result.message.content == "ok"
    sent_request = fake_container["client"].requests[0]
    assert sent_request.temperature == 0.5
    assert sent_request.max_output_tokens == 256
    assert sent_request.user_identifier == "user-123"
    assert sent_request.model == "gemini-2.0-flash"
    assert sent_request.structured_output == structured
