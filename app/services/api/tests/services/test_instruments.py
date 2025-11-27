"""
Tests for instruments service
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

from finquest_api.services.instruments import (
    YFinanceProvider,
    get_provider,
    ensure_instrument,
    ResolvedInstrument,
)
from finquest_api.db.models import Instrument


class TestYFinanceProvider:
    """Tests for YFinanceProvider class"""
    
    def test_determine_type_crypto(self):
        """Test determining instrument type as crypto"""
        provider = YFinanceProvider()
        info = {"quoteType": "CRYPTOCURRENCY"}
        
        result = provider._determine_type(info)
        
        assert result == "crypto"
    
    def test_determine_type_etf(self):
        """Test determining instrument type as ETF"""
        provider = YFinanceProvider()
        info = {"quoteType": "ETF"}
        
        result = provider._determine_type(info)
        
        assert result == "etf"
    
    def test_determine_type_mutualfund(self):
        """Test determining instrument type as mutual fund"""
        provider = YFinanceProvider()
        info = {"quoteType": "MUTUALFUND"}
        
        result = provider._determine_type(info)
        
        assert result == "etf"
    
    def test_determine_type_equity(self):
        """Test determining instrument type as equity"""
        provider = YFinanceProvider()
        info = {"quoteType": "EQUITY"}
        
        result = provider._determine_type(info)
        
        assert result == "equity"
    
    def test_determine_type_default(self):
        """Test determining instrument type default"""
        provider = YFinanceProvider()
        info = {"quoteType": "UNKNOWN"}
        
        result = provider._determine_type(info)
        
        assert result == "equity"
    
    def test_get_exchange_mic_nasdaq(self):
        """Test getting MIC code for NASDAQ"""
        provider = YFinanceProvider()
        
        result = provider._get_exchange_mic("NASDAQ")
        
        assert result == "XNAS"
    
    def test_get_exchange_mic_nyse(self):
        """Test getting MIC code for NYSE"""
        provider = YFinanceProvider()
        
        result = provider._get_exchange_mic("NYSE")
        
        assert result == "XNYS"
    
    def test_get_exchange_mic_unknown(self):
        """Test getting MIC code for unknown exchange"""
        provider = YFinanceProvider()
        
        result = provider._get_exchange_mic("UNKNOWN")
        
        assert result == "UNKNOWN"
    
    def test_get_exchange_mic_none(self):
        """Test getting MIC code when exchange is None"""
        provider = YFinanceProvider()
        
        result = provider._get_exchange_mic(None)
        
        assert result is None
    
    def test_get_country_code_exact_match(self):
        """Test getting country code with exact match"""
        provider = YFinanceProvider()
        
        result = provider._get_country_code("United States")
        
        assert result == "US"
    
    def test_get_country_code_case_insensitive(self):
        """Test getting country code with case-insensitive match"""
        provider = YFinanceProvider()
        
        result = provider._get_country_code("united states")
        
        assert result == "US"
    
    def test_get_country_code_already_code(self):
        """Test getting country code when already a 2-character code"""
        provider = YFinanceProvider()
        
        result = provider._get_country_code("US")
        
        assert result == "US"
    
    def test_get_country_code_unknown(self):
        """Test getting country code for unknown country"""
        provider = YFinanceProvider()
        
        result = provider._get_country_code("Unknown Country")
        
        assert result is None
    
    def test_get_country_code_none(self):
        """Test getting country code when country is None"""
        provider = YFinanceProvider()
        
        result = provider._get_country_code(None)
        
        assert result is None
    
    def test_resolve_symbol_success(self):
        """Test successful symbol resolution"""
        provider = YFinanceProvider()
        mock_info = {
            "symbol": "AAPL",
            "longName": "Apple Inc.",
            "exchange": "NASDAQ",
            "currency": "USD",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "country": "United States",
            "quoteType": "EQUITY"
        }
        
        mock_ticker = Mock()
        mock_ticker.info = mock_info
        
        with patch('finquest_api.services.instruments.yf.Ticker', return_value=mock_ticker):
            result = provider.resolve_symbol("AAPL")
            
            assert result.type == "equity"
            assert result.symbol == "AAPL"
            assert result.name == "Apple Inc."
            assert result.exchange_mic == "XNAS"
            assert result.currency == "USD"
            assert result.sector == "Technology"
            assert result.country == "US"
    
    def test_resolve_symbol_not_found(self):
        """Test symbol resolution when symbol not found"""
        provider = YFinanceProvider()
        mock_ticker = Mock()
        mock_ticker.info = {}
        
        with patch('finquest_api.services.instruments.yf.Ticker', return_value=mock_ticker):
            with pytest.raises(ValueError) as exc_info:
                provider.resolve_symbol("INVALID")
            
            assert "not found" in str(exc_info.value).lower()
    
    def test_resolve_symbol_exception(self):
        """Test symbol resolution with exception"""
        provider = YFinanceProvider()
        
        with patch('finquest_api.services.instruments.yf.Ticker', side_effect=Exception("Network error")):
            with pytest.raises(ValueError) as exc_info:
                provider.resolve_symbol("AAPL")
            
            assert "Failed to resolve symbol" in str(exc_info.value)
    
    def test_get_latest_price_not_implemented(self):
        """Test get_latest_price raises NotImplementedError"""
        provider = YFinanceProvider()
        
        with pytest.raises(NotImplementedError):
            provider.get_latest_price(uuid4())
    
    def test_backfill_eod_not_implemented(self):
        """Test backfill_eod raises NotImplementedError"""
        provider = YFinanceProvider()
        
        with pytest.raises(NotImplementedError):
            provider.backfill_eod(uuid4(), datetime.now().date(), datetime.now().date())
    
    def test_get_fx_rate_same_currency(self):
        """Test FX rate for same currency"""
        provider = YFinanceProvider()
        
        result = provider.get_fx_rate("USD", "USD", datetime.now())
        
        assert result == Decimal("1.0")
    
    def test_get_fx_rate_success(self):
        """Test successful FX rate retrieval"""
        provider = YFinanceProvider()
        mock_close_series = Mock()
        mock_iloc = Mock()
        mock_iloc.__getitem__ = Mock(return_value=110.5)
        mock_close_series.iloc = mock_iloc
        
        mock_hist = Mock()
        mock_hist.empty = False
        mock_hist.__getitem__ = Mock(return_value=mock_close_series)
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        with patch('finquest_api.services.instruments.yf.Ticker', return_value=mock_ticker):
            result = provider.get_fx_rate("USD", "JPY", datetime.now())
            
            assert result == Decimal("110.5")
    
    def test_get_fx_rate_empty_history(self):
        """Test FX rate when history is empty"""
        provider = YFinanceProvider()
        mock_hist = Mock()
        mock_hist.empty = True
        
        mock_ticker = Mock()
        mock_ticker.history.return_value = mock_hist
        
        with patch('finquest_api.services.instruments.yf.Ticker', return_value=mock_ticker):
            result = provider.get_fx_rate("USD", "JPY", datetime.now())
            
            assert result is None
    
    def test_get_fx_rate_exception(self):
        """Test FX rate with exception"""
        provider = YFinanceProvider()
        
        with patch('finquest_api.services.instruments.yf.Ticker', side_effect=Exception("Error")):
            result = provider.get_fx_rate("USD", "JPY", datetime.now())
            
            assert result is None


class TestGetProvider:
    """Tests for get_provider function"""
    
    def test_get_provider_singleton(self):
        """Test that get_provider returns singleton instance"""
        # Reset the global provider
        import finquest_api.services.instruments as instruments_module
        instruments_module._provider = None
        
        provider1 = get_provider()
        provider2 = get_provider()
        
        assert provider1 is provider2
        assert isinstance(provider1, YFinanceProvider)


class TestEnsureInstrument:
    """Tests for ensure_instrument function"""
    
    def test_ensure_instrument_existing(self):
        """Test ensuring instrument that already exists"""
        mock_db = MagicMock()
        mock_instrument = Mock(spec=Instrument)
        mock_instrument.symbol = "AAPL"
        mock_instrument.exchange_mic = "XNAS"
        mock_instrument.sector = None
        mock_instrument.industry = None
        mock_instrument.country = None
        mock_instrument.name = None
        
        mock_resolved = ResolvedInstrument(
            type="equity",
            symbol="AAPL",
            name="Apple Inc.",
            exchange_mic="XNAS",
            currency="USD",
            sector="Technology",
            industry="Consumer Electronics",
            country="US"
        )
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = mock_instrument
        mock_db.query.return_value = mock_query
        
        with patch('finquest_api.services.instruments.get_provider') as mock_get_provider:
            mock_provider = Mock()
            mock_provider.resolve_symbol.return_value = mock_resolved
            mock_get_provider.return_value = mock_provider
            
            result = ensure_instrument(mock_db, "AAPL")
            
            assert result == mock_instrument
            mock_db.commit.assert_called_once()
    
    def test_ensure_instrument_new(self):
        """Test ensuring new instrument"""
        mock_db = MagicMock()
        mock_resolved = ResolvedInstrument(
            type="equity",
            symbol="AAPL",
            name="Apple Inc.",
            exchange_mic="XNAS",
            currency="USD",
            sector="Technology",
            industry="Consumer Electronics",
            country="US"
        )
        
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        new_instrument = Mock(spec=Instrument)
        new_instrument.id = uuid4()
        
        with patch('finquest_api.services.instruments.get_provider') as mock_get_provider:
            mock_provider = Mock()
            mock_provider.resolve_symbol.return_value = mock_resolved
            mock_get_provider.return_value = mock_provider
            
            with patch('finquest_api.services.instruments.Instrument', return_value=new_instrument):
                result = ensure_instrument(mock_db, "AAPL")
                
                assert result == new_instrument
                mock_db.add.assert_called_once()
                mock_db.commit.assert_called_once()

