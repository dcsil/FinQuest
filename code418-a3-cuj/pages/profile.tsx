import Head from "next/head";
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Progress, Avatar, Divider, Alert, Grid } from "@mantine/core";
import { IconTrophy, IconFlame, IconStar, IconSettings, IconTrash, IconRefresh, IconMedal, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { useAppContext } from "../context/AppContext";
import { getXPProgress, checkForNewBadges } from "../utils";

export default function Profile() {
    const { state } = useAppContext();
    const { user, gamification, positions, watchlist, completedTasks, tasks, practiceLots } = state;

    const xpProgress = getXPProgress(gamification.xp);
    const potentialBadges = checkForNewBadges(gamification);
    const totalXPFromTasks = completedTasks.reduce((total, taskId) => {
        const task = tasks.find(t => t.id === taskId);
        return total + (task ? (task.type === 'lesson' ? 20 : task.type === 'news_skim' ? 10 : task.type === 'simulate' ? 30 : 10) : 0);
    }, 0);

    const getBadgeIcon = (badge: string) => {
        switch (badge) {
            case 'day1': return <IconStar size={24} color="gold" />;
            case 'streak3': return <IconFlame size={24} color="orange" />;
            case 'streak7': return <IconTrophy size={24} color="purple" />;
            default: return <IconMedal size={24} />;
        }
    };

    const getBadgeLabel = (badge: string) => {
        switch (badge) {
            case 'day1': return 'First Day';
            case 'streak3': return '3 Day Streak';
            case 'streak7': return 'Week Warrior';
            default: return badge;
        }
    };

    const getBadgeDescription = (badge: string) => {
        switch (badge) {
            case 'day1': return 'Completed your first task';
            case 'streak3': return 'Maintained a 3-day streak';
            case 'streak7': return 'Achieved a 7-day streak';
            default: return 'Special achievement unlocked';
        }
    };

    const getRiskToleranceColor = (tolerance: string) => {
        switch (tolerance.toLowerCase()) {
            case 'low': return 'green';
            case 'medium': return 'orange';
            case 'high': return 'red';
            default: return 'gray';
        }
    };

    const handleResetData = () => {
        if (typeof window !== 'undefined' && confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
            // Clear localStorage and reload
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('demoApp:')) {
                    localStorage.removeItem(key);
                }
            });
            window.location.reload();
        }
    };

    return (
        <>
            <Head>
                <title>Profile - FinanceTracker</title>
                <meta name="description" content="Your personal profile and achievements" />
            </Head>

            <Container size="xl" p="md">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title order={1} size="h2" c="blue">
                            Your Profile 👤
                        </Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Track your progress and manage your account
                        </Text>
                    </div>
                </Group>

                <Grid>
                    {/* User Info */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="md" padding="lg" radius="md" withBorder>
                            <Group gap="md" mb="md">
                                <Avatar size="xl" color="blue" radius="xl">
                                    {user.name.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="xl" fw={600}>
                                        {user.name}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Investor since {new Date().getFullYear()}
                                    </Text>
                                </div>
                            </Group>

                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Risk Tolerance</Text>
                                    <Badge color={getRiskToleranceColor(user.riskTolerance)} variant="light">
                                        {user.riskTolerance}
                                    </Badge>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Investment Goal</Text>
                                    <Text size="sm" fw={500}>
                                        {user.goalHorizonYears} years
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Portfolio Holdings</Text>
                                    <Text size="sm" fw={500}>
                                        {positions.length} positions
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Watchlist Items</Text>
                                    <Text size="sm" fw={500}>
                                        {watchlist.length} items
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Practice Trades</Text>
                                    <Text size="sm" fw={500}>
                                        {practiceLots.length} lots
                                    </Text>
                                </Group>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* Level & XP */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="md" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Group>
                                    <IconTrophy size={24} color="gold" />
                                    <Text size="lg" fw={600}>
                                        Level & Progress
                                    </Text>
                                </Group>
                                <Badge color="orange" variant="light" size="lg">
                                    Level {gamification.level}
                                </Badge>
                            </Group>

                            <Stack gap="md">
                                <div>
                                    <Group justify="space-between" mb="xs">
                                        <Text size="sm" c="dimmed">XP Progress</Text>
                                        <Text size="sm" fw={500}>
                                            {xpProgress.current} / {xpProgress.needed}
                                        </Text>
                                    </Group>
                                    <Progress
                                        value={xpProgress.progress}
                                        size="lg"
                                        radius="md"
                                        color="blue"
                                        animated
                                    />
                                </div>

                                <Group justify="space-around">
                                    <Stack align="center" gap="xs">
                                        <Text size="sm" c="dimmed">Total XP</Text>
                                        <Text size="xl" fw={700} c="orange">
                                            {gamification.xp}
                                        </Text>
                                    </Stack>
                                    <Stack align="center" gap="xs">
                                        <Text size="sm" c="dimmed">Current Level</Text>
                                        <Text size="xl" fw={700} c="blue">
                                            {gamification.level}
                                        </Text>
                                    </Stack>
                                    <Stack align="center" gap="xs">
                                        <Text size="sm" c="dimmed">Next Level</Text>
                                        <Text size="xl" fw={700} c="green">
                                            {gamification.level + 1}
                                        </Text>
                                    </Stack>
                                </Group>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* Streak */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="md" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Group>
                                    <IconFlame size={24} color="orange" />
                                    <Text size="lg" fw={600}>
                                        Daily Streak
                                    </Text>
                                </Group>
                                <Badge color="orange" variant="light" size="lg">
                                    {gamification.streak} days
                                </Badge>
                            </Group>

                            <Stack gap="md">
                                <Group justify="center">
                                    <IconFlame size={48} color="orange" />
                                </Group>

                                <Text size="sm" ta="center" c="dimmed">
                                    Keep completing tasks daily to maintain your streak!
                                </Text>

                                <Group justify="space-around">
                                    <Stack align="center" gap="xs">
                                        <Text size="sm" c="dimmed">Current Streak</Text>
                                        <Text size="lg" fw={700} c="orange">
                                            {gamification.streak}
                                        </Text>
                                    </Stack>
                                    <Stack align="center" gap="xs">
                                        <Text size="sm" c="dimmed">Best Streak</Text>
                                        <Text size="lg" fw={700} c="red">
                                            {Math.max(gamification.streak, 0)}
                                        </Text>
                                    </Stack>
                                </Group>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* Achievements */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="md" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Group>
                                    <IconMedal size={24} color="gold" />
                                    <Text size="lg" fw={600}>
                                        Achievements
                                    </Text>
                                </Group>
                                <Badge color="gold" variant="light">
                                    {gamification.badges.length} badges
                                </Badge>
                            </Group>

                            <Stack gap="md">
                                {gamification.badges.length === 0 ? (
                                    <Stack align="center" gap="sm">
                                        <IconMedal size={32} color="gray" />
                                        <Text size="sm" c="dimmed" ta="center">
                                            Complete tasks to unlock achievements!
                                        </Text>
                                    </Stack>
                                ) : (
                                    <Stack gap="sm">
                                        {gamification.badges.map((badge, index) => (
                                            <Group key={index} justify="space-between" p="sm" bg="gold.0" style={{ borderRadius: '8px' }}>
                                                <Group gap="md">
                                                    {getBadgeIcon(badge)}
                                                    <div>
                                                        <Text size="sm" fw={500}>
                                                            {getBadgeLabel(badge)}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {getBadgeDescription(badge)}
                                                        </Text>
                                                    </div>
                                                </Group>
                                                <Badge color="gold" variant="light">
                                                    Unlocked
                                                </Badge>
                                            </Group>
                                        ))}
                                    </Stack>
                                )}

                                {potentialBadges.length > 0 && (
                                    <Alert color="blue" variant="light">
                                        <Text size="sm">
                                            Complete more tasks to unlock {potentialBadges.length} more achievements!
                                        </Text>
                                    </Alert>
                                )}
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>

                {/* Stats Overview */}
                <Card shadow="md" padding="lg" radius="md" withBorder mt="xl">
                    <Text size="lg" fw={600} mb="md">
                        Activity Summary
                    </Text>

                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Stack align="center" gap="xs">
                                <IconTarget size={24} color="blue" />
                                <Text size="sm" c="dimmed">Tasks Completed</Text>
                                <Text size="xl" fw={700} c="blue">
                                    {completedTasks.length}
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Stack align="center" gap="xs">
                                <IconTrendingUp size={24} color="green" />
                                <Text size="sm" c="dimmed">XP Earned</Text>
                                <Text size="xl" fw={700} c="green">
                                    {totalXPFromTasks}
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Stack align="center" gap="xs">
                                <IconStar size={24} color="orange" />
                                <Text size="sm" c="dimmed">Achievements</Text>
                                <Text size="xl" fw={700} c="orange">
                                    {gamification.badges.length}
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                            <Stack align="center" gap="xs">
                                <IconFlame size={24} color="red" />
                                <Text size="sm" c="dimmed">Best Streak</Text>
                                <Text size="xl" fw={700} c="red">
                                    {Math.max(gamification.streak, 0)}
                                </Text>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Card>

                {/* Settings */}
                <Card shadow="md" padding="lg" radius="md" withBorder mt="xl">
                    <Group justify="space-between" mb="md">
                        <Group>
                            <IconSettings size={24} color="gray" />
                            <Text size="lg" fw={600}>
                                Settings
                            </Text>
                        </Group>
                    </Group>

                    <Stack gap="md">
                        <Divider />

                        <Group justify="space-between" align="center">
                            <div>
                                <Text size="sm" fw={500}>Reset All Data</Text>
                                <Text size="xs" c="dimmed">
                                    Clear all progress, achievements, and data
                                </Text>
                            </div>
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={handleResetData}
                            >
                                Reset Data
                            </Button>
                        </Group>

                        <Group justify="space-between" align="center">
                            <div>
                                <Text size="sm" fw={500}>Refresh App</Text>
                                <Text size="xs" c="dimmed">
                                    Reload the application
                                </Text>
                            </div>
                            <Button
                                variant="light"
                                color="blue"
                                leftSection={<IconRefresh size={16} />}
                                onClick={() => window.location.reload()}
                            >
                                Refresh
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </Container>
        </>
    );
}
