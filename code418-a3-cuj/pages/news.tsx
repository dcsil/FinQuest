import Head from "next/head";
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Anchor, Chip, Grid } from "@mantine/core";
import { IconNews, IconExternalLink, IconClock, IconFilter, IconTrendingUp } from "@tabler/icons-react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { formatTimeAgo } from "../utils";

export default function News() {
    const { state } = useAppContext();
    const { news, positions } = state;
    const [filter, setFilter] = useState<'all' | 'holdings' | string>('all');

    // Get unique tickers from news for filter chips
    const allTickers = Array.from(new Set(news.flatMap(item => item.tickers)));
    const holdingsTickers = positions.map(p => p.ticker);

    // Filter news based on selected filter
    const filteredNews = news.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'holdings') {
            return item.tickers.some(ticker => holdingsTickers.includes(ticker));
        }
        return item.tickers.includes(filter);
    });

    const getNewsIcon = (tickers: string[]) => {
        if (tickers.some(ticker => holdingsTickers.includes(ticker))) {
            return '📈';
        }
        return '📰';
    };

    const getNewsColor = (tickers: string[]) => {
        if (tickers.some(ticker => holdingsTickers.includes(ticker))) {
            return 'green';
        }
        return 'blue';
    };

    const getSourceColor = (source: string) => {
        const colors: { [key: string]: string } = {
            'Market Daily': 'blue',
            'Finance Wire': 'green',
            'TSX Times': 'orange',
            'US Markets': 'purple',
            'Tech Finance': 'cyan',
            'ETF Weekly': 'grape'
        };
        return colors[source] || 'gray';
    };

    return (
        <>
            <Head>
                <title>News - FinanceTracker</title>
                <meta name="description" content="Stay updated with the latest market news" />
            </Head>

            <Container size="xl" p="md">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title order={1} size="h2" c="blue">
                            Market News 📰
                        </Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Stay informed with the latest market updates and analysis
                        </Text>
                    </div>
                    <Badge color="blue" variant="light" size="lg">
                        {filteredNews.length} articles
                    </Badge>
                </Group>

                {/* Filter Section */}
                <Card shadow="md" padding="lg" radius="md" withBorder mb="xl">
                    <Group gap="md" align="center" mb="md">
                        <IconFilter size={20} color="gray" />
                        <Text size="sm" fw={500} c="dimmed">
                            Filter by:
                        </Text>
                    </Group>

                    <Group gap="sm">
                        <Chip
                            checked={filter === 'all'}
                            onChange={() => setFilter('all')}
                            variant="light"
                            color="blue"
                        >
                            All News
                        </Chip>
                        <Chip
                            checked={filter === 'holdings'}
                            onChange={() => setFilter('holdings')}
                            variant="light"
                            color="green"
                        >
                            My Holdings ({news.filter(item => item.tickers.some(ticker => holdingsTickers.includes(ticker))).length})
                        </Chip>
                        {allTickers.map(ticker => (
                            <Chip
                                key={ticker}
                                checked={filter === ticker}
                                onChange={() => setFilter(ticker)}
                                variant="light"
                                color={holdingsTickers.includes(ticker) ? "green" : "gray"}
                            >
                                {ticker}
                            </Chip>
                        ))}
                    </Group>
                </Card>

                {/* News Articles */}
                {filteredNews.length === 0 ? (
                    <Card shadow="md" padding="xl" radius="md" withBorder>
                        <Stack align="center" gap="md">
                            <IconNews size={48} color="gray" />
                            <Text size="lg" fw={500} c="dimmed">
                                No news articles found
                            </Text>
                            <Text size="sm" c="dimmed" ta="center" maw={400}>
                                {filter === 'holdings'
                                    ? 'No news articles are available for your current holdings. Try viewing all news instead.'
                                    : 'No news articles match your current filter. Try selecting a different filter.'
                                }
                            </Text>
                            <Button
                                variant="light"
                                color="blue"
                                onClick={() => setFilter('all')}
                            >
                                View All News
                            </Button>
                        </Stack>
                    </Card>
                ) : (
                    <Grid>
                        {filteredNews.map((article) => (
                            <Grid.Col key={article.id} span={{ base: 12, md: 6, lg: 4 }}>
                                <Card shadow="md" padding="lg" radius="md" withBorder h="100%">
                                    <Stack gap="md" h="100%">
                                        {/* Article Header */}
                                        <Stack gap="sm">
                                            <Group justify="space-between" align="flex-start">
                                                <Badge
                                                    color={getSourceColor(article.source)}
                                                    variant="light"
                                                    leftSection={getNewsIcon(article.tickers)}
                                                    size="sm"
                                                >
                                                    {article.source}
                                                </Badge>
                                                <Anchor
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    size="sm"
                                                >
                                                    <IconExternalLink size={14} />
                                                </Anchor>
                                            </Group>

                                            <Text
                                                size="lg"
                                                fw={600}
                                                lineClamp={3}
                                                style={{ flex: 1 }}
                                            >
                                                {article.title}
                                            </Text>
                                        </Stack>

                                        {/* Article Meta */}
                                        <Stack gap="sm">
                                            <Group justify="space-between" align="center">
                                                <Group gap="xs">
                                                    <IconClock size={14} color="gray" />
                                                    <Text size="xs" c="dimmed">
                                                        {formatTimeAgo(article.publishedAt)}
                                                    </Text>
                                                </Group>
                                                <Group gap="xs">
                                                    {article.tickers.map(ticker => (
                                                        <Badge
                                                            key={ticker}
                                                            size="xs"
                                                            variant="outline"
                                                            color={holdingsTickers.includes(ticker) ? "green" : "gray"}
                                                        >
                                                            {ticker}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            </Group>

                                            {/* TL;DR */}
                                            <Card bg="gray.0" p="sm" radius="sm">
                                                <Text size="sm" c="dimmed" mb="xs" fw={500}>
                                                    TL;DR
                                                </Text>
                                                <Text size="sm">
                                                    {article.tldr}
                                                </Text>
                                            </Card>

                                            {/* Action Button */}
                                            <Button
                                                variant="light"
                                                color={getNewsColor(article.tickers)}
                                                fullWidth
                                                leftSection={<IconExternalLink size={16} />}
                                                component="a"
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Read Full Article
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                )}

                {/* News Summary Stats */}
                {filteredNews.length > 0 && (
                    <Card shadow="md" padding="lg" radius="md" withBorder mt="xl">
                        <Group justify="space-between" align="center">
                            <Group gap="md">
                                <IconTrendingUp size={24} color="blue" />
                                <div>
                                    <Text size="lg" fw={600}>
                                        News Summary
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Showing {filteredNews.length} articles
                                        {filter !== 'all' && ` filtered by ${filter === 'holdings' ? 'your holdings' : filter}`}
                                    </Text>
                                </div>
                            </Group>
                            <Group gap="lg">
                                <Stack align="center" gap="xs">
                                    <Text size="sm" c="dimmed">Holdings Related</Text>
                                    <Text size="lg" fw={700} c="green">
                                        {filteredNews.filter(item => item.tickers.some(ticker => holdingsTickers.includes(ticker))).length}
                                    </Text>
                                </Stack>
                                <Stack align="center" gap="xs">
                                    <Text size="sm" c="dimmed">Sources</Text>
                                    <Text size="lg" fw={700} c="blue">
                                        {new Set(filteredNews.map(item => item.source)).size}
                                    </Text>
                                </Stack>
                                <Stack align="center" gap="xs">
                                    <Text size="sm" c="dimmed">Tickers</Text>
                                    <Text size="lg" fw={700} c="purple">
                                        {new Set(filteredNews.flatMap(item => item.tickers)).size}
                                    </Text>
                                </Stack>
                            </Group>
                        </Group>
                    </Card>
                )}
            </Container>
        </>
    );
}
