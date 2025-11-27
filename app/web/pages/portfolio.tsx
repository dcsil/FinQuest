/**
 * Portfolio Page
 */
import { useState, useEffect } from 'react';
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
    Alert,
    AppShell,
    Skeleton,
} from '@mantine/core';
import { IconPlus, IconTrendingUp, IconTrendingDown, IconAlertCircle } from '@tabler/icons-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppNav } from '@/components/AppNav';
import { AddPositionDialog } from '@/components/AddPositionDialog';
import { AllocationChart } from '@/components/AllocationChart';
import { ValueChart, type TimeRange } from '@/components/ValueChart';
import { SuggestionsWidget } from '@/components/SuggestionsWidget';
import { usersApi } from '@/lib/api';
import type { Suggestion } from '@/types/learning';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { useSnapshots } from '@/features/portfolio/hooks/useSnapshots';
import { getDateRange } from '@/features/portfolio/utils/dateRange';
import { formatCurrency, formatPercentage, formatQuantity } from '@/features/portfolio/utils/formatters';
import { calculateUnrealizedPLPercent, calculateDailyPLPercent } from '@/features/portfolio/utils/calculations';

/**
 * Chart skeleton component for loading state
 * Matches the layout of ValueChart component
 */
const ChartSkeleton = () => (
    <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}>
            <Skeleton height={24} width={250} style={{ margin: '0 auto' }} />
            <Group gap="xs" style={{ position: 'absolute', right: 0 }}>
                <Skeleton height={32} width={180} radius="md" />
                <Skeleton height={32} width={32} radius="md" />
            </Group>
        </div>
        <div style={{ position: 'relative', height: 400 }}>
            {/* Chart area skeleton */}
            <Skeleton height={400} radius="md" />
        </div>
    </div>
);

/**
 * Portfolio page skeleton component for initial loading state
 */
const PortfolioSkeleton = () => (
    <Stack gap="xl">
        {/* First Row: Chart (2/3) + Pie Chart (1/3) */}
        <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
                <Paper shadow="sm" p="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                    <ChartSkeleton />
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper shadow="sm" p="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                    <Skeleton height={24} width={150} mb="md" />
                    <Skeleton height={300} radius="md" />
                </Paper>
            </Grid.Col>
        </Grid>

        {/* Second Row: Three Widgets */}
        <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                    <Skeleton height={16} width={100} mb="xs" />
                    <Skeleton height={32} width={150} mt="xs" />
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                    <Skeleton height={16} width={120} mb="xs" />
                    <Skeleton height={32} width={150} mt="xs" />
                    <Skeleton height={16} width={80} mt={4} />
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                    <Skeleton height={16} width={100} mb="xs" />
                    <Group gap="xs" mt="xs">
                        <Skeleton height={20} width={20} radius="md" />
                        <Skeleton height={32} width={120} />
                    </Group>
                    <Skeleton height={16} width={80} mt={4} />
                </Card>
            </Grid.Col>
        </Grid>

        {/* AI Suggestions Widget Skeleton */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Skeleton height={28} width={200} mb="md" />
            <Skeleton height={100} radius="md" />
        </Paper>

        {/* Holdings Table Skeleton */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" align="center" mb="md">
                <Skeleton height={28} width={120} />
                <Skeleton height={36} width={140} radius="md" />
            </Group>
            <Stack gap="xs">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={48} radius="md" />
                ))}
            </Stack>
        </Paper>
    </Stack>
);

const PortfolioPage = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [dialogOpened, setDialogOpened] = useState(false);
    const { portfolio, loading, error, loadPortfolio } = usePortfolio();
    const { snapshots, showSkeleton: showSnapshotsSkeleton, timeRange, setTimeRange, loadSnapshots } = useSnapshots('1m');

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

    // Load portfolio and initial snapshots on mount
    useEffect(() => {
        loadPortfolio();
        loadSnapshots('1m');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Load suggestions after portfolio is loaded
    useEffect(() => {
        if (portfolio) {
            loadSuggestions();
        }
    }, [portfolio]);

    // Reload snapshots when time range changes
    useEffect(() => {
        loadSnapshots(timeRange);
    }, [timeRange, loadSnapshots]);

    const handleAddPositionSuccess = () => {
        loadPortfolio();
        loadSnapshots(timeRange);
    };

    if (loading && !portfolio) {
        return (
            <ProtectedRoute>
                <AppShell header={{ height: 70 }}>
                    <AppNav />
                    <AppShell.Main>
                        <Container size="xl" py="xl">
                            <Stack gap="xl">
                                {/* Header - Always render since it's not dynamic */}
                                <Title order={1}>Portfolio</Title>
                                <PortfolioSkeleton />
                            </Stack>
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

    const { totals, positions, allocationByType, baseCurrency } = portfolio || {
        totals: { totalValue: 0, totalCostBasis: 0, unrealizedPL: 0, dailyPL: 0 },
        positions: [],
        allocationByType: {},
        baseCurrency: 'USD',
    };

    // Calculate percentages
    const unrealizedPLPercent = calculateUnrealizedPLPercent(totals);
    const dailyPLPercent = calculateDailyPLPercent(totals);

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
                            <Title order={1}>Portfolio</Title>

                            {/* First Row: Chart (2/3) + Pie Chart (1/3) */}
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 8 }}>
                                    <Paper shadow="sm" p="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                                        {showSnapshotsSkeleton ? (
                                            <ChartSkeleton />
                                        ) : (
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
                                        )}
                                    </Paper>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <Paper shadow="sm" p="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <AllocationChart
                                            data={allocationByType}
                                            title="Asset Allocation"
                                        />
                                    </Paper>
                                </Grid.Col>
                            </Grid>

                            {/* Second Row: Three Widgets */}
                            <Grid>
                                <Grid.Col span={{ base: 12, sm: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                                        <Text size="sm" color="dimmed">
                                            Total Value
                                        </Text>
                                        <Text size="xl" fw={700} mt="xs">
                                            {formatCurrency(totals.totalValue, baseCurrency)}
                                        </Text>
                                    </Card>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                                        <Text size="sm" color="dimmed">
                                            Total Gain/Loss
                                        </Text>
                                        <Text
                                            size="xl"
                                            fw={700}
                                            c={Number(totals.unrealizedPL) >= 0 ? 'green' : 'red'}
                                            mt="xs"
                                        >
                                            {formatCurrency(totals.unrealizedPL, baseCurrency)}
                                        </Text>
                                        <Text
                                            size="sm"
                                            c={Number(totals.unrealizedPL) >= 0 ? 'green' : 'red'}
                                            mt={4}
                                        >
                                            {formatPercentage(unrealizedPLPercent)}
                                        </Text>
                                    </Card>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
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
                                        <Text
                                            size="sm"
                                            c={Number(totals.dailyPL) >= 0 ? 'green' : 'red'}
                                            mt={4}
                                        >
                                            {formatPercentage(dailyPLPercent)}
                                        </Text>
                                    </Card>
                                </Grid.Col>
                            </Grid>

                            {/* AI Suggestions Widget */}
                            <SuggestionsWidget suggestions={suggestions} loading={loadingSuggestions} />

                            {/* Holdings Table */}
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <Group justify="space-between" align="center" mb="md">
                                    <Title order={2}>Holdings</Title>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => setDialogOpened(true)}
                                    >
                                        Add Position
                                    </Button>
                                </Group>
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

