"""
Tests for __init__.py main function
"""
import pytest
from unittest.mock import patch, MagicMock
from finquest_api import main, __version__


class TestMain:
    """Tests for main function"""
    
    def test_main_function(self):
        """Test main function calls uvicorn.run"""
        with patch('finquest_api.uvicorn.run') as mock_run:
            main()
            
            mock_run.assert_called_once()
            call_args = mock_run.call_args
            assert call_args[0][0] == "finquest_api.main:app"
            assert call_args[1]["host"] == "0.0.0.0"
            assert call_args[1]["port"] == 8000
            assert call_args[1]["reload"] is True
    
    def test_version(self):
        """Test version constant"""
        assert __version__ == "0.1.0"

