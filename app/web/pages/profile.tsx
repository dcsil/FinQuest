/**
 * Profile Page - Display user information and financial profile
 */
import { useState, useEffect } from 'react';
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
    useMantineTheme,
    useMantineColorScheme,
    Select,
    Button,
} from '@mantine/core';
import { IconUser, IconMail, IconCalendar, IconTrendingUp, IconTarget, IconWallet, IconShield, IconWorld, IconCheck } from '@tabler/icons-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppNav } from '@/components/AppNav';
import { BadgesGrid } from '@/components/BadgesGrid';
import { AppShell } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileField } from '@/features/profile/components/ProfileField';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { formatExperience, formatIncome, formatInvestmentAmount } from '@/features/profile/utils/formatters';
import { getUserDisplayName, getUserInitial } from '@/features/profile/utils/user';
import { countries } from '@/features/profile/constants';

const ProfilePage = () => {
    const { user } = useAuth();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const { profile, loading, loadProfile, updateProfile } = useProfile();
    const [editingCountry, setEditingCountry] = useState<boolean>(false);
    const [countryValue, setCountryValue] = useState<string>("US");
    const [savingCountry, setSavingCountry] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            loadProfile().then((data) => {
                if (data?.country) {
                    setCountryValue(data.country);
                }
            });
        }
    }, [user, loadProfile]);

    const handleSaveCountry = async () => {
        if (!profile) return;

        setSavingCountry(true);
        try {
            await updateProfile({ country: countryValue });
            setEditingCountry(false);
        } catch (err) {
            console.error('Failed to update country:', err);
            alert('Failed to update country. Please try again.');
        } finally {
            setSavingCountry(false);
        }
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
                                {editingCountry ? (
                                    <Group gap="md" p="md" style={{
                                        borderRadius: '8px',
                                        backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[0],
                                        border: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
                                    }}>
                                        <div style={{ color: isDark ? theme.colors.blue[4] : theme.colors.blue[6] }}>
                                            <IconWorld size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text size="sm" c="dimmed" fw={500} mb="xs">
                                                Country
                                            </Text>
                                            <Group gap="sm">
                                                <Select
                                                    data={countries}
                                                    value={countryValue}
                                                    onChange={(value) => setCountryValue(value || "US")}
                                                    searchable
                                                    style={{ flex: 1 }}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveCountry}
                                                    loading={savingCountry}
                                                    leftSection={<IconCheck size={16} />}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="subtle"
                                                    onClick={() => {
                                                        setEditingCountry(false);
                                                        if (profile?.country) {
                                                            setCountryValue(profile.country);
                                                        }
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </Group>
                                        </div>
                                    </Group>
                                ) : (
                                    <Group gap="md" p="md" style={{
                                        borderRadius: '8px',
                                        backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[0],
                                        border: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
                                        cursor: 'pointer',
                                    }}
                                        onClick={() => setEditingCountry(true)}
                                    >
                                        <div style={{ color: isDark ? theme.colors.blue[4] : theme.colors.blue[6] }}>
                                            <IconWorld size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text size="sm" c="dimmed" fw={500}>
                                                Country
                                            </Text>
                                            <Text size="lg" fw={600} c={isDark ? theme.colors.gray[0] : theme.colors.dark[9]}>
                                                {profile?.country ? countries.find(c => c.value === profile.country)?.label || profile.country : "Not specified"}
                                            </Text>
                                        </div>
                                    </Group>
                                )}
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

