import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '../lib/types';

export function useStudySessions(userId: string | undefined, selectedDate: Date) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data } = await supabase
                .from('study_sessions')
                .select('id, tag_id, duration, created_at')
                .eq('user_id', userId)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: true });

            if (data) setSessions(data);
        } finally {
            setLoading(false);
        }
    }, [userId, selectedDate]);

    const calculateDistribution = useCallback((isToday: boolean, activeTagId: string | null, activeStartTime: number | null) => {
        const startMs = new Date(selectedDate).setHours(0, 0, 0, 0);
        let dailyTotal = 0;

        const distribution = Array.from({ length: 24 }, (_, i) => {
            const hStart = startMs + i * 3600000;
            const hEnd = hStart + 3600000;

            const hourSessions = sessions.filter(s => {
                const sStart = new Date(s.created_at).getTime();
                const sEnd = sStart + s.duration;
                return Math.max(sStart, hStart) < Math.min(sEnd, hEnd);
            }).map(s => {
                const sStart = new Date(s.created_at).getTime();
                const sEnd = sStart + s.duration;
                return { tag_id: s.tag_id, start: Math.max(sStart, hStart), end: Math.min(sEnd, hEnd) };
            });

            if (isToday && activeStartTime && activeTagId) {
                const sStart = activeStartTime;
                const sEnd = Date.now();
                if (Math.max(sStart, hStart) < Math.min(sEnd, hEnd)) {
                    hourSessions.push({ tag_id: activeTagId, start: Math.max(sStart, hStart), end: Math.min(sEnd, hEnd) });
                }
            }

            hourSessions.sort((a, b) => a.start - b.start);

            const segments: any[] = [];
            let currentLeft = hStart;

            hourSessions.forEach(s => {
                if (s.start > currentLeft) {
                    segments.push({ type: 'gap', start: currentLeft, duration: s.start - currentLeft });
                    currentLeft = s.start;
                }
                if (s.end > currentLeft) {
                    segments.push({ type: 'session', start: currentLeft, duration: s.end - currentLeft, tagId: s.tag_id });
                    currentLeft = s.end;
                }
            });

            if (currentLeft < hEnd) {
                segments.push({ type: 'gap', start: currentLeft, duration: hEnd - currentLeft });
            }

            const totalInHour = segments.filter(seg => seg.type === 'session').reduce((acc, curr) => acc + curr.duration, 0);
            dailyTotal += totalInHour;

            return { hour: i, total: totalInHour, segments };
        });

        return { hourData: distribution, totalToday: dailyTotal };
    }, [sessions, selectedDate]);

    return { sessions, fetchSessions, calculateDistribution, loading };
}
