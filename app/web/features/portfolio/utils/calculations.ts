interface PortfolioTotals {
    totalValue: number | string;
    totalCostBasis: number | string;
    unrealizedPL: number | string;
    dailyPL: number | string;
}

export const calculateUnrealizedPLPercent = (totals: PortfolioTotals): number => {
    if (totals.totalCostBasis === 0) return 0;
    return (Number(totals.unrealizedPL) / Number(totals.totalCostBasis)) * 100;
};

export const calculateDailyPLPercent = (totals: PortfolioTotals): number => {
    const previousValue = Number(totals.totalValue) - Number(totals.dailyPL);
    if (previousValue === 0 || totals.dailyPL === 0) return 0;
    return (Number(totals.dailyPL) / previousValue) * 100;
};

