import Head from "next/head";
import { Grid, Container, Title, Text, Group, Button, Stack } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { useAppContext } from "../context/AppContext";
import PortfolioSummary from "../components/PortfolioSummary";
import AllocationChart from "../components/AllocationChart";
import GamificationWidget from "../components/GamificationWidget";
import TodaysTasks from "../components/TodaysTasks";
import NewsPreview from "../components/NewsPreview";

export default function Dashboard() {
    const { state } = useAppContext();
    const { user, positions, watchlist, news, tasks, gamification, completedTasks, practiceLots } = state;

    return (
        <>
            <Head>
                <title>Dashboard - FinanceTracker</title>
                <meta name="description" content="Your personal finance dashboard for tracking investments and daily tasks" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Container size="xl" p="md">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title order={1} size="h2" c="blue">
                            Good morning, {user.name}! 👋
                        </Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Here's your 5-minute daily check-in
                        </Text>
                    </div>
                    <Group>
                        <Button
                            component={Link}
                            href="/holdings"
                            rightSection={<IconArrowRight size={16} />}
                            variant="light"
                        >
                            View Holdings
                        </Button>
                    </Group>
                </Group>

                {/* Quick Stats */}
                <Grid mb="xl">
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Group justify="center" p="md" bg="blue.0" style={{ borderRadius: '8px' }}>
                            <Text size="sm" c="blue" fw={500}>
                                📊 {positions.length} Holdings
                            </Text>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Group justify="center" p="md" bg="green.0" style={{ borderRadius: '8px' }}>
                            <Text size="sm" c="green" fw={500}>
                                👁️ {watchlist.length} Watchlist
                            </Text>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Group justify="center" p="md" bg="orange.0" style={{ borderRadius: '8px' }}>
                            <Text size="sm" c="orange" fw={500}>
                                🔥 {gamification.streak} Day Streak
                            </Text>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Group justify="center" p="md" bg="violet.0" style={{ borderRadius: '8px' }}>
                            <Text size="sm" c="violet" fw={500}>
                                🏆 Level {gamification.level}
                            </Text>
                        </Group>
                    </Grid.Col>
                </Grid>

                <Grid>
                    {/* Left Column */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="md">
                            <PortfolioSummary positions={positions} practiceLots={practiceLots} />
                            <AllocationChart positions={positions} practiceLots={practiceLots} />
                        </Stack>
                    </Grid.Col>

                    {/* Right Column */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="md">
                            <TodaysTasks tasks={tasks} completedTasks={completedTasks} />
                            <GamificationWidget gamification={gamification} />
                            <NewsPreview news={news} positions={positions} />
                        </Stack>
                    </Grid.Col>
                </Grid>

            </Container>
        </>
    );
}
