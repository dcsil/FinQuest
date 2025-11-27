/**
 * Badges Grid Component for Profile Page
 */
import { useEffect, useState } from 'react';
import { Grid, Card, Text, Badge, Stack, Title } from '@mantine/core';
import { gamificationApi, type BadgeDefinitionResponse } from '@/lib/api';

export const BadgesGrid = () => {
    const [badges, setBadges] = useState<BadgeDefinitionResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const data = await gamificationApi.getBadges();
                setBadges(data);
            } catch (error) {
                console.error('Failed to fetch badges:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, []);

    if (loading) {
        return <Text>Loading badges...</Text>;
    }

    const earnedBadges = badges.filter((b) => b.earned);
    const unearnedBadges = badges.filter((b) => !b.earned && b.is_active);

    return (
        <Stack gap="lg">
            <div>
                <Title order={3} mb="md">
                    Your Badges ({earnedBadges.length})
                </Title>
                {earnedBadges.length === 0 ? (
                    <Text c="dimmed">No badges earned yet. Keep learning to earn your first badge!</Text>
                ) : (
                    <Grid>
                        {earnedBadges.map((badge) => (
                            <Grid.Col key={badge.code} span={{ base: 12, sm: 6, md: 4 }}>
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Stack gap="xs" align="center">
                                        <div style={{ fontSize: '48px' }}>🏅</div>
                                        <Text fw={600} size="lg" ta="center">
                                            {badge.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" ta="center">
                                            {badge.description}
                                        </Text>
                                        <Badge color="green" variant="light">
                                            Earned
                                        </Badge>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                )}
            </div>

            {unearnedBadges.length > 0 && (
                <div>
                    <Title order={3} mb="md">
                        Available Badges
                    </Title>
                    <Grid>
                        {unearnedBadges.map((badge) => (
                            <Grid.Col key={badge.code} span={{ base: 12, sm: 6, md: 4 }}>
                                <Card shadow="sm" padding="lg" radius="md" withBorder style={{ opacity: 0.6 }}>
                                    <Stack gap="xs" align="center">
                                        <div style={{ fontSize: '48px', filter: 'grayscale(100%)' }}>🏅</div>
                                        <Text fw={600} size="lg" ta="center">
                                            {badge.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" ta="center">
                                            {badge.description}
                                        </Text>
                                        <Badge color="gray" variant="light">
                                            Locked
                                        </Badge>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                </div>
            )}
        </Stack>
    );
};

