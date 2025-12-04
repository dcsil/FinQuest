import { useState, useCallback } from 'react';
import { portfolioApi } from '@/lib/api';
import type { SnapshotPoint } from '@/types/portfolio';
import type { TimeRange } from '@/components/ValueChart';
import { getDateRange } from '../utils/dateRange';

export const useSnapshots = (initialRange: TimeRange = '1m') => {
    const [snapshots, setSnapshots] = useState<SnapshotPoint[]>([]);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);

    const loadSnapshots = useCallback(async (range?: TimeRange) => {
        try {
            const rangeToUse = range || timeRange;
            const { from, to, granularity } = getDateRange(rangeToUse);

            setShowSkeleton(false);

            // Set a timeout to show skeleton after 1 second
            const skeletonTimeout = setTimeout(() => {
                setShowSkeleton(true);
            }, 1000);

            try {
                const data = await portfolioApi.getSnapshots(from, to, granularity);
                setSnapshots(data.series);
            } finally {
                clearTimeout(skeletonTimeout);
                setShowSkeleton(false);
            }
        } catch (err) {
            console.error('Failed to load snapshots:', err);
            setShowSkeleton(false);
        }
    }, [timeRange]);

    return {
        snapshots,
        showSkeleton,
        timeRange,
        setTimeRange,
        loadSnapshots,
    };
};


