/**
 * Application Navigation Component
 */
import { AppShell, Group, Button, Text, Container, Menu, Avatar } from '@mantine/core';
import { IconLogout, IconUser, IconWallet } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import FinQuestLogo from '../assets/FinQuestLogo.png';
import { useAuth } from '@/contexts/AuthContext';

export const AppNav = () => {
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <AppShell.Header>
            <Container size="xl" h="100%">
                <Group justify="space-between" h="100%">
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
                    <Group gap="md">
                        <Button
                            variant="subtle"
                            leftSection={<IconWallet size={16} />}
                            onClick={() => router.push('/portfolio')}
                        >
                            Portfolio
                        </Button>
                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Avatar
                                    src={null}
                                    alt={user?.email || 'User'}
                                    radius="xl"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </Avatar>
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

