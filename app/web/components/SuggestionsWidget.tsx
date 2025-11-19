import { Card, Text, Group, Badge, Button, Stack, ThemeIcon, SimpleGrid } from '@mantine/core';
import { IconBook, IconChartBar, IconAlertTriangle, IconArrowRight } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import type { Suggestion } from '@/types/learning';

export interface SuggestionsWidgetProps {
    suggestions: Suggestion[];
    loading?: boolean;
}

export const SuggestionsWidget = ({ suggestions, loading }: SuggestionsWidgetProps) => {
    const router = useRouter();

    const getIcon = (type: string) => {
        switch (type) {
            case "investment":
                return <IconChartBar size={20} />;
            case "warning":
                return <IconAlertTriangle size={20} />;
            default:
                return <IconBook size={20} />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "investment":
                return "blue";
            case "warning":
                return "orange";
            default:
                return "teal";
        }
    };

    const getConfidenceLabel = (confidence: number | null) => {
        if (!confidence) return { label: 'Match', color: 'gray' };
        if (confidence >= 0.8) return { label: 'High Match', color: 'green' };
        if (confidence >= 0.5) return { label: 'Medium Match', color: 'yellow' };
        return { label: 'Low Match', color: 'gray' };
    };

    if (loading) {
        return (
            <Card withBorder padding="lg" radius="md">
                <Text>Loading suggestions...</Text>
            </Card>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    // Show only top 3 suggestions
    const topSuggestions = suggestions.slice(0, 3);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Text size="xl" fw={700}>AI Suggestions</Text>
                <Button variant="subtle" onClick={() => router.push('/learn')} rightSection={<IconArrowRight size={16} />}>
                    View All
                </Button>
            </Group>
            
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                {topSuggestions.map((suggestion) => (
                    <Card key={suggestion.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Card.Section withBorder inheritPadding py="xs">
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <ThemeIcon
                                        color={getColor(suggestion.metadata?.type || "")}
                                        variant="light"
                                        size="md"
                                    >
                                        {getIcon(suggestion.metadata?.type || "")}
                                    </ThemeIcon>
                                    <Text fw={500} size="sm" tt="capitalize">
                                        {suggestion.metadata?.topic || "General"}
                                    </Text>
                                </Group>
                                {suggestion.confidence && (
                                    <Badge variant="light" color={getConfidenceLabel(suggestion.confidence).color} size="sm">
                                        {getConfidenceLabel(suggestion.confidence).label}
                                    </Badge>
                                )}
                            </Group>
                        </Card.Section>

                        <Stack mt="md" mb="md" style={{ flex: 1 }}>
                            <Text size="sm" c="dimmed" lineClamp={2}>
                                {suggestion.reason}
                            </Text>
                        </Stack>

                        <Button
                            variant="light"
                            color="blue"
                            fullWidth
                            size="xs"
                            onClick={() => router.push(`/modules/${suggestion.moduleId}`)}
                        >
                            Start Module
                        </Button>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
};
