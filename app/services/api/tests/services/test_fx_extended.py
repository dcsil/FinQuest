"""
Extended tests for FX service
"""
from unittest.mock import Mock, MagicMock, patch
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from finquest_api.services.fx import fx_at, convert_to_base
from finquest_api.db.models import FxRateSnapshot


class TestFxAt:
    """Tests for fx_at function"""
    
    def test_same_currency(self):
        """Test FX rate for same currency"""
        mock_db = MagicMock()
        when = datetime.now(timezone.utc)
        
        result = fx_at(mock_db, "USD", "USD", when)
        
        assert result == Decimal("1.0")
        mock_db.query.assert_not_called()
    
    def test_recent_rate_from_db(self):
        """Test using recent rate from database"""
        mock_db = MagicMock()
        when = datetime.now(timezone.utc)
        mock_snapshot = Mock(spec=FxRateSnapshot)
        mock_snapshot.rate = Decimal("1.25")
        mock_snapshot.as_of = when - timedelta(hours=1)
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = mock_snapshot
        mock_db.query.return_value = mock_query
        
        result = fx_at(mock_db, "EUR", "USD", when)
        
        assert result == Decimal("1.25")
    
    def test_stale_rate_from_db(self):
        """Test when DB rate is stale"""
        mock_db = MagicMock()
        when = datetime.now(timezone.utc)
        mock_snapshot = Mock(spec=FxRateSnapshot)
        mock_snapshot.rate = Decimal("1.25")
        mock_snapshot.as_of = when - timedelta(hours=25)
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = mock_snapshot
        mock_db.query.return_value = mock_query
        
        mock_provider = Mock()
        mock_provider.get_fx_rate.return_value = Decimal("1.30")
        
        with patch('finquest_api.services.fx.get_provider', return_value=mock_provider):
            result = fx_at(mock_db, "EUR", "USD", when)
            
            assert result == Decimal("1.30")
            mock_provider.get_fx_rate.assert_called_once()
    
    def test_no_rate_in_db(self):
        """Test when no rate exists in database"""
        mock_db = MagicMock()
        when = datetime.now(timezone.utc)
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        mock_provider = Mock()
        mock_provider.get_fx_rate.return_value = Decimal("1.30")
        
        with patch('finquest_api.services.fx.get_provider', return_value=mock_provider):
            result = fx_at(mock_db, "EUR", "USD", when)
            
            assert result == Decimal("1.30")
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()


class TestConvertToBase:
    """Tests for convert_to_base function"""
    
    def test_same_currency(self):
        """Test conversion with same currency"""
        mock_db = MagicMock()
        amount = Decimal("100.0")
        
        result = convert_to_base(mock_db, amount, "USD", "USD")
        
        assert result == amount
        mock_db.query.assert_not_called()
    
    def test_convert_with_fx_now(self):
        """Test conversion using fx_now"""
        mock_db = MagicMock()
        amount = Decimal("100.0")
        
        with patch('finquest_api.services.fx.fx_now', return_value=Decimal("1.25")):
            result = convert_to_base(mock_db, amount, "EUR", "USD", None)
            
            assert result == Decimal("125.0")
    
    def test_convert_with_fx_at(self):
        """Test conversion using fx_at"""
        mock_db = MagicMock()
        amount = Decimal("100.0")
        when = datetime.now(timezone.utc)
        
        with patch('finquest_api.services.fx.fx_at', return_value=Decimal("1.25")):
            result = convert_to_base(mock_db, amount, "EUR", "USD", when)
            
            assert result == Decimal("125.0")
    
    def test_convert_no_rate_available(self):
        """Test conversion when rate is not available"""
        mock_db = MagicMock()
        amount = Decimal("100.0")
        
        with patch('finquest_api.services.fx.fx_now', return_value=None):
            result = convert_to_base(mock_db, amount, "EUR", "USD", None)
            
            assert result is None



