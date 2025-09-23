import React, { useState } from 'react';
import { Card, Text, Group, Button, Stack, Badge, Checkbox, ActionIcon } from '@mantine/core';
import { IconChecklist, IconClock, IconCheck, IconX } from '@tabler/icons-react';
import { Task } from '../types';
import { useAppContext } from '../context/AppContext';

interface TodaysTasksProps {
    tasks: Task[];
    completedTasks: string[];
}

const TodaysTasks: React.FC<TodaysTasksProps> = ({ tasks, completedTasks }) => {
    const { completeTask, undoTask } = useAppContext();
    const [showAll, setShowAll] = useState(false);

    // Get today's 3 tasks (or show all if showAll is true)
    const todaysTasks = showAll ? tasks : tasks.slice(0, 3);
    const completedCount = todaysTasks.filter(task => completedTasks.includes(task.id)).length;

    const handleTaskToggle = (task: Task) => {
        if (completedTasks.includes(task.id)) {
            undoTask(task.id, task.type);
        } else {
            completeTask(task.id, task.type);
        }
    };

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'lesson': return '📚';
            case 'news_skim': return '📰';
            case 'simulate': return '💰';
            case 'review_holdings': return '📊';
            default: return '✅';
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

    return (
        <Card shadow="md" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Group>
                    <IconChecklist size={24} color="blue" />
                    <Text size="lg" fw={600}>
                        Today&apos;s Tasks
                    </Text>
                </Group>
                <Badge color="blue" variant="light">
                    {completedCount}/{todaysTasks.length} done
                </Badge>
            </Group>

            <Stack gap="md">
                {todaysTasks.map((task) => {
                    const isCompleted = completedTasks.includes(task.id);

                    return (
                        <Group
                            key={task.id}
                            justify="space-between"
                            p="sm"
                            style={{
                                borderRadius: '8px',
                                backgroundColor: isCompleted ? '#f0f9ff' : '#fafafa',
                                border: isCompleted ? '1px solid #0ea5e9' : '1px solid #e5e7eb'
                            }}
                        >
                            <Group gap="md" style={{ flex: 1 }}>
                                <Checkbox
                                    checked={isCompleted}
                                    onChange={() => handleTaskToggle(task)}
                                    size="md"
                                    color="blue"
                                />
                                <Stack gap="xs" style={{ flex: 1 }}>
                                    <Text
                                        size="sm"
                                        fw={500}
                                        style={{
                                            textDecoration: isCompleted ? 'line-through' : 'none',
                                            opacity: isCompleted ? 0.7 : 1
                                        }}
                                    >
                                        {task.title}
                                    </Text>
                                    <Group gap="xs">
                                        <Badge
                                            size="xs"
                                            color={getTaskColor(task.type)}
                                            variant="light"
                                            leftSection={getTaskIcon(task.type)}
                                        >
                                            {task.type.replace('_', ' ')}
                                        </Badge>
                                        <Group gap="xs">
                                            <IconClock size={12} color="gray" />
                                            <Text size="xs" c="dimmed">
                                                {task.estMins} min
                                            </Text>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Group>
                            <ActionIcon
                                variant="subtle"
                                color={isCompleted ? "green" : "gray"}
                                onClick={() => handleTaskToggle(task)}
                            >
                                {isCompleted ? <IconCheck size={16} /> : <IconX size={16} />}
                            </ActionIcon>
                        </Group>
                    );
                })}

                {tasks.length > 3 && !showAll && (
                    <Button
                        variant="light"
                        color="blue"
                        fullWidth
                        onClick={() => setShowAll(true)}
                    >
                        Show All Tasks ({tasks.length})
                    </Button>
                )}

                {completedCount === todaysTasks.length && todaysTasks.length > 0 && (
                    <Card bg="green.0" p="md" radius="md">
                        <Group justify="center" gap="xs">
                            <Text size="sm" fw={500} c="green">
                                🎉 Nice work! All tasks completed!
                            </Text>
                        </Group>
                    </Card>
                )}
            </Stack>
        </Card>
    );
};

export default TodaysTasks;
