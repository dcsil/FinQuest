/**
 * XP Progress Bar Component (Compact version for navbar)
 */
import { Progress, Text, Group, useMantineColorScheme, Tooltip, Skeleton } from '@mantine/core';
import { useGamification } from '@/contexts/GamificationContext';

interface XPBarProps {
    compact?: boolean;
}

export const XPBar = ({ compact = false }: XPBarProps) => {
    const { totalXp, level, xpToNextLevel, loading } = useGamification();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    
    if (loading) {
        if (compact) {
            return (
                <Group gap={4} style={{ minWidth: '140px' }}>
                    <Skeleton height={16} width={50} radius="sm" />
                    <Skeleton height={8} style={{ flex: 1, minWidth: '60px' }} radius="xl" />
                </Group>
            );
        }
        return (
            <Group gap="xs" style={{ minWidth: '200px' }}>
                <Skeleton height={16} width={60} radius="sm" />
                <Skeleton height={12} style={{ flex: 1 }} radius="xl" />
                <Skeleton height={14} width={80} radius="sm" />
            </Group>
        );
    }

    // Calculate XP thresholds based on level
    const getLevelThreshold = (lvl: number): number => {
        if (lvl <= 1) return 0;
        if (lvl <= 5) return (lvl - 1) * 200;
        return 1000 + (lvl - 6) * 500;
    };

    const currentLevelThreshold = getLevelThreshold(level);
    const nextLevelThreshold = level >= 10 ? currentLevelThreshold : getLevelThreshold(level + 1);
    const xpInCurrentLevel = totalXp - currentLevelThreshold;
    const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold;
    const percent = level >= 10 ? 100 : xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0;

    const tooltipText = level >= 10
        ? `Level ${level} (MAX)`
        : `Level ${level}: ${xpInCurrentLevel}/${xpNeededForLevel} XP (${xpToNextLevel} XP to next level)`;

    if (compact) {
        const xpBarContent = (
            <Group gap={4} style={{ minWidth: '140px' }}>
                <Text 
                    size="xs" 
                    fw={600} 
                    c={isDark ? 'white' : 'dark.9'}
                    style={{ 
                        color: isDark ? '#fff' : undefined,
                        textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                    }}
                >
                    Level {level}
                </Text>
                <Progress
                    value={Math.max(0, Math.min(100, percent))}
                    size="sm"
                    radius="xl"
                    style={{ flex: 1, minWidth: '60px' }}
                    color={level >= 7 ? 'yellow' : level >= 4 ? 'blue' : 'gray'}
                />
            </Group>
        );

        return (
            <Tooltip label={tooltipText} withArrow>
                {xpBarContent}
            </Tooltip>
        );
    }

    return (
        <Group gap="xs" style={{ minWidth: '200px' }}>
            <Text size="sm" fw={600} c={isDark ? 'gray.0' : 'dark.9'}>
                Level {level}
            </Text>
            <Progress
                value={Math.max(0, Math.min(100, percent))}
                size="md"
                radius="xl"
                style={{ flex: 1 }}
                color={level >= 7 ? 'yellow' : level >= 4 ? 'blue' : 'gray'}
            />
            <Text size="xs" c="dimmed">
                {level >= 10 ? 'MAX' : `${xpToNextLevel} XP to next`}
            </Text>
        </Group>
    );
};

