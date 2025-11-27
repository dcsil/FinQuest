/**
 * XP Progress Bar Component
 */
import { motion } from 'framer-motion';
import { Progress, Text, Group } from '@mantine/core';
import { useGamification } from '@/contexts/GamificationContext';

export const XPBar = () => {
    const { totalXp, level, xpToNextLevel } = useGamification();

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

    return (
        <Group gap="xs" style={{ minWidth: '200px' }}>
            <Text size="sm" fw={600}>
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

