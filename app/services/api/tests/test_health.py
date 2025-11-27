"""
Tests for health check endpoints
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.exc import SQLAlchemyError

from finquest_api.routers.health import health_check, readiness_check


class TestHealthCheck:
    """Tests for /health endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_health_check_success(self):
        """Test successful health check"""
        result = await health_check()
        
        assert result["status"] == "healthy"
        assert result["service"] == "finquest-api"
        assert "timestamp" in result


class TestReadinessCheck:
    """Tests for /ready endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_readiness_check_success(self):
        """Test successful readiness check"""
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_connection.execute.return_value = None
        mock_context = MagicMock()
        mock_context.__enter__.return_value = mock_connection
        mock_context.__exit__.return_value = None
        mock_engine.connect.return_value = mock_context
        
        with patch('finquest_api.routers.health.get_engine', return_value=mock_engine):
            result = await readiness_check()
            
            assert result["status"] == "ready"
            assert result["checks"]["database"] == "ok"
            assert "timestamp" in result
    
    @pytest.mark.anyio("asyncio")
    async def test_readiness_check_runtime_error(self):
        """Test readiness check with RuntimeError"""
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_connection.execute.side_effect = RuntimeError("Configuration error")
        mock_context = MagicMock()
        mock_context.__enter__.return_value = mock_connection
        mock_context.__exit__.return_value = None
        mock_engine.connect.return_value = mock_context
        
        with patch('finquest_api.routers.health.get_engine', return_value=mock_engine):
            with pytest.raises(Exception) as exc_info:
                await readiness_check()
            
            # Should raise HTTPException with 503 status
            assert exc_info.value.status_code == 503
            assert "configuration-error" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_readiness_check_sqlalchemy_error(self):
        """Test readiness check with SQLAlchemyError"""
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_connection.execute.side_effect = SQLAlchemyError("Connection error")
        mock_context = MagicMock()
        mock_context.__enter__.return_value = mock_connection
        mock_context.__exit__.return_value = None
        mock_engine.connect.return_value = mock_context
        
        with patch('finquest_api.routers.health.get_engine', return_value=mock_engine):
            with pytest.raises(Exception) as exc_info:
                await readiness_check()
            
            # Should raise HTTPException with 503 status
            assert exc_info.value.status_code == 503
            assert "connection-error" in str(exc_info.value.detail)

