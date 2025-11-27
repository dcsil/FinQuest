/**
 * Application Navigation Component
 */
import { useState, useEffect } from 'react';
import { AppShell, Group, Button, Text, Container, Menu, Avatar, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconLogout, IconUser, IconSun, IconMoon } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/router';
import FinQuestLogo from '../assets/FinQuestLogo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';

const ColorSchemeToggle = () => {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = colorScheme === 'dark';

    return (
        <Tooltip label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <ActionIcon
                variant="subtle"
                onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle color scheme"
                size="lg"
            >
                {mounted ? (isDark ? <IconSun size={20} /> : <IconMoon size={20} />) : <IconMoon size={20} />}
            </ActionIcon>
        </Tooltip>
    );
};

const getLevelBorderColor = (level: number): string => {
    if (level >= 7) return '#f6d365'; // Gold
    if (level >= 4) return '#667eea'; // Blue
    return '#9ca3af'; // Grey
};

const ProfileAvatarWithLevel = () => {
    const { user } = useAuth();
    const { level } = useGamification();
    const router = useRouter();

    const borderColor = getLevelBorderColor(level);
    const borderWidth = level >= 7 ? 3 : level >= 4 ? 2 : 1;

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ position: 'relative' }}
        >
            <Avatar
                src={null}
                alt={user?.email || 'User'}
                radius="xl"
                style={{
                    cursor: 'pointer',
                    border: `${borderWidth}px solid ${borderColor}`,
                    boxShadow: level >= 7 ? `0 0 8px ${borderColor}` : 'none',
                }}
            >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Badge
                size="xs"
                radius="xl"
                style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    border: `2px solid white`,
                    background: borderColor,
                    color: level >= 7 ? '#000' : '#fff',
                    fontWeight: 700,
                    fontSize: '10px',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {level}
            </Badge>
        </motion.div>
    );
};

export const AppNav = () => {
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <AppShell.Header>
            <Container size="xl" h="100%">
                <Group justify="space-between" h="100%" style={{ width: '100%' }}>
                    <Group gap="xs">
                        <Image
                            src={FinQuestLogo}
                            alt="FinQuest Logo"
                            width={40}
                            height={40}
                            style={{ borderRadius: '8px' }}
                        />
                        <Text size="xl" fw={700}>
                            FinQuest
                        </Text>
                    </Group>
                    <Group gap="md" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        <Button
                            variant={router.pathname === '/' || router.pathname === '/dashboard' ? 'light' : 'subtle'}
                            onClick={() => router.push('/dashboard')}
                        >
                            Dashboard
                        </Button>
                        <Button
                            variant={router.pathname === '/portfolio' ? 'light' : 'subtle'}
                            onClick={() => router.push('/portfolio')}
                        >
                            Portfolio
                        </Button>
                        <Button
                            variant={router.pathname === '/learn' ? 'light' : 'subtle'}
                            onClick={() => router.push('/learn')}
                        >
                            Learn
                        </Button>
                    </Group>
                    <Group gap="md">
                        <ColorSchemeToggle />
                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <ProfileAvatarWithLevel />
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>{user?.email}</Menu.Label>
                                <Menu.Item
                                    leftSection={<IconUser size={16} />}
                                    onClick={() => router.push('/profile')}
                                >
                                    Profile
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                    color="red"
                                    leftSection={<IconLogout size={16} />}
                                    onClick={handleSignOut}
                                >
                                    Logout
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </Container>
        </AppShell.Header>
    );
};

