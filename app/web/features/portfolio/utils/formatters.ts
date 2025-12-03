export const formatCurrency = (value: number | string | null | undefined, currency: string): string => {
    if (value === null || value === undefined) return '~';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '~';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
};

export const formatPercentage = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '~';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '~';
    const sign = numValue >= 0 ? '+' : '';
    return `${sign}${numValue.toFixed(2)}%`;
};

export const formatQuantity = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '~';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '~';
    return numValue.toFixed(4);
};


