"""
Portfolio snapshot job for daily valuation snapshots
"""
from __future__ import annotations

from datetime import datetime, date, time, timedelta, timezone
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
import pytz
import yfinance as yf

from sqlalchemy.orm import Session

from ..db.models import User, Portfolio, PortfolioValuationSnapshot, Instrument, Transaction
from ..db.session import session_scope
from ..services.portfolio import get_portfolio_view, get_or_create_portfolio, _compute_positions
from ..services.pricing import get_latest_price, get_prev_close, backfill_eod, PriceRecord
from ..services.fx import fx_at


def snapshot_portfolio(db: Session, portfolio_id: UUID, as_of: Optional[datetime] = None) -> None:
    """
    Create a portfolio valuation snapshot at a given time.
    If as_of is None, uses end of day for the user's timezone.
    """
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")
    
    user = db.query(User).filter(User.id == portfolio.user_id).first()
    if not user:
        raise ValueError(f"User for portfolio {portfolio_id} not found")
    
    # Track if this is an EOD snapshot (as_of was None)
    is_eod_snapshot = (as_of is None)
    
    # Set as_of to end of day in user's timezone if not provided
    if as_of is None:
        user_tz = pytz.timezone(user.timezone)
        today = date.today()
        # End of day: 00:15 next day (as per spec)
        eod_time = time(0, 15)  # 00:15
        as_of = user_tz.localize(datetime.combine(today, eod_time))
        # Convert to UTC for storage
        as_of = as_of.astimezone(pytz.UTC)
    else:
        # Ensure as_of is timezone-aware
        if as_of.tzinfo is None:
            user_tz = pytz.timezone(user.timezone)
            as_of = user_tz.localize(as_of)
            as_of = as_of.astimezone(pytz.UTC)
    
    # Check if snapshot already exists for this portfolio and time
    if is_eod_snapshot:
        # For EOD snapshots, check exact match (same day's EOD)
        existing = db.query(PortfolioValuationSnapshot).filter(
            PortfolioValuationSnapshot.portfolio_id == portfolio_id,
            PortfolioValuationSnapshot.as_of == as_of
        ).first()
        
        if existing:
            # EOD snapshot already exists for today, skip
            return
    else:
        # For manual snapshots, check if one exists within 1 minute (to avoid rapid duplicates)
        time_window_start = as_of - timedelta(minutes=1)
        time_window_end = as_of + timedelta(minutes=1)
        existing = db.query(PortfolioValuationSnapshot).filter(
            PortfolioValuationSnapshot.portfolio_id == portfolio_id,
            PortfolioValuationSnapshot.as_of >= time_window_start,
            PortfolioValuationSnapshot.as_of <= time_window_end,
        ).first()
        
        if existing:
            # Snapshot already exists within 1 minute, skip to avoid duplicates
            return
    
    # Get portfolio view (this uses current prices, which is fine for EOD)
    # For EOD snapshots, we should use EOD prices instead of latest prices
    portfolio_view = get_portfolio_view(db, user)
    
    # Create snapshot
    snapshot = PortfolioValuationSnapshot(
        portfolio_id=portfolio_id,
        as_of=as_of,
        total_value=portfolio_view.totals.totalValue,
        total_cost_basis=portfolio_view.totals.totalCostBasis,
        unrealized_pl=portfolio_view.totals.unrealizedPL,
        daily_pl=portfolio_view.totals.dailyPL,
        allocation_by_type=portfolio_view.allocationByType,
        allocation_by_sector=portfolio_view.allocationBySector,
        top_movers=[
            {
                "symbol": m.symbol,
                "pct": float(m.pct),
                "abs": float(m.abs),
            }
            for m in portfolio_view.bestMovers + portfolio_view.worstMovers
        ],
    )
    
    db.add(snapshot)
    db.commit()


def snapshot_all_portfolios(as_of: Optional[datetime] = None) -> None:
    """
    Create snapshots for all active portfolios.
    This is the main function to be called by a scheduler.
    """
    with session_scope() as db:
        # Get all active portfolios
        portfolios = db.query(Portfolio).filter(
            Portfolio.deleted_at.is_(None)
        ).all()
        
        for portfolio in portfolios:
            try:
                snapshot_portfolio(db, portfolio.id, as_of)
            except Exception as e:
                # Log error but continue with other portfolios
                print(f"Error creating snapshot for portfolio {portfolio.id}: {e}")
                db.rollback()


def snapshot_user_portfolio(user_id: UUID, as_of: Optional[datetime] = None) -> None:
    """
    Create snapshot for a specific user's portfolio.
    """
    with session_scope() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        portfolio = get_or_create_portfolio(db, user)
        snapshot_portfolio(db, portfolio.id, as_of)


