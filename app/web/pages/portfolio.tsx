/**
 * Portfolio Page
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
    Container,
    Title,
    Stack,
    Card,
    Text,
    Group,
    Button,
    Table,
    Badge,
    Grid,
    Paper,
    Loader,
    Alert,
    AppShell,
} from '@mantine/core';
import { IconPlus, IconTrendingUp, IconTrendingDown, IconAlertCircle } from '@tabler/icons-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppNav } from '@/components/AppNav';
import { AddPositionDialog } from '@/components/AddPositionDialog';
import { AllocationChart } from '@/components/AllocationChart';
import { ValueChart, type TimeRange } from '@/components/ValueChart';
import { portfolioApi } from '@/lib/api';
import type { PortfolioHoldingsResponse, SnapshotPoint } from '@/types/portfolio';
import { format, subDays, startOfYear } from 'date-fns';

const PortfolioPage = () => {
    const [portfolio, setPortfolio] = useState<PortfolioHoldingsResponse | null>(null);
    const [snapshots, setSnapshots] = useState<SnapshotPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('1m');
    const [dialogOpened, setDialogOpened] = useState(false);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await portfolioApi.getPortfolio();
            setPortfolio(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load portfolio');
        } finally {
            setLoading(false);
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

            const data = await portfolioApi.getSnapshots(from, to, granularity);
            setSnapshots(data.series);
        } catch (err) {
            console.error('Failed to load snapshots:', err);
        }
    }, [timeRange, getDateRange]);

    // Load portfolio and initial snapshots on mount
    useEffect(() => {
        loadPortfolio();
        loadSnapshots(timeRange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Reload snapshots when time range changes
    useEffect(() => {
        loadSnapshots(timeRange);
    }, [timeRange, loadSnapshots]);

    const handleAddPositionSuccess = () => {
        loadPortfolio();
        loadSnapshots(timeRange);
    };

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

    const formatQuantity = (value: number | string | null | undefined) => {
        if (value === null || value === undefined) return '~';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '~';
        return numValue.toFixed(4);
    };

    if (loading && !portfolio) {
        return (
            <ProtectedRoute>
                <AppShell header={{ height: 70 }}>
                    <AppNav />
                    <AppShell.Main>
                        <Container size="xl" py="xl">
                            <Loader size="xl" />
                        </Container>
                    </AppShell.Main>
                </AppShell>
            </ProtectedRoute>
        );
    }

    if (error && !portfolio) {
        return (
            <ProtectedRoute>
                <AppShell header={{ height: 70 }}>
                    <AppNav />
                    <AppShell.Main>
                        <Container size="xl" py="xl">
                            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
                                {error}
                            </Alert>
                        </Container>
                    </AppShell.Main>
                </AppShell>
            </ProtectedRoute>
        );
    }

    const { totals, positions, allocationByType, allocationBySector, bestMovers, worstMovers, baseCurrency } = portfolio || {
        totals: { totalValue: 0, totalCostBasis: 0, unrealizedPL: 0, dailyPL: 0 },
        positions: [],
        allocationByType: {},
        allocationBySector: {},
        bestMovers: [],
        worstMovers: [],
        baseCurrency: 'USD',
    };

    return (
        <ProtectedRoute>
            <Head>
                <title>Portfolio - FinQuest</title>
            </Head>
            <AppShell header={{ height: 70 }}>
                <AppNav />
                <AppShell.Main>
                    <Container size="xl" py="xl">
                        <Stack gap="xl">
                            {/* Header */}
                            <Group justify="space-between" align="center">
                                <Title order={1}>Portfolio</Title>
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => setDialogOpened(true)}
                                >
                                    Add Position
                                </Button>
                            </Group>

                            {/* Summary Cards */}
                            <Grid>
                                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                                        <Text size="sm" color="dimmed">
                                            Total Value
                                        </Text>
                                        <Text size="xl" fw={700} mt="xs">
                                            {formatCurrency(totals.totalValue, baseCurrency)}
                                        </Text>
                                    </Card>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                                        <Text size="sm" color="dimmed">
                                            Unrealized Change
                                        </Text>
                                        <Group gap="xs" mt="xs">
                                            <Text
                                                size="xl"
                                                fw={700}
                                                c={Number(totals.unrealizedPL) >= 0 ? 'green' : 'red'}
                                            >
                                                {formatCurrency(totals.unrealizedPL, baseCurrency)}
                                            </Text>
                                        </Group>
                                    </Card>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                                        <Text size="sm" color="dimmed">
                                            Daily Change
                                        </Text>
                                        <Group gap="xs" mt="xs">
                                            {Number(totals.dailyPL) >= 0 ? (
                                                <IconTrendingUp size={20} color="green" />
                                            ) : (
                                                <IconTrendingDown size={20} color="red" />
                                            )}
                                            <Text
                                                size="xl"
                                                fw={700}
                                                c={Number(totals.dailyPL) >= 0 ? 'green' : 'red'}
                                            >
                                                {formatCurrency(totals.dailyPL, baseCurrency)}
                                            </Text>
                                        </Group>
                                    </Card>
                                </Grid.Col>
                            </Grid>

                            {/* Value Over Time Chart */}
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <ValueChart
                                    data={snapshots}
                                    baseCurrency={baseCurrency}
                                    defaultRange={timeRange}
                                    granularity={getDateRange(timeRange).granularity as 'hourly' | '6hourly' | 'daily' | 'weekly'}
                                    onRangeChange={(range) => {
                                        setTimeRange(range);
                                    }}
                                    onRefresh={async () => {
                                        try {
                                            // Simply refetch snapshots - missing ones will be auto-generated
                                            await loadSnapshots(timeRange);
                                        } catch (err) {
                                            console.error('Failed to refresh snapshots:', err);
                                            throw err;
                                        }
                                    }}
                                />
                            </Paper>

                            {/* Holdings Table */}
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <Title order={2} mb="md">
                                    Holdings
                                </Title>
                                {positions.length === 0 ? (
                                    <Text color="dimmed" ta="center" py="xl">
                                        No positions yet. Click &quot;Add Position&quot; to get started.
                                    </Text>
                                ) : (
                                    <Table.ScrollContainer minWidth={800}>
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Symbol</Table.Th>
                                                    <Table.Th>Name</Table.Th>
                                                    <Table.Th>Type</Table.Th>
                                                    <Table.Th>Sector</Table.Th>
                                                    <Table.Th>Quantity</Table.Th>
                                                    <Table.Th>Avg Cost</Table.Th>
                                                    <Table.Th>Market Price</Table.Th>
                                                    <Table.Th>Value</Table.Th>
                                                    <Table.Th>Daily P/L</Table.Th>
                                                    <Table.Th>Unrealized P/L</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {positions.map((position) => (
                                                    <Table.Tr key={position.instrumentId}>
                                                        <Table.Td>
                                                            <Text fw={600}>{position.symbol}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text>{position.name || '—'}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                color={
                                                                    position.type === 'equity'
                                                                        ? 'blue'
                                                                        : position.type === 'etf'
                                                                            ? 'green'
                                                                            : 'orange'
                                                                }
                                                            >
                                                                {position.type}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text>{position.sector || '—'}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text>{formatQuantity(position.quantity)}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text>
                                                                {formatCurrency(
                                                                    position.avgCostBase,
                                                                    baseCurrency
                                                                )}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text>
                                                                {position.marketPrice !== null
                                                                    ? formatCurrency(
                                                                        position.marketPrice,
                                                                        position.currency
                                                                    )
                                                                    : '~'}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text>
                                                                {position.valueBase !== null
                                                                    ? formatCurrency(
                                                                        position.valueBase,
                                                                        baseCurrency
                                                                    )
                                                                    : '~'}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            {position.dailyPL !== null && position.dailyPL !== undefined ? (
                                                                <Text
                                                                    c={Number(position.dailyPL) >= 0 ? 'green' : 'red'}
                                                                    fw={500}
                                                                >
                                                                    {formatCurrency(
                                                                        position.dailyPL,
                                                                        baseCurrency
                                                                    )}
                                                                </Text>
                                                            ) : (
                                                                <Text color="dimmed">—</Text>
                                                            )}
                                                        </Table.Td>
                                                        <Table.Td>
                                                            {position.unrealizedPL !== null && position.unrealizedPL !== undefined ? (
                                                                <Text
                                                                    c={Number(position.unrealizedPL) >= 0 ? 'green' : 'red'}
                                                                    fw={500}
                                                                >
                                                                    {formatCurrency(
                                                                        position.unrealizedPL,
                                                                        baseCurrency
                                                                    )}
                                                                </Text>
                                                            ) : (
                                                                <Text color="dimmed">—</Text>
                                                            )}
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Table.ScrollContainer>
                                )}
                            </Paper>

                            {/* Allocations and Movers */}
                            <Grid>
                                {/* Allocation by Type */}
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                                        <AllocationChart
                                            data={allocationByType}
                                            title="Allocation by Type"
                                        />
                                    </Paper>
                                </Grid.Col>

                                {/* Allocation by Sector */}
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                                        <AllocationChart
                                            data={allocationBySector}
                                            title="Allocation by Sector"
                                        />
                                    </Paper>
                                </Grid.Col>
                            </Grid>

                            {/* Best/Worst Movers */}
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                                        <Title order={3} mb="md">
                                            Best Movers
                                        </Title>
                                        {bestMovers.length === 0 ? (
                                            <Text color="dimmed">No data available</Text>
                                        ) : (
                                            <Stack gap="sm">
                                                {bestMovers.map((mover) => (
                                                    <Group key={mover.symbol} justify="space-between">
                                                        <Text fw={600}>{mover.symbol}</Text>
                                                        <Group gap="xs">
                                                            <Text c="green" fw={500}>
                                                                {formatCurrency(mover.abs, baseCurrency)}
                                                            </Text>
                                                            <Badge color="green">
                                                                {formatPercentage(mover.pct)}
                                                            </Badge>
                                                        </Group>
                                                    </Group>
                                                ))}
                                            </Stack>
                                        )}
                                    </Paper>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                                        <Title order={3} mb="md">
                                            Worst Movers
                                        </Title>
                                        {worstMovers.length === 0 ? (
                                            <Text color="dimmed">No data available</Text>
                                        ) : (
                                            <Stack gap="sm">
                                                {worstMovers.map((mover) => (
                                                    <Group key={mover.symbol} justify="space-between">
                                                        <Text fw={600}>{mover.symbol}</Text>
                                                        <Group gap="xs">
                                                            <Text c="red" fw={500}>
                                                                {formatCurrency(mover.abs, baseCurrency)}
                                                            </Text>
                                                            <Badge color="red">
                                                                {formatPercentage(mover.pct)}
                                                            </Badge>
                                                        </Group>
                                                    </Group>
                                                ))}
                                            </Stack>
                                        )}
                                    </Paper>
                                </Grid.Col>
                            </Grid>
                        </Stack>

                        {/* Add Position Dialog */}
                        <AddPositionDialog
                            opened={dialogOpened}
                            onClose={() => setDialogOpened(false)}
                            onSuccess={handleAddPositionSuccess}
                        />
                    </Container>
                </AppShell.Main>
            </AppShell>
        </ProtectedRoute>
    );
};

export default PortfolioPage;

