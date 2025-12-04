/**
 * Profile Page - Display user information and financial profile
 */
import { useEffect } from 'react';
import Head from 'next/head';
import {
    Container,
    Title,
    Stack,
    Paper,
    Text,
    Group,
    Avatar,
    Skeleton,
} from '@mantine/core';
import { IconUser, IconMail, IconCalendar, IconTrendingUp, IconTarget, IconWallet, IconShield } from '@tabler/icons-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppNav } from '@/components/AppNav';
import { BadgesGrid } from '@/components/BadgesGrid';
import { CountryField } from '@/components/CountryField';
import { AppShell } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileField } from '@/features/profile/components/ProfileField';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { formatExperience, formatIncome, formatInvestmentAmount } from '@/features/profile/utils/formatters';
import { getUserDisplayName, getUserInitial } from '@/features/profile/utils/user';

const ProfilePage = () => {
    const { user } = useAuth();
    const { profile, loading, loadProfile, updateProfile } = useProfile();

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user, loadProfile]);

    const handleSaveCountry = async (country: string) => {
        if (!profile) return;
        await updateProfile({ country });
    };

    return (
        <ProtectedRoute>
            <Head>
                <title>Profile - FinQuest</title>
            </Head>
            <AppShell header={{ height: 70 }}>
                <AppNav />
                <AppShell.Main>
                    <Container size="xl" py="xl">
                        <Stack gap="xl">
                            {/* Header */}
                            <Title order={1}>Profile</Title>

                            {/* User Info Card */}
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <Group gap="lg" mb="lg">
                                    <Avatar size={80} radius="xl" color="blue">
                                        {getUserInitial(user)}
                                    </Avatar>
                                    <div style={{ flex: 1 }}>
                                        <Title order={2} mb="xs">
                                            {getUserDisplayName(user)}
                                        </Title>
                                        <Group gap="xs" c="dimmed">
                                            <IconMail size={16} />
                                            <Text size="sm">{user?.email}</Text>
                                        </Group>
                                        {user?.created_at && (
                                            <Group gap="xs" c="dimmed" mt={4}>
                                                <IconCalendar size={16} />
                                                <Text size="sm">
                                                    Member since {new Date(user.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </Text>
                                            </Group>
                                        )}
                                    </div>
                                </Group>
                                <CountryField
                                    value={profile?.country}
                                    onSave={handleSaveCountry}
                                />
                            </Paper>

                            {/* Badges Section */}
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <BadgesGrid />
                            </Paper>

                            {/* Financial Profile Card */}
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <Title order={2} mb="lg">
                                    Financial Profile
                                </Title>
                                {loading ? (
                                    <Stack gap="md">
                                        <Skeleton height={80} radius="md" />
                                        <Skeleton height={80} radius="md" />
                                        <Skeleton height={80} radius="md" />
                                    </Stack>
                                ) : (
                                    <Stack gap="md">
                                        <ProfileField
                                            label="Financial Goals"
                                            value={profile?.financialGoals}
                                            icon={<IconTarget size={24} />}
                                        />
                                        <ProfileField
                                            label="Investing Experience"
                                            value={formatExperience(profile?.investingExperience)}
                                            icon={<IconTrendingUp size={24} />}
                                        />
                                        <ProfileField
                                            label="Age"
                                            value={profile?.age}
                                            icon={<IconUser size={24} />}
                                        />
                                        <ProfileField
                                            label="Annual Income"
                                            value={formatIncome(profile?.annualIncome)}
                                            icon={<IconWallet size={24} />}
                                        />
                                        <ProfileField
                                            label="Investment Amount"
                                            value={formatInvestmentAmount(profile?.investmentAmount)}
                                            icon={<IconTrendingUp size={24} />}
                                        />
                                        <ProfileField
                                            label="Risk Tolerance"
                                            value={profile?.riskTolerance}
                                            icon={<IconShield size={24} />}
                                        />
                                        {(!profile || Object.values(profile).every(v => v === undefined || v === null || v === '')) && (
                                            <Text c="dimmed" ta="center" py="xl">
                                                No financial profile information available. Complete onboarding to add your profile details.
                                            </Text>
                                        )}
                                    </Stack>
                                )}
                            </Paper>
                        </Stack>
                    </Container>
                </AppShell.Main>
            </AppShell>
        </ProtectedRoute>
    );
};

export default ProfilePage;