def snapshot_user_portfolio_range(user_id: UUID, start_date: date, end_date: date) -> int:
    """
    Create snapshots for a specific user's portfolio over a date range.
    Generates one snapshot per day in the range.
    Returns the number of snapshots created.
    """
    with session_scope() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        portfolio = get_or_create_portfolio(db, user)
        user_tz = pytz.timezone(user.timezone)
        
        count = 0
        current_date = start_date
        
        while current_date <= end_date:
            # Create snapshot for this date at 00:15 in user's timezone
            eod_time = time(0, 15)
            as_of = user_tz.localize(datetime.combine(current_date, eod_time))
            as_of = as_of.astimezone(pytz.UTC)
            
            try:
                snapshot_portfolio(db, portfolio.id, as_of)
                count += 1
            except Exception as e:
                # Log error but continue with other dates
                print(f"Error creating snapshot for {current_date}: {e}")
                db.rollback()
            
            current_date += timedelta(days=1)
        
        return count


def calculate_required_time_slots(
    from_time: datetime,
    to_time: datetime,
    granularity: str
) -> List[datetime]:
    """
    Calculate required time slots based on granularity.
    Returns list of datetime objects for each required snapshot (in UTC).
    """
    # Ensure timezone-aware
    if from_time.tzinfo is None:
        from_time = from_time.replace(tzinfo=timezone.utc)
    if to_time.tzinfo is None:
        to_time = to_time.replace(tzinfo=timezone.utc)
    
    slots = []
    current = from_time
    
    if granularity == 'hourly':
        # Round down to the hour
        current = current.replace(minute=0, second=0, microsecond=0)
        while current <= to_time:
            slots.append(current)
            current += timedelta(hours=1)
    
    elif granularity == '6hourly':
        # Round down to the nearest 6-hour mark (0, 6, 12, 18)
        hour = (current.hour // 6) * 6
        current = current.replace(hour=hour, minute=0, second=0, microsecond=0)
        while current <= to_time:
            slots.append(current)
            current += timedelta(hours=6)
    
    elif granularity == 'daily':
        # Round down to start of day
        current = current.replace(hour=0, minute=0, second=0, microsecond=0)
        while current <= to_time:
            slots.append(current)
            current += timedelta(days=1)
    
    elif granularity == 'weekly':
        # Round down to start of week (Monday)
        days_since_monday = current.weekday()
        current = current.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)
        while current <= to_time:
            slots.append(current)
            current += timedelta(weeks=1)
    
    return slots


