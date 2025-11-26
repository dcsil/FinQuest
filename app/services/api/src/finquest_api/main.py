"""
FinQuest API - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, api, auth
from .config import settings
from .routers import portfolio, users, modules

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
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(api.router, prefix="/api/v1", tags=["api"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(modules.router, prefix="/api/v1/modules", tags=["modules"])

# Include portfolio router
app.include_router(portfolio.router, prefix="/api", tags=["portfolio"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to FinQuest API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }

