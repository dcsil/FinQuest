/**
 * TypeScript types for portfolio API
 */

export type PostPositionRequest = {
    symbol: string;
    quantity: number;
    avgCost: number;
    executedAt?: string; // ISO datetime string
};

export type PostPositionResponse = {
    status: string;
    portfolioId: string;
    transactionIds: string[];
};

export type PositionInfo = {
    instrumentId: string;
    symbol: string;
    name: string | null;
    type: 'equity' | 'etf' | 'crypto';
    sector: string | null;
    quantity: number;
    avgCostBase: number;
    marketPrice: number | null;
    valueBase: number | null;
    unrealizedPL: number | null;
    dailyPL: number | null;
    currency: string;
};

export type PortfolioTotals = {
    totalValue: number;
    totalCostBasis: number;
    unrealizedPL: number;
    dailyPL: number;
};

export type MoverInfo = {
    symbol: string;
    pct: number;
    abs: number;
};

export type PortfolioHoldingsResponse = {
    baseCurrency: string;
    totals: PortfolioTotals;
    positions: PositionInfo[];
    allocationByType: Record<string, number>;
    allocationBySector: Record<string, number>;
    bestMovers: MoverInfo[];
    worstMovers: MoverInfo[];
};

export type SnapshotPoint = {
    asOf: string; // ISO datetime string
    totalValue: number;
};

export type SnapshotsResponse = {
    baseCurrency: string;
    series: SnapshotPoint[];
};

