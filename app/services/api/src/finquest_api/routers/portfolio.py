"""
Portfolio API endpoints
"""
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session

from ..auth_utils import get_current_user
from ..db.models import User, PortfolioValuationSnapshot
from ..db.session import get_session
from ..schemas import (
    PostPositionRequest,
    PostPositionResponse,
    PortfolioHoldingsResponse,
    SnapshotsResponse,
    SnapshotPoint,
)
from ..services.portfolio import (
    create_position_from_avg_cost,
    get_portfolio_view,
    get_or_create_portfolio,
)
from ..jobs.snapshots import snapshot_user_portfolio, snapshot_user_portfolio_range, ensure_snapshots_for_range

router = APIRouter()


@router.post("/portfolio/positions", response_model=PostPositionResponse, status_code=status.HTTP_201_CREATED)
async def add_position(
    request: PostPositionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Add a position to the portfolio by creating a BUY transaction.
    """
    try:
        # Validate inputs
        if request.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be positive"
            )
        if request.avgCost <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Average cost must be positive"
            )
        
        # Create position
        transaction_ids = create_position_from_avg_cost(
            db=db,
            user=user,
            symbol=request.symbol,
            qty=request.quantity,
            avg_cost=request.avgCost,
            executed_at=request.executedAt,
        )
        
        # Get portfolio
        portfolio = get_or_create_portfolio(db, user)
        
        return PostPositionResponse(
            status="ok",
            portfolioId=str(portfolio.id),
            transactionIds=[str(tx_id) for tx_id in transaction_ids],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add position: {str(e)}"
        )


@router.get("/portfolio", response_model=PortfolioHoldingsResponse)
async def get_portfolio(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Get portfolio holdings and analytics.
    """
    try:
        return get_portfolio_view(db, user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get portfolio: {str(e)}"
        )


@router.get("/portfolio/snapshots", response_model=SnapshotsResponse)
async def get_snapshots(
    from_date: Optional[date] = Query(None, alias="from", description="Start date (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, alias="to", description="End date (YYYY-MM-DD)"),
    granularity: Optional[str] = Query(None, description="Time granularity: 'hourly', '6hourly', 'daily', 'weekly'"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Get portfolio valuation snapshots for a date range.
    Defaults to last 90 days if no dates provided.
    Granularity filters snapshots to specific time intervals:
    - 'hourly': Every hour (for 1d view)
    - '6hourly': Every 6 hours (for 1w view)
    - 'daily': Every day (for 1m, ytd views)
    - 'weekly': Every week (for 1y view)
    """
    try:
        portfolio = get_or_create_portfolio(db, user)
        
        # Set default date range (last 90 days)
        if to_date is None:
            to_date = date.today()
        if from_date is None:
            from_date = to_date - timedelta(days=90)
        
        # Get snapshots (convert dates to datetime for comparison)
        from datetime import time as dt_time, timezone
        from_start = datetime.combine(from_date, dt_time.min).replace(tzinfo=timezone.utc)
        # Use end of day to include all snapshots created during to_date
        to_end = datetime.combine(to_date, dt_time.max).replace(tzinfo=timezone.utc)
        
        # Ensure snapshots exist for the requested range and granularity
        if granularity:
            ensure_snapshots_for_range(
                db=db,
                user=user,
                portfolio_id=portfolio.id,
                from_time=from_start,
                to_time=to_end,
                granularity=granularity
            )
        
        snapshots = db.query(PortfolioValuationSnapshot).filter(
            PortfolioValuationSnapshot.portfolio_id == portfolio.id,
            PortfolioValuationSnapshot.as_of >= from_start,
            PortfolioValuationSnapshot.as_of <= to_end,
        ).order_by(PortfolioValuationSnapshot.as_of).all()
        
        # Filter by granularity if specified
        if granularity and snapshots:
            filtered_snapshots = []
            last_included_time = None
            
            for snapshot in snapshots:
                snapshot_time = snapshot.as_of
                should_include = False
                
                if granularity == 'hourly':
                    # Include if it's on the hour (minute == 0) or if it's the first snapshot
                    # For hourly, we want snapshots at hour boundaries
                    if last_included_time is None:
                        should_include = True
                    else:
                        # Include if at least 1 hour has passed
                        time_diff = (snapshot_time - last_included_time).total_seconds()
                        if time_diff >= 3600:  # 1 hour in seconds
                            should_include = True
                
                elif granularity == '6hourly':
                    # Include if at least 6 hours have passed
                    if last_included_time is None:
                        should_include = True
                    else:
                        time_diff = (snapshot_time - last_included_time).total_seconds()
                        if time_diff >= 21600:  # 6 hours in seconds
                            should_include = True
                
                elif granularity == 'daily':
                    # Include if it's a different day
                    if last_included_time is None:
                        should_include = True
                    else:
                        if snapshot_time.date() != last_included_time.date():
                            should_include = True
                
                elif granularity == 'weekly':
                    # Include if at least 7 days have passed
                    if last_included_time is None:
                        should_include = True
                    else:
                        time_diff = (snapshot_time - last_included_time).total_seconds()
                        if time_diff >= 604800:  # 7 days in seconds
                            should_include = True
                
                if should_include:
                    filtered_snapshots.append(snapshot)
                    last_included_time = snapshot_time
            
            snapshots = filtered_snapshots
        
        # Convert to response format
        series = [
            SnapshotPoint(
                asOf=snapshot.as_of,
                totalValue=snapshot.total_value,
            )
            for snapshot in snapshots
        ]
        
        return SnapshotsResponse(
            baseCurrency=user.base_currency,
            series=series,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get snapshots: {str(e)}"
        )


@router.post("/portfolio/snapshots/generate", status_code=status.HTTP_201_CREATED)
async def generate_snapshot(
    from_date: Optional[date] = Query(None, alias="from", description="Start date (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, alias="to", description="End date (YYYY-MM-DD)"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Generate portfolio valuation snapshots for the current user.
    If from_date and to_date are provided, generates snapshots for each day in the range.
    If not provided, generates a single snapshot for today.
    """
    try:
        if from_date and to_date:
            if from_date > to_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be before or equal to end date"
                )
            # Limit range to prevent excessive generation
            days_diff = (to_date - from_date).days
            if days_diff > 365:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Date range cannot exceed 365 days"
                )
            count = snapshot_user_portfolio_range(user.id, from_date, to_date)
            return {
                "status": "ok",
                "message": f"Generated {count} snapshots successfully",
                "count": count
            }
        else:
            # Single snapshot for current time (not end of day)
            # This allows generating multiple snapshots throughout the day
            from datetime import timezone as tz
            current_time = datetime.now(tz.utc)
            snapshot_user_portfolio(user.id, current_time)
            return {"status": "ok", "message": "Snapshot generated successfully", "count": 1}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate snapshot: {str(e)}"
        )

