import React from 'react';
import { AppShell, Text, Group, Button, Burger, Drawer, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHome, IconWallet, IconEye, IconNews, IconChecklist, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AppShellProps {
    children: React.ReactNode;
}

const navigation = [
    { link: '/', label: 'Dashboard', icon: IconHome },
    { link: '/holdings', label: 'Holdings', icon: IconWallet },
    { link: '/watchlist', label: 'Watchlist', icon: IconEye },
    { link: '/news', label: 'News', icon: IconNews },
    { link: '/tasks', label: 'Tasks', icon: IconChecklist },
    { link: '/profile', label: 'Profile', icon: IconUser },
];

const AppShellComponent: React.FC<AppShellProps> = ({ children }) => {
    const [opened, { toggle, close }] = useDisclosure();
    const router = useRouter();

    const navItems = navigation.map((item) => (
        <Link key={item.label} href={item.link} style={{ textDecoration: 'none' }}>
            <Button
                variant={router.pathname === item.link ? 'filled' : 'subtle'}
                leftSection={<item.icon size={12} style={{ width: '12px', height: '12px' }} />}
                fullWidth
                justify="flex-start"
                color={router.pathname === item.link ? 'blue' : 'gray'}
                onClick={close}
                style={{ marginBottom: rem(4) }}
            >
                {item.label}
            </Button>
        </Link>
    ));

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Text size="xl" fw={700} c="blue">
                            💰 FinanceTracker
                        </Text>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <Text size="sm" c="dimmed" mb="md">
                    Navigation
                </Text>
                {navItems}
            </AppShell.Navbar>

            <AppShell.Main>
                {children}
            </AppShell.Main>

            <Drawer opened={opened} onClose={close} title="Navigation" size="xs">
                {navItems}
            </Drawer>
        </AppShell>
    );
};

export default AppShellComponent;
