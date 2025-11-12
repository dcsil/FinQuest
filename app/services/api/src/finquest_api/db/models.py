"""
SQLAlchemy 2.x declarative models for the FinQuest MVP.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base declarative class."""

    pass


def uuid_pk():
    return mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )


def ts_created():
    return mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


def ts_updated():
    return mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


def ts_soft_delete():
    return mapped_column(DateTime(timezone=True), nullable=True)


CurrencyCode = String(3)

# ---------- Users & Portfolio ----------


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = uuid_pk()
    # Link to Supabase auth.users.id (UUID). Keep a separate internal id for FK stability.
    auth_user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(120))
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="America/Toronto")
    base_currency: Mapped[str] = mapped_column(CurrencyCode, nullable=False, default="USD")
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()
    deleted_at: Mapped[Optional[datetime]] = ts_soft_delete()

    portfolio: Mapped[Optional["Portfolio"]] = relationship(back_populates="user", uselist=False)
    suggestions: Mapped[list["Suggestion"]] = relationship(back_populates="user")


class Portfolio(Base):
    __tablename__ = "portfolios"
    __table_args__ = (UniqueConstraint("user_id", name="uq_portfolios_user"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, default="My Portfolio")
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()
    deleted_at: Mapped[Optional[datetime]] = ts_soft_delete()

    user: Mapped["User"] = relationship(back_populates="portfolio")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    valuation_snapshots: Mapped[list["PortfolioValuationSnapshot"]] = relationship(
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )


# ---------- Instruments & Pricing ----------

InstrumentTypeEnum = Enum("equity", "etf", "crypto", name="instrument_type")
ExchangeMIC = String(20)


class Instrument(Base):
    __tablename__ = "instruments"
    __table_args__ = (
        UniqueConstraint("symbol", "exchange_mic", name="uq_instruments_symbol_exchange"),
        Index("ix_instruments_type_sector", "type", "sector"),
    )

    id: Mapped[UUID] = uuid_pk()
    type: Mapped[str] = mapped_column(InstrumentTypeEnum, nullable=False)
    symbol: Mapped[str] = mapped_column(String(24), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(256))
    exchange_mic: Mapped[Optional[str]] = mapped_column(ExchangeMIC)
    currency: Mapped[str] = mapped_column(CurrencyCode, nullable=False, default="USD")
    sector: Mapped[Optional[str]] = mapped_column(String(120))
    industry: Mapped[Optional[str]] = mapped_column(String(120))
    country: Mapped[Optional[str]] = mapped_column(String(2))
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()
    deleted_at: Mapped[Optional[datetime]] = ts_soft_delete()

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="instrument")
    eod_prices: Mapped[list["InstrumentPriceEOD"]] = relationship(
        back_populates="instrument",
        cascade="all, delete-orphan",
    )
    latest_price: Mapped[Optional["InstrumentPriceLatest"]] = relationship(
        back_populates="instrument",
        uselist=False,
        cascade="all, delete-orphan",
    )


class InstrumentPriceEOD(Base):
    __tablename__ = "instrument_price_eod"
    __table_args__ = (
        UniqueConstraint("instrument_id", "price_date", name="uq_eod_instrument_day"),
        Index("ix_eod_instrument_day", "instrument_id", "price_date"),
    )

    id: Mapped[UUID] = uuid_pk()
    instrument_id: Mapped[UUID] = mapped_column(ForeignKey("instruments.id", ondelete="CASCADE"), nullable=False)
    price_date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Optional[Numeric]] = mapped_column(Numeric(20, 8))
    high: Mapped[Optional[Numeric]] = mapped_column(Numeric(20, 8))
    low: Mapped[Optional[Numeric]] = mapped_column(Numeric(20, 8))
    close: Mapped[Numeric] = mapped_column(Numeric(20, 8), nullable=False)
    volume: Mapped[Optional[Numeric]] = mapped_column(Numeric(28, 0))
    created_at: Mapped[datetime] = ts_created()

    instrument: Mapped["Instrument"] = relationship(back_populates="eod_prices")


