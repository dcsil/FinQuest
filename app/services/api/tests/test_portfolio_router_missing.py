"""
Tests for missing lines in portfolio router
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from decimal import Decimal
from datetime import date, datetime, timedelta, timezone

from finquest_api.routers.portfolio import add_position, get_snapshots
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


class TestAddPositionMissingLines:
    """Tests for missing lines in add_position"""
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_zero_quantity(self, mock_user, mock_db):
        """Test add_position with zero quantity (line 47)"""
        # The endpoint checks quantity <= 0, but Pydantic prevents 0
        # We can test by creating a request with a very small positive value
        # and then manually setting quantity to 0 after validation
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=Decimal("0.0001"),  # Very small but positive
            avgCost=Decimal("150.0")
        )
        # Manually set to 0 to test endpoint validation
        request.quantity = Decimal("0")
        
        with pytest.raises(Exception) as exc_info:
            await add_position(request, mock_user, mock_db)
        
        # After fixing the router to re-raise HTTPException, it should be 400
        assert exc_info.value.status_code == 400
        assert "Quantity must be positive" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_zero_cost(self, mock_user, mock_db):
        """Test add_position with zero cost (line 52)"""
        # Create request with valid quantity, then manually set cost to 0
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=Decimal("10"),
            avgCost=Decimal("0.0001")  # Very small but positive
        )
        # Manually set to 0 to test endpoint validation
        request.avgCost = Decimal("0")
        
        with pytest.raises(Exception) as exc_info:
            await add_position(request, mock_user, mock_db)
        
        # After fixing the router to re-raise HTTPException, it should be 400
        assert exc_info.value.status_code == 400
        assert "Average cost must be positive" in str(exc_info.value.detail)
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_timezone_naive(self, mock_user, mock_db):
        """Test add_position with timezone-naive datetime (line 76)"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        # Create timezone-naive datetime
        naive_time = datetime(2024, 1, 1, 12, 0, 0)
        
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=10,
            avgCost=150.0,
            executedAt=naive_time
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', return_value=[uuid4()]):
            with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.routers.portfolio.recalculate_snapshots_after_transaction'):
                    result = await add_position(request, mock_user, mock_db)
                    
                    assert result.status == "ok"
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_timezone_aware_conversion(self, mock_user, mock_db):
        """Test add_position with timezone-aware datetime conversion (line 78)"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        # Create timezone-aware datetime in different timezone
        from datetime import timezone as tz
        aware_time = datetime(2024, 1, 1, 12, 0, 0, tzinfo=tz(timedelta(hours=-5)))
        
        request = PostPositionRequest(
            symbol="AAPL",
            quantity=10,
            avgCost=150.0,
            executedAt=aware_time
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', return_value=[uuid4()]):
            with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.routers.portfolio.recalculate_snapshots_after_transaction') as mock_recalc:
                    result = await add_position(request, mock_user, mock_db)
                    
                    assert result.status == "ok"
                    mock_recalc.assert_called_once()
    
    @pytest.mark.anyio("asyncio")
    async def test_add_position_value_error(self, mock_user, mock_db):
        """Test add_position with ValueError (lines 103-104)"""
        request = PostPositionRequest(
            symbol="INVALID",
            quantity=10,
            avgCost=150.0
        )
        
        with patch('finquest_api.routers.portfolio.create_position_from_avg_cost', side_effect=ValueError("Symbol not found")):
            with pytest.raises(Exception) as exc_info:
                await add_position(request, mock_user, mock_db)
            
            assert exc_info.value.status_code == 404


class TestGetSnapshotsMissingLines:
    """Tests for missing lines in get_snapshots"""
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_6hourly_granularity(self, mock_user, mock_db):
        """Test getting snapshots with 6hourly granularity (lines 198-203)"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        now = datetime.now(timezone.utc)
        mock_snapshot1 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot1.as_of = now
        mock_snapshot1.total_value = 1000.0
        
        mock_snapshot2 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot2.as_of = now + timedelta(hours=7)
        mock_snapshot2.total_value = 1100.0
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot1, mock_snapshot2]
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.routers.portfolio.ensure_snapshots_for_range'):
                result = await get_snapshots(None, None, "6hourly", mock_user, mock_db)
                
                assert len(result.series) >= 1
    
    @pytest.mark.anyio("asyncio")
    async def test_get_snapshots_weekly_granularity(self, mock_user, mock_db):
        """Test getting snapshots with weekly granularity (lines 213-220)"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        now = datetime.now(timezone.utc)
        mock_snapshot1 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot1.as_of = now
        mock_snapshot1.total_value = 1000.0
        
        mock_snapshot2 = Mock(spec=PortfolioValuationSnapshot)
        mock_snapshot2.as_of = now + timedelta(days=8)
        mock_snapshot2.total_value = 1100.0
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_snapshot1, mock_snapshot2]
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.routers.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.routers.portfolio.ensure_snapshots_for_range'):
                result = await get_snapshots(None, None, "weekly", mock_user, mock_db)
                
                assert len(result.series) >= 1

