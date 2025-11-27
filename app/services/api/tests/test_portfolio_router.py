"""
Tests for portfolio router endpoints
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from datetime import date, datetime, timedelta, timezone

from finquest_api.routers.portfolio import (
    add_position,
    get_portfolio,
    get_snapshots,
    generate_snapshot,
)
from finquest_api.db.models import User, Portfolio, PortfolioValuationSnapshot
from finquest_api.schemas import PostPositionRequest


@pytest.fixture
def mock_user():
    """Create a mock user"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.base_currency = "USD"
    return user


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    db = MagicMock()
    return db


class TestAddPosition:
    """Tests for POST /portfolio/positions endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_success(self, mock_user, mock_db):
        """Test successful position addition"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=10,
            avgCost=150.0
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', return_value=[uuid4()]) as mock_create:
            with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.routers.portfolio.recalculate_snapshots_after_transaction'):
                    result = await add_position(request, mock_user, mock_db)
                    
                    assert result.status == "ok"
                    assert result.portfolioId == str(mock_portfolio.id)
                    assert len(result.transactionIds) == 1
                    mock_create.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_with_executed_at(self, mock_user, mock_db):
        """Test position addition with executed_at timestamp"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        executed_at = datetime.now(timezone.utc)
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=10,
            avgCost=150.0,
            executedAt=executed_at
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', return_value=[uuid4()]):
            with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.routers.portfolio.recalculate_snapshots_after_transaction') as mock_recalc:
                    result = await add_position(request, mock_user, mock_db)
                    
                    assert result.status == "ok"
                    mock_recalc.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_invalid_quantity(self, mock_user, mock_db):
        """Test position addition with invalid quantity - Pydantic validation"""
        # Pydantic validation catches negative values before reaching endpoint
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            PostPositionRequest(
                symbol="AAPL",
                quantity=-10,
                avgCost=150.0
            )
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_invalid_cost(self, mock_user, mock_db):
        """Test position addition with invalid average cost - Pydantic validation"""
        # Pydantic validation catches negative values before reaching endpoint
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            PostPositionRequest(
                symbol="AAPL",
                quantity=10,
                avgCost=-150.0
            )
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_endpoint_validation(self, mock_user, mock_db):
        """Test endpoint-level validation for edge cases"""
        # Test that endpoint validates quantity > 0 (even though Pydantic does too)
        # We'll test with a valid request to ensure endpoint logic works
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=0.0001,  # Very small but positive
            avgCost=150.0
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', return_value=[uuid4()]):
            with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.routers.portfolio.recalculate_snapshots_after_transaction'):
                    result = await add_position(request, mock_user, mock_db)
                    assert result.status == "ok"
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_value_error(self, mock_user, mock_db):
        """Test position addition with ValueError"""
        request = PostPositionRequest(
            symbol="INVALID",
            quantity=10,
            avgCost=150.0
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', side_effect=ValueError("Symbol not found")):
            with pytest.raises(Exception) as exc_info:
                await add_position(request, mock_user, mock_db)
            
            assert exc_info.value.status_code == 404
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_recalculation_failure(self, mock_user, mock_db):
        """Test position addition when recalculation fails"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=10,
            avgCost=150.0
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', return_value=[uuid4()]):
            with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.routers.portfolio.recalculate_snapshots_after_transaction', side_effect=Exception("Recalc error")):
                    # Should not fail even if recalculation fails
                    result = await add_position(request, mock_user, mock_db)
                    assert result.status == "ok"


