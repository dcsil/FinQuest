/**
 * Gamification Engagement Component
 * Displays streak, level progress, and encourages module completion
 */
import { Paper, Group, Text, Button, Stack, useMantineColorScheme, Skeleton } from '@mantine/core';
import { IconFlame, IconTrendingUp, IconBook, IconSparkles } from '@tabler/icons-react';
import { useGamification } from '@/contexts/GamificationContext';
import { useRouter } from 'next/router';
import type { Suggestion } from '@/types/learning';

interface GamificationEngagementProps {
    suggestions?: Suggestion[];
    loadingSuggestions?: boolean;
}

export const GamificationEngagement = ({
    suggestions = [],
    loadingSuggestions = false
}: GamificationEngagementProps) => {
    const { currentStreak, xpToNextLevel, loading } = useGamification();
    const { colorScheme } = useMantineColorScheme();
    const router = useRouter();
    const isDark = colorScheme === 'dark';

    // Check if close to leveling up (within 50 XP)
    const isCloseToLevelUp = xpToNextLevel <= 50 && xpToNextLevel > 0;

    // Check if there are available modules
    const hasAvailableModules = suggestions.length > 0;

    if (loading || loadingSuggestions) {
        return (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <Skeleton height={40} width={40} radius="md" />
                        <Stack gap={4}>
                            <Skeleton height={16} width={200} />
                            <Skeleton height={14} width={150} />
                        </Stack>
                    </Group>
                    <Skeleton height={36} width={120} radius="md" />
                </Group>
            </Paper>
        );
    }

    // Don't show if no streak and not close to level up and no modules
    if (currentStreak === 0 && !isCloseToLevelUp && !hasAvailableModules) {
        return null;
    }

    const getEncouragementMessage = () => {
        if (currentStreak > 0 && isCloseToLevelUp && hasAvailableModules) {
            return `🔥 ${currentStreak}-day streak! You're ${xpToNextLevel} XP away from leveling up. Complete a module to level up!`;
        }
        if (currentStreak > 0 && isCloseToLevelUp) {
            return `🔥 ${currentStreak}-day streak! You're ${xpToNextLevel} XP away from leveling up!`;
        }
        if (currentStreak > 0 && hasAvailableModules) {
            return `🔥 ${currentStreak}-day streak! Keep it up! Complete a new module to earn more XP.`;
        }
        if (currentStreak > 0) {
            return `🔥 ${currentStreak}-day streak! Keep it up!`;
        }
        if (isCloseToLevelUp && hasAvailableModules) {
            return `You're ${xpToNextLevel} XP away from leveling up! Complete a module to level up!`;
        }
        if (isCloseToLevelUp) {
            return `You're ${xpToNextLevel} XP away from leveling up!`;
        }
        if (hasAvailableModules) {
            return 'Complete a new module to earn XP and level up!';
        }
        return null;
    };

    const message = getEncouragementMessage();
    if (!message) return null;

    return (
        <Paper
            shadow="sm"
            p="lg"
            radius="md"
            withBorder
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: isDark
                    ? '1px solid rgba(139, 92, 246, 0.2)'
                    : '1px solid rgba(139, 92, 246, 0.1)',
            }}
        >
            <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="md" style={{ flex: 1, minWidth: 250 }}>
                    {currentStreak > 0 && (
                        <IconFlame
                            size={32}
                            style={{
                                color: '#f5576c',
                                filter: 'drop-shadow(0 2px 4px rgba(245, 87, 108, 0.3))'
                            }}
                        />
                    )}
                    {isCloseToLevelUp && currentStreak === 0 && (
                        <IconTrendingUp
                            size={32}
                            style={{
                                color: '#8b5cf6',
                                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))'
                            }}
                        />
                    )}
                    {!currentStreak && !isCloseToLevelUp && (
                        <IconSparkles
                            size={32}
                            style={{
                                color: '#8b5cf6',
                                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))'
                            }}
                        />
                    )}
                    <Text
                        size="md"
                        fw={500}
                        c={isDark ? 'gray.0' : 'dark.8'}
                        style={{ flex: 1 }}
                    >
                        {message}
                    </Text>
                </Group>
                {hasAvailableModules && (
                    <Button
                        leftSection={<IconBook size={18} />}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'purple', deg: 90 }}
                        onClick={() => router.push('/learn')}
                        radius="md"
                    >
                        Start Learning
                    </Button>
                )}
            </Group>
        </Paper>
    );
};

