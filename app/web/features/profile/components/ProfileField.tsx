import { Group, Text, useMantineTheme, useMantineColorScheme } from '@mantine/core';

interface ProfileFieldProps {
    label: string;
    value: string | number | undefined;
    icon: React.ReactNode;
}

export const ProfileField = ({ label, value, icon }: ProfileFieldProps) => {
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

