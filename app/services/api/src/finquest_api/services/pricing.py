"""
Pricing service for instrument prices
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

import yfinance as yf
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import Instrument, InstrumentPriceLatest, InstrumentPriceEOD


@dataclass
class PriceRecord:
    """Price record for an instrument"""
    price: Decimal
    ts: datetime
    day_change_abs: Optional[Decimal] = None
    day_change_pct: Optional[Decimal] = None


def get_latest_price(db: Session, instrument_id: UUID) -> Optional[PriceRecord]:
    """Get latest price for an instrument from database or yfinance"""
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        return None
    
    # Try database first
    latest_price = db.query(InstrumentPriceLatest).filter(
        InstrumentPriceLatest.instrument_id == instrument_id
    ).first()
    
    if latest_price:
        # Check if it's recent (within last hour)
        if (datetime.now(latest_price.ts.tzinfo) - latest_price.ts) < timedelta(hours=1):
            return PriceRecord(
                price=latest_price.price,
                ts=latest_price.ts,
                day_change_abs=latest_price.day_change_abs,
                day_change_pct=latest_price.day_change_pct,
            )
    
    # Fetch from yfinance
    try:
        ticker = yf.Ticker(instrument.symbol)
        hist = ticker.history(period="1d", interval="1m")
        
        if hist.empty:
            # Fallback to yesterday's EOD
            return get_prev_close(db, instrument_id)
        
        # Get latest price
        latest = hist.iloc[-1]
        price = Decimal(str(latest["Close"]))
        ts = datetime.now(timezone.utc)
        
        # Calculate day change if we have enough data
        day_change_abs = None
        day_change_pct = None
        if len(hist) > 1:
            prev_close = hist.iloc[0]["Close"]
            day_change_abs = Decimal(str(latest["Close"] - prev_close))
            if prev_close > 0:
                day_change_pct = Decimal(str((latest["Close"] - prev_close) / prev_close * 100))
        
        # Update database
        if latest_price:
            latest_price.price = price
            latest_price.ts = ts
            latest_price.day_change_abs = day_change_abs
            latest_price.day_change_pct = day_change_pct
        else:
            latest_price = InstrumentPriceLatest(
                instrument_id=instrument_id,
                price=price,
                ts=ts,
                day_change_abs=day_change_abs,
                day_change_pct=day_change_pct,
            )
            db.add(latest_price)
        
        db.commit()
        
        return PriceRecord(
            price=price,
            ts=ts,
            day_change_abs=day_change_abs,
            day_change_pct=day_change_pct,
        )
    except Exception:
        # Fallback to EOD
        return get_prev_close(db, instrument_id)


def get_latest_prices(db: Session, instrument_ids: list[UUID]) -> dict[UUID, Optional[PriceRecord]]:
    """Get latest prices for multiple instruments"""
    result = {}
    for instrument_id in instrument_ids:
        result[instrument_id] = get_latest_price(db, instrument_id)
    return result


def get_prev_close(db: Session, instrument_id: UUID) -> Optional[PriceRecord]:
    """Get previous close price (yesterday's EOD)"""
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        return None
    
    # Try database first
    yesterday = date.today() - timedelta(days=1)
    eod_price = db.query(InstrumentPriceEOD).filter(
        InstrumentPriceEOD.instrument_id == instrument_id,
        InstrumentPriceEOD.price_date == yesterday
    ).first()
    
    if eod_price:
        return PriceRecord(
            price=eod_price.close,
            ts=datetime.combine(yesterday, datetime.min.time()),
            day_change_abs=None,
            day_change_pct=None,
        )
    
    # Fetch from yfinance
    try:
        ticker = yf.Ticker(instrument.symbol)
        hist = ticker.history(period="5d")
        
        if hist.empty:
            return None
        
        # Get yesterday's close
        latest_date = hist.index[-1].date()
        if latest_date == date.today():
            # Today's data available, use previous day
            if len(hist) > 1:
                prev_close = hist.iloc[-2]["Close"]
                prev_date = hist.index[-2].date()
            else:
                return None
        else:
            prev_close = hist.iloc[-1]["Close"]
            prev_date = latest_date
        
        price = Decimal(str(prev_close))
        
        # Store in database
        eod_price = InstrumentPriceEOD(
            instrument_id=instrument_id,
            price_date=prev_date,
            close=price,
        )
        db.add(eod_price)
        db.commit()
        
        return PriceRecord(
            price=price,
            ts=datetime.combine(prev_date, datetime.min.time()),
            day_change_abs=None,
            day_change_pct=None,
        )
    except Exception:
        return None


def backfill_eod(db: Session, instrument_id: UUID, start: date, end: date) -> None:
    """Backfill end-of-day prices for an instrument"""
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        return
    
    try:
        ticker = yf.Ticker(instrument.symbol)
        
        # Calculate period
        days = (end - start).days + 1
        if days <= 5:
            period = "5d"
        elif days <= 30:
            period = "1mo"
        elif days <= 90:
            period = "3mo"
        else:
            period = "1y"
        
        hist = ticker.history(period=period, start=start, end=end)
        
        if hist.empty:
            return
        
        # Store prices in database
        for idx, row in hist.iterrows():
            price_date = idx.date()
            if start <= price_date <= end:
                # Check if already exists
                existing = db.query(InstrumentPriceEOD).filter(
                    InstrumentPriceEOD.instrument_id == instrument_id,
                    InstrumentPriceEOD.price_date == price_date
                ).first()
                
                if not existing:
                    eod_price = InstrumentPriceEOD(
                        instrument_id=instrument_id,
                        price_date=price_date,
                        open=Decimal(str(row["Open"])) if not row.isna()["Open"] else None,
                        high=Decimal(str(row["High"])) if not row.isna()["High"] else None,
                        low=Decimal(str(row["Low"])) if not row.isna()["Low"] else None,
                        close=Decimal(str(row["Close"])),
                        volume=Decimal(str(int(row["Volume"]))) if not row.isna()["Volume"] else None,
                    )
                    db.add(eod_price)
        
        db.commit()
    except Exception:
        db.rollback()
        raise

