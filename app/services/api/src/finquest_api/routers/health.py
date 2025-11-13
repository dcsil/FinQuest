"""
Health check endpoints.
"""
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.concurrency import run_in_threadpool

from ..db import get_engine

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic service health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "finquest-api",
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check that verifies database connectivity."""
    def _check_database() -> None:
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

    try:
        await run_in_threadpool(_check_database)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"database": "configuration-error", "message": str(exc)},
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"database": "connection-error", "message": str(exc)},
        ) from exc

    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "database": "ok",
        },
    }

