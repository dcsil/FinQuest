"""
FinQuest API - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, api
from .config import settings

# Create FastAPI app instance
app = FastAPI(
    title="FinQuest API",
    description="Backend API for FinQuest - Financial Education Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(api.router, prefix="/api/v1", tags=["api"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to FinQuest API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }

