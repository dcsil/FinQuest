"""
Tests for database session management
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

from finquest_api.db.session import get_engine, get_session, session_scope, init_database
from finquest_api.config import settings


class TestGetEngine:
    """Tests for get_engine function"""
    
    def test_get_engine_success(self, monkeypatch):
        """Test successful engine creation"""
        mock_engine = Mock()
        
        with patch('finquest_api.db.session.create_engine', return_value=mock_engine):
            monkeypatch.setenv("SUPABASE_DB_URL", "postgresql://test:test@localhost/test")
            
            # Reset global engine
            import finquest_api.db.session as session_module
            session_module.engine = None
            
            engine = get_engine()
            assert engine == mock_engine
    
    def test_get_engine_missing_url(self, monkeypatch):
        """Test engine creation without DB URL"""
        monkeypatch.delenv("SUPABASE_DB_URL", raising=False)
        monkeypatch.setattr(settings, "SUPABASE_DB_URL", None)
        
        # Reset global engine
        import finquest_api.db.session as session_module
        session_module.engine = None
        
        with pytest.raises(RuntimeError) as exc_info:
            get_engine()
        
        assert "SUPABASE_DB_URL is not configured" in str(exc_info.value)
    
    def test_get_engine_postgresql_url_conversion(self, monkeypatch):
        """Test postgresql:// URL is converted to postgresql+psycopg://"""
        mock_engine = Mock()
        
        with patch('finquest_api.db.session.create_engine', return_value=mock_engine) as mock_create:
            monkeypatch.setenv("SUPABASE_DB_URL", "postgresql://test:test@localhost/test")
            
            # Reset global engine
            import finquest_api.db.session as session_module
            session_module.engine = None
            
            get_engine()
            
            # Check that URL was converted
            call_args = mock_create.call_args
            assert "postgresql+psycopg://" in call_args[0][0]
    
    def test_get_engine_uses_cached_engine(self, monkeypatch):
        """Test that get_engine returns cached engine on second call"""
        mock_engine = Mock()
        
        with patch('finquest_api.db.session.create_engine', return_value=mock_engine) as mock_create:
            monkeypatch.setenv("SUPABASE_DB_URL", "postgresql://test:test@localhost/test")
            
            # Reset global engine
            import finquest_api.db.session as session_module
            session_module.engine = None
            
            engine1 = get_engine()
            engine2 = get_engine()
            
            # Should only create engine once
            assert mock_create.call_count == 1
            assert engine1 == engine2 == mock_engine


class TestGetSession:
    """Tests for get_session function"""
    
    def test_get_session_yields_and_closes(self, monkeypatch):
        """Test that get_session yields session and closes it"""
        mock_engine = Mock()
        mock_session = Mock()
        mock_sessionmaker = Mock(return_value=mock_session)
        
        with patch('finquest_api.db.session.get_engine', return_value=mock_engine):
            with patch('finquest_api.db.session.SessionLocal', mock_sessionmaker):
                session_gen = get_session()
                session = next(session_gen)
                
                assert session == mock_session
                mock_sessionmaker.assert_called_once_with(bind=mock_engine)
                
                # Close session
                try:
                    next(session_gen)
                except StopIteration:
                    pass
                
                mock_session.close.assert_called_once()


class TestSessionScope:
    """Tests for session_scope context manager"""
    
    def test_session_scope_commits_on_success(self, monkeypatch):
        """Test that session_scope commits on successful execution"""
        mock_engine = Mock()
        mock_session = Mock()
        mock_sessionmaker = Mock(return_value=mock_session)
        
        with patch('finquest_api.db.session.get_engine', return_value=mock_engine):
            with patch('finquest_api.db.session.SessionLocal', mock_sessionmaker):
                with session_scope() as session:
                    assert session == mock_session
                
                mock_session.commit.assert_called_once()
                mock_session.close.assert_called_once()
    
    def test_session_scope_rolls_back_on_exception(self, monkeypatch):
        """Test that session_scope rolls back on exception"""
        mock_engine = Mock()
        mock_session = Mock()
        mock_sessionmaker = Mock(return_value=mock_session)
        
        with patch('finquest_api.db.session.get_engine', return_value=mock_engine):
            with patch('finquest_api.db.session.SessionLocal', mock_sessionmaker):
                with pytest.raises(ValueError):
                    with session_scope() as session:
                        raise ValueError("Test error")
                
                mock_session.rollback.assert_called_once()
                mock_session.close.assert_called_once()
                mock_session.commit.assert_not_called()


class TestInitDatabase:
    """Tests for init_database function"""
    
    def test_init_database_creates_tables(self, monkeypatch):
        """Test that init_database creates tables"""
        mock_engine = Mock()
        mock_metadata = Mock()
        
        with patch('finquest_api.db.session.get_engine', return_value=mock_engine):
            with patch('finquest_api.db.session.Base.metadata', mock_metadata):
                init_database()
                
                mock_metadata.create_all.assert_called_once_with(bind=mock_engine)

