import React, { useState, useEffect } from 'react';
import { Card, Text, Group, Progress, Badge, Stack, ActionIcon, Tooltip } from '@mantine/core';
import { IconTrophy, IconFlame, IconStar, IconSparkles } from '@tabler/icons-react';
import { Gamification } from '../types';
import { getXPProgress } from '../utils';

interface GamificationWidgetProps {
    gamification: Gamification;
    showBadgeNotification?: boolean;
    onBadgeNotificationShown?: () => void;
}

const GamificationWidget: React.FC<GamificationWidgetProps> = ({
    gamification,
    showBadgeNotification = false,
    onBadgeNotificationShown
}) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const xpProgress = getXPProgress(gamification.xp);

    useEffect(() => {
        if (showBadgeNotification) {
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                onBadgeNotificationShown?.();
            }, 3000);
        }
    }, [showBadgeNotification, onBadgeNotificationShown]);

    const getBadgeIcon = (badge: string) => {
        switch (badge) {
            case 'day1': return <IconStar size={16} color="gold" />;
            case 'streak3': return <IconFlame size={16} color="orange" />;
            case 'streak7': return <IconTrophy size={16} color="purple" />;
            default: return <IconStar size={16} />;
        }
    };

    const getBadgeLabel = (badge: string) => {
        switch (badge) {
            case 'day1': return 'First Day';
            case 'streak3': return '3 Day Streak';
            case 'streak7': return 'Week Warrior';
            default: return badge;
        }
    };

    return (
        <Card shadow="md" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Group>
                    <IconTrophy size={24} color="gold" />
                    <Text size="lg" fw={600}>
                        Your Progress
                    </Text>
                </Group>
                {showConfetti && (
                    <Group>
                        <IconSparkles size={20} color="gold" />
                        <Text size="sm" c="gold" fw={500}>
                            New Badge!
                        </Text>
                    </Group>
                )}
            </Group>

            <Stack gap="md">
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                            Level {gamification.level}
                        </Text>
                        <Text size="sm" fw={500}>
                            {xpProgress.current} / {xpProgress.needed} XP
                        </Text>
                    </Group>
                    <Progress
                        value={xpProgress.progress}
                        size="lg"
                        radius="md"
                        color="blue"
                        animated
                    />
                </Stack>

                <Group justify="space-between">
                    <Group gap="xs">
                        <IconFlame size={16} color="orange" />
                        <Text size="sm" c="dimmed">
                            Streak
                        </Text>
                    </Group>
                    <Badge color="orange" variant="light">
                        {gamification.streak} days
                    </Badge>
                </Group>

                {gamification.badges.length > 0 && (
                    <Stack gap="xs">
                        <Text size="sm" c="dimmed">
                            Badges
                        </Text>
                        <Group gap="xs">
                            {gamification.badges.map((badge, index) => (
                                <Tooltip key={index} label={getBadgeLabel(badge)}>
                                    <ActionIcon variant="light" color="gold" size="lg">
                                        {getBadgeIcon(badge)}
                                    </ActionIcon>
                                </Tooltip>
                            ))}
                        </Group>
                    </Stack>
                )}

                {showConfetti && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        zIndex: 10
                    }}>
                        {/* Simple confetti effect using CSS */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '24px',
                            animation: 'bounce 1s infinite'
                        }}>
                            🎉
                        </div>
                    </div>
                )}
            </Stack>

            <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          40% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
          60% {
            transform: translate(-50%, -50%) translateY(-5px);
          }
        }
      `}</style>
        </Card>
    );
};

export default GamificationWidget;