class InstrumentPriceLatest(Base):
    __tablename__ = "instrument_price_latest"
    __table_args__ = (UniqueConstraint("instrument_id", name="uq_latest_instrument"),)

    id: Mapped[UUID] = uuid_pk()
    instrument_id: Mapped[UUID] = mapped_column(ForeignKey("instruments.id", ondelete="CASCADE"), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    price: Mapped[Numeric] = mapped_column(Numeric(20, 8), nullable=False)
    day_change_abs: Mapped[Optional[Numeric]] = mapped_column(Numeric(20, 8))
    day_change_pct: Mapped[Optional[Numeric]] = mapped_column(Numeric(9, 6))
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()

    instrument: Mapped["Instrument"] = relationship(back_populates="latest_price")


# ---------- FX Rates ----------


class FxRateSnapshot(Base):
    __tablename__ = "fx_rate_snapshots"
    __table_args__ = (UniqueConstraint("base_ccy", "quote_ccy", "as_of", name="uq_fx_pair_time"),)

    id: Mapped[UUID] = uuid_pk()
    base_ccy: Mapped[str] = mapped_column(CurrencyCode, nullable=False)
    quote_ccy: Mapped[str] = mapped_column(CurrencyCode, nullable=False)
    as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rate: Mapped[Numeric] = mapped_column(Numeric(20, 10), nullable=False)
    created_at: Mapped[datetime] = ts_created()


# ---------- Transactions ----------

SideEnum = Enum("buy", "sell", name="trade_side")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_tx_portfolio_instrument_time", "portfolio_id", "instrument_id", "executed_at"),)

    id: Mapped[UUID] = uuid_pk()
    portfolio_id: Mapped[UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    instrument_id: Mapped[UUID] = mapped_column(ForeignKey("instruments.id", ondelete="RESTRICT"), nullable=False, index=True)
    side: Mapped[str] = mapped_column(SideEnum, nullable=False)
    quantity: Mapped[Numeric] = mapped_column(Numeric(28, 10), nullable=False)
    price: Mapped[Numeric] = mapped_column(Numeric(20, 8), nullable=False)
    trade_currency: Mapped[str] = mapped_column(CurrencyCode, nullable=False)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    fx_rate_to_user_base: Mapped[Optional[Numeric]] = mapped_column(Numeric(20, 10))
    notes: Mapped[Optional[str]] = mapped_column(String(280))
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()
    deleted_at: Mapped[Optional[datetime]] = ts_soft_delete()

    portfolio: Mapped["Portfolio"] = relationship(back_populates="transactions")
    instrument: Mapped["Instrument"] = relationship(back_populates="transactions")


# ---------- Portfolio Valuation Snapshots ----------


class PortfolioValuationSnapshot(Base):
    __tablename__ = "portfolio_valuation_snapshots"
    __table_args__ = (
        Index("ix_snapshots_portfolio_time", "portfolio_id", "as_of"),
        UniqueConstraint("portfolio_id", "as_of", name="uq_snapshot_portfolio_time"),
    )

    id: Mapped[UUID] = uuid_pk()
    portfolio_id: Mapped[UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_value: Mapped[Numeric] = mapped_column(Numeric(20, 8), nullable=False)
    total_cost_basis: Mapped[Numeric] = mapped_column(Numeric(20, 8), nullable=False)
    unrealized_pl: Mapped[Numeric] = mapped_column(Numeric(20, 8), nullable=False)
    daily_pl: Mapped[Optional[Numeric]] = mapped_column(Numeric(20, 8))
    allocation_by_sector: Mapped[Optional[dict]] = mapped_column(JSON)
    allocation_by_type: Mapped[Optional[dict]] = mapped_column(JSON)
    top_movers: Mapped[Optional[list]] = mapped_column(JSON)
    created_at: Mapped[datetime] = ts_created()

    portfolio: Mapped["Portfolio"] = relationship(back_populates="valuation_snapshots")


# ---------- Learning Modules ----------


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[UUID] = uuid_pk()
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()
    deleted_at: Mapped[Optional[datetime]] = ts_soft_delete()

    versions: Mapped[list["ModuleVersion"]] = relationship(back_populates="module", cascade="all, delete-orphan")
    quiz_questions: Mapped[list["ModuleQuestion"]] = relationship(
        back_populates="module",
        cascade="all, delete-orphan",
    )


class ModuleVersion(Base):
    __tablename__ = "module_versions"
    __table_args__ = (UniqueConstraint("module_id", "version", name="uq_module_version"),)

    id: Mapped[UUID] = uuid_pk()
    module_id: Mapped[UUID] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    assets: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = ts_created()

    module: Mapped["Module"] = relationship(back_populates="versions")


QuestionTypeEnum = Enum("single_choice", "multiple_choice", name="question_type")


class ModuleQuestion(Base):
    __tablename__ = "module_questions"
    __table_args__ = (Index("ix_module_questions_module_order", "module_id", "order_index"),)

    id: Mapped[UUID] = uuid_pk()
    module_id: Mapped[UUID] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    type: Mapped[str] = mapped_column(QuestionTypeEnum, nullable=False, default="multiple_choice")
    prompt_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    explanation_markdown: Mapped[Optional[str]] = mapped_column(Text)
    shuffle_choices: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = ts_created()

    module: Mapped["Module"] = relationship(back_populates="quiz_questions")
    choices: Mapped[list["ModuleChoice"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
    )


class ModuleChoice(Base):
    __tablename__ = "module_choices"

    id: Mapped[UUID] = uuid_pk()
    question_id: Mapped[UUID] = mapped_column(ForeignKey("module_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    text_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = ts_created()

    question: Mapped["ModuleQuestion"] = relationship(back_populates="choices")


# ---------- Learning Progress ----------


class ModuleAttempt(Base):
    __tablename__ = "module_attempts"
    __table_args__ = (Index("ix_attempts_user_module_time", "user_id", "module_id", "started_at"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id: Mapped[UUID] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    score_pct: Mapped[Optional[Numeric]] = mapped_column(Numeric(5, 2))
    passed: Mapped[Optional[bool]] = mapped_column(Boolean)
    passing_score_pct: Mapped[Numeric] = mapped_column(Numeric(5, 2), nullable=False, default=70)
    created_at: Mapped[datetime] = ts_created()

    answers: Mapped[list["ModuleAttemptAnswer"]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
    )


class ModuleAttemptAnswer(Base):
    __tablename__ = "module_attempt_answers"
    __table_args__ = (Index("ix_attempt_answers_attempt_question", "attempt_id", "question_id"),)

    id: Mapped[UUID] = uuid_pk()
    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("module_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[UUID] = mapped_column(ForeignKey("module_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_choice_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = ts_created()

    attempt: Mapped["ModuleAttempt"] = relationship(back_populates="answers")


class ModuleCompletion(Base):
    __tablename__ = "module_completions"
    __table_args__ = (UniqueConstraint("user_id", "module_id", "attempt_id", name="uq_completion_unique"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id: Mapped[UUID] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("module_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


# ---------- Onboarding ----------


class OnboardingQuestion(Base):
    __tablename__ = "onboarding_questions"

    id: Mapped[UUID] = uuid_pk()
    key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    prompt_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(QuestionTypeEnum, nullable=False, default="multiple_choice")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()

    choices: Mapped[list["OnboardingChoice"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
    )


class OnboardingChoice(Base):
    __tablename__ = "onboarding_choices"

    id: Mapped[UUID] = uuid_pk()
    question_id: Mapped[UUID] = mapped_column(ForeignKey("onboarding_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = ts_created()

    question: Mapped["OnboardingQuestion"] = relationship(back_populates="choices")


class OnboardingFlowRule(Base):
    __tablename__ = "onboarding_flow_rules"
    __table_args__ = (UniqueConstraint("from_question_id", "choice_id", name="uq_flow_from_choice"),)

    id: Mapped[UUID] = uuid_pk()
    from_question_id: Mapped[UUID] = mapped_column(
        ForeignKey("onboarding_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    choice_id: Mapped[UUID] = mapped_column(ForeignKey("onboarding_choices.id", ondelete="CASCADE"), nullable=False)
    to_question_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("onboarding_questions.id", ondelete="SET NULL"))


class OnboardingResponse(Base):
    __tablename__ = "onboarding_responses"
    __table_args__ = (Index("ix_onboarding_responses_user_time", "user_id", "submitted_at"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


# ---------- AI-Generated Learning Pathways ----------

PathwayStatusEnum = Enum("active", "superseded", "archived", name="pathway_status")


class LearningPathway(Base):
    __tablename__ = "learning_pathways"
    __table_args__ = (Index("ix_pathways_user_time", "user_id", "created_at"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(PathwayStatusEnum, nullable=False, default="active")
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="ai")
    rationale: Mapped[Optional[str]] = mapped_column(Text)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = ts_created()

    items: Mapped[list["LearningPathwayItem"]] = relationship(
        back_populates="pathway",
        cascade="all, delete-orphan",
    )


class LearningPathwayItem(Base):
    __tablename__ = "learning_pathway_items"
    __table_args__ = (Index("ix_pathway_items_pathway_order", "pathway_id", "order_index"),)

    id: Mapped[UUID] = uuid_pk()
    pathway_id: Mapped[UUID] = mapped_column(ForeignKey("learning_pathways.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id: Mapped[UUID] = mapped_column(ForeignKey("modules.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    pathway: Mapped["LearningPathway"] = relationship(back_populates="items")


# ---------- Adaptive AI Suggestions ----------

SuggestionStatusEnum = Enum("shown", "clicked", "dismissed", "completed", name="suggestion_status")


class Suggestion(Base):
    __tablename__ = "suggestions"
    __table_args__ = (Index("ix_suggestions_user_time", "user_id", "created_at"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[Optional[Numeric]] = mapped_column(Numeric(5, 2))
    module_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("modules.id", ondelete="SET NULL"), index=True)
    status: Mapped[str] = mapped_column(SuggestionStatusEnum, nullable=False, default="shown")
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()
    deleted_at: Mapped[Optional[datetime]] = ts_soft_delete()

    user: Mapped["User"] = relationship(back_populates="suggestions")


# ---------- Gamification ----------


class DailyLearningLog(Base):
    __tablename__ = "daily_learning_log"
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_daily_learning_user_day"),)

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    day: Mapped[date] = mapped_column(Date, nullable=False)
    completed_modules: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_incremented: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    congrats_shown: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = ts_created()
    updated_at: Mapped[datetime] = ts_updated()

