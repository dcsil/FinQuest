import { useState } from 'react';
import {
    Group,
    Text,
    Select,
    Button,
    useMantineTheme,
    useMantineColorScheme,
} from '@mantine/core';
import { IconWorld, IconCheck } from '@tabler/icons-react';
import { countries } from '@/features/profile/constants';

interface CountryFieldProps {
    value?: string;
    onSave: (country: string) => Promise<void>;
    onCancel?: () => void;
}

export const CountryField = ({ value, onSave, onCancel }: CountryFieldProps) => {
    const [editing, setEditing] = useState(false);
    const [countryValue, setCountryValue] = useState<string>(value || "US");
    const [saving, setSaving] = useState(false);
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(countryValue);
            setEditing(false);
        } catch (err) {
            console.error('Failed to save country:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setCountryValue(value || "US");
        if (onCancel) {
            onCancel();
        }
    };

    if (editing) {
        return (
            <Group gap="md" p="md" style={{
                borderRadius: '8px',
                backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[0],
                border: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
            }}
                data-testid="country-field-editing"
            >
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
                            onChange={(val) => setCountryValue(val || "US")}
                            searchable
                            style={{ flex: 1 }}
                            data-testid="country-select"
                        />
                        <Button
                            size="sm"
                            onClick={handleSave}
                            loading={saving}
                            leftSection={<IconCheck size={16} />}
                            data-testid="country-save-button"
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="subtle"
                            onClick={handleCancel}
                            data-testid="country-cancel-button"
                        >
                            Cancel
                        </Button>
                    </Group>
                </div>
            </Group>
        );
    }

    return (
        <Group gap="md" p="md" style={{
            borderRadius: '8px',
            backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[0],
            border: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
            cursor: 'pointer',
        }}
            onClick={() => setEditing(true)}
            data-testid="country-field-display"
        >
            <div style={{ color: isDark ? theme.colors.blue[4] : theme.colors.blue[6] }}>
                <IconWorld size={24} />
            </div>
            <div style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" fw={500}>
                    Country
                </Text>
                <Text size="lg" fw={600} c={isDark ? theme.colors.gray[0] : theme.colors.dark[9]}>
                    {value ? countries.find(c => c.value === value)?.label || value : "Not specified"}
                </Text>
            </div>
        </Group>
    );
};


