"""
Tests for FX service
"""
from unittest.mock import Mock, MagicMock, patch
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from finquest_api.services.fx import fx_now
from finquest_api.db.models import FxRateSnapshot


class TestFxNow:
    """Tests for fx_now function"""
    
    def test_same_currency(self):
        """Test FX rate for same currency"""
        mock_db = MagicMock()
        
        result = fx_now(mock_db, "USD", "USD")
        
        assert result == Decimal("1.0")
        mock_db.query.assert_not_called()
    
    def test_recent_rate_from_db(self):
        """Test using recent rate from database"""
        mock_db = MagicMock()
        mock_snapshot = Mock(spec=FxRateSnapshot)
        mock_snapshot.rate = Decimal("1.25")
        # Create datetime with timezone
        mock_snapshot.as_of = datetime.now(timezone.utc) - timedelta(hours=1)
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = mock_snapshot
        mock_db.query.return_value = mock_query
        
        result = fx_now(mock_db, "EUR", "USD")
        
        assert result == Decimal("1.25")
    
    def test_recent_rate_timezone_naive(self):
        """Test using recent rate with timezone-naive datetime (line 38-40)"""
        mock_db = MagicMock()
        mock_snapshot = Mock(spec=FxRateSnapshot)
        mock_snapshot.rate = Decimal("1.25")
        # Create timezone-naive datetime that's recent (within 24 hours)
        # Use a fixed time that's definitely within 24 hours of "now"
        now_utc = datetime.now(timezone.utc)
        naive_time = (now_utc - timedelta(hours=1)).replace(tzinfo=None)  # Remove timezone to make it naive
        mock_snapshot.as_of = naive_time
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = mock_snapshot
        mock_db.query.return_value = mock_query
        
        # Mock the provider to not be called (since we want to test the DB path)
        mock_provider = Mock()
        mock_provider.get_fx_rate.return_value = None
        
        with patch('finquest_api.services.fx.get_provider', return_value=mock_provider):
            result = fx_now(mock_db, "EUR", "USD")
            
            assert result == Decimal("1.25")
            # Provider should not be called since DB rate is recent
            mock_provider.get_fx_rate.assert_not_called()
    
    def test_stale_rate_from_db(self):
        """Test when DB rate is stale"""
        mock_db = MagicMock()
        mock_snapshot = Mock(spec=FxRateSnapshot)
        mock_snapshot.rate = Decimal("1.25")
        mock_snapshot.as_of = datetime.now(timezone.utc) - timedelta(hours=25)
        
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = mock_snapshot
        mock_db.query.return_value = mock_query
        
        mock_provider = Mock()
        mock_provider.get_fx_rate.return_value = Decimal("1.30")
        
        with patch('finquest_api.services.fx.get_provider', return_value=mock_provider):
            result = fx_now(mock_db, "EUR", "USD")
            
            assert result == Decimal("1.30")
            mock_provider.get_fx_rate.assert_called_once()
    
    def test_no_rate_in_db(self):
        """Test when no rate exists in database"""
        mock_db = MagicMock()
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        mock_provider = Mock()
        mock_provider.get_fx_rate.return_value = Decimal("1.30")
        
        with patch('finquest_api.services.fx.get_provider', return_value=mock_provider):
            result = fx_now(mock_db, "EUR", "USD")
            
            assert result == Decimal("1.30")
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
    
    def test_provider_returns_none(self):
        """Test when provider returns None"""
        mock_db = MagicMock()
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.first.return_value = None
        mock_db.query.return_value = mock_query
        
        mock_provider = Mock()
        mock_provider.get_fx_rate.return_value = None
        
        with patch('finquest_api.services.fx.get_provider', return_value=mock_provider):
            result = fx_now(mock_db, "EUR", "USD")
            
            assert result is None
            mock_db.add.assert_not_called()

