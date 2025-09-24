import Head from "next/head";
import { Container, Title, Text, Group, Button, Card, Stack, Badge, ActionIcon, Alert } from "@mantine/core";
import { IconEye, IconTrash, IconPlus, IconTrendingUp, IconTrendingDown, IconInfoCircle } from "@tabler/icons-react";
import { useAppContext } from "../context/AppContext";
import { formatCurrency, formatPercentage } from "../utils";

export default function Watchlist() {
    const { state, removeFromWatchlist } = useAppContext();
    const { watchlist, positions } = state;

    const handleRemoveFromWatchlist = (ticker: string) => {
        removeFromWatchlist(ticker);
    };

    const getDayChange = (prevClose: number, lastPrice: number) => {
        const change = lastPrice - prevClose;
        const changePct = (change / prevClose) * 100;
        return { change, changePct };
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'US Equity ETF': return 'blue';
            case 'Canada Equity ETF': return 'green';
            case 'Bond ETF': return 'orange';
            case 'US Tech Equity': return 'purple';
            case 'Global Equity ETF': return 'cyan';
            default: return 'gray';
        }
    };

    const getCategoryIcon = (category: string) => {
        if (category.includes('ETF')) return '📊';
        if (category.includes('Tech')) return '💻';
        if (category.includes('Bond')) return '🏛️';
        return '📈';
    };

    return (
        <>
            <Head>
                <title>Watchlist - FinanceTracker</title>
                <meta name="description" content="Track stocks and ETFs you're interested in" />
            </Head>

            <Container size="xl" p="md">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title order={1} size="h2" c="blue">
                            Your Watchlist 👁️
                        </Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Track stocks and ETFs you&apos;re interested in
                        </Text>
                    </div>
                    <Badge color="blue" variant="light" size="lg">
                        {watchlist.length} items
                    </Badge>
                </Group>

                {watchlist.length === 0 ? (
                    <Card shadow="md" padding="xl" radius="md" withBorder>
                        <Stack align="center" gap="md">
                            <IconEye size={48} color="gray" />
                            <Text size="lg" fw={500} c="dimmed">
                                Your watchlist is empty
                            </Text>
                            <Text size="sm" c="dimmed" ta="center" maw={400}>
                                Start building your watchlist by adding stocks and ETFs from your holdings or by browsing the market.
                            </Text>
                            <Group gap="md" mt="md">
                                <Button
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconPlus size={16} />}
                                    component="a"
                                    href="/holdings"
                                >
                                    Browse Holdings
                                </Button>
                                <Button
                                    variant="light"
                                    color="green"
                                    leftSection={<IconEye size={16} />}
                                >
                                    Discover Stocks
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                ) : (
                    <Stack gap="md">
                        <Alert icon={<IconInfoCircle size={16} />} title="Watchlist Tips" color="blue" variant="light">
                            <Text size="sm">
                                Track up to 20 stocks and ETFs. Click the trash icon to remove items.
                                Prices update throughout the trading day.
                            </Text>
                        </Alert>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                            {watchlist.map((item) => {
                                const dayChange = getDayChange(item.prevClose, item.lastPrice);
                                const isPositive = dayChange.change >= 0;
                                const isInHoldings = positions.some(p => p.ticker === item.ticker);

                                return (
                                    <Card key={item.ticker} shadow="md" padding="lg" radius="md" withBorder>
                                        <Stack gap="sm">
                                            <Group justify="space-between" align="flex-start">
                                                <Stack gap="xs">
                                                    <Group gap="xs">
                                                        <Text size="lg" fw={700}>
                                                            {item.ticker}
                                                        </Text>
                                                        {isInHoldings && (
                                                            <Badge size="sm" color="green" variant="light">
                                                                Owned
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                    <Text size="sm" c="dimmed" lineClamp={2}>
                                                        {item.name}
                                                    </Text>
                                                </Stack>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => handleRemoveFromWatchlist(item.ticker)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>

                                            <Group justify="space-between" align="center">
                                                <Text size="xl" fw={600}>
                                                    {formatCurrency(item.lastPrice)}
                                                </Text>
                                                <Group gap="xs">
                                                    {isPositive ? (
                                                        <IconTrendingUp size={16} color="green" />
                                                    ) : (
                                                        <IconTrendingDown size={16} color="red" />
                                                    )}
                                                    <Text
                                                        size="sm"
                                                        fw={500}
                                                        c={isPositive ? 'green' : 'red'}
                                                    >
                                                        {formatCurrency(dayChange.change)} ({formatPercentage(dayChange.changePct)})
                                                    </Text>
                                                </Group>
                                            </Group>

                                            <Group justify="space-between" align="center">
                                                <Badge
                                                    color={getCategoryColor(item.category)}
                                                    variant="light"
                                                    leftSection={getCategoryIcon(item.category)}
                                                >
                                                    {item.category}
                                                </Badge>
                                                <Text size="xs" c="dimmed">
                                                    Prev: {formatCurrency(item.prevClose)}
                                                </Text>
                                            </Group>

                                            <Group gap="xs" mt="sm">
                                                <Button
                                                    variant="light"
                                                    color="blue"
                                                    size="xs"
                                                    fullWidth
                                                    leftSection={<IconEye size={14} />}
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    variant="light"
                                                    color="green"
                                                    size="xs"
                                                    fullWidth
                                                    leftSection={<IconPlus size={14} />}
                                                    disabled={isInHoldings}
                                                >
                                                    {isInHoldings ? 'Owned' : 'Simulate Buy'}
                                                </Button>
                                            </Group>
                                        </Stack>
                                    </Card>
                                );
                            })}
                        </div>

                        {watchlist.length >= 20 && (
                            <Alert color="orange" variant="light">
                                <Text size="sm">
                                    You&apos;ve reached the maximum watchlist size. Remove some items to add new ones.
                                </Text>
                            </Alert>
                        )}
                    </Stack>
                )}

                {/* Quick Stats */}
                {watchlist.length > 0 && (
                    <Card shadow="md" padding="lg" radius="md" withBorder mt="xl">
                        <Text size="lg" fw={600} mb="md">
                            Watchlist Summary
                        </Text>
                        <Group justify="space-around">
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed">Total Items</Text>
                                <Text size="xl" fw={700} c="blue">
                                    {watchlist.length}
                                </Text>
                            </Stack>
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed">In Holdings</Text>
                                <Text size="xl" fw={700} c="green">
                                    {watchlist.filter(item => positions.some(p => p.ticker === item.ticker)).length}
                                </Text>
                            </Stack>
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed">Categories</Text>
                                <Text size="xl" fw={700} c="purple">
                                    {new Set(watchlist.map(item => item.category)).size}
                                </Text>
                            </Stack>
                        </Group>
                    </Card>
                )}
            </Container>
        </>
    );
}
