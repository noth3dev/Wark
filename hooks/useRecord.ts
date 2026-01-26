import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTags } from "./useTags";
import { useActiveSession } from "./useActiveSession";
import { useStudySessions } from "./useStudySessions";
import { useStopwatchSync } from "./useStopwatchSync";

export function useRecord() {
    const { user, loading: authLoading } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [mounted, setMounted] = useState(false);
    const [activeSessionElapsed, setActiveSessionElapsed] = useState(0);

    const isToday = new Date().toDateString() === selectedDate.toDateString();

    const { tags, fetchTags } = useTags();
    const { activeSession, fetchActiveSession } = useActiveSession(user?.id);
    const { sessions, fetchSessions, calculateDistribution, loading: sessionsLoading } = useStudySessions(user?.id, selectedDate);

    useEffect(() => { setMounted(true); }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        await Promise.all([fetchTags(), fetchSessions(), fetchActiveSession()]);
    }, [user, fetchTags, fetchSessions, fetchActiveSession]);

    useEffect(() => {
        if (mounted && !authLoading && user) fetchData();
    }, [mounted, authLoading, user, selectedDate, fetchData]);

    // Sync
    useStopwatchSync(user?.id, fetchData);

    // Live update for elapsed time
    useEffect(() => {
        const timerInterval = setInterval(() => {
            if (activeSession && isToday) {
                const startTime = new Date(activeSession.start_time);
                const now = new Date();
                const effectiveStartTime = (startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();
                setActiveSessionElapsed(Date.now() - effectiveStartTime);
            } else {
                setActiveSessionElapsed(0);
            }
        }, 1000);
        return () => clearInterval(timerInterval);
    }, [activeSession, isToday]);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const getTagTotal = (tagId: string) => {
        const recordedTotal = sessions
            .filter(s => s.tag_id === tagId)
            .reduce((acc, curr) => acc + curr.duration, 0);
        return (isToday && activeSession?.tag_id === tagId) ? recordedTotal + activeSessionElapsed : recordedTotal;
    };

    const activeStartTime = useMemo(() => activeSession ? new Date(activeSession.start_time).getTime() : null, [activeSession]);
    const { hourData, totalToday } = useMemo(() =>
        calculateDistribution(isToday, activeSession?.tag_id || null, activeStartTime),
        [isToday, activeSession, activeStartTime, calculateDistribution]);

    return {
        user,
        tags,
        sessions,
        loading: authLoading || sessionsLoading,
        selectedDate,
        isToday,
        mounted,
        changeDate,
        getTagTotal,
        totalToday,
        hourData,
        fetchData
    };
}
