import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Tag, ActiveSession } from "../lib/types";
import { useAuth } from "../lib/auth-context";

export function useStopwatch(onSave?: () => void) {
    const { user } = useAuth();
    const [time, setTime] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);
    const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
    const [dailyTimes, setDailyTimes] = useState<Record<string, number>>({});

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const switchingRef = useRef(false);
    const activeSessionRef = useRef<ActiveSession | null>(null);
    const dailyTimesRef = useRef<Record<string, number>>({});

    // Keep refs in sync with state
    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    useEffect(() => {
        dailyTimesRef.current = dailyTimes;
    }, [dailyTimes]);

    const fetchTags = useCallback(async () => {
        if (!user) return;

        try {
            const { data: tagsData } = await supabase.from('tags').select('*');
            if (tagsData) {
                setTags(tagsData);

                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                const { data: sessionsData } = await supabase
                    .from('study_sessions')
                    .select('tag_id, duration')
                    .gte('created_at', startOfDay.toISOString());

                const totals: Record<string, number> = {};
                sessionsData?.forEach(s => {
                    totals[s.tag_id] = (totals[s.tag_id] || 0) + s.duration;
                });
                setDailyTimes(totals);

                const { data: activeSessions } = await supabase
                    .from('active_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .limit(1);

                if (activeSessions && activeSessions.length > 0) {
                    const session = activeSessions[0];
                    setActiveSession(session);
                    setActiveTagId(session.tag_id);

                    const tag = tagsData.find(t => t.id === session.tag_id);
                    localStorage.setItem('active_study_session', JSON.stringify({
                        tagId: session.tag_id,
                        startTime: new Date(session.start_time).getTime(),
                        color: tag?.color || '#22d3ee',
                        name: tag?.name,
                        icon: tag?.icon || 'Moon',
                        sessionId: session.id,
                        accumulated: totals[session.tag_id] || 0
                    }));
                } else {
                    setActiveSession(null);
                    setActiveTagId(null);
                    localStorage.removeItem('active_study_session');
                }
            }
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchTags();
        }
    }, [user, fetchTags]);

    useEffect(() => {
        if (activeSession && activeTagId) {
            if (timerRef.current) clearInterval(timerRef.current);

            timerRef.current = setInterval(() => {
                const startTime = new Date(activeSession.start_time);
                const now = new Date();

                const effectiveStartTime = (startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();

                const elapsed = Date.now() - effectiveStartTime;
                const accumulated = dailyTimes[activeTagId] || 0;
                setTime(accumulated + elapsed);
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setTime(0);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession, activeTagId, dailyTimes]);

    const startSession = async (tagId: string, currentTags?: Tag[]) => {
        if (!user) return null;

        const targetTags = currentTags || tags;
        const tag = targetTags.find(t => t.id === tagId);

        const { data: newSession, error } = await supabase
            .from('active_sessions')
            .insert({
                user_id: user.id,
                tag_id: tagId
            })
            .select()
            .single();

        if (!error && newSession) {
            setActiveSession(newSession);
            setActiveTagId(tagId);

            localStorage.setItem('active_study_session', JSON.stringify({
                tagId,
                startTime: new Date(newSession.start_time).getTime(),
                color: tag?.color || '#22d3ee',
                name: tag?.name,
                icon: tag?.icon || 'Moon',
                sessionId: newSession.id,
                accumulated: dailyTimesRef.current[tagId] || 0
            }));
            return newSession;
        }
        return null;
    };

    const endSession = async (sessionToEnd?: ActiveSession) => {
        const session = sessionToEnd || activeSessionRef.current;
        if (!session || !user) return;

        const tagId = session.tag_id;
        const { data: sessionData } = await supabase
            .from('active_sessions')
            .select('start_time')
            .eq('id', session.id)
            .single();

        if (sessionData) {
            const startTime = new Date(sessionData.start_time);
            const endTime = new Date();

            if (startTime.toDateString() !== endTime.toDateString()) {
                const sessionsToInsert = [];
                const endOfFirstDay = new Date(startTime);
                endOfFirstDay.setHours(23, 59, 59, 999);
                const durationDay1 = endOfFirstDay.getTime() - startTime.getTime();
                if (durationDay1 > 1000) {
                    sessionsToInsert.push({
                        user_id: user.id,
                        tag_id: tagId,
                        duration: durationDay1,
                        created_at: startTime.toISOString()
                    });
                }

                let currentDay = new Date(startTime);
                currentDay.setDate(currentDay.getDate() + 1);
                currentDay.setHours(0, 0, 0, 0);

                while (currentDay.toDateString() !== endTime.toDateString()) {
                    sessionsToInsert.push({
                        user_id: user.id,
                        tag_id: tagId,
                        duration: 24 * 60 * 60 * 1000,
                        created_at: new Date(currentDay).toISOString()
                    });
                    currentDay.setDate(currentDay.getDate() + 1);
                }

                const startOfLastDay = new Date(endTime);
                startOfLastDay.setHours(0, 0, 0, 0);
                const durationLastDay = endTime.getTime() - startOfLastDay.getTime();
                if (durationLastDay > 1000) {
                    sessionsToInsert.push({
                        user_id: user.id,
                        tag_id: tagId,
                        duration: durationLastDay,
                        created_at: startOfLastDay.toISOString()
                    });

                    setDailyTimes(prev => {
                        const newTimes = { ...prev, [tagId]: (prev[tagId] || 0) + durationLastDay };
                        dailyTimesRef.current = newTimes;
                        return newTimes;
                    });
                }

                if (sessionsToInsert.length > 0) {
                    await supabase.from('study_sessions').insert(sessionsToInsert);
                }
            } else {
                const duration = endTime.getTime() - startTime.getTime();
                if (duration >= 1000) {
                    await supabase.from('study_sessions').insert({
                        user_id: user.id,
                        tag_id: tagId,
                        duration: duration,
                        created_at: startTime.toISOString()
                    });

                    setDailyTimes(prev => {
                        const newTimes = { ...prev, [tagId]: (prev[tagId] || 0) + duration };
                        dailyTimesRef.current = newTimes;
                        return newTimes;
                    });
                }
            }

            if (onSave) onSave();
        }

        await supabase
            .from('active_sessions')
            .delete()
            .eq('id', session.id);

        if (activeSessionRef.current?.id === session.id) {
            setActiveSession(null);
            setActiveTagId(null);
        }
    };

    const handleTagClick = async (tagId: string) => {
        if (activeTagId === tagId || switchingRef.current || !user) return;

        switchingRef.current = true;
        try {
            // Immediate feedback: Clear active session UI
            setActiveTagId(null);
            localStorage.removeItem('active_study_session');

            // Find all active sessions for this user in DB to ensure total cleanup
            const { data: dbActiveSessions } = await supabase
                .from('active_sessions')
                .select('*')
                .eq('user_id', user.id);

            if (dbActiveSessions && dbActiveSessions.length > 0) {
                // End them all
                for (const session of dbActiveSessions) {
                    await endSession(session);
                }
            }

            // Small delay to ensure DB propagation and state settlement
            await startSession(tagId);
        } catch (error) {
            console.error("Error switching tags:", error);
            await fetchTags();
        } finally {
            switchingRef.current = false;
        }
    };

    const addTag = async (name: string) => {
        if (!user) return null;

        const { data } = await supabase.from('tags').insert([{
            name: name.trim(),
            user_id: user.id,
            icon: 'Cpu'
        }]).select().single();

        if (data) {
            setTags(prev => [...prev, data]);
            return data;
        }
        return null;
    };

    const updateTag = async (id: string, name: string, color: string, icon: string) => {
        const { error } = await supabase.from('tags')
            .update({ name, color, icon })
            .eq('id', id);

        if (!error) {
            setTags(prev => prev.map(t => t.id === id ? { ...t, name, color, icon } : t));
            const savedSession = localStorage.getItem('active_study_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                if (session.tagId === id) {
                    localStorage.setItem('active_study_session', JSON.stringify({
                        ...session,
                        name,
                        color,
                        icon
                    }));
                }
            }
            return true;
        }
        return false;
    };

    const deleteTag = async (id: string) => {
        await supabase.from('study_sessions').delete().eq('tag_id', id);
        const { error } = await supabase.from('tags').delete().eq('id', id);

        if (!error) {
            setTags(prev => prev.filter(t => t.id !== id));
            if (activeTagId === id) {
                localStorage.removeItem('active_study_session');
                setActiveTagId(null);
                setActiveSession(null);
            }
            return true;
        }
        return false;
    };

    // Real-time synchronization
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`stopwatch_sync_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'active_sessions',
                    filter: `user_id=eq.${user.id}`
                },
                () => fetchTags()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'study_sessions',
                    filter: `user_id=eq.${user.id}`
                },
                () => fetchTags()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tags',
                    filter: `user_id=eq.${user.id}`
                },
                () => fetchTags()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchTags]);

    return {
        time,
        tags,
        activeTagId,
        activeSession,
        dailyTimes,
        handleTagClick,
        addTag,
        updateTag,
        deleteTag
    };
}
