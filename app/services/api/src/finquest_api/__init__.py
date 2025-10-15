"""
FinQuest API Package
"""
import uvicorn

__version__ = "0.1.0"


def main() -> None:
    """Run the FastAPI application"""
    uvicorn.run(
        "finquest_api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
