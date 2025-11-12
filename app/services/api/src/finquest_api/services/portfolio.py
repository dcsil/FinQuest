"""
Portfolio service for position management and analytics
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..db.models import (
    User, Portfolio, Instrument, Transaction, InstrumentPriceLatest, InstrumentPriceEOD
)
from ..schemas import (
    PortfolioHoldingsResponse, PositionInfo, PortfolioTotals, MoverInfo
)
from .instruments import ensure_instrument
from .pricing import get_latest_price, get_prev_close, get_latest_prices
from .fx import fx_now, fx_at, convert_to_base


@dataclass
class Position:
    """Derived position from transactions"""
    instrument_id: UUID
    quantity: Decimal
    avg_cost_trade_ccy: Decimal
    cost_basis_base: Decimal


def get_or_create_portfolio(db: Session, user: User) -> Portfolio:
    """Get or create a portfolio for a user"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user.id,
        Portfolio.deleted_at.is_(None)
    ).first()
    
    if not portfolio:
        portfolio = Portfolio(
            user_id=user.id,
            name="My Portfolio"
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    
    return portfolio


def create_position_from_avg_cost(
    db: Session,
    user: User,
    symbol: str,
    qty: Decimal,
    avg_cost: Decimal,
    executed_at: Optional[datetime] = None
) -> list[UUID]:
    """
    Create a BUY transaction from average cost input.
    Returns list of transaction IDs.
    """
    if qty <= 0 or avg_cost <= 0:
        raise ValueError("Quantity and average cost must be positive")
    
    # Resolve instrument
    instrument = ensure_instrument(db, symbol)
    
    # Get or create portfolio
    portfolio = get_or_create_portfolio(db, user)
    
    # Set executed_at to now if not provided
    if executed_at is None:
        from datetime import timezone
        executed_at = datetime.now(timezone.utc)
    elif executed_at.tzinfo is None:
        # Make timezone-aware if naive
        from datetime import timezone
        executed_at = executed_at.replace(tzinfo=timezone.utc)
    
    # Get FX rate if needed
    fx_rate = None
    if instrument.currency != user.base_currency:
        fx_rate = fx_at(db, instrument.currency, user.base_currency, executed_at)
    
    # Create BUY transaction
    transaction = Transaction(
        portfolio_id=portfolio.id,
        instrument_id=instrument.id,
        side="buy",
        quantity=qty,
        price=avg_cost,
        trade_currency=instrument.currency,
        executed_at=executed_at,
        fx_rate_to_user_base=fx_rate,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return [transaction.id]


def _compute_positions(db: Session, portfolio_id: UUID) -> dict[UUID, Position]:
    """
    Compute positions from transactions using average cost method.
    Returns dict mapping instrument_id to Position.
    """
    # Get all transactions for this portfolio
    transactions = db.query(Transaction).filter(
        Transaction.portfolio_id == portfolio_id,
        Transaction.deleted_at.is_(None)
    ).order_by(Transaction.executed_at).all()
    
    positions: dict[UUID, Position] = {}
    
    for tx in transactions:
        instrument_id = tx.instrument_id
        if instrument_id not in positions:
            positions[instrument_id] = Position(
                instrument_id=instrument_id,
                quantity=Decimal("0"),
                avg_cost_trade_ccy=Decimal("0"),
                cost_basis_base=Decimal("0"),
            )
        
        pos = positions[instrument_id]
        
        if tx.side == "buy":
            # Average cost method: new_avg_cost = (old_qty*old_avg_cost + buy_qty*buy_price) / (old_qty + buy_qty)
            old_qty = pos.quantity
            old_avg_cost = pos.avg_cost_trade_ccy if old_qty > 0 else Decimal("0")
            buy_qty = tx.quantity
            buy_price = tx.price
            
            new_qty = old_qty + buy_qty
            if new_qty > 0:
                new_avg_cost = (old_qty * old_avg_cost + buy_qty * buy_price) / new_qty
            else:
                new_avg_cost = Decimal("0")
            
            pos.quantity = new_qty
            pos.avg_cost_trade_ccy = new_avg_cost
            
            # Update cost basis in base currency
            if tx.fx_rate_to_user_base:
                cost_in_base = buy_qty * buy_price * tx.fx_rate_to_user_base
            else:
                # Fallback: use current FX rate (not ideal, but MVP)
                cost_in_base = None  # Will be handled in get_portfolio_view
            if cost_in_base:
                pos.cost_basis_base += cost_in_base
        
        elif tx.side == "sell":
            # Reduce quantity, keep avg cost unchanged
            pos.quantity -= tx.quantity
            if pos.quantity < 0:
                pos.quantity = Decimal("0")
    
    # Remove positions with zero quantity
    return {k: v for k, v in positions.items() if v.quantity > 0}




def get_portfolio_view(db: Session, user: User) -> PortfolioHoldingsResponse:
    """Get portfolio holdings and analytics"""
    portfolio = get_or_create_portfolio(db, user)
    
    # Compute positions from transactions
    positions_dict = _compute_positions(db, portfolio.id)
    
    if not positions_dict:
        # Empty portfolio
        return PortfolioHoldingsResponse(
            baseCurrency=user.base_currency,
            totals=PortfolioTotals(
                totalValue=Decimal("0"),
                totalCostBasis=Decimal("0"),
                unrealizedPL=Decimal("0"),
                dailyPL=Decimal("0"),
            ),
            positions=[],
            allocationByType={},
            allocationBySector={},
            bestMovers=[],
            worstMovers=[],
        )
    
    # Get instruments and prices
    instrument_ids = list(positions_dict.keys())
    instruments = {
        inst.id: inst
        for inst in db.query(Instrument).filter(Instrument.id.in_(instrument_ids)).all()
    }
    
    # Get latest prices
    latest_prices = get_latest_prices(db, instrument_ids)
    
    # Build position info list
    position_infos: list[PositionInfo] = []
    total_value = Decimal("0")
    total_cost_basis = Decimal("0")
    
    for instrument_id, position in positions_dict.items():
        instrument = instruments.get(instrument_id)
        if not instrument:
            continue
        
        price_record = latest_prices.get(instrument_id)
        market_price = price_record.price if price_record else None
        
        # Get FX rate for this instrument
        fx_rate = fx_now(db, instrument.currency, user.base_currency)
        
        # Compute cost basis in base currency using average cost method
        # For average cost: remaining_cost_basis = avg_cost * remaining_qty * fx
        if position.avg_cost_trade_ccy > 0 and fx_rate:
            remaining_cost_base = position.quantity * position.avg_cost_trade_ccy * fx_rate
            total_cost_basis += remaining_cost_base
            avg_cost_base = position.avg_cost_trade_ccy * fx_rate
        else:
            remaining_cost_base = Decimal("0")
            avg_cost_base = Decimal("0")
        
        # Convert to base currency for value
        value_base = None
        unrealized_pl = None
        daily_pl = None
        
        if market_price and fx_rate:
            # Convert market value to base currency
            value_in_trade_ccy = position.quantity * market_price
            value_base = value_in_trade_ccy * fx_rate
            total_value += value_base
            
            # Compute unrealized P/L
            unrealized_pl = value_base - remaining_cost_base
            
            # Compute daily P/L
            if price_record and price_record.day_change_abs:
                daily_pl_trade_ccy = position.quantity * price_record.day_change_abs
                daily_pl = daily_pl_trade_ccy * fx_rate
            elif price_record:
                # Fallback: compare to previous close
                prev_close_record = get_prev_close(db, instrument_id)
                if prev_close_record and prev_close_record.price:
                    prev_value_base = position.quantity * prev_close_record.price * fx_rate
                    daily_pl = value_base - prev_value_base
        
        position_info = PositionInfo(
            instrumentId=str(instrument_id),
            symbol=instrument.symbol,
            name=instrument.name,
            type=instrument.type,
            sector=instrument.sector,
            quantity=position.quantity,
            avgCostBase=avg_cost_base,
            marketPrice=market_price,
            valueBase=value_base,
            unrealizedPL=unrealized_pl,
            dailyPL=daily_pl,
            currency=instrument.currency,
        )
        position_infos.append(position_info)
    
    # Compute totals
    total_unrealized_pl = total_value - total_cost_basis
    total_daily_pl = sum(
        (pos.dailyPL if pos.dailyPL else Decimal("0"))
        for pos in position_infos
    )
    
    totals = PortfolioTotals(
        totalValue=total_value,
        totalCostBasis=total_cost_basis,
        unrealizedPL=total_unrealized_pl,
        dailyPL=total_daily_pl,
    )
    
    # Compute allocations
    allocation_by_type = _compute_allocation_by_type(position_infos, total_value)
    allocation_by_sector = _compute_allocation_by_sector(position_infos, total_value)
    
    # Compute best/worst movers
    best_movers, worst_movers = _compute_best_worst_movers(position_infos)
    
    return PortfolioHoldingsResponse(
        baseCurrency=user.base_currency,
        totals=totals,
        positions=position_infos,
        allocationByType=allocation_by_type,
        allocationBySector=allocation_by_sector,
        bestMovers=best_movers,
        worstMovers=worst_movers,
    )


def _compute_allocation_by_type(
    positions: list[PositionInfo],
    total_value: Decimal
) -> dict[str, float]:
    """Compute allocation by instrument type"""
    if total_value == 0:
        return {}
    
    allocation: dict[str, float] = {}
    for pos in positions:
        if pos.valueBase:
            allocation[pos.type] = allocation.get(pos.type, 0.0) + float(pos.valueBase)
    
    # Normalize to weights
    return {k: v / float(total_value) for k, v in allocation.items()}


def _compute_allocation_by_sector(
    positions: list[PositionInfo],
    total_value: Decimal
) -> dict[str, float]:
    """Compute allocation by sector (only for positions with sector data)"""
    if total_value == 0:
        return {}
    
    allocation: dict[str, float] = {}
    sector_total = Decimal("0")
    
    for pos in positions:
        if pos.sector and pos.valueBase:
            sector_value = float(pos.valueBase)
            allocation[pos.sector] = allocation.get(pos.sector, 0.0) + sector_value
            sector_total += pos.valueBase
    
    if sector_total == 0:
        return {}
    
    # Normalize to weights (only for positions with sector data)
    # Renormalize so weights sum to 1.0 within the sector subset
    return {k: v / float(sector_total) for k, v in allocation.items()}


def _compute_best_worst_movers(
    positions: list[PositionInfo]
) -> tuple[list[MoverInfo], list[MoverInfo]]:
    """Compute best and worst movers based on daily P/L (absolute value)"""
    movers = []
    
    for pos in positions:
        if pos.dailyPL is not None and pos.valueBase:
            pct = (pos.dailyPL / pos.valueBase * Decimal("100")) if pos.valueBase > 0 else Decimal("0")
            movers.append(MoverInfo(
                symbol=pos.symbol,
                pct=pct,
                abs=pos.dailyPL,
            ))
    
    if not movers:
        return [], []
    
    # Sort by absolute daily P/L (descending)
    movers.sort(key=lambda x: abs(x.abs), reverse=True)
    
    # Get top 3 best (positive) and worst (negative)
    best = [m for m in movers if m.abs > 0][:3]
    worst = [m for m in movers if m.abs < 0][:3]
    
    # Reverse worst so most negative is first
    worst.reverse()
    
    return best, worst

