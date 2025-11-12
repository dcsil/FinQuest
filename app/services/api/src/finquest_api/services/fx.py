"""
FX rate service for currency conversion
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import FxRateSnapshot
from .instruments import get_provider


def fx_now(db: Session, quote: str, base: str) -> Optional[Decimal]:
    """
    Get current FX rate from quote to base currency.
    Returns None if rate is not available.
    """
    if quote == base:
        return Decimal("1.0")
    
    # Try to get latest from database
    fx_snapshot = db.query(FxRateSnapshot).filter(
        FxRateSnapshot.base_ccy == base.upper(),
        FxRateSnapshot.quote_ccy == quote.upper()
    ).order_by(desc(FxRateSnapshot.as_of)).first()
    
    if fx_snapshot:
        # Check if it's recent (within last 24 hours)
        now = datetime.now(timezone.utc)
        if fx_snapshot.as_of.tzinfo:
            if (now - fx_snapshot.as_of) < timedelta(hours=24):
                return fx_snapshot.rate
        else:
            # Handle timezone-naive datetimes (legacy data)
            fx_snapshot_aware = fx_snapshot.as_of.replace(tzinfo=timezone.utc)
            if (now - fx_snapshot_aware) < timedelta(hours=24):
                return fx_snapshot.rate
    
    # Fallback to provider
    provider = get_provider()
    now = datetime.now(timezone.utc)
    rate = provider.get_fx_rate(base, quote, now)
    
    if rate:
        # Store in database for future use
        fx_snapshot = FxRateSnapshot(
            base_ccy=base.upper(),
            quote_ccy=quote.upper(),
            as_of=now,
            rate=rate
        )
        db.add(fx_snapshot)
        db.commit()
    
    return rate


def fx_at(db: Session, quote: str, base: str, when: datetime) -> Optional[Decimal]:
    """
    Get FX rate from quote to base currency at a specific time.
    Returns the nearest available rate (before or at 'when').
    """
    if quote == base:
        return Decimal("1.0")
    
    # Try to get from database (nearest to 'when')
    fx_snapshot = db.query(FxRateSnapshot).filter(
        FxRateSnapshot.base_ccy == base.upper(),
        FxRateSnapshot.quote_ccy == quote.upper(),
        FxRateSnapshot.as_of <= when
    ).order_by(desc(FxRateSnapshot.as_of)).first()
    
    if fx_snapshot:
        # If snapshot is within 24 hours of 'when', use it
        if (when - fx_snapshot.as_of) < timedelta(hours=24):
            return fx_snapshot.rate
    
    # Fallback to provider (for current rates)
    # For historical rates, we'd need a proper FX data provider
    provider = get_provider()
    rate = provider.get_fx_rate(base, quote, when)
    
    if rate:
        # Store in database
        fx_snapshot = FxRateSnapshot(
            base_ccy=base.upper(),
            quote_ccy=quote.upper(),
            as_of=when,
            rate=rate
        )
        db.add(fx_snapshot)
        db.commit()
    
    return rate


def convert_to_base(
    db: Session,
    amount: Decimal,
    from_currency: str,
    to_currency: str,
    as_of: Optional[datetime] = None
) -> Optional[Decimal]:
    """
    Convert an amount from one currency to another.
    Returns None if FX rate is not available.
    """
    if from_currency == to_currency:
        return amount
    
    if as_of:
        rate = fx_at(db, from_currency, to_currency, as_of)
    else:
        rate = fx_now(db, from_currency, to_currency)
    
    if rate is None:
        return None
    
    return amount * rate

