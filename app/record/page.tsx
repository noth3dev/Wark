"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { Loader2, BarChart2, Calendar, Clock, ArrowLeft, History, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Tag {
    id: string;
    name: string;
    color?: string;
}

interface Session {
    tag_id: string;
    duration: number;
    created_at: string;
}

export default function RecordPage() {
    const { user, loading: authLoading } = useAuth();
    const [tags, setTags] = useState<Tag[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [activeSessionElapsed, setActiveSessionElapsed] = useState(0);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [authLoading, user, selectedDate]);

    const isToday = new Date().toDateString() === selectedDate.toDateString();

    // Real-time update for active session (DB-based)
    useEffect(() => {
        if (!isToday) {
            setActiveSessionElapsed(0);
            setActiveTagId(null);
            return;
        }

        const updateActiveSession = async () => {
            if (!user) return;

            // Fetch active session from DB
            const { data: activeSessions } = await supabase
                .from('active_sessions')
                .select('tag_id, start_time')
                .eq('user_id', user.id)
                .limit(1);

            if (activeSessions && activeSessions.length > 0) {
                const session = activeSessions[0];
                const startTime = new Date(session.start_time);
                const now = new Date();

                // If the session started on a previous day, only count from midnight of today
                const EffectiveStartTime = (isToday && startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();

                const elapsed = Date.now() - EffectiveStartTime;
                setActiveSessionElapsed(elapsed);
                setActiveTagId(session.tag_id);
            } else {
                setActiveSessionElapsed(0);
                setActiveTagId(null);
            }
        };

        // Initial update
        updateActiveSession();

        // Update every second
        const interval = setInterval(updateActiveSession, 1000);
        return () => clearInterval(interval);
    }, [isToday, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Tags
            const { data: tagsData } = await supabase.from('tags').select('*');
            if (tagsData) setTags(tagsData);

            // Fetch Selected Day's Sessions
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: sessionsData } = await supabase
                .from('study_sessions')
                .select('tag_id, duration, created_at')
                .eq('user_id', user!.id)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: true });

            if (sessionsData) setSessions(sessionsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const formatTime = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    };

    const getTagTotal = (tagId: string) => {
        const recordedTotal = sessions
            .filter(s => s.tag_id === tagId)
            .reduce((acc, curr) => acc + curr.duration, 0);

        return tagId === activeTagId ? recordedTotal + activeSessionElapsed : recordedTotal;
    };

    const totalToday = sessions.reduce((acc, curr) => acc + curr.duration, 0) + activeSessionElapsed;

    // Timeline logic: 24 slots representing 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Find sessions that fall into each hour
    const getSessionsInHour = (hour: number) => {
        return sessions.filter(s => {
            const date = new Date(s.created_at);
            return date.getHours() === hour;
        });
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white">
            <div className="max-w-6xl mx-auto px-6 py-24 space-y-24">
                {/* Header */}
                <header className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
                    >
                        <History className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">Activity Logs</span>
                    </motion.div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => changeDate(-1)}
                                    className="p-2 hover:bg-white/5 rounded-full border border-white/5 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-neutral-500" />
                                </button>
                                <div className="text-center min-w-[200px]">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 mb-1">
                                        {isToday ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                    </p>
                                    <h1 className="text-4xl md:text-6xl font-extralight tracking-tighter">
                                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </h1>
                                </div>
                                <button
                                    onClick={() => changeDate(1)}
                                    className="p-2 hover:bg-white/5 rounded-full border border-white/5 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-right"
                        >
                            <p className="text-[10px] font-bold uppercase text-neutral-600 mb-1">Lived</p>
                            <p className="text-4xl font-light tracking-tighter text-cyan-400">{formatTime(totalToday)}</p>
                        </motion.div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-16">
                    {/* Left: Tag Summaries */}
                    <div className="lg:col-span-4 space-y-8">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 border-b border-white/5 pb-4">Tag Distribution</h2>
                        <div className="space-y-4">
                            {tags.map(tag => {
                                const total = getTagTotal(tag.id);
                                if (total === 0) return null;
                                const percentage = ((total / totalToday) * 100).toFixed(1);

                                return (
                                    <motion.div
                                        key={tag.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                                <span className="text-sm font-bold tracking-tight">{tag.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold font-mono text-neutral-500">{percentage}%</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="h-full"
                                                    style={{ backgroundColor: tag.color || '#22d3ee' }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-right font-mono text-neutral-600 pt-1">{formatTime(total)}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {sessions.length === 0 && (
                                <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-xs text-neutral-600">No data recorded today.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Daily Timetable */}
                    <div className="lg:col-span-8 space-y-8">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 border-b border-white/5 pb-4">24H Protocol Execution</h2>
                        <div className="grid grid-cols-1 gap-1">
                            {hours.map(hour => {
                                const hourSessions = getSessionsInHour(hour);
                                let totalInHour = hourSessions.reduce((acc, curr) => acc + curr.duration, 0);

                                // Add active session if it's currently in this hour
                                const now = new Date();
                                if (isToday && now.getHours() === hour && activeSessionElapsed > 0) {
                                    totalInHour += activeSessionElapsed;
                                }

                                const intensity = Math.min(totalInHour / 3600000, 1); // 0 to 1

                                return (
                                    <div key={hour} className="group flex items-center gap-6 py-2">
                                        <div className="w-12 text-[10px] font-mono font-bold text-neutral-700 tabular-nums">
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>
                                        <div className="relative flex-1 h-12 bg-white/5 rounded-xl overflow-hidden border border-white/[0.02] group-hover:border-white/10 transition-colors">
                                            {/* Fill based on intensity */}
                                            {totalInHour > 0 && (
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-cyan-400/20 backdrop-blur-sm border-r border-cyan-400/30"
                                                    style={{ width: `${intensity * 100}%` }}
                                                />
                                            )}
                                            {/* Session Details on Hover */}
                                            <div className="absolute inset-0 flex items-center px-4 gap-2">
                                                {hourSessions.map((s, i) => {
                                                    const tag = tags.find(t => t.id === s.tag_id);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ backgroundColor: tag?.color || '#22d3ee' }}
                                                            title={`${tag?.name}: ${formatTime(s.duration)}`}
                                                        />
                                                    );
                                                })}
                                                {totalInHour > 0 && (
                                                    <span className="ml-auto text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 font-mono">
                                                        {((totalInHour / 3600000) * 60).toFixed(0)}m / 60m
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
