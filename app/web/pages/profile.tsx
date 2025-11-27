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
import { usersApi } from '@/lib/api';
import type { UserProfile } from '@/types/user';

interface ProfileFieldProps {
    label: string;
    value: string | number | undefined;
    icon: React.ReactNode;
}

const ProfileField = ({ label, value, icon }: ProfileFieldProps) => {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    if (value === undefined || value === null || value === '') {
        return null;
    }

    return (
        <Group gap="md" p="md" style={{
            borderRadius: '8px',
            backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[0],
            border: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
        }}>
            <div style={{ color: isDark ? theme.colors.blue[4] : theme.colors.blue[6] }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" fw={500}>
                    {label}
                </Text>
                <Text size="lg" fw={600} c={isDark ? theme.colors.gray[0] : theme.colors.dark[9]}>
                    {typeof value === 'number' ? value.toString() : value}
                </Text>
            </div>
        </Group>
    );
};

const countries = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "GB", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "IT", label: "Italy" },
    { value: "ES", label: "Spain" },
    { value: "NL", label: "Netherlands" },
    { value: "BE", label: "Belgium" },
    { value: "CH", label: "Switzerland" },
    { value: "AT", label: "Austria" },
    { value: "SE", label: "Sweden" },
    { value: "NO", label: "Norway" },
    { value: "DK", label: "Denmark" },
    { value: "FI", label: "Finland" },
    { value: "IE", label: "Ireland" },
    { value: "PT", label: "Portugal" },
    { value: "PL", label: "Poland" },
    { value: "CZ", label: "Czech Republic" },
    { value: "GR", label: "Greece" },
    { value: "JP", label: "Japan" },
    { value: "CN", label: "China" },
    { value: "IN", label: "India" },
    { value: "SG", label: "Singapore" },
    { value: "HK", label: "Hong Kong" },
    { value: "KR", label: "South Korea" },
    { value: "TW", label: "Taiwan" },
    { value: "NZ", label: "New Zealand" },
    { value: "BR", label: "Brazil" },
    { value: "MX", label: "Mexico" },
    { value: "AR", label: "Argentina" },
    { value: "ZA", label: "South Africa" },
    { value: "AE", label: "United Arab Emirates" },
    { value: "IL", label: "Israel" },
    { value: "TR", label: "Turkey" },
    { value: "RU", label: "Russia" },
];

const ProfilePage = () => {
    const { user } = useAuth();
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingCountry, setEditingCountry] = useState<boolean>(false);
    const [countryValue, setCountryValue] = useState<string>("US");
    const [savingCountry, setSavingCountry] = useState<boolean>(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await usersApi.getFinancialProfile();
                setProfile(data);
                if (data?.country) {
                    setCountryValue(data.country);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadProfile();
        }
    }, [user]);

    const handleSaveCountry = async () => {
        if (!profile) return;

        setSavingCountry(true);
        try {
            const updatedProfile = { ...profile, country: countryValue };
            await usersApi.updateFinancialProfile(updatedProfile);
            setProfile(updatedProfile);
            setEditingCountry(false);
        } catch (err) {
            console.error('Failed to update country:', err);
            alert('Failed to update country. Please try again.');
        } finally {
            setSavingCountry(false);
        }
    };

    const getUserDisplayName = () => {
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return 'User';
    };

    const getUserInitial = () => {
        const name = getUserDisplayName();
        return name.charAt(0).toUpperCase();
    };

    const formatExperience = (years?: number) => {
        if (years === undefined || years === null) return undefined;
        if (years === 0) return 'Less than 1 year';
        if (years === 1) return '1 year';
        return `${years} years`;
    };

    const formatIncome = (income?: string) => {
        if (!income) return undefined;
        const incomeMap: Record<string, string> = {
            '0-25k': '$0 - $25,000',
            '25k-50k': '$25,000 - $50,000',
            '50k-75k': '$50,000 - $75,000',
            '75k-100k': '$75,000 - $100,000',
            '100k-150k': '$100,000 - $150,000',
            '150k+': '$150,000+',
        };
        return incomeMap[income] || income;
    };

    const formatInvestmentAmount = (amount?: string) => {
        if (!amount) return undefined;
        const amountMap: Record<string, string> = {
            '0-1k': '$0 - $1,000',
            '1k-5k': '$1,000 - $5,000',
            '5k-10k': '$5,000 - $10,000',
            '10k-25k': '$10,000 - $25,000',
            '25k+': '$25,000+',
        };
        return amountMap[amount] || amount;
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
                                        {getUserInitial()}
                                    </Avatar>
                                    <div style={{ flex: 1 }}>
                                        <Title order={2} mb="xs">
                                            {getUserDisplayName()}
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