def get_historical_price(
    db: Session,
    instrument_id: UUID,
    as_of: datetime,
    fallback_to_latest: bool = True
) -> Optional[PriceRecord]:
    """
    Get historical price for an instrument at a specific time.
    Uses yfinance to fetch historical data.
    If fallback_to_latest is True, falls back to latest price if historical data unavailable.
    """
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        return None
    
    # Ensure as_of is timezone-aware (UTC)
    if as_of.tzinfo is None:
        as_of_utc = as_of.replace(tzinfo=timezone.utc)
    else:
        as_of_utc = as_of.astimezone(timezone.utc)
    
    try:
        ticker = yf.Ticker(instrument.symbol)
        now = datetime.now(timezone.utc)
        time_diff = now - as_of_utc
        
        # For very recent times (within last few hours), try intraday data first
        if time_diff < timedelta(hours=6):
            try:
                hist = ticker.history(period="1d", interval="1m")
                if not hist.empty and len(hist) > 0:
                    # Get the latest available price (yfinance intraday may not have data for all times)
                    # Use the most recent price before or at as_of
                    as_of_naive = as_of_utc.replace(tzinfo=None)
                    hist_times = hist.index
                    
                    # Find the closest time before or at as_of
                    closest_idx = None
                    for i, hist_time in enumerate(hist_times):
                        if hist_time <= as_of_naive:
                            closest_idx = i
                        else:
                            break
                    
                    # If no price before as_of, use the first available price
                    if closest_idx is None and len(hist) > 0:
                        closest_idx = 0
                    
                    if closest_idx is not None:
                        price = Decimal(str(hist.iloc[closest_idx]["Close"]))
                        hist_time_utc = hist_times[closest_idx]
                        if isinstance(hist_time_utc, datetime):
                            hist_time_utc = hist_time_utc.replace(tzinfo=timezone.utc)
                        else:
                            hist_time_utc = datetime.fromtimestamp(hist_time_utc.timestamp(), tz=timezone.utc)
                        
                        return PriceRecord(
                            price=price,
                            ts=hist_time_utc,
                            day_change_abs=None,
                            day_change_pct=None,
                        )
            except Exception as e:
                # If intraday fails, fall through to daily data
                print(f"Warning: Failed to get intraday data for {instrument.symbol} at {as_of_utc}: {e}")
        
        # For older data or if intraday fails, use daily data
        target_date = as_of_utc.date()
        # Fetch more data to ensure we get something (go back further to handle weekends/holidays)
        start_date = target_date - timedelta(days=60)
        end_date = target_date + timedelta(days=2)  # Include next day to handle timezone differences
        
        try:
            hist = ticker.history(start=start_date, end=end_date, interval="1d")
            if not hist.empty and len(hist) > 0:
                # Find the closest date to as_of (on or before target_date)
                # This handles weekends/holidays by using the last available trading day
                closest_date = None
                closest_price = None
                
                # Iterate through all rows to find the closest date <= target_date
                for idx, row in hist.iterrows():
                    hist_date = idx.date()
                    if hist_date <= target_date:
                        # Update to the most recent date <= target_date
                        if closest_date is None or hist_date > closest_date:
                            closest_date = hist_date
                            closest_price = row["Close"]
                
                # If no price on or before target_date, use the most recent available
                if closest_price is None and len(hist) > 0:
                    # Use the most recent price available (even if it's after target_date)
                    closest_date = hist.index[-1].date()
                    closest_price = hist.iloc[-1]["Close"]
                    print(f"Warning: Using future price for {instrument.symbol} at {target_date} (closest: {closest_date})")
                
                if closest_price is not None:
                    try:
                        # Check if price is valid (not NaN)
                        price_float = float(closest_price)
                        if price_float > 0:  # Valid price should be positive
                            price = Decimal(str(price_float))
                            return PriceRecord(
                                price=price,
                                ts=datetime.combine(closest_date, time.min).replace(tzinfo=timezone.utc),
                                day_change_abs=None,
                                day_change_pct=None,
                            )
                    except (ValueError, TypeError) as e:
                        print(f"Warning: Invalid price for {instrument.symbol} on {closest_date}: {e}")
        except Exception as e:
            print(f"Warning: Failed to get daily data for {instrument.symbol} at {as_of_utc}: {e}")
            import traceback
            traceback.print_exc()
        
        # Fallback to latest price if historical data unavailable
        if fallback_to_latest:
            try:
                latest_price_record = get_latest_price(db, instrument_id)
                if latest_price_record and latest_price_record.price:
                    return latest_price_record
            except Exception as e:
                print(f"Warning: Failed to get latest price for {instrument.symbol}: {e}")
        
        return None
    except Exception as e:
        print(f"Error getting historical price for {instrument.symbol} at {as_of_utc}: {e}")
        # Try fallback to latest price
        if fallback_to_latest:
            try:
                return get_latest_price(db, instrument_id)
            except Exception:
                return None
        return None


