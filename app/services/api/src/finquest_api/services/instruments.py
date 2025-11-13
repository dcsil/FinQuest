"""
Instrument provider service using yfinance
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Protocol
from uuid import UUID

import yfinance as yf
from sqlalchemy.orm import Session

from ..db.models import Instrument


@dataclass
class ResolvedInstrument:
    """Resolved instrument information"""
    type: str  # "equity" | "etf" | "crypto"
    symbol: str
    name: Optional[str]
    exchange_mic: Optional[str]
    currency: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None


@dataclass
class LatestPrice:
    """Latest price information"""
    price: Decimal
    ts: datetime
    day_change_abs: Optional[Decimal] = None
    day_change_pct: Optional[Decimal] = None


class InstrumentProvider(Protocol):
    """Protocol for instrument providers"""
    
    def resolve_symbol(self, raw: str) -> ResolvedInstrument:
        """Resolve a raw symbol string to instrument details"""
        ...
    
    def get_latest_price(self, instrument_id: UUID) -> LatestPrice:
        """Get latest price for an instrument"""
        ...
    
    def backfill_eod(self, instrument_id: UUID, start: date, end: date) -> None:
        """Backfill end-of-day prices for an instrument"""
        ...
    
    def get_fx_rate(self, base: str, quote: str, as_of: datetime) -> Optional[Decimal]:
        """Get FX rate from base to quote currency at a given time"""
        ...


class YFinanceProvider:
    """yfinance-based instrument provider"""
    
    # Mapping from country names to ISO 3166-1 alpha-2 codes
    COUNTRY_CODE_MAP = {
        "United States": "US",
        "United Kingdom": "GB",
        "Canada": "CA",
        "Australia": "AU",
        "Germany": "DE",
        "France": "FR",
        "Japan": "JP",
        "China": "CN",
        "India": "IN",
        "Brazil": "BR",
        "South Korea": "KR",
        "Switzerland": "CH",
        "Netherlands": "NL",
        "Italy": "IT",
        "Spain": "ES",
        "Sweden": "SE",
        "Norway": "NO",
        "Denmark": "DK",
        "Finland": "FI",
        "Belgium": "BE",
        "Austria": "AT",
        "Ireland": "IE",
        "Portugal": "PT",
        "Poland": "PL",
        "Greece": "GR",
        "Turkey": "TR",
        "Russia": "RU",
        "Mexico": "MX",
        "Argentina": "AR",
        "Chile": "CL",
        "Colombia": "CO",
        "Peru": "PE",
        "South Africa": "ZA",
        "Egypt": "EG",
        "Nigeria": "NG",
        "Kenya": "KE",
        "Israel": "IL",
        "Saudi Arabia": "SA",
        "United Arab Emirates": "AE",
        "Singapore": "SG",
        "Hong Kong": "HK",
        "Taiwan": "TW",
        "Thailand": "TH",
        "Malaysia": "MY",
        "Indonesia": "ID",
        "Philippines": "PH",
        "Vietnam": "VN",
        "New Zealand": "NZ",
    }
    
    def _determine_type(self, info: dict) -> str:
        """Determine instrument type from yfinance info"""
        quote_type = info.get("quoteType", "").lower()
        if quote_type == "cryptocurrency":
            return "crypto"
        elif quote_type in ["etf", "mutualfund"]:
            return "etf"
        else:
            return "equity"
    
    def _get_exchange_mic(self, exchange: Optional[str]) -> Optional[str]:
        """Convert exchange name to MIC code (simplified)"""
        if not exchange:
            return None
        # Common mappings (simplified - can be expanded)
        exchange_map = {
            "NASDAQ": "XNAS",
            "NYSE": "XNYS",
            "AMEX": "XASE",
            "TSX": "XTSE",
            "NEO": "XNEO",
            "NMS": "XNAS",  # NASDAQ Market System
        }
        return exchange_map.get(exchange.upper(), exchange.upper())
    
    def _get_country_code(self, country: Optional[str]) -> Optional[str]:
        """Convert country name to ISO 3166-1 alpha-2 code"""
        if not country:
            return None
        
        # Try exact match first
        country_code = self.COUNTRY_CODE_MAP.get(country)
        if country_code:
            return country_code
        
        # Try case-insensitive match
        for country_name, code in self.COUNTRY_CODE_MAP.items():
            if country_name.lower() == country.lower():
                return code
        
        # If already a 2-character code, return as-is (might be already correct)
        if len(country) == 2 and country.isalpha():
            return country.upper()
        
        # If we can't map it, return None (field is optional)
        return None
    
    def resolve_symbol(self, raw: str) -> ResolvedInstrument:
        """Resolve a raw symbol string to instrument details using yfinance"""
        try:
            ticker = yf.Ticker(raw.upper())
            info = ticker.info
            
            if not info or "symbol" not in info:
                raise ValueError(f"Symbol {raw} not found")
            
            instrument_type = self._determine_type(info)
            symbol = info.get("symbol", raw.upper())
            name = info.get("longName") or info.get("shortName")
            exchange = info.get("exchange")
            exchange_mic = self._get_exchange_mic(exchange)
            currency = info.get("currency", "USD").upper()
            sector = info.get("sector")
            industry = info.get("industry")
            country_name = info.get("country")
            country_code = self._get_country_code(country_name)
            
            return ResolvedInstrument(
                type=instrument_type,
                symbol=symbol,
                name=name,
                exchange_mic=exchange_mic,
                currency=currency,
                sector=sector,
                industry=industry,
                country=country_code,
            )
        except Exception as e:
            raise ValueError(f"Failed to resolve symbol {raw}: {str(e)}")
    
    def get_latest_price(self, instrument_id: UUID) -> LatestPrice:
        """Get latest price for an instrument"""
        # This will be implemented with database lookup
        # For now, we'll fetch from yfinance directly
        raise NotImplementedError("Use database lookup via pricing service")
    
    def backfill_eod(self, instrument_id: UUID, start: date, end: date) -> None:
        """Backfill end-of-day prices for an instrument"""
        # This will be implemented with database storage
        raise NotImplementedError("Use pricing service for EOD backfill")
    
    def get_fx_rate(self, base: str, quote: str, as_of: datetime) -> Optional[Decimal]:
        """Get FX rate from base to quote currency at a given time"""
        if base == quote:
            return Decimal("1.0")
        
        # For MVP, use yfinance to get current FX rates
        # For historical rates, we'd need a proper FX data provider
        try:
            # yfinance uses format like "USDJPY=X" for FX pairs
            pair = f"{base}{quote}=X"
            ticker = yf.Ticker(pair)
            hist = ticker.history(period="1d")
            
            if hist.empty:
                return None
            
            # Get the latest close price
            rate = Decimal(str(hist["Close"].iloc[-1]))
            return rate
        except Exception:
            return None


# Global provider instance
_provider: Optional[InstrumentProvider] = None


def get_provider() -> InstrumentProvider:
    """Get the instrument provider instance"""
    global _provider
    if _provider is None:
        _provider = YFinanceProvider()
    return _provider


def ensure_instrument(db: Session, raw_symbol: str) -> Instrument:
    """
    Ensure an instrument exists in the database, creating it if necessary.
    Updates sector/industry on first insert only (doesn't overwrite non-nulls).
    """
    provider = get_provider()
    
    # Resolve symbol
    resolved = provider.resolve_symbol(raw_symbol)
    
    # Check if instrument already exists
    instrument = db.query(Instrument).filter(
        Instrument.symbol == resolved.symbol,
        Instrument.exchange_mic == resolved.exchange_mic,
        Instrument.deleted_at.is_(None)
    ).first()
    
    if instrument:
        # Update metadata only if fields are None and we have new data
        if not instrument.sector and resolved.sector:
            instrument.sector = resolved.sector
        if not instrument.industry and resolved.industry:
            instrument.industry = resolved.industry
        if not instrument.country and resolved.country:
            instrument.country = resolved.country
        if not instrument.name and resolved.name:
            instrument.name = resolved.name
        db.commit()
        db.refresh(instrument)
        return instrument
    
    # Create new instrument
    instrument = Instrument(
        type=resolved.type,
        symbol=resolved.symbol,
        name=resolved.name,
        exchange_mic=resolved.exchange_mic,
        currency=resolved.currency,
        sector=resolved.sector,
        industry=resolved.industry,
        country=resolved.country,
    )
    db.add(instrument)
    db.commit()
    db.refresh(instrument)
    
    return instrument

