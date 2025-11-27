"""
Tests for pricing service
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from decimal import Decimal
from datetime import date, datetime, timedelta, timezone

from finquest_api.services.pricing import (
    get_latest_price,
    get_latest_prices,
    get_prev_close,
    backfill_eod,
    PriceRecord,
)
from finquest_api.db.models import Instrument, InstrumentPriceLatest, InstrumentPriceEOD


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    db = MagicMock()
    return db


class TestGetLatestPrice:
    """Tests for get_latest_price function"""
    
    def test_get_latest_price_no_instrument(self, mock_db):
        """Test getting latest price when instrument doesn't exist"""
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        result = get_latest_price(mock_db, uuid4())
        
        assert result is None
    
    def test_get_latest_price_from_db_recent(self, mock_db):
        """Test getting recent price from database"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_latest_price = Mock(spec=InstrumentPriceLatest)
        mock_latest_price.price = Decimal("150.0")
        mock_latest_price.ts = datetime.now(timezone.utc) - timedelta(minutes=30)
        mock_latest_price.day_change_abs = Decimal("5.0")
        mock_latest_price.day_change_pct = Decimal("3.45")
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_price_query = Mock()
        mock_price_query.filter.return_value.first.return_value = mock_latest_price
        
        mock_db.query.side_effect = [mock_instrument_query, mock_price_query]
        
        result = get_latest_price(mock_db, instrument_id)
        
        assert result is not None
        assert result.price == Decimal("150.0")
        assert result.day_change_abs == Decimal("5.0")
    
    def test_get_latest_price_from_yfinance(self, mock_db):
        """Test getting price from yfinance when DB is stale"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_latest_price = Mock(spec=InstrumentPriceLatest)
        mock_latest_price.price = Decimal("150.0")
        mock_latest_price.ts = datetime.now(timezone.utc) - timedelta(hours=2)
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_price_query = Mock()
        mock_price_query.filter.return_value.first.return_value = mock_latest_price
        
        mock_db.query.side_effect = [mock_instrument_query, mock_price_query]
        
        # Mock yfinance response
        mock_hist = Mock()
        mock_hist.empty = False
        mock_hist.__len__ = Mock(return_value=2)
        
        # Mock hist.iloc[-1] which returns a row with ["Close"]
        mock_latest_row = Mock()
        mock_latest_row.__getitem__ = Mock(return_value=160.0)
        mock_hist_iloc = Mock()
        mock_hist_iloc.__getitem__ = Mock(side_effect=lambda idx: mock_latest_row if idx == -1 else Mock(__getitem__=Mock(return_value=150.0)))
        mock_hist.iloc = mock_hist_iloc
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        with patch('finquest_api.services.pricing.yf.Ticker', return_value=mock_ticker):
            result = get_latest_price(mock_db, instrument_id)
            
            assert result is not None
            assert result.price == Decimal("160.0")
            mock_db.commit.assert_called_once()
    
    def test_get_latest_price_yfinance_empty_fallback(self, mock_db):
        """Test getting price falls back to EOD when yfinance is empty"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_price_query = Mock()
        mock_price_query.filter.return_value.first.return_value = None
        
        mock_db.query.side_effect = [mock_instrument_query, mock_price_query]
        
        mock_hist = Mock()
        mock_hist.empty = True
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        mock_eod_price = PriceRecord(
            price=Decimal("155.0"),
            ts=datetime.now(timezone.utc),
            day_change_abs=None,
            day_change_pct=None,
        )
        
        with patch('finquest_api.services.pricing.yf.Ticker', return_value=mock_ticker):
            with patch('finquest_api.services.pricing.get_prev_close', return_value=mock_eod_price):
                result = get_latest_price(mock_db, instrument_id)
                
                assert result == mock_eod_price
    
    def test_get_latest_price_exception_fallback(self, mock_db):
        """Test getting price falls back to EOD on exception"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_price_query = Mock()
        mock_price_query.filter.return_value.first.return_value = None
        
        mock_db.query.side_effect = [mock_instrument_query, mock_price_query]
        
        mock_eod_price = PriceRecord(
            price=Decimal("155.0"),
            ts=datetime.now(timezone.utc),
            day_change_abs=None,
            day_change_pct=None,
        )
        
        with patch('finquest_api.services.pricing.yf.Ticker', side_effect=Exception("Network error")):
            with patch('finquest_api.services.pricing.get_prev_close', return_value=mock_eod_price):
                result = get_latest_price(mock_db, instrument_id)
                
                assert result == mock_eod_price


