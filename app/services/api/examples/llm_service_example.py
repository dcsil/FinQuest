"""
Simple usage example for the FinQuest LLMService.

Run with:
    uv run python examples/llm_service_example.py
"""
import asyncio

from finquest_api.config import settings
from finquest_api.services.llm import (
    LLMMessage,
    LLMService,
    StructuredOutputConfig,
)


async def main() -> None:
    """Demonstrate a single completion request."""
    service = LLMService(settings.llm)
    completion = await service.acomplete(
        [
            LLMMessage(role="system", content="You are a concise financial mentor."),
            LLMMessage(role="user", content="Explain compound interest in a sentence."),
        ],
        temperature=0.4,
        max_output_tokens=128,
        user_identifier="demo-user",
        structured_output=StructuredOutputConfig(
            type="json_schema",
            json_schema={
                "type": "object",
                "properties": {
                    "explanation": {"type": "string"},
                },
                "required": ["explanation"],
            },
        ),
    )

    print("Raw text response:\n", completion.message.content)
    print("Structured output:\n", completion.structured_output)
    print("Token usage:", completion.usage.model_dump())


if __name__ == "__main__":
    asyncio.run(main())
