import Head from "next/head";
import { useState, useEffect } from "react";
import {
    Container,
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Button,
    Group,
    ThemeIcon,
    Loader,
    Center,
    AppShell,
} from "@mantine/core";
import { IconBook, IconChartBar, IconAlertTriangle, IconArrowRight } from "@tabler/icons-react";
import { AppNav } from "@/components/AppNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usersApi } from "@/lib/api";
import { useRouter } from "next/router";
import type { Suggestion } from "@/types/learning";

const Learn = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const data = await usersApi.getSuggestions();
                setSuggestions(data);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    const getIcon = (type: string | undefined) => {
        switch (type) {
            case "investment":
                return <IconChartBar size={24} />;
            case "warning":
                return <IconAlertTriangle size={24} />;
            default:
                return <IconBook size={24} />;
        }
    };

    const getColor = (type: string | undefined) => {
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
        if (!confidence) return { label: 'Low Match', color: 'gray' };
        if (confidence >= 0.8) return { label: 'High Match', color: 'green' };
        if (confidence >= 0.5) return { label: 'Medium Match', color: 'yellow' };
        return { label: 'Low Match', color: 'gray' };
    };

    return (
        <ProtectedRoute>
            <Head>
                <title>Learn - FinQuest</title>
            </Head>
            <AppShell header={{ height: 70 }}>
                <AppNav />
                <AppShell.Main>
                    <Container size="xl" py="xl">
                        <Stack gap="xl">
                            <div>
                                <Title order={1}>Your Learning Path</Title>
                                <Text c="dimmed" size="lg">
                                    Personalized modules to help you reach your financial goals.
                                </Text>
                            </div>

                            {loading ? (
                                <Center h={200}>
                                    <Loader size="lg" />
                                </Center>
                            ) : suggestions.length === 0 ? (
                                <Card withBorder padding="xl" radius="md">
                                    <Text ta="center" size="lg">
                                        No learning modules available yet. Complete your profile or add positions to get recommendations.
                                    </Text>
                                </Card>
                            ) : (
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                                    {suggestions.map((suggestion) => (
                                        <Card
                                            key={suggestion.id}
                                            shadow="sm"
                                            padding="lg"
                                            radius="md"
                                            withBorder
                                            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                                        >
                                            <Card.Section withBorder inheritPadding py="xs">
                                                <Group justify="space-between">
                                                    <Group gap="xs">
                                                        <ThemeIcon
                                                            color={getColor(suggestion.metadata?.type)}
                                                            variant="light"
                                                            size="lg"
                                                        >
                                                            {getIcon(suggestion.metadata?.type)}
                                                        </ThemeIcon>
                                                        <Text fw={500} tt="capitalize">
                                                            {suggestion.metadata?.topic || "General"}
                                                        </Text>
                                                    </Group>
                                                    {suggestion.confidence && (
                                                        <Badge variant="light" color={getConfidenceLabel(suggestion.confidence).color}>
                                                            {getConfidenceLabel(suggestion.confidence).label}
                                                        </Badge>
                                                    )}
                                                </Group>
                                            </Card.Section>

                                            <Stack mt="md" mb="md" style={{ flex: 1 }}>
                                                <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                                                    {suggestion.reason}
                                                </Text>
                                            </Stack>

                                            <Button
                                                variant="light"
                                                color="blue"
                                                fullWidth
                                                rightSection={<IconArrowRight size={14} />}
                                                onClick={() => router.push(`/modules/${suggestion.moduleId}`)}
                                            >
                                                Start Module
                                            </Button>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            )}
                        </Stack>
                    </Container>
                </AppShell.Main>
            </AppShell>
        </ProtectedRoute>
    );
};

export default Learn;