class TestGetLatestPrices:
    """Tests for get_latest_prices function"""
    
    def test_get_latest_prices_multiple(self, mock_db):
        """Test getting latest prices for multiple instruments"""
        instrument_id1 = uuid4()
        instrument_id2 = uuid4()
        
        mock_price1 = PriceRecord(
            price=Decimal("150.0"),
            ts=datetime.now(timezone.utc),
            day_change_abs=Decimal("5.0"),
            day_change_pct=Decimal("3.45"),
        )
        
        mock_price2 = PriceRecord(
            price=Decimal("200.0"),
            ts=datetime.now(timezone.utc),
            day_change_abs=Decimal("10.0"),
            day_change_pct=Decimal("5.26"),
        )
        
        with patch('finquest_api.services.pricing.get_latest_price') as mock_get_price:
            mock_get_price.side_effect = [mock_price1, mock_price2]
            
            result = get_latest_prices(mock_db, [instrument_id1, instrument_id2])
            
            assert len(result) == 2
            assert result[instrument_id1] == mock_price1
            assert result[instrument_id2] == mock_price2


class TestGetPrevClose:
    """Tests for get_prev_close function"""
    
    def test_get_prev_close_no_instrument(self, mock_db):
        """Test getting previous close when instrument doesn't exist"""
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        result = get_prev_close(mock_db, uuid4())
        
        assert result is None
    
    def test_get_prev_close_from_db(self, mock_db):
        """Test getting previous close from database"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        date.today() - timedelta(days=1)
        mock_eod = Mock(spec=InstrumentPriceEOD)
        mock_eod.close = Decimal("155.0")
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_eod_query = Mock()
        mock_eod_query.filter.return_value.first.return_value = mock_eod
        
        mock_db.query.side_effect = [mock_instrument_query, mock_eod_query]
        
        result = get_prev_close(mock_db, instrument_id)
        
        assert result is not None
        assert result.price == Decimal("155.0")
    
    def test_get_prev_close_from_yfinance(self, mock_db):
        """Test getting previous close from yfinance"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_eod_query = Mock()
        mock_eod_query.filter.return_value.first.return_value = None
        
        mock_db.query.side_effect = [mock_instrument_query, mock_eod_query]
        
        # Mock yfinance response
        mock_hist = Mock()
        mock_hist.empty = False
        mock_hist.__len__ = Mock(return_value=2)
        
        # Mock hist.index[-1].date() and hist.index[-2].date()
        mock_index_item1 = Mock()
        mock_index_item1.date.return_value = date.today() - timedelta(days=1)
        mock_index_item2 = Mock()
        mock_index_item2.date.return_value = date.today() - timedelta(days=2)
        mock_hist.index = Mock()
        mock_hist.index.__getitem__ = Mock(side_effect=lambda idx: mock_index_item1 if idx == -1 else mock_index_item2)
        
        # Mock hist.iloc[-1]["Close"] and hist.iloc[-2]["Close"]
        mock_row1 = Mock()
        mock_row1.__getitem__ = Mock(return_value=155.0)
        mock_row2 = Mock()
        mock_row2.__getitem__ = Mock(return_value=154.0)
        mock_hist_iloc = Mock()
        mock_hist_iloc.__getitem__ = Mock(side_effect=lambda idx: mock_row1 if idx == -1 else mock_row2)
        mock_hist.iloc = mock_hist_iloc
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        with patch('finquest_api.services.pricing.yf.Ticker', return_value=mock_ticker):
            result = get_prev_close(mock_db, instrument_id)
            
            assert result is not None
            assert result.price == Decimal("155.0")
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
    
    def test_get_prev_close_yfinance_empty(self, mock_db):
        """Test getting previous close when yfinance returns empty"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_eod_query = Mock()
        mock_eod_query.filter.return_value.first.return_value = None
        
        mock_db.query.side_effect = [mock_instrument_query, mock_eod_query]
        
        mock_hist = Mock()
        mock_hist.empty = True
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        with patch('finquest_api.services.pricing.yf.Ticker', return_value=mock_ticker):
            result = get_prev_close(mock_db, instrument_id)
            
            assert result is None
    
    def test_get_prev_close_exception(self, mock_db):
        """Test getting previous close with exception"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_instrument_query = Mock()
        mock_instrument_query.filter.return_value.first.return_value = mock_instrument
        
        mock_eod_query = Mock()
        mock_eod_query.filter.return_value.first.return_value = None
        
        mock_db.query.side_effect = [mock_instrument_query, mock_eod_query]
        
        with patch('finquest_api.services.pricing.yf.Ticker', side_effect=Exception("Error")):
            result = get_prev_close(mock_db, instrument_id)
            
            assert result is None


