/**
 * Level Up Modal Component
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Text, Button, Stack, Title, Group } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';

interface LevelUpModalProps {
    opened: boolean;
    onClose: () => void;
    newLevel: number;
}

export const LevelUpModal = ({ opened, onClose, newLevel }: LevelUpModalProps) => {
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
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                style={{ fontSize: '64px' }}
                            >
                                🎉
                            </motion.div>
                            <Title order={2} c={isDark ? 'white' : 'dark'}>
                                Level Up!
                            </Title>
                            <Text size="xl" fw={700} c={isDark ? 'blue.4' : 'blue.6'}>
                                You've reached Level {newLevel}!
                            </Text>
                            <Text size="sm" c="dimmed">
                                Keep learning and earning XP to level up even more!
                            </Text>
                            <Button onClick={onClose} fullWidth mt="md" size="md">
                                Awesome!
                            </Button>
                        </Stack>
                    </motion.div>
                </Modal>
            )}
        </AnimatePresence>
    );
};

