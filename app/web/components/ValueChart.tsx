/**
 * Value Over Time Chart Component
 */
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfYear } from 'date-fns';
import { ActionIcon, Tooltip as MantineTooltip, SegmentedControl, Group } from '@mantine/core';
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
}

export const ValueChart = ({ data, baseCurrency, onRefresh, onRangeChange, defaultRange = '1m', granularity = 'daily' }: ValueChartProps) => {
    const [loading, setLoading] = useState(false);
    const [selectedRange, setSelectedRange] = useState<TimeRange>(defaultRange);
    const [isInitialMount, setIsInitialMount] = useState(true);

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
    });

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
                        <MantineTooltip label="Generate snapshot">
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
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                        tickFormatter={(value) => `${baseCurrency} ${value.toLocaleString()}`}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${baseCurrency} ${value.toLocaleString()}`, 'Value']}
                        labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                                const tooltipFormat = getTooltipFormat(granularity);
                                return format(new Date(payload[0].payload.fullDate), tooltipFormat);
                            }
                            return label;
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0088FE"
                        strokeWidth={2}
                        name="Portfolio Value"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

