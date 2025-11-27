"""
Tests for portfolio service
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timezone

from finquest_api.services.portfolio import (
    get_or_create_portfolio,
    create_position_from_avg_cost,
    _compute_positions,
    get_portfolio_view,
    Position,
)
from finquest_api.db.models import User, Portfolio, Instrument, Transaction


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


class TestGetOrCreatePortfolio:
    """Tests for get_or_create_portfolio function"""
    
    def test_get_existing_portfolio(self, mock_user, mock_db):
        """Test getting existing portfolio"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_portfolio
        mock_db.query.return_value = mock_query
        
        result = get_or_create_portfolio(mock_db, mock_user)
        
        assert result == mock_portfolio
        mock_db.add.assert_not_called()
    
    def test_create_new_portfolio(self, mock_user, mock_db):
        """Test creating new portfolio"""
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        new_portfolio = Mock(spec=Portfolio)
        new_portfolio.id = uuid4()
        
        with patch('finquest_api.services.portfolio.Portfolio', return_value=new_portfolio):
            result = get_or_create_portfolio(mock_db, mock_user)
            
            assert result == new_portfolio
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()


class TestCreatePositionFromAvgCost:
    """Tests for create_position_from_avg_cost function"""
    
    def test_create_position_success(self, mock_user, mock_db):
        """Test successful position creation"""
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = uuid4()
        mock_instrument.currency = "USD"
        
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.id = uuid4()
        
        with patch('finquest_api.services.portfolio.ensure_instrument', return_value=mock_instrument):
            with patch('finquest_api.services.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.services.portfolio.fx_at', return_value=None):
                    with patch('finquest_api.services.portfolio.Transaction', return_value=mock_transaction):
                        result = create_position_from_avg_cost(
                            mock_db,
                            mock_user,
                            "AAPL",
                            Decimal("10"),
                            Decimal("150.0")
                        )
                        
                        assert len(result) == 1
                        assert result[0] == mock_transaction.id
                        mock_db.add.assert_called_once()
                        mock_db.commit.assert_called_once()
    
    def test_create_position_with_fx_rate(self, mock_user, mock_db):
        """Test position creation with FX rate"""
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = uuid4()
        mock_instrument.currency = "EUR"
        
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.id = uuid4()
        
        with patch('finquest_api.services.portfolio.ensure_instrument', return_value=mock_instrument):
            with patch('finquest_api.services.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.services.portfolio.fx_at', return_value=Decimal("1.1")):
                    with patch('finquest_api.services.portfolio.Transaction', return_value=mock_transaction):
                        result = create_position_from_avg_cost(
                            mock_db,
                            mock_user,
                            "AAPL",
                            Decimal("10"),
                            Decimal("150.0")
                        )
                        
                        assert len(result) == 1
    
    def test_create_position_invalid_quantity(self, mock_user, mock_db):
        """Test position creation with invalid quantity"""
        with pytest.raises(ValueError) as exc_info:
            create_position_from_avg_cost(
                mock_db,
                mock_user,
                "AAPL",
                Decimal("-10"),
                Decimal("150.0")
            )
        
        assert "must be positive" in str(exc_info.value).lower()
    
    def test_create_position_invalid_cost(self, mock_user, mock_db):
        """Test position creation with invalid cost"""
        with pytest.raises(ValueError) as exc_info:
            create_position_from_avg_cost(
                mock_db,
                mock_user,
                "AAPL",
                Decimal("10"),
                Decimal("-150.0")
            )
        
        assert "must be positive" in str(exc_info.value).lower()
    
    def test_create_position_with_executed_at(self, mock_user, mock_db):
        """Test position creation with executed_at timestamp"""
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = uuid4()
        mock_instrument.currency = "USD"
        
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.id = uuid4()
        
        executed_at = datetime.now(timezone.utc)
        
        with patch('finquest_api.services.portfolio.ensure_instrument', return_value=mock_instrument):
            with patch('finquest_api.services.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
                with patch('finquest_api.services.portfolio.fx_at', return_value=None):
                    with patch('finquest_api.services.portfolio.Transaction', return_value=mock_transaction):
                        result = create_position_from_avg_cost(
                            mock_db,
                            mock_user,
                            "AAPL",
                            Decimal("10"),
                            Decimal("150.0"),
                            executed_at=executed_at
                        )
                        
                        assert len(result) == 1


class TestComputePositions:
    """Tests for _compute_positions function"""
    
    def test_compute_positions_buy(self, mock_db):
        """Test computing positions with buy transaction"""
        portfolio_id = uuid4()
        instrument_id = uuid4()
        
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.instrument_id = instrument_id
        mock_transaction.side = "buy"
        mock_transaction.quantity = Decimal("10")
        mock_transaction.price = Decimal("150.0")
        mock_transaction.fx_rate_to_user_base = None
        mock_transaction.executed_at = datetime.now(timezone.utc)
        mock_transaction.deleted_at = None
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_transaction]
        mock_db.query.return_value = mock_query
        
        result = _compute_positions(mock_db, portfolio_id)
        
        assert instrument_id in result
        assert result[instrument_id].quantity == Decimal("10")
        assert result[instrument_id].avg_cost_trade_ccy == Decimal("150.0")
    
    def test_compute_positions_multiple_buys(self, mock_db):
        """Test computing positions with multiple buy transactions"""
        portfolio_id = uuid4()
        instrument_id = uuid4()
        
        mock_tx1 = Mock(spec=Transaction)
        mock_tx1.instrument_id = instrument_id
        mock_tx1.side = "buy"
        mock_tx1.quantity = Decimal("10")
        mock_tx1.price = Decimal("150.0")
        mock_tx1.fx_rate_to_user_base = None
        mock_tx1.executed_at = datetime.now(timezone.utc)
        mock_tx1.deleted_at = None
        
        mock_tx2 = Mock(spec=Transaction)
        mock_tx2.instrument_id = instrument_id
        mock_tx2.side = "buy"
        mock_tx2.quantity = Decimal("5")
        mock_tx2.price = Decimal("160.0")
        mock_tx2.fx_rate_to_user_base = None
        mock_tx2.executed_at = datetime.now(timezone.utc)
        mock_tx2.deleted_at = None
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_tx1, mock_tx2]
        mock_db.query.return_value = mock_query
        
        result = _compute_positions(mock_db, portfolio_id)
        
        assert instrument_id in result
        assert result[instrument_id].quantity == Decimal("15")
        # Average cost: (10*150 + 5*160) / 15 = 153.33...
        assert result[instrument_id].avg_cost_trade_ccy > Decimal("153")
    
    def test_compute_positions_sell(self, mock_db):
        """Test computing positions with sell transaction"""
        portfolio_id = uuid4()
        instrument_id = uuid4()
        
        mock_buy = Mock(spec=Transaction)
        mock_buy.instrument_id = instrument_id
        mock_buy.side = "buy"
        mock_buy.quantity = Decimal("10")
        mock_buy.price = Decimal("150.0")
        mock_buy.fx_rate_to_user_base = None
        mock_buy.executed_at = datetime.now(timezone.utc)
        mock_buy.deleted_at = None
        
        mock_sell = Mock(spec=Transaction)
        mock_sell.instrument_id = instrument_id
        mock_sell.side = "sell"
        mock_sell.quantity = Decimal("5")
        mock_sell.price = Decimal("160.0")
        mock_sell.fx_rate_to_user_base = None
        mock_sell.executed_at = datetime.now(timezone.utc)
        mock_sell.deleted_at = None
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_buy, mock_sell]
        mock_db.query.return_value = mock_query
        
        result = _compute_positions(mock_db, portfolio_id)
        
        assert instrument_id in result
        assert result[instrument_id].quantity == Decimal("5")
    
    def test_compute_positions_sell_all(self, mock_db):
        """Test computing positions when all sold"""
        portfolio_id = uuid4()
        instrument_id = uuid4()
        
        mock_buy = Mock(spec=Transaction)
        mock_buy.instrument_id = instrument_id
        mock_buy.side = "buy"
        mock_buy.quantity = Decimal("10")
        mock_buy.price = Decimal("150.0")
        mock_buy.fx_rate_to_user_base = None
        mock_buy.executed_at = datetime.now(timezone.utc)
        mock_buy.deleted_at = None
        
        mock_sell = Mock(spec=Transaction)
        mock_sell.instrument_id = instrument_id
        mock_sell.side = "sell"
        mock_sell.quantity = Decimal("10")
        mock_sell.price = Decimal("160.0")
        mock_sell.fx_rate_to_user_base = None
        mock_sell.executed_at = datetime.now(timezone.utc)
        mock_sell.deleted_at = None
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_buy, mock_sell]
        mock_db.query.return_value = mock_query
        
        result = _compute_positions(mock_db, portfolio_id)
        
        # Position should be removed (zero quantity)
        assert instrument_id not in result
    
    def test_compute_positions_with_fx_rate(self, mock_db):
        """Test computing positions with FX rate"""
        portfolio_id = uuid4()
        instrument_id = uuid4()
        
        mock_transaction = Mock(spec=Transaction)
        mock_transaction.instrument_id = instrument_id
        mock_transaction.side = "buy"
        mock_transaction.quantity = Decimal("10")
        mock_transaction.price = Decimal("150.0")
        mock_transaction.fx_rate_to_user_base = Decimal("1.1")
        mock_transaction.executed_at = datetime.now(timezone.utc)
        mock_transaction.deleted_at = None
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_transaction]
        mock_db.query.return_value = mock_query
        
        result = _compute_positions(mock_db, portfolio_id)
        
        assert instrument_id in result
        assert result[instrument_id].cost_basis_base == Decimal("1650.0")  # 10 * 150 * 1.1


