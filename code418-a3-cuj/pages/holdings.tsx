import Head from "next/head";
import { Container, Title, Text, Group, Button, Table, Badge, ActionIcon, Drawer, Stack, Card, Divider } from "@mantine/core";
import { IconPlus, IconEye, IconInfoCircle, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { calculatePositionValue, calculateDayChangeAbs, calculateDayChangePct, calculateTotalPL, formatCurrency, formatPercentage } from "../utils";
import { Position } from "../types";
import AllocationChart from "../components/AllocationChart";

export default function Holdings() {
    const { state, addToWatchlist, addPracticeLot } = useAppContext();
    const { positions, watchlist, practiceLots } = state;
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [sortBy, setSortBy] = useState<'value' | 'dayChange' | 'ticker'>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleRowClick = (position: Position) => {
        setSelectedPosition(position);
        setDrawerOpened(true);
    };

    const handleSort = (column: 'value' | 'dayChange' | 'ticker') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const sortedPositions = [...positions].sort((a, b) => {
        let aValue: number, bValue: number;

        switch (sortBy) {
            case 'value':
                aValue = calculatePositionValue(a);
                bValue = calculatePositionValue(b);
                break;
            case 'dayChange':
                aValue = calculateDayChangeAbs(a);
                bValue = calculateDayChangeAbs(b);
                break;
            case 'ticker':
                aValue = a.ticker.localeCompare(b.ticker);
                bValue = 0;
                break;
            default:
                return 0;
        }

        if (sortBy === 'ticker') {
            return sortOrder === 'asc' ? aValue : -aValue;
        }

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const getPracticeLotsForTicker = (ticker: string) => {
        return practiceLots.filter(lot => lot.ticker === ticker);
    };

    const getTotalPracticeShares = (ticker: string) => {
        return getPracticeLotsForTicker(ticker).reduce((sum, lot) => sum + lot.shares, 0);
    };

    const getTotalPracticeValue = (ticker: string) => {
        const position = positions.find(p => p.ticker === ticker);
        if (!position) return 0;
        return getTotalPracticeShares(ticker) * position.lastPrice;
    };

    const handleSimulateBuy = (ticker: string, amount: number = 100) => {
        const position = positions.find(p => p.ticker === ticker);
        if (position) {
            const shares = amount / position.lastPrice;
            const practiceLot = {
                ticker,
                shares,
                price: position.lastPrice,
                date: new Date().toISOString()
            };
            addPracticeLot(practiceLot);
        }
    };

    const handleAddToWatchlist = (position: Position) => {
        const watchlistItem = {
            ticker: position.ticker,
            name: position.name,
            lastPrice: position.lastPrice,
            prevClose: position.prevClose,
            category: position.category
        };
        addToWatchlist(position.ticker, watchlistItem);
    };

    return (
        <>
            <Head>
                <title>Holdings - FinanceTracker</title>
                <meta name="description" content="View and manage your investment holdings" />
            </Head>

            <Container size="xl" p="md">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title order={1} size="h2" c="blue">
                            Your Holdings 📊
                        </Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Track your investments and performance
                        </Text>
                    </div>
                </Group>

                <Group align="flex-start" gap="xl">
                    {/* Holdings Table */}
                    <div style={{ flex: 1 }}>
                        <Card shadow="md" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Text size="lg" fw={600}>
                                    Positions
                                </Text>
                                <Badge color="blue" variant="light">
                                    {positions.length} holdings
                                </Badge>
                            </Group>

                            <Table highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Ticker</Table.Th>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Qty</Table.Th>
                                        <Table.Th>Avg Cost</Table.Th>
                                        <Table.Th>Last</Table.Th>
                                        <Table.Th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('dayChange')}
                                        >
                                            Day Δ {sortBy === 'dayChange' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </Table.Th>
                                        <Table.Th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('value')}
                                        >
                                            Value {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </Table.Th>
                                        <Table.Th>Total P/L</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {sortedPositions.map((position) => {
                                        const dayChangeAbs = calculateDayChangeAbs(position);
                                        const dayChangePct = calculateDayChangePct(position);
                                        const value = calculatePositionValue(position);
                                        const totalPL = calculateTotalPL(position);
                                        const practiceShares = getTotalPracticeShares(position.ticker);
                                        const practiceValue = getTotalPracticeValue(position.ticker);
                                        const isInWatchlist = watchlist.some(item => item.ticker === position.ticker);
                                        const isPositive = dayChangeAbs >= 0;

                                        return (
                                            <Table.Tr
                                                key={position.ticker}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleRowClick(position)}
                                            >
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <Text fw={600}>{position.ticker}</Text>
                                                        {practiceShares > 0 && (
                                                            <Badge size="xs" color="green" variant="light">
                                                                + Practice
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" lineClamp={1}>
                                                        {position.name}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">
                                                        {position.qty}
                                                        {practiceShares > 0 && (
                                                            <Text size="xs" c="green">
                                                                +{practiceShares.toFixed(2)}
                                                            </Text>
                                                        )}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{formatCurrency(position.avgCost)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{formatCurrency(position.lastPrice)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        {isPositive ? (
                                                            <IconTrendingUp size={14} color="green" />
                                                        ) : (
                                                            <IconTrendingDown size={14} color="red" />
                                                        )}
                                                        <Text
                                                            size="sm"
                                                            c={isPositive ? 'green' : 'red'}
                                                            fw={500}
                                                        >
                                                            {formatCurrency(dayChangeAbs)} ({formatPercentage(dayChangePct)})
                                                        </Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>
                                                        {formatCurrency(value + practiceValue)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text
                                                        size="sm"
                                                        c={totalPL >= 0 ? 'green' : 'red'}
                                                        fw={500}
                                                    >
                                                        {formatCurrency(totalPL)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="blue"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddToWatchlist(position);
                                                        }}
                                                    >
                                                        <IconEye size={16} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Card>
                    </div>

                    {/* Allocation Chart */}
                    <div style={{ width: 350 }}>
                        <AllocationChart positions={positions} practiceLots={practiceLots} />
                    </div>
                </Group>

                {/* Position Detail Drawer */}
                <Drawer
                    opened={drawerOpened}
                    onClose={() => setDrawerOpened(false)}
                    title={selectedPosition ? `${selectedPosition.ticker} - ${selectedPosition.name}` : ''}
                    size="md"
                    position="right"
                >
                    {selectedPosition && (
                        <Stack gap="md">
                            <Card p="md" withBorder>
                                <Text size="sm" c="dimmed" mb="xs">
                                    Description
                                </Text>
                                <Text size="sm" mb="md">
                                    {selectedPosition.name} is a {selectedPosition.category.toLowerCase()}
                                    that provides exposure to the underlying market segment.
                                </Text>

                                <Text size="sm" c="dimmed" mb="xs">
                                    Category
                                </Text>
                                <Badge color="blue" variant="light" mb="md">
                                    {selectedPosition.category}
                                </Badge>

                                <Text size="sm" c="dimmed" mb="xs">
                                    Risk Tip
                                </Text>
                                <Text size="sm" mb="md">
                                    {selectedPosition.category.includes('ETF')
                                        ? 'ETFs provide diversification but still carry market risk. Consider your risk tolerance.'
                                        : 'Individual stocks can be more volatile than diversified funds. Monitor regularly.'
                                    }
                                </Text>
                            </Card>

                            <Divider />

                            <Stack gap="sm">
                                <Button
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconEye size={16} />}
                                    onClick={() => handleAddToWatchlist(selectedPosition)}
                                    disabled={watchlist.some(item => item.ticker === selectedPosition.ticker)}
                                >
                                    {watchlist.some(item => item.ticker === selectedPosition.ticker)
                                        ? 'Already in Watchlist'
                                        : 'Add to Watchlist'
                                    }
                                </Button>

                                <Button
                                    variant="light"
                                    color="green"
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => handleSimulateBuy(selectedPosition.ticker)}
                                >
                                    Simulate $100 Buy
                                </Button>
                            </Stack>

                            {getPracticeLotsForTicker(selectedPosition.ticker).length > 0 && (
                                <Card p="md" withBorder bg="green.0">
                                    <Text size="sm" fw={500} c="green" mb="xs">
                                        Practice Lots
                                    </Text>
                                    <Stack gap="xs">
                                        {getPracticeLotsForTicker(selectedPosition.ticker).map((lot, index) => (
                                            <Group key={index} justify="space-between">
                                                <Text size="xs">
                                                    {lot.shares.toFixed(4)} shares @ {formatCurrency(lot.price)}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {new Date(lot.date).toLocaleDateString()}
                                                </Text>
                                            </Group>
                                        ))}
                                    </Stack>
                                </Card>
                            )}
                        </Stack>
                    )}
                </Drawer>
            </Container>
        </>
    );
}
