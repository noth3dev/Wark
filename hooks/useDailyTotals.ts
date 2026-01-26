import { useState, useCallback } from 'react';
import { sessionService } from '../lib/services/sessionService';

export function useDailyTotals() {
    const [dailyTimes, setDailyTimes] = useState<Record<string, number>>({});

    const fetchDailyTotals = useCallback(async (userId: string) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data } = await sessionService.fetchDailyTotals(userId, startOfDay.toISOString());

        const totals: Record<string, number> = {};
        data?.forEach(s => {
            totals[s.tag_id] = (totals[s.tag_id] || 0) + s.duration;
        });
        setDailyTimes(totals);
        return totals;
    }, []);

    const updateDailyTime = useCallback((tagId: string, duration: number) => {
        setDailyTimes(prev => ({
            ...prev,
            [tagId]: (prev[tagId] || 0) + duration
        }));
    }, []);

    return { dailyTimes, fetchDailyTotals, updateDailyTime, setDailyTimes };
}
