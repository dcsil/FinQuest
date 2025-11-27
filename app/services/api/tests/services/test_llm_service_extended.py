"""
Extended tests for LLM service to cover missing line
"""
import pytest
from unittest.mock import Mock, AsyncMock
from pydantic import SecretStr

from finquest_api.services.llm.service import LLMService
from finquest_api.services.llm.models import LLMCompletionRequest, LLMMessage
from finquest_api.config import LLMSettings


class TestLLMServiceExtended:
    """Extended tests for LLMService"""
    
    @pytest.mark.anyio("asyncio")
    async def test_acomplete_request(self):
        """Test acomplete_request method (line 53)"""
        settings = LLMSettings(
            provider="gemini",
            model="gemini-2.0-flash",
            api_key=SecretStr("test-key"),
        )
        
        mock_client = AsyncMock()
        mock_completion = Mock()
        mock_client.acomplete.return_value = mock_completion
        
        service = LLMService(settings)
        service._client = mock_client
        
        request = LLMCompletionRequest(messages=[LLMMessage(role="user", content="Hi")])
        result = await service.acomplete_request(request)
        
        assert result == mock_completion
        mock_client.acomplete.assert_called_once_with(request)

