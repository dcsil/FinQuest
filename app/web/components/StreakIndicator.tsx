/**
 * Streak Indicator Component
 */
import { motion } from 'framer-motion';
import { Group, Text, useMantineColorScheme, Tooltip } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { useGamification } from '@/contexts/GamificationContext';

interface StreakIndicatorProps {
    compact?: boolean;
}

export const StreakIndicator = ({ compact = false }: StreakIndicatorProps) => {
    const { currentStreak } = useGamification();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    if (currentStreak === 0) {
        return null;
    }

    const tooltipText = `Daily streak: ${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;

    if (compact) {
        const streakContent = (
            <motion.div
                key={currentStreak}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
                <Group gap={4} style={{ cursor: 'default' }}>
                    <IconFlame size={16} style={{ color: '#f5576c' }} />
                    <Text size="xs" fw={600} c={isDark ? 'red.4' : 'red.6'}>
                        {currentStreak}
                    </Text>
                </Group>
            </motion.div>
        );

        return (
            <Tooltip label={tooltipText} withArrow>
                {streakContent}
            </Tooltip>
        );
    }

    return (
        <motion.div
            key={currentStreak}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
            <Group gap={4} style={{ cursor: 'default' }}>
                <IconFlame size={20} style={{ color: '#f5576c' }} />
                <Text size="sm" fw={600} c={isDark ? 'red.4' : 'red.6'}>
                    {currentStreak}-day streak
                </Text>
            </Group>
        </motion.div>
    );
};

