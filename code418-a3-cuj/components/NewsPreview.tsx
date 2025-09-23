import React from 'react';
import { Card, Text, Group, Stack, Badge, Button, Anchor } from '@mantine/core';
import { IconNews, IconExternalLink, IconClock } from '@tabler/icons-react';
import { NewsItem, Position } from '../types';
import { formatTimeAgo } from '../utils';

interface NewsPreviewProps {
    news: NewsItem[];
    positions: Position[];
}

const NewsPreview: React.FC<NewsPreviewProps> = ({ news, positions }) => {
    // Get tickers from positions
    const positionTickers = positions.map(p => p.ticker);

    // Filter news by holdings, then fall back to general market news
    const holdingsNews = news.filter(item =>
        item.tickers.some(ticker => positionTickers.includes(ticker))
    );

    const previewNews = holdingsNews.length >= 3 ? holdingsNews : news;
    const topNews = previewNews.slice(0, 3);

    const getNewsIcon = (tickers: string[]) => {
        if (tickers.some(ticker => positionTickers.includes(ticker))) {
            return '📈';
        }
        return '📰';
    };

    const getNewsColor = (tickers: string[]) => {
        if (tickers.some(ticker => positionTickers.includes(ticker))) {
            return 'green';
        }
        return 'blue';
    };

    return (
        <Card shadow="md" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Group>
                    <IconNews size={24} color="blue" />
                    <Text size="lg" fw={600}>
                        Market News
                    </Text>
                </Group>
                <Button
                    variant="light"
                    color="blue"
                    size="xs"
                    component="a"
                    href="/news"
                >
                    View All
                </Button>
            </Group>

            <Stack gap="md">
                {topNews.length === 0 ? (
                    <Stack align="center" gap="sm">
                        <Text size="sm" c="dimmed" ta="center">
                            No news items available
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                            Check back later for market updates
                        </Text>
                    </Stack>
                ) : (
                    topNews.map((item) => (
                        <Stack key={item.id} gap="xs">
                            <Group justify="space-between" align="flex-start">
                                <Text
                                    size="sm"
                                    fw={500}
                                    style={{ flex: 1 }}
                                    lineClamp={2}
                                >
                                    {item.title}
                                </Text>
                                <Anchor
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="xs"
                                >
                                    <IconExternalLink size={12} />
                                </Anchor>
                            </Group>

                            <Group justify="space-between" align="center">
                                <Group gap="xs">
                                    <Badge
                                        size="xs"
                                        color={getNewsColor(item.tickers)}
                                        variant="light"
                                        leftSection={getNewsIcon(item.tickers)}
                                    >
                                        {item.source}
                                    </Badge>
                                    <Group gap="xs">
                                        <IconClock size={10} color="gray" />
                                        <Text size="xs" c="dimmed">
                                            {formatTimeAgo(item.publishedAt)}
                                        </Text>
                                    </Group>
                                </Group>
                                {item.tickers.map(ticker => (
                                    <Badge
                                        key={ticker}
                                        size="xs"
                                        variant="outline"
                                        color={positionTickers.includes(ticker) ? "green" : "gray"}
                                    >
                                        {ticker}
                                    </Badge>
                                ))}
                            </Group>

                            <Badge
                                size="sm"
                                color="gray"
                                variant="light"
                                fullWidth
                                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                            >
                                {item.tldr}
                            </Badge>
                        </Stack>
                    ))
                )}

                {holdingsNews.length === 0 && news.length > 0 && (
                    <Text size="xs" c="dimmed" ta="center" mt="sm">
                        Showing general market news (no holdings-specific news available)
                    </Text>
                )}
            </Stack>
        </Card>
    );
};

export default NewsPreview;
