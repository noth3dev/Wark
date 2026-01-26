"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tag, Session } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export function useRecord() {
    const { user, loading: authLoading } = useAuth();
    const [tags, setTags] = useState<Tag[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [mounted, setMounted] = useState(false);

    const [activeSessionElapsed, setActiveSessionElapsed] = useState(0);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);
    const [activeStartTime, setActiveStartTime] = useState<number | null>(null);

    const isToday = new Date().toDateString() === selectedDate.toDateString();

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: tagsData } = await supabase.from('tags').select('*');
            if (tagsData) setTags(tagsData);

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: sessionsData } = await supabase
                .from('study_sessions')
                .select('id, tag_id, duration, created_at')
                .eq('user_id', user.id)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: true });

            if (sessionsData) setSessions(sessionsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        if (mounted && !authLoading && user) {
            fetchData();
        }
    }, [mounted, authLoading, user, selectedDate, fetchData]);

    // Real-time synchronization for data and active session
    useEffect(() => {
        if (!user || !mounted) return;

        const syncData = () => {
            fetchData();
        };

        const updateActiveSession = async () => {
            if (!isToday) {
                setActiveSessionElapsed(0);
                setActiveTagId(null);
                setActiveStartTime(null);
                return;
            }

            const { data: activeSessions } = await supabase
                .from('active_sessions')
                .select('tag_id, start_time')
                .eq('user_id', user.id)
                .limit(1);

            if (activeSessions && activeSessions.length > 0) {
                const session = activeSessions[0];
                const startTime = new Date(session.start_time);
                const now = new Date();

                const effectiveStartTime = (startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();

                setActiveSessionElapsed(Date.now() - effectiveStartTime);
                setActiveTagId(session.tag_id);
                setActiveStartTime(startTime.getTime());
            } else {
                setActiveSessionElapsed(0);
                setActiveTagId(null);
                setActiveStartTime(null);
            }
        };

        const channel = supabase
            .channel(`record_sync_${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${user.id}` },
                () => updateActiveSession()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${user.id}` },
                () => syncData()
            )
            .subscribe();

        // Initial fetch
        updateActiveSession();

        // Still need a local interval to update the "elapsed" time visually for active sessions
        const timerInterval = setInterval(() => {
            if (activeStartTime && isToday) {
                const now = new Date();
                const startTime = new Date(activeStartTime);
                const effectiveStartTime = (startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();
                setActiveSessionElapsed(Date.now() - effectiveStartTime);
            }
        }, 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(timerInterval);
        };
    }, [user, mounted, isToday, activeStartTime, fetchData]);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const getTagTotal = (tagId: string) => {
        const recordedTotal = sessions
            .filter(s => s.tag_id === tagId)
            .reduce((acc, curr) => acc + curr.duration, 0);

        return tagId === activeTagId ? recordedTotal + activeSessionElapsed : recordedTotal;
    };

    const { hourData, totalToday } = useMemo(() => {
        const startMs = new Date(selectedDate).setHours(0, 0, 0, 0);
        let dailyTotal = 0;

        const distribution = Array.from({ length: 24 }, (_, i) => {
            const hStart = startMs + i * 3600000;
            const hEnd = hStart + 3600000;

            // Get sessions overlapping with this hour
            const hourSessions = sessions.filter(s => {
                const sStart = new Date(s.created_at).getTime();
                const sEnd = sStart + s.duration;
                return Math.max(sStart, hStart) < Math.min(sEnd, hEnd);
            }).map(s => {
                const sStart = new Date(s.created_at).getTime();
                const sEnd = sStart + s.duration;
                return {
                    tag_id: s.tag_id,
                    start: Math.max(sStart, hStart),
                    end: Math.min(sEnd, hEnd)
                };
            });

            // Handle active session if today
            if (isToday && activeStartTime && activeTagId) {
                const sStart = activeStartTime;
                const sEnd = Date.now();
                if (Math.max(sStart, hStart) < Math.min(sEnd, hEnd)) {
                    hourSessions.push({
                        tag_id: activeTagId,
                        start: Math.max(sStart, hStart),
                        end: Math.min(sEnd, hEnd)
                    });
                }
            }

            // Sort by start time
            hourSessions.sort((a, b) => a.start - b.start);

            // Calculate segments (sessions and gaps) - handling overlaps
            const segments: { type: 'session' | 'gap', start: number, duration: number, tagId?: string }[] = [];
            let currentLeft = hStart;

            hourSessions.forEach(s => {
                // If the session starts after the current point, add a gap
                if (s.start > currentLeft) {
                    segments.push({
                        type: 'gap',
                        start: currentLeft,
                        duration: s.start - currentLeft
                    });
                    currentLeft = s.start;
                }

                // If the session ends after the current point (it provides new coverage)
                if (s.end > currentLeft) {
                    segments.push({
                        type: 'session',
                        start: currentLeft,
                        duration: s.end - currentLeft,
                        tagId: s.tag_id
                    });
                    currentLeft = s.end;
                }
            });

            // Final gap if remaining
            if (currentLeft < hEnd) {
                segments.push({
                    type: 'gap',
                    start: currentLeft,
                    duration: hEnd - currentLeft
                });
            }

            // Calculate total non-overlapping duration for this hour
            const totalInHour = segments
                .filter(seg => seg.type === 'session')
                .reduce((acc, curr) => acc + curr.duration, 0);

            dailyTotal += totalInHour;

            return {
                hour: i,
                total: totalInHour,
                segments
            };
        });

        return { hourData: distribution, totalToday: dailyTotal };
    }, [sessions, selectedDate, isToday, activeStartTime, activeTagId]);

    return {
        user,
        tags,
        sessions,
        loading: authLoading || loading,
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
