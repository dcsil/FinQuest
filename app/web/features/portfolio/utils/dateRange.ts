import { format, subDays, startOfYear } from 'date-fns';
import type { TimeRange } from '@/components/ValueChart';

export interface DateRangeResult {
    from: string;
    to: string;
    granularity: string;
}

export const getDateRange = (range: TimeRange): DateRangeResult => {
    const to = new Date();
    let from: Date;
    let granularity: string;

    switch (range) {
        case '1d':
            from = subDays(to, 1);
            granularity = 'hourly';
            break;
        case '1w':
            from = subDays(to, 7);
            granularity = '6hourly';
            break;
        case '1m':
            from = subDays(to, 30);
            granularity = 'daily';
            break;
        case 'ytd':
            from = startOfYear(to);
            granularity = 'daily';
            break;
        case '1y':
            from = subDays(to, 365);
            granularity = 'weekly';
            break;
        default:
            from = subDays(to, 30);
            granularity = 'daily';
    }

    return {
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
        granularity,
    };
};