class TestBackfillEod:
    """Tests for backfill_eod function"""
    
    def test_backfill_eod_no_instrument(self, mock_db):
        """Test backfilling when instrument doesn't exist"""
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        # Should return without error
        backfill_eod(mock_db, uuid4(), date.today() - timedelta(days=7), date.today())
        
        # Should not add anything
        mock_db.add.assert_not_called()
    
    def test_backfill_eod_success(self, mock_db):
        """Test successful EOD backfill"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_instrument
        mock_db.query.return_value = mock_query
        
        # Mock yfinance response - use Mock instead of pandas DataFrame
        mock_hist = Mock()
        mock_hist.empty = False
        
        # Mock iterrows to return date-indexed rows
        row1_date = date.today() - timedelta(days=2)
        row2_date = date.today() - timedelta(days=1)
        
        def mock_getitem(key):
            if key == 'Open':
                return Mock(__getitem__=Mock(side_effect=[150.0, 151.0]))
            elif key == 'High':
                return Mock(__getitem__=Mock(side_effect=[155.0, 156.0]))
            elif key == 'Low':
                return Mock(__getitem__=Mock(side_effect=[149.0, 150.0]))
            elif key == 'Close':
                return Mock(__getitem__=Mock(side_effect=[154.0, 155.0]))
            elif key == 'Volume':
                return Mock(__getitem__=Mock(side_effect=[1000000, 1100000]))
        
        mock_hist.__getitem__ = Mock(side_effect=mock_getitem)
        
        # Create mock rows
        def create_row_data(idx, date_val):
            row = Mock()
            row.name = date_val
            row.__getitem__ = Mock(side_effect=lambda k: {
                'Open': [150.0, 151.0][idx],
                'High': [155.0, 156.0][idx],
                'Low': [149.0, 150.0][idx],
                'Close': [154.0, 155.0][idx],
                'Volume': [1000000, 1100000][idx]
            }[k])
            isna_mock = Mock()
            isna_mock.__getitem__ = Mock(return_value=False)
            row.isna = Mock(return_value=isna_mock)
            return row
        
        mock_row1 = create_row_data(0, row1_date)
        mock_row2 = create_row_data(1, row2_date)
        
        def create_mock_idx(dt_val):
            """Create a mock index that has .date() method - dt_val is already a date"""
            idx = Mock()
            idx.date = Mock(return_value=dt_val)  # dt_val is already a date object
            return idx
        
        mock_idx1 = create_mock_idx(row1_date)
        mock_idx2 = create_mock_idx(row2_date)
        
        mock_hist.iterrows.return_value = [
            (mock_idx1, mock_row1),
            (mock_idx2, mock_row2),
        ]
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        mock_existing_query = Mock()
        mock_existing_query.filter.return_value.first.return_value = None
        
        with patch('finquest_api.services.pricing.yf.Ticker', return_value=mock_ticker):
            # Setup query side effect: instrument query, then existing queries for each date
            query_calls = [mock_query]
            for _ in range(2):
                query_calls.append(mock_existing_query)
            mock_db.query.side_effect = query_calls
            
            backfill_eod(mock_db, instrument_id, date.today() - timedelta(days=5), date.today())
            
            # Should add prices
            assert mock_db.add.call_count == 2
            mock_db.commit.assert_called_once()
    
    def test_backfill_eod_existing_prices(self, mock_db):
        """Test backfilling when prices already exist"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_instrument
        mock_db.query.return_value = mock_query
        
        # Mock existing price
        mock_existing = Mock(spec=InstrumentPriceEOD)
        mock_existing_query = Mock()
        mock_existing_query.filter.return_value.first.return_value = mock_existing
        
        import pandas as pd
        dates = pd.date_range(start=date.today() - timedelta(days=5), end=date.today(), freq='D')
        mock_hist = pd.DataFrame({
            'Open': [150.0],
            'High': [155.0],
            'Low': [149.0],
            'Close': [154.0],
            'Volume': [1000000]
        }, index=dates[:1])
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        with patch('finquest_api.services.pricing.yf.Ticker', return_value=mock_ticker):
            mock_db.query.side_effect = [mock_query, mock_existing_query]
            
            backfill_eod(mock_db, instrument_id, date.today() - timedelta(days=5), date.today())
            
            # Should not add existing prices
            mock_db.add.assert_not_called()
    
    def test_backfill_eod_exception(self, mock_db):
        """Test backfilling with exception"""
        instrument_id = uuid4()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.id = instrument_id
        mock_instrument.symbol = "AAPL"
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_instrument
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.services.pricing.yf.Ticker', side_effect=Exception("Error")):
            with pytest.raises(Exception):
                backfill_eod(mock_db, instrument_id, date.today() - timedelta(days=5), date.today())
            
            mock_db.rollback.assert_called_once()