def calculate_portfolio_value_at_time(
    db: Session,
    user: User,
    portfolio_id: UUID,
    as_of: datetime
) -> Decimal:
    """
    Calculate portfolio total value at a specific historical time.
    Uses historical prices and FX rates.
    """
    # Ensure as_of is timezone-aware for comparison
    if as_of.tzinfo is None:
        as_of_aware = as_of.replace(tzinfo=timezone.utc)
    else:
        as_of_aware = as_of
    
    # Compute positions as of as_of (only transactions before or at as_of)
    # Note: SQLAlchemy handles timezone-aware datetime comparisons correctly
    transactions = db.query(Transaction).filter(
        Transaction.portfolio_id == portfolio_id,
        Transaction.deleted_at.is_(None),
        Transaction.executed_at <= as_of_aware
    ).order_by(Transaction.executed_at).all()
    
    if not transactions:
        print(f"Warning: No transactions found for portfolio {portfolio_id} before {as_of_aware}")
        return Decimal("0")
    
    print(f"Calculating portfolio value at {as_of_aware} with {len(transactions)} transactions")
    
    # Compute positions using average cost method
    positions: dict[UUID, Decimal] = {}  # instrument_id -> quantity
    avg_costs: dict[UUID, Decimal] = {}  # instrument_id -> avg_cost
    
    for tx in transactions:
        instrument_id = tx.instrument_id
        if instrument_id not in positions:
            positions[instrument_id] = Decimal("0")
            avg_costs[instrument_id] = Decimal("0")
        
        if tx.side == "buy":
            old_qty = positions[instrument_id]
            old_avg_cost = avg_costs[instrument_id] if old_qty > 0 else Decimal("0")
            buy_qty = tx.quantity
            buy_price = tx.price
            
            new_qty = old_qty + buy_qty
            if new_qty > 0:
                new_avg_cost = (old_qty * old_avg_cost + buy_qty * buy_price) / new_qty
            else:
                new_avg_cost = Decimal("0")
            
            positions[instrument_id] = new_qty
            avg_costs[instrument_id] = new_avg_cost
        
        elif tx.side == "sell":
            positions[instrument_id] -= tx.quantity
            if positions[instrument_id] < 0:
                positions[instrument_id] = Decimal("0")
    
    # Remove zero positions
    positions = {k: v for k, v in positions.items() if v > 0}
    
    if not positions:
        return Decimal("0")
    
    # Get instruments
    instrument_ids = list(positions.keys())
    instruments = {
        inst.id: inst
        for inst in db.query(Instrument).filter(Instrument.id.in_(instrument_ids)).all()
    }
    
    # Calculate total value using historical prices
    total_value = Decimal("0")
    
    for instrument_id, quantity in positions.items():
        instrument = instruments.get(instrument_id)
        if not instrument:
            print(f"Warning: Instrument {instrument_id} not found")
            continue
        
        # Get historical price (with fallback to latest)
        price_record = get_historical_price(db, instrument_id, as_of, fallback_to_latest=True)
        if not price_record or not price_record.price:
            print(f"Warning: No price found for {instrument.symbol} at {as_of}")
            continue
        
        # Get historical FX rate (with fallback to current rate)
        fx_rate = fx_at(db, instrument.currency, user.base_currency, as_of)
        if not fx_rate:
            # Fallback to current FX rate if historical not available
            from ..services.fx import fx_now
            fx_rate = fx_now(db, instrument.currency, user.base_currency)
            if not fx_rate:
                print(f"Warning: No FX rate found for {instrument.currency} to {user.base_currency}")
                continue
        
        # Calculate value in base currency
        value_in_trade_ccy = quantity * price_record.price
        value_base = value_in_trade_ccy * fx_rate
        total_value += value_base
        print(f"  {instrument.symbol}: {quantity} @ {price_record.price} {instrument.currency} * {fx_rate} = {value_base} {user.base_currency}")
    
    print(f"Total portfolio value at {as_of}: {total_value} {user.base_currency}")
    return total_value


def ensure_snapshots_for_range(
    db: Session,
    user: User,
    portfolio_id: UUID,
    from_time: datetime,
    to_time: datetime,
    granularity: str
) -> int:
    """
    Ensure snapshots exist for all required time slots in the range.
    Generates missing snapshots using historical data.
    Returns the number of new snapshots created.
    """
    # Calculate required time slots
    required_slots = calculate_required_time_slots(from_time, to_time, granularity)
    
    if not required_slots:
        return 0
    
    # Get existing snapshots in the range
    existing_snapshots = db.query(PortfolioValuationSnapshot).filter(
        PortfolioValuationSnapshot.portfolio_id == portfolio_id,
        PortfolioValuationSnapshot.as_of >= from_time,
        PortfolioValuationSnapshot.as_of <= to_time,
    ).all()
    
    existing_times = {snapshot.as_of for snapshot in existing_snapshots}
    
    # Find missing slots (within a small tolerance for time matching)
    missing_slots = []
    for slot in required_slots:
        # Check if there's an existing snapshot within 1 minute of this slot
        found = False
        for existing_time in existing_times:
            time_diff = abs((slot - existing_time).total_seconds())
            if time_diff < 60:  # Within 1 minute
                found = True
                break
        if not found:
            missing_slots.append(slot)
    
    # Generate missing snapshots
    created_count = 0
    for slot in missing_slots:
        try:
            # Calculate portfolio value at this time
            total_value = calculate_portfolio_value_at_time(db, user, portfolio_id, slot)
            
            # Create snapshot
            snapshot = PortfolioValuationSnapshot(
                portfolio_id=portfolio_id,
                as_of=slot,
                total_value=total_value,
                total_cost_basis=Decimal("0"),  # Could calculate this too if needed
                unrealized_pl=Decimal("0"),
                daily_pl=None,
                allocation_by_type=None,
                allocation_by_sector=None,
                top_movers=None,
            )
            db.add(snapshot)
            created_count += 1
        except Exception as e:
            # Log error but continue
            print(f"Error creating snapshot for {slot}: {e}")
            db.rollback()
            continue
    
    if created_count > 0:
        db.commit()
    
    return created_count