class TestGetPortfolioView:
    """Tests for get_portfolio_view function"""
    
    def test_get_portfolio_view_empty(self, mock_user, mock_db):
        """Test getting portfolio view for empty portfolio"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        with patch('finquest_api.services.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.services.portfolio._compute_positions', return_value={}):
                result = get_portfolio_view(mock_db, mock_user)
                
                assert result.baseCurrency == "USD"
                assert len(result.positions) == 0
                assert result.totals.totalValue == Decimal("0")
    
    def test_get_portfolio_view_with_positions(self, mock_user, mock_db):
        """Test getting portfolio view with positions"""
        mock_portfolio = Mock(spec=Portfolio)
        mock_portfolio.id = uuid4()
        
        instrument_id = uuid4()
        position = Position(
            instrument_id=instrument_id,
            quantity=Decimal("10"),
            avg_cost_trade_ccy=Decimal("150.0"),
            cost_basis_base=Decimal("1500.0")
        )
        
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        mock_instrument.name = "Apple Inc."
        mock_instrument.type = "equity"
        mock_instrument.currency = "USD"
        mock_instrument.sector = "Technology"
        
        mock_price_record = Mock()
        mock_price_record.price = Decimal("160.0")
        mock_price_record.ts = datetime.now(timezone.utc)
        mock_price_record.day_change_abs = Decimal("10.0")
        mock_price_record.day_change_pct = Decimal("6.67")
        
        with patch('finquest_api.services.portfolio.get_or_create_portfolio', return_value=mock_portfolio):
            with patch('finquest_api.services.portfolio._compute_positions', return_value={instrument_id: position}):
                mock_query = Mock()
                mock_query.filter.return_value.all.return_value = [mock_instrument]
                mock_db.query.return_value = mock_query
                
                with patch('finquest_api.services.portfolio.get_latest_prices', return_value={instrument_id: mock_price_record}):
                    result = get_portfolio_view(mock_db, mock_user)
                    
                    assert result.baseCurrency == "USD"
                    assert len(result.positions) == 1
                    assert result.positions[0].symbol == "AAPL"
                    assert result.totals.totalValue > Decimal("0")