class TestGetPortfolio:
    """Tests for GET /portfolio endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_portfolio_success(self, mock_user, mock_db):
        """Test successful portfolio retrieval"""
        mock_response = Mock()
        
        with patch('finquest_api.routers.portfolio.get_portfolio_view', return_value=mock_response):
            result = await get_portfolio(mock_user, mock_db)
            
            assert result == mock_response
    
    @pytest.mark.anyio("asyncio")
    async def test_get_portfolio_exception(self, mock_user, mock_db):
        """Test portfolio retrieval with exception"""
        with patch('finquest_api.routers.portfolio.get_portfolio_view', side_effect=Exception("Database error")):
            with pytest.raises(Exception) as exc_info:
                await get_portfolio(mock_user, mock_db)
            
            assert exc_info.value.status_code == 500
            assert "Failed to get portfolio" in str(exc_info.value.detail)


class TestGetSnapshots:
    """Tests for GET /portfolio/snapshots endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_default_range(self, mock_user, mock_db):
        """Test getting snapshots with default date range"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        mock_snapshot = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot.as_of = datetime.now(timezone.utc)
        mock_snapshot.total_value = 1000.0
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot]
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            result = await get_snapshots(None, None, None, mock_user, mock_db)
            
            assert result.baseCurrency == "USD"
            assert len(result.series) == 1
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_with_dates(self, mock_user, mock_db):
        """Test getting snapshots with specific date range"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        mock_snapshot = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot.as_of = datetime.now(timezone.utc)
        mock_snapshot.total_value = 1000.0
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot]
        mock_db.query.return_value = mock_query
        
        from_date = date.today() - timedelta(days=30)
        to_date = date.today()
        
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.routers.portfolio.ensure_snapshots_for_range'):
                result = await get_snapshots(from_date, to_date, None, mock_user, mock_db)
                
                assert result.baseCurrency == "USD"
                assert len(result.series) == 1
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_hourly_granularity(self, mock_user, mock_db):
        """Test getting snapshots with hourly granularity"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        now = datetime.now(timezone.utc)
        mock_snapshot1 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot1.as_of = now
        mock_snapshot1.total_value = 1000.0
        
        mock_snapshot2 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot2.as_of = now + timedelta(hours=2)
        mock_snapshot2.total_value = 1100.0
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot1, mock_snapshot2]
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.routers.portfolio.ensure_snapshots_for_range'):
                result = await get_snapshots(None, None, "hourly", mock_user, mock_db)
                
                assert len(result.series) >= 1
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_daily_granularity(self, mock_user, mock_db):
        """Test getting snapshots with daily granularity"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        today = datetime.now(timezone.utc)
        yesterday = today - timedelta(days=1)
        
        mock_snapshot1 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot1.as_of = yesterday
        mock_snapshot1.total_value = 1000.0
        
        mock_snapshot2 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot2.as_of = today
        mock_snapshot2.total_value = 1100.0
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot1, mock_snapshot2]
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.routers.portfolio.ensure_snapshots_for_range'):
                result = await get_snapshots(None, None, "daily", mock_user, mock_db)
                
                assert len(result.series) >= 1
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_exception(self, mock_user, mock_db):
        """Test snapshots retrieval with exception"""
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', side_effect=Exception("Database error")):
            with pytest.raises(Exception) as exc_info:
                await get_snapshots(None, None, None, mock_user, mock_db)
            
            assert exc_info.value.status_code == 500


class TestGenerateSnapshot:
    """Tests for POST /portfolio/snapshots/generate endpoint"""
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_single_snapshot(self, mock_user, mock_db):
        """Test generating a single snapshot"""
        with patch('finquest_api.routers.portfolio.snapshot_user_portfolio') as mock_snapshot:
            result = await generate_snapshot(None, None, mock_user, mock_db)
            
            assert result["status"] == "ok"
            assert result["count"] == 1
            mock_snapshot.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_snapshot_range(self, mock_user, mock_db):
        """Test generating snapshots for a date range"""
        from_date = date.today() - timedelta(days=7)
        to_date = date.today()
        
        with patch('finquest_api.routers.portfolio.snapshot_user_portfolio_range', return_value=8) as mock_snapshot_range:
            result = await generate_snapshot(from_date, to_date, mock_user, mock_db)
            
            assert result["status"] == "ok"
            assert result["count"] == 8
            mock_snapshot_range.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_snapshot_invalid_range(self, mock_user, mock_db):
        """Test generating snapshots with invalid date range"""
        from_date = date.today()
        to_date = date.today() - timedelta(days=1)
        
        with pytest.raises(Exception) as exc_info:
            await generate_snapshot(from_date, to_date, mock_user, mock_db)
        
        assert exc_info.value.status_code == 400
        assert "Start date must be before" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_snapshot_range_too_large(self, mock_user, mock_db):
        """Test generating snapshots with range exceeding 365 days"""
        from_date = date.today() - timedelta(days=400)
        to_date = date.today()
        
        with pytest.raises(Exception) as exc_info:
            await generate_snapshot(from_date, to_date, mock_user, mock_db)
        
        assert exc_info.value.status_code == 400
        assert "Date range cannot exceed 365 days" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_generate_snapshot_exception(self, mock_user, mock_db):
        """Test snapshot generation with exception"""
        with patch('finquest_api.routers.portfolio.snapshot_user_portfolio', side_effect=Exception("Error")):
            with pytest.raises(Exception) as exc_info:
                await generate_snapshot(None, None, mock_user, mock_db)
            
            assert exc_info.value.status_code == 500

