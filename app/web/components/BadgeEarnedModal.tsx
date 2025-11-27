/**
 * Badge Earned Modal Component
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Text, Button, Stack, Title } from '@mantine/core';
import type { BadgeInfo } from '@/lib/api';

interface BadgeEarnedModalProps {
    badges: BadgeInfo[];
    opened: boolean;
    onClose: () => void;
}

export const BadgeEarnedModal = ({ badges, opened, onClose }: BadgeEarnedModalProps) => {
    if (badges.length === 0) return null;

    return (
        <AnimatePresence>
            {opened && (
                <Modal
                    opened={opened}
                    onClose={onClose}
                    title={
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.25 }}
                        >
                            <Title order={3}>🏆 Badge Earned!</Title>
                        </motion.div>
                    }
                    centered
                    size="md"
                    styles={{
                        content: {
                            overflow: 'visible',
                        },
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Stack gap="md" align="center">
                            {badges.map((badge) => (
                                <div key={badge.code} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏅</div>
                                    <Title order={4} mb="xs">
                                        {badge.name}
                                    </Title>
                                    <Text size="sm" c="dimmed">
                                        {badge.description}
                                    </Text>
                                </div>
                            ))}
                            <Button onClick={onClose} fullWidth mt="md">
                                Awesome!
                            </Button>
                        </Stack>
                    </motion.div>
                </Modal>
            )}
        </AnimatePresence>
    );
};

