export const formatExperience = (years?: number): string | undefined => {
    if (years === undefined || years === null) return undefined;
    if (years === 0) return 'Less than 1 year';
    if (years === 1) return '1 year';
    return `${years} years`;
};

export const formatIncome = (income?: string): string | undefined => {
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

export const formatInvestmentAmount = (amount?: string): string | undefined => {
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

