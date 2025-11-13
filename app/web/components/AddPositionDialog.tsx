/**
 * Add Position Dialog Component
 */
import { useState } from 'react';
import {
    Modal,
    Button,
    TextInput,
    NumberInput,
    Stack,
    Group,
    Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { portfolioApi } from '@/lib/api';
import type { PostPositionRequest } from '@/types/portfolio';

interface AddPositionDialogProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddPositionDialog = ({ opened, onClose, onSuccess }: AddPositionDialogProps) => {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState<number | ''>(0);
    const [avgCost, setAvgCost] = useState<number | ''>(0);
    const [executedAt, setExecutedAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        // Validation
        if (!symbol.trim()) {
            setError('Ticker symbol is required');
            return;
        }
        if (!quantity || quantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }
        if (!avgCost || avgCost <= 0) {
            setError('Average cost must be greater than 0');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const request: PostPositionRequest = {
                symbol: symbol.trim().toUpperCase(),
                quantity: Number(quantity),
                avgCost: Number(avgCost),
                executedAt: executedAt ? new Date(executedAt).toISOString() : undefined,
            };

            await portfolioApi.addPosition(request);

            // Reset form
            setSymbol('');
            setQuantity(0);
            setAvgCost(0);
            setExecutedAt('');
            setError(null);

            // Close dialog and refresh portfolio
            onClose();
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add position');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setSymbol('');
            setQuantity(0);
            setAvgCost(0);
            setExecutedAt('');
            setError(null);
            onClose();
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Add Position"
            size="md"
        >
            <Stack gap="md">
                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
                        {error}
                    </Alert>
                )}

                <TextInput
                    label="Ticker Symbol"
                    placeholder="AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                    disabled={loading}
                />

                <NumberInput
                    label="Quantity"
                    placeholder="10"
                    value={quantity}
                    onChange={(value) => setQuantity(value === '' ? '' : Number(value))}
                    min={0}
                    step={0.01}
                    decimalScale={2}
                    required
                    disabled={loading}
                />

                <NumberInput
                    label="Average Cost"
                    placeholder="180.00"
                    value={avgCost}
                    onChange={(value) => setAvgCost(value === '' ? '' : Number(value))}
                    min={0}
                    step={0.01}
                    decimalScale={2}
                    required
                    disabled={loading}
                />

                <TextInput
                    label="Executed At (Optional)"
                    placeholder="Leave empty to use current time"
                    value={executedAt ? executedAt.slice(0, 16) : ''}
                    onChange={(e) => setExecutedAt(e.target.value)}
                    type="datetime-local"
                    disabled={loading}
                    description="Leave empty to use current time"
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        Add Position
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

