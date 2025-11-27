import Head from "next/head";
import { useState, useEffect } from "react";
import {
    Container,
    Title,
    Text,
    Stack,
    Card,
    AppShell,
    Skeleton,
    Box,
} from "@mantine/core";
import { AppNav } from "@/components/AppNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usersApi } from "@/lib/api";
import type { Suggestion } from "@/types/learning";
import { LearningPathway } from "@/components/LearningPathway";

/**
 * Learning page skeleton component for loading state
 */
const LearnSkeleton = () => (
    <Stack gap="xl">
        <div>
            <Skeleton height={36} width={300} mb="xs" />
            <Skeleton height={20} width={500} />
        </div>

        <Box style={{ position: 'relative', padding: '2rem 0' }}>
            <Stack gap={0} align="center">
                {[1, 2, 3, 4, 5].map((i, index) => (
                    <Box key={i} style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                        {index < 4 && (
                            <Box
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '100%',
                                    transform: 'translateX(-50%)',
                                    width: '3px',
                                    height: '80px',
                                    background: 'linear-gradient(to bottom, #dee2e6, #e9ecef)',
                                    zIndex: 0,
                                    borderRadius: '2px',
                                }}
                            />
                        )}
                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative', zIndex: 1 }}>
                            <Stack gap="md">
                                <Skeleton height={24} width="60%" />
                                <Skeleton height={16} width="100%" />
                                <Skeleton height={16} width="90%" />
                                <Skeleton height={36} width="100%" radius="md" />
                            </Stack>
                        </Card>
                        {index < 4 && <Box h={80} />}
                    </Box>
                ))}
            </Stack>
        </Box>
    </Stack>
);

const Learn = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

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
                                <LearnSkeleton />
                            ) : suggestions.length === 0 ? (
                                <Card withBorder padding="xl" radius="md">
                                    <Text ta="center" size="lg">
                                        No learning modules available yet. Complete your profile or add positions to get recommendations.
                                    </Text>
                                </Card>
                            ) : (
                                <LearningPathway suggestions={suggestions} />
                            )}
                        </Stack>
                    </Container>
                </AppShell.Main>
            </AppShell>
        </ProtectedRoute>
    );
};

export default Learn;
