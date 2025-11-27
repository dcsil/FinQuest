/**
 * Streak Indicator Component
 */
import { motion } from 'framer-motion';
import { Group, Text } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import { useGamification } from '@/contexts/GamificationContext';

export const StreakIndicator = () => {
    const { currentStreak } = useGamification();

    if (currentStreak === 0) {
        return null;
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
                <Text size="sm" fw={600} c="red">
                    {currentStreak}-day streak
                </Text>
            </Group>
        </motion.div>
    );
};

