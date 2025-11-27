/**
 * Dashboard Page
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
    Container,
    Title,
    Stack,
    Paper,
    AppShell,
    Skeleton,
    useMantineColorScheme,
    useMantineTheme,
} from '@mantine/core';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppNav } from '@/components/AppNav';
import { ValueChart, type TimeRange } from '@/components/ValueChart';
import { SuggestionsWidget } from '@/components/SuggestionsWidget';
import { XPBar } from '@/components/XPBar';
import { StreakIndicator } from '@/components/StreakIndicator';
import { portfolioApi, usersApi } from '@/lib/api';
import type { PortfolioHoldingsResponse, SnapshotPoint } from '@/types/portfolio';
import type { Suggestion } from '@/types/learning';
import { format, subDays, startOfYear } from 'date-fns';

/**
 * Dashboard skeleton component for initial loading state
 */
const DashboardSkeleton = () => (
    <Stack gap="xl">
        {/* Header */}
        <Skeleton height={36} width={200} />

        {/* My Investments Section */}
        <div>
            <Skeleton height={28} width={180} mb="md" />
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Skeleton height={400} radius="md" />
            </Paper>
        </div>

        {/* AI Suggestions Widget Skeleton */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Skeleton height={28} width={200} mb="md" />
            <Skeleton height={100} radius="md" />
        </Paper>
    </Stack>
);

const DashboardPage = () => {
    const { colorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();
    const isDark = colorScheme === 'dark';
    const [portfolio, setPortfolio] = useState<PortfolioHoldingsResponse | null>(null);
    const [snapshots, setSnapshots] = useState<SnapshotPoint[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('1m');
    const [showSnapshotsSkeleton, setShowSnapshotsSkeleton] = useState(false);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const data = await portfolioApi.getPortfolio();
            setPortfolio(data);
        } catch (err) {
            console.error('Failed to load portfolio:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSuggestions = async () => {
        try {
            setLoadingSuggestions(true);
            const data = await usersApi.getSuggestions();
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to load suggestions:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const getDateRange = useCallback((range: TimeRange): { from: string; to: string; granularity: string } => {
        const to = new Date();
        let from: Date;
        let granularity: string;

        switch (range) {
            case '1d':
                from = subDays(to, 1);
                granularity = 'hourly';
                break;
            case '1w':
                from = subDays(to, 7);
                granularity = '6hourly';
                break;
            case '1m':
                from = subDays(to, 30);
                granularity = 'daily';
                break;
            case 'ytd':
                from = startOfYear(to);
                granularity = 'daily';
                break;
            case '1y':
                from = subDays(to, 365);
                granularity = 'weekly';
                break;
            default:
                from = subDays(to, 30);
                granularity = 'daily';
        }

        return {
            from: format(from, 'yyyy-MM-dd'),
            to: format(to, 'yyyy-MM-dd'),
            granularity,
        };
    }, []);

    const loadSnapshots = useCallback(async (range?: TimeRange) => {
        try {
            const rangeToUse = range || timeRange;
            const { from, to, granularity } = getDateRange(rangeToUse);

            setShowSnapshotsSkeleton(false);

            // Set a timeout to show skeleton after 1 second
            const skeletonTimeout = setTimeout(() => {
                setShowSnapshotsSkeleton(true);
            }, 1000);

            try {
                const data = await portfolioApi.getSnapshots(from, to, granularity);
                setSnapshots(data.series);
            } finally {
                clearTimeout(skeletonTimeout);
                setShowSnapshotsSkeleton(false);
            }
        } catch (err) {
            console.error('Failed to load snapshots:', err);
            setShowSnapshotsSkeleton(false);
        }
    }, [timeRange, getDateRange]);

    // Load portfolio and initial snapshots on mount
    useEffect(() => {
        loadPortfolio();
        loadSnapshots(timeRange);
        loadSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Reload snapshots when time range changes
    useEffect(() => {
        loadSnapshots(timeRange);
    }, [timeRange, loadSnapshots]);

    const { totals, baseCurrency } = portfolio || {
        totals: { totalValue: 0, totalCostBasis: 0, unrealizedPL: 0, dailyPL: 0 },
        baseCurrency: 'USD',
    };

    // Calculate daily percentage change
    const previousValue = Number(totals.totalValue) - Number(totals.dailyPL);
    const dailyPLPercent = previousValue !== 0 && totals.dailyPL !== 0
        ? (Number(totals.dailyPL) / previousValue) * 100
        : 0;

    const formatCurrency = (value: number | string | null | undefined, currency: string) => {
        if (value === null || value === undefined) return '~';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '~';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numValue);
    };

    const formatPercentage = (value: number | string | null | undefined) => {
        if (value === null || value === undefined) return '~';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '~';
        const sign = numValue >= 0 ? '+' : '';
        return `${sign}${numValue.toFixed(2)}%`;
    };

    if (loading && !portfolio) {
        return (
            <ProtectedRoute>
                <AppShell header={{ height: 70 }}>
                    <AppNav />
                    <AppShell.Main>
                        <Container size="xl" py="xl">
                            <DashboardSkeleton />
                        </Container>
                    </AppShell.Main>
                </AppShell>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <Head>
                <title>Dashboard - FinQuest</title>
            </Head>
            <AppShell header={{ height: 70 }}>
                <AppNav />
                <AppShell.Main>
                    <Container size="xl" py="xl">
                        <Stack gap="xl">
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <Title order={1}>Dashboard</Title>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <StreakIndicator />
                                    <XPBar />
                                </div>
                            </div>

                            {/* My Investments Section */}
                            <div>
                                <Title order={2} mb="md">My investments</Title>
                                <Paper shadow="sm" p="lg" radius="md" withBorder>
                                    {showSnapshotsSkeleton ? (
                                        <div style={{ position: 'relative', height: 400 }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: 20,
                                                left: 20,
                                                zIndex: 10,
                                                backgroundColor: isDark ? 'rgba(37, 38, 43, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                backdropFilter: 'blur(10px)',
                                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                            }}>
                                                <div style={{ 
                                                    fontSize: '24px', 
                                                    fontWeight: 700,
                                                    color: isDark ? '#fff' : '#111827'
                                                }}>
                                                    {formatCurrency(totals.totalValue, baseCurrency)}
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: dailyPLPercent >= 0 ? '#16a34a' : '#dc2626',
                                                    fontWeight: 500
                                                }}>
                                                    {formatPercentage(dailyPLPercent)}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ValueChart
                                            data={snapshots}
                                            baseCurrency={baseCurrency}
                                            defaultRange={timeRange}
                                            granularity={getDateRange(timeRange).granularity as 'hourly' | '6hourly' | 'daily' | 'weekly'}
                                            onRangeChange={(range) => {
                                                setTimeRange(range);
                                            }}
                                            overlayValue={totals.totalValue}
                                            overlayPercentage={dailyPLPercent}
                                            overlayCurrency={baseCurrency}
                                        />
                                    )}
                                </Paper>
                            </div>

                            {/* AI Suggestions Widget */}
                            <SuggestionsWidget suggestions={suggestions} loading={loadingSuggestions} />
                        </Stack>
                    </Container>
                </AppShell.Main>
            </AppShell>
        </ProtectedRoute>
    );
};

export default DashboardPage;

