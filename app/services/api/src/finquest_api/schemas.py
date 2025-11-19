"""
Pydantic schemas for request/response validation
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


# ---------- Portfolio Position Schemas ----------


class PostPositionRequest(BaseModel):
    """Request to add a position"""
    symbol: str = Field(..., description="Ticker symbol (e.g., AAPL)")
    quantity: Decimal = Field(..., gt=0, description="Quantity of shares")
    avgCost: Decimal = Field(..., gt=0, description="Average cost per share")
    executedAt: Optional[datetime] = Field(None, description="Execution timestamp (defaults to now)")


class PostPositionResponse(BaseModel):
    """Response after adding a position"""
    status: str = "ok"
    portfolioId: str
    transactionIds: list[str]


# ---------- Portfolio Holdings Schemas ----------


class PositionInfo(BaseModel):
    """Information about a single position"""
    instrumentId: str
    symbol: str
    name: Optional[str]
    type: str  # "equity" | "etf" | "crypto"
    sector: Optional[str]
    quantity: Decimal
    avgCostBase: Decimal  # in base currency
    marketPrice: Optional[Decimal]  # in trade currency
    valueBase: Optional[Decimal]  # converted to base currency
    unrealizedPL: Optional[Decimal]
    dailyPL: Optional[Decimal]
    currency: str  # trade currency


class PortfolioTotals(BaseModel):
    """Portfolio totals in base currency"""
    totalValue: Decimal
    totalCostBasis: Decimal
    unrealizedPL: Decimal
    dailyPL: Decimal


class MoverInfo(BaseModel):
    """Best/worst mover information"""
    symbol: str
    pct: Decimal
    abs: Decimal


class PortfolioHoldingsResponse(BaseModel):
    """Portfolio holdings and analytics"""
    baseCurrency: str
    totals: PortfolioTotals
    positions: list[PositionInfo]
    allocationByType: dict[str, float]  # weights sum to 1.0
    allocationBySector: dict[str, float]  # when available
    bestMovers: list[MoverInfo]
    worstMovers: list[MoverInfo]


# ---------- Portfolio Snapshot Schemas ----------


class SnapshotPoint(BaseModel):
    """Single snapshot data point"""
    asOf: datetime
    totalValue: Decimal


class SnapshotsResponse(BaseModel):
    """Portfolio valuation snapshots"""
    baseCurrency: str
    series: list[SnapshotPoint]


# ---------- User Profile Schemas ----------


class UserProfile(BaseModel):
    """User profile with financial goals"""
    financialGoals: Optional[str] = None
    investingExperience: Optional[int] = None
    age: Optional[int] = None
    annualIncome: Optional[str] = None
    investmentAmount: Optional[str] = None
    riskTolerance: Optional[str] = None


class UpdateProfileRequest(UserProfile):
    """Request to update user profile"""
    pass


# ---------- Suggestion Schemas ----------


class SuggestionResponse(BaseModel):
    """Personalized suggestion"""
    id: str
    reason: str
    confidence: Optional[float]
    moduleId: Optional[str]
    status: str
    metadata: Optional[dict] = None


# ---------- Learning Module Schemas ----------


class ModuleChoice(BaseModel):
    """Choice for a quiz question"""
    text: str
    isCorrect: bool


class ModuleQuestion(BaseModel):
    """Quiz question"""
    question: str
    choices: list[ModuleChoice]
    explanation: Optional[str] = None


class ModuleContent(BaseModel):
    """Full learning module content"""
    id: Optional[str] = None
    title: str
    body: str  # Markdown content
    questions: list[ModuleQuestion]


class ModuleAttemptRequest(BaseModel):
    """Request to record a module attempt"""
    score: int
    max_score: int
    passed: bool


class ModuleAttemptResponse(BaseModel):
    """Response after recording a module attempt"""
    status: str
    attempt_id: str
    completed: bool
