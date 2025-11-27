/**
 * Streak Increment Modal Component
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Text, Button, Stack, Title } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';

interface StreakModalProps {
    opened: boolean;
    onClose: () => void;
    streak: number;
}

export const StreakModal = ({ opened, onClose, streak }: StreakModalProps) => {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <AnimatePresence>
            {opened && (
                <Modal
                    opened={opened}
                    onClose={onClose}
                    title={null}
                    centered
                    size="md"
                    withCloseButton={false}
                    styles={{
                        content: {
                            overflow: 'visible',
                        },
                        body: {
                            padding: 0,
                        },
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Stack gap="lg" align="center" p="xl" style={{ textAlign: 'center' }}>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                style={{ fontSize: '64px' }}
                            >
                                🔥
                            </motion.div>
                            <Title order={2} c={isDark ? 'white' : 'dark'}>
                                Streak Increased!
                            </Title>
                            <Text size="xl" fw={700} c={isDark ? 'red.4' : 'red.6'}>
                                {streak}-Day Streak
                            </Text>
                            <Text size="sm" c="dimmed">
                                Keep it up! Complete a quiz every day to maintain your streak.
                            </Text>
                            <Button onClick={onClose} fullWidth mt="md" size="md" color="red">
                                Awesome!
                            </Button>
                        </Stack>
                    </motion.div>
                </Modal>
            )}
        </AnimatePresence>
    );
};


