import React from 'react';
import { Card, Text, Group, Stack, Badge, Divider } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconWallet } from '@tabler/icons-react';
import { Position, PracticeLot } from '../types';
import { calculatePortfolioTotals, formatCurrency, formatPercentage } from '../utils';

interface PortfolioSummaryProps {
    positions: Position[];
    practiceLots: PracticeLot[];
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ positions, practiceLots }) => {
    const totals = calculatePortfolioTotals(positions, practiceLots);
    const isPositive = totals.totalDayChange >= 0;

    return (
        <Card shadow="md" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Group>
                    <IconWallet size={24} color="blue" />
                    <Text size="lg" fw={600}>
                        Portfolio Summary
                    </Text>
                </Group>
                <Badge color="blue" variant="light">
                    CAD
                </Badge>
            </Group>

            <Stack gap="sm">
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Total Value
                    </Text>
                    <Text size="xl" fw={700}>
                        {formatCurrency(totals.totalValue)}
                    </Text>
                </Group>

                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Day Change
                    </Text>
                    <Group gap="xs">
                        {isPositive ? (
                            <IconTrendingUp size={16} color="green" />
                        ) : (
                            <IconTrendingDown size={16} color="red" />
                        )}
                        <Text
                            size="md"
                            fw={600}
                            c={isPositive ? 'green' : 'red'}
                        >
                            {formatCurrency(totals.totalDayChange)} ({formatPercentage(totals.totalDayChangePct)})
                        </Text>
                    </Group>
                </Group>

                <Divider />

                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Total P/L
                    </Text>
                    <Text
                        size="md"
                        fw={600}
                        c={totals.totalPL >= 0 ? 'green' : 'red'}
                    >
                        {formatCurrency(totals.totalPL)}
                    </Text>
                </Group>

                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Positions
                    </Text>
                    <Text size="sm" fw={500}>
                        {positions.length} + {practiceLots.length} practice
                    </Text>
                </Group>
            </Stack>
        </Card>
    );
};

export default PortfolioSummary;
