import React from 'react';
import { Card, Text, Group, Stack } from '@mantine/core';
import { PieChart } from '@mantine/charts';
import { IconChartPie } from '@tabler/icons-react';
import { Position, PracticeLot } from '../types';
import { calculateAllocation } from '../utils';

interface AllocationChartProps {
    positions: Position[];
    practiceLots: PracticeLot[];
}

const AllocationChart: React.FC<AllocationChartProps> = ({ positions, practiceLots }) => {
    const allocation = calculateAllocation(positions, practiceLots);

    // Define colors for each category
    const categoryColors: { [key: string]: string } = {
        'US Equity ETF': '#339af0',
        'Canada Equity ETF': '#51cf66',
        'Bond ETF': '#ffd43b',
        'US Tech Equity': '#ff6b6b',
        'Global Equity ETF': '#9775fa'
    };

    const chartData = allocation.map(item => ({
        name: item.category,
        value: item.percentage,
        color: categoryColors[item.category] || '#868e96'
    }));

    if (allocation.length === 0) {
        return (
            <Card shadow="md" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Group>
                        <IconChartPie size={24} color="blue" />
                        <Text size="lg" fw={600}>
                            Asset Allocation
                        </Text>
                    </Group>
                </Group>
                <Stack align="center" gap="md">
                    <Text size="sm" c="dimmed" ta="center">
                        No positions to display
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                        Add some investments to see your allocation breakdown
                    </Text>
                </Stack>
            </Card>
        );
    }

    return (
        <Card shadow="md" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Group>
                    <IconChartPie size={24} color="blue" />
                    <Text size="lg" fw={600}>
                        Asset Allocation
                    </Text>
                </Group>
            </Group>

            <Stack gap="md">
                <div style={{ height: 200 }}>
                    <PieChart
                        data={chartData}
                        size={180}
                        thickness={40}
                        withTooltip
                        tooltipDataSource="segment"
                        withLabels
                        labelsPosition="outside"
                        labelsType="percent"
                        withLabelsLine
                    />
                </div>

                <Stack gap="xs">
                    {allocation.map((item, index) => (
                        <Group key={item.category} justify="space-between">
                            <Group gap="xs">
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: categoryColors[item.category] || '#868e96'
                                    }}
                                />
                                <Text size="sm">{item.category}</Text>
                            </Group>
                            <Text size="sm" fw={500}>
                                {item.percentage.toFixed(1)}%
                            </Text>
                        </Group>
                    ))}
                </Stack>
            </Stack>
        </Card>
    );
};

export default AllocationChart;
