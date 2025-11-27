/**
 * Value Over Time Chart Component
 */
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ActionIcon, Tooltip as MantineTooltip, SegmentedControl, Group, useMantineColorScheme } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import type { SnapshotPoint } from '@/types/portfolio';

export type TimeRange = '1d' | '1w' | '1m' | 'ytd' | '1y';

interface ValueChartProps {
    data: SnapshotPoint[];
    baseCurrency: string;
    onRefresh?: () => Promise<void>;
    onRangeChange?: (range: TimeRange) => void;
    defaultRange?: TimeRange;
    granularity?: 'hourly' | '6hourly' | 'daily' | 'weekly';
    overlayValue?: number | string | null;
    overlayPercentage?: number | null;
    overlayCurrency?: string;
}

export const ValueChart = ({
    data,
    baseCurrency,
    onRefresh,
    onRangeChange,
    defaultRange = '1m',
    granularity = 'daily',
    overlayValue,
    overlayPercentage,
    overlayCurrency
}: ValueChartProps) => {
    const { colorScheme } = useMantineColorScheme();
    const [loading, setLoading] = useState(false);
    const [selectedRange, setSelectedRange] = useState<TimeRange>(defaultRange);
    const [isInitialMount, setIsInitialMount] = useState(true);
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        setSelectedRange(defaultRange);
        setIsInitialMount(true);
    }, [defaultRange]);

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
            return;
        }
        if (onRangeChange) {
            onRangeChange(selectedRange);
        }
    }, [selectedRange, onRangeChange, isInitialMount]);

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setLoading(true);
        try {
            await onRefresh();
        } catch (error) {
            console.error('Failed to generate snapshot:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRangeChange = (value: string) => {
        setSelectedRange(value as TimeRange);
    };

    if (data.length === 0) {
        return (
            <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}>
                    <h3 style={{ textAlign: 'center', margin: 0, flex: 1 }}>Portfolio Value Over Time</h3>
                    <Group gap="xs" style={{ position: 'absolute', right: 0 }}>
                        {onRangeChange && (
                            <SegmentedControl
                                value={selectedRange}
                                onChange={handleRangeChange}
                                data={[
                                    { label: '1D', value: '1d' },
                                    { label: '1W', value: '1w' },
                                    { label: '1M', value: '1m' },
                                    { label: 'YTD', value: 'ytd' },
                                    { label: '1Y', value: '1y' },
                                ]}
                                size="xs"
                            />
                        )}
                        {onRefresh && (
                            <MantineTooltip label="Refresh data">
                                <ActionIcon
                                    variant="subtle"
                                    onClick={handleRefresh}
                                    loading={loading}
                                >
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </MantineTooltip>
                        )}
                    </Group>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No snapshot data available</p>
                </div>
            </div>
        );
    }

    const getDateFormat = (granularity: string): string => {
        switch (granularity) {
            case 'hourly':
                return 'HH:mm';
            case '6hourly':
                return 'MMM dd HH:mm';
            case 'daily':
                return 'MMM dd';
            case 'weekly':
                return 'MMM dd, yyyy';
            default:
                return 'MMM dd';
        }
    };

    const getTooltipFormat = (granularity: string): string => {
        switch (granularity) {
            case 'hourly':
                return 'PPpp';
            case '6hourly':
                return 'PPpp';
            case 'daily':
                return 'PP';
            case 'weekly':
                return 'PP';
            default:
                return 'PP';
        }
    };

    const chartData = data.map((point) => {
        const value = typeof point.totalValue === 'string'
            ? parseFloat(point.totalValue)
            : point.totalValue;
        const dateFormat = getDateFormat(granularity);
        return {
            date: format(new Date(point.asOf), dateFormat),
            value: Number(value.toFixed(2)),
            fullDate: point.asOf,
        };
    }).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    // Calculate dynamic Y-axis domain based on data min/max
    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    // Calculate padding: 10% of range, or at least 2% of max value
    let padding: number;
    if (range === 0) {
        // All values are the same - add padding around the value
        padding = Math.max(maxValue * 0.1, maxValue * 0.05, 50);
    } else {
        padding = Math.max(range * 0.1, maxValue * 0.02);
    }

    // Set domain with padding
    // For positive values, start from a reasonable minimum (not necessarily 0)
    const domainMin = minValue - padding;
    const domainMax = maxValue + padding;
    const yAxisDomain = [domainMin, domainMax];

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

    const showOverlay = overlayValue !== undefined && overlayValue !== null;

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}>
                <h3 style={{ textAlign: 'center', margin: 0, flex: 1 }}>Portfolio Value Over Time</h3>
                <Group gap="xs" style={{ position: 'absolute', right: 0 }}>
                    {onRangeChange && (
                        <SegmentedControl
                            value={selectedRange}
                            onChange={handleRangeChange}
                            data={[
                                { label: '1D', value: '1d' },
                                { label: '1W', value: '1w' },
                                { label: '1M', value: '1m' },
                                { label: 'YTD', value: 'ytd' },
                                { label: '1Y', value: '1y' },
                            ]}
                            size="xs"
                        />
                    )}
                    {onRefresh && (
                        <MantineTooltip label="Refresh data">
                            <ActionIcon
                                variant="subtle"
                                onClick={handleRefresh}
                                loading={loading}
                            >
                                <IconRefresh size={18} />
                            </ActionIcon>
                        </MantineTooltip>
                    )}
                </Group>
            </div>
            <div style={{ position: 'relative' }}>
                {showOverlay && (
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
                            lineHeight: 1.2,
                            color: isDark ? '#fff' : '#111827'
                        }}>
                            {formatCurrency(overlayValue, overlayCurrency || baseCurrency)}
                        </div>
                        {overlayPercentage !== undefined && overlayPercentage !== null && (
                            <div style={{
                                fontSize: '14px',
                                color: Number(overlayPercentage) >= 0 ? '#16a34a' : '#dc2626',
                                fontWeight: 500,
                                marginTop: '4px'
                            }}>
                                {formatPercentage(overlayPercentage)}
                            </div>
                        )}
                    </div>
                )}
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#888"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => value.toLocaleString()}
                            stroke="transparent"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            domain={yAxisDomain}
                            width={70}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length > 0) {
                                    const tooltipFormat = getTooltipFormat(granularity);
                                    const date = payload[0].payload.fullDate;
                                    const value = payload[0].value as number;
                                    return (
                                        <div style={{
                                            backgroundColor: isDark ? 'rgba(37, 38, 43, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '10px 14px',
                                            boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                                        }}>
                                            <div style={{ fontWeight: 600, marginBottom: '6px', color: isDark ? '#fff' : '#111827' }}>
                                                {format(new Date(date), tooltipFormat)}
                                            </div>
                                            <div style={{ color: '#2563eb', fontWeight: 500 }}>
                                                {formatCurrency(value, baseCurrency)}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                            animationDuration={300}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

