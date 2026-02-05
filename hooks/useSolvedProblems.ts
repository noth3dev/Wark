import { useState, useEffect, useCallback, useMemo } from 'react';
import { solvedProblemService } from '../lib/services/solvedProblemService';
import { useAuth } from '../lib/auth-context';

export function useSolvedProblems(activeTagId: string | null, customDate?: string) {
    const { user } = useAuth();
    const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const targetDate = customDate || new Date().toLocaleDateString('sv-SE');

    const fetchCounts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [summaryData, logData] = await Promise.all([
                solvedProblemService.getDailyCountsByTag(user.id, targetDate),
                solvedProblemService.getDailyLogs(user.id, targetDate)
            ]);

            const counts: Record<string, number> = {};
            summaryData.forEach(item => {
                const key = item.tag_id || 'no_tag';
                counts[key] = item.count;
            });
            setTagCounts(counts);
            setLogs(logData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, targetDate]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    // Current active count
    const activeCount = useMemo(() => {
        const key = activeTagId || 'no_tag';
        return tagCounts[key] || 0;
    }, [tagCounts, activeTagId]);

    // Total for today
    const totalCount = useMemo(() => {
        return Object.values(tagCounts).reduce((acc, curr) => acc + curr, 0);
    }, [tagCounts]);

    const increment = useCallback(async () => {
        if (!user) return;
        const key = activeTagId || 'no_tag';
        const currentVal = tagCounts[key] || 0;
        const newVal = currentVal + 1;

        setTagCounts(prev => ({ ...prev, [key]: newVal }));
        // Optimistic log add (local only)
        setLogs(prev => [...prev, { created_at: new Date().toISOString(), tag_id: activeTagId }]);

        try {
            await solvedProblemService.updateCount(user.id, targetDate, activeTagId, newVal, true);
        } catch (e) {
            console.error(e);
            fetchCounts(); // Re-sync on error
        }
    }, [user, tagCounts, activeTagId, targetDate, fetchCounts]);

    const decrement = useCallback(async () => {
        if (!user) return;
        const key = activeTagId || 'no_tag';
        const currentVal = tagCounts[key] || 0;
        if (currentVal <= 0) return;

        const newVal = currentVal - 1;
        setTagCounts(prev => ({ ...prev, [key]: newVal }));

        // Optimistic log removal (local only)
        setLogs(prev => {
            const newLogs = [...prev];
            // Find the last index of a log with the matching tag_id
            const lastIndex = [...newLogs].reverse().findIndex(log => log.tag_id === activeTagId);
            if (lastIndex !== -1) {
                const actualIndex = newLogs.length - 1 - lastIndex;
                newLogs.splice(actualIndex, 1);
            }
            return newLogs;
        });

        try {
            await solvedProblemService.updateCount(user.id, targetDate, activeTagId, newVal, false);
        } catch (e) {
            console.error(e);
            setTagCounts(prev => ({ ...prev, [key]: currentVal }));
        }
    }, [user, tagCounts, activeTagId, targetDate]);

    return {
        count: activeCount,
        totalCount,
        logs,
        loading,
        increment,
        decrement,
        fetchCounts
    };
}
