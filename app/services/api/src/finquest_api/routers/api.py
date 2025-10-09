"""
Main API endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def api_root():
    """API v1 root endpoint"""
    return {
        "message": "FinQuest API v1",
        "version": "0.1.0"
    }

