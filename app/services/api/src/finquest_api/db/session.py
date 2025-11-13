"""
SQLAlchemy engine and session management for FinQuest.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Base

from ..config import settings


engine: Optional[Engine] = None
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_engine() -> Engine:
    """
    Lazily create and return a SQLAlchemy engine configured for Supabase Postgres.
    """
    global engine
    if engine is not None:
        return engine

    if not settings.SUPABASE_DB_URL:
        raise RuntimeError(
            "SUPABASE_DB_URL is not configured. "
            "Set the Supabase Postgres connection string in your environment."
        )

    engine_options = {
        "echo": settings.SQLALCHEMY_ECHO,
        "future": True,
        "pool_pre_ping": True,
        "pool_timeout": settings.SQLALCHEMY_POOL_TIMEOUT,
    }

    if settings.SQLALCHEMY_POOL_SIZE is not None:
        engine_options["pool_size"] = settings.SQLALCHEMY_POOL_SIZE

    if settings.SQLALCHEMY_MAX_OVERFLOW is not None:
        engine_options["max_overflow"] = settings.SQLALCHEMY_MAX_OVERFLOW

    db_url = settings.SUPABASE_DB_URL
    assert db_url is not None  # for type checkers

    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    engine = create_engine(db_url, **engine_options)
    return engine


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    """
    db_engine = get_engine()
    session = SessionLocal(bind=db_engine)
    try:
        yield session
    finally:
        session.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """
    Provide a transactional scope around a series of operations.
    """
    session = SessionLocal(bind=get_engine())
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_database() -> None:
    """
    Create database tables based on the declarative metadata.
    """
    Base.metadata.create_all(bind=get_engine())

init_database()

