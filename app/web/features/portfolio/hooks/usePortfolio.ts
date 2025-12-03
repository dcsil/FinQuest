import { useState, useCallback } from 'react';
import { portfolioApi } from '@/lib/api';
import type { PortfolioHoldingsResponse } from '@/types/portfolio';

export const usePortfolio = () => {
    const [portfolio, setPortfolio] = useState<PortfolioHoldingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPortfolio = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await portfolioApi.getPortfolio();
            setPortfolio(data);
        } catch (err) {
            console.error('Error loading portfolio:', err);
            setError(err instanceof Error ? err.message : 'Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        portfolio,
        loading,
        error,
        loadPortfolio,
    };
};


