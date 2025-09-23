import Head from "next/head";
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Checkbox, ActionIcon, Progress } from "@mantine/core";
import { IconChecklist, IconClock, IconCheck, IconX, IconTrophy, IconStar, IconBook, IconNews, IconCurrencyDollar, IconChartBar } from "@tabler/icons-react";
import { useAppContext } from "../context/AppContext";
import { getXPReward } from "../utils";

export default function Tasks() {
    const { state, completeTask, undoTask } = useAppContext();
    const { tasks, completedTasks, gamification } = state;

    const handleTaskToggle = (taskId: string, taskType: string) => {
        if (completedTasks.includes(taskId)) {
            undoTask(taskId, taskType);
        } else {
            completeTask(taskId, taskType);
        }
    };

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'lesson': return <IconBook size={20} color="blue" />;
            case 'news_skim': return <IconNews size={20} color="green" />;
            case 'simulate': return <IconCurrencyDollar size={20} color="orange" />;
            case 'review_holdings': return <IconChartBar size={20} color="purple" />;
            default: return <IconChecklist size={20} />;
        }
    };

    const getTaskColor = (type: string) => {
        switch (type) {
            case 'lesson': return 'blue';
            case 'news_skim': return 'green';
            case 'simulate': return 'orange';
            case 'review_holdings': return 'purple';
            default: return 'gray';
        }
    };

    const getTaskDescription = (type: string) => {
        switch (type) {
            case 'lesson': return 'Educational content to improve your financial knowledge';
            case 'news_skim': return 'Quick news updates to stay informed';
            case 'simulate': return 'Practice trading with virtual money';
            case 'review_holdings': return 'Review and analyze your current investments';
            default: return 'General task to help you stay engaged';
        }
    };

    const completedCount = completedTasks.length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

    const tasksByType = tasks.reduce((acc, task) => {
        if (!acc[task.type]) acc[task.type] = [];
        acc[task.type].push(task);
        return acc;
    }, {} as Record<string, typeof tasks>);

    return (
        <>
            <Head>
                <title>Tasks - FinanceTracker</title>
                <meta name="description" content="Complete daily tasks to build your investment knowledge" />
            </Head>

            <Container size="xl" p="md">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title order={1} size="h2" c="blue">
                            Daily Tasks 📋
                        </Title>
                        <Text size="sm" c="dimmed" mt="xs">
                            Complete tasks to earn XP and build your investment knowledge
                        </Text>
                    </div>
                    <Group gap="md">
                        <Badge color="blue" variant="light" size="lg">
                            {completedCount}/{totalTasks} done
                        </Badge>
                        <Badge color="orange" variant="light" size="lg">
                            {gamification.xp} XP
                        </Badge>
                    </Group>
                </Group>

                {/* Progress Overview */}
                <Card shadow="md" padding="lg" radius="md" withBorder mb="xl">
                    <Group justify="space-between" mb="md">
                        <Text size="lg" fw={600}>
                            Progress Overview
                        </Text>
                        <Group gap="xs">
                            <IconTrophy size={20} color="gold" />
                            <Text size="sm" fw={500} c="orange">
                                Level {gamification.level}
                            </Text>
                        </Group>
                    </Group>

                    <Stack gap="md">
                        <div>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" c="dimmed">Task Completion</Text>
                                <Text size="sm" fw={500}>{completionRate.toFixed(1)}%</Text>
                            </Group>
                            <Progress
                                value={completionRate}
                                size="lg"
                                radius="md"
                                color="blue"
                                animated
                            />
                        </div>

                        <Group justify="space-around">
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed">Completed</Text>
                                <Text size="xl" fw={700} c="green">
                                    {completedCount}
                                </Text>
                            </Stack>
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed">Remaining</Text>
                                <Text size="xl" fw={700} c="blue">
                                    {totalTasks - completedCount}
                                </Text>
                            </Stack>
                            <Stack align="center" gap="xs">
                                <Text size="sm" c="dimmed">XP Earned</Text>
                                <Text size="xl" fw={700} c="orange">
                                    {completedTasks.reduce((total, taskId) => {
                                        const task = tasks.find(t => t.id === taskId);
                                        return total + (task ? getXPReward(task.type) : 0);
                                    }, 0)}
                                </Text>
                            </Stack>
                        </Group>
                    </Stack>
                </Card>

                {/* Tasks by Category */}
                <Stack gap="xl">
                    {Object.entries(tasksByType).map(([type, typeTasks]) => {
                        const completedInType = typeTasks.filter(task => completedTasks.includes(task.id)).length;
                        const typeCompletionRate = (completedInType / typeTasks.length) * 100;

                        return (
                            <Card key={type} shadow="md" padding="lg" radius="md" withBorder>
                                <Stack gap="md">
                                    <Group justify="space-between" align="center">
                                        <Group gap="md">
                                            {getTaskIcon(type)}
                                            <div>
                                                <Text size="lg" fw={600} tt="capitalize">
                                                    {type.replace('_', ' ')} Tasks
                                                </Text>
                                                <Text size="sm" c="dimmed">
                                                    {getTaskDescription(type)}
                                                </Text>
                                            </div>
                                        </Group>
                                        <Group gap="xs">
                                            <Badge color={getTaskColor(type)} variant="light">
                                                {completedInType}/{typeTasks.length}
                                            </Badge>
                                            <Badge color="orange" variant="light">
                                                +{getXPReward(type)} XP each
                                            </Badge>
                                        </Group>
                                    </Group>

                                    <Progress
                                        value={typeCompletionRate}
                                        size="sm"
                                        radius="md"
                                        color={getTaskColor(type)}
                                    />

                                    <Stack gap="sm">
                                        {typeTasks.map((task) => {
                                            const isCompleted = completedTasks.includes(task.id);

                                            return (
                                                <Group
                                                    key={task.id}
                                                    justify="space-between"
                                                    p="md"
                                                    style={{
                                                        borderRadius: '8px',
                                                        backgroundColor: isCompleted ? '#f0f9ff' : '#fafafa',
                                                        border: isCompleted ? '1px solid #0ea5e9' : '1px solid #e5e7eb'
                                                    }}
                                                >
                                                    <Group gap="md" style={{ flex: 1 }}>
                                                        <Checkbox
                                                            checked={isCompleted}
                                                            onChange={() => handleTaskToggle(task.id, task.type)}
                                                            size="md"
                                                            color={getTaskColor(task.type)}
                                                        />
                                                        <Stack gap="xs" style={{ flex: 1 }}>
                                                            <Text
                                                                size="md"
                                                                fw={500}
                                                                style={{
                                                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                                                    opacity: isCompleted ? 0.7 : 1
                                                                }}
                                                            >
                                                                {task.title}
                                                            </Text>
                                                            <Group gap="md">
                                                                <Group gap="xs">
                                                                    <IconClock size={14} color="gray" />
                                                                    <Text size="sm" c="dimmed">
                                                                        {task.estMins} min
                                                                    </Text>
                                                                </Group>
                                                                <Badge
                                                                    size="sm"
                                                                    color={getTaskColor(task.type)}
                                                                    variant="light"
                                                                >
                                                                    +{getXPReward(task.type)} XP
                                                                </Badge>
                                                                {task.params && (
                                                                    <Badge size="sm" variant="outline" color="gray">
                                                                        {task.params.ticker} • ${task.params.amount}
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                        </Stack>
                                                    </Group>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color={isCompleted ? "green" : "gray"}
                                                        size="lg"
                                                        onClick={() => handleTaskToggle(task.id, task.type)}
                                                    >
                                                        {isCompleted ? <IconCheck size={20} /> : <IconX size={20} />}
                                                    </ActionIcon>
                                                </Group>
                                            );
                                        })}
                                    </Stack>
                                </Stack>
                            </Card>
                        );
                    })}
                </Stack>

                {/* Completion Celebration */}
                {completedCount === totalTasks && totalTasks > 0 && (
                    <Card shadow="md" padding="xl" radius="md" withBorder bg="green.0" mt="xl">
                        <Stack align="center" gap="md">
                            <Group gap="xs">
                                <IconTrophy size={32} color="gold" />
                                <IconStar size={32} color="gold" />
                                <IconTrophy size={32} color="gold" />
                            </Group>
                            <Text size="xl" fw={700} c="green" ta="center">
                                🎉 Congratulations! 🎉
                            </Text>
                            <Text size="md" c="green" ta="center" maw={400}>
                                You've completed all available tasks! Great job staying consistent with your financial education.
                            </Text>
                            <Group gap="md" mt="md">
                                <Button
                                    variant="light"
                                    color="green"
                                    leftSection={<IconChartBar size={16} />}
                                    component="a"
                                    href="/holdings"
                                >
                                    Review Holdings
                                </Button>
                                <Button
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconNews size={16} />}
                                    component="a"
                                    href="/news"
                                >
                                    Read News
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                )}

                {/* Tips */}
                <Card shadow="md" padding="lg" radius="md" withBorder mt="xl">
                    <Group gap="md" mb="md">
                        <IconStar size={20} color="blue" />
                        <Text size="lg" fw={600}>
                            Tips for Success
                        </Text>
                    </Group>
                    <Stack gap="sm">
                        <Text size="sm">
                            • Complete at least one task daily to maintain your streak
                        </Text>
                        <Text size="sm">
                            • Focus on lessons first to build foundational knowledge
                        </Text>
                        <Text size="sm">
                            • Use simulation tasks to practice without risk
                        </Text>
                        <Text size="sm">
                            • Stay informed by completing news skim tasks regularly
                        </Text>
                    </Stack>
                </Card>
            </Container>
        </>
    );
}
