"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Plus, LayoutGrid } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { TimerDisplay } from "./stopwatch/TimerDisplay";
import { TagItem } from "./stopwatch/TagItem";
import { TagModal } from "./stopwatch/TagModal";

interface Tag {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

interface StopwatchProps {
    onSave?: () => void;
}

interface ActiveSession {
    id: string;
    tag_id: string;
    start_time: string;
}

export default function Stopwatch({ onSave }: StopwatchProps) {
    const [time, setTime] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);
    const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
    const [dailyTimes, setDailyTimes] = useState<Record<string, number>>({});
    const [showAddTag, setShowAddTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tagsData } = await supabase.from('tags').select('*');
        if (tagsData) {
            setTags(tagsData);

            // Fetch daily totals from study_sessions
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

            // Check for existing active session
            const { data: activeSessions } = await supabase
                .from('active_sessions')
                .select('*')
                .eq('user_id', user.id)
                .limit(1);

            if (activeSessions && activeSessions.length > 0) {
                const session = activeSessions[0];
                setActiveSession(session);
                setActiveTagId(session.tag_id);

                // Update localStorage for header sync
                const tag = tagsData.find(t => t.id === session.tag_id);
                localStorage.setItem('active_study_session', JSON.stringify({
                    tagId: session.tag_id,
                    startTime: new Date(session.start_time).getTime(),
                    color: tag?.color || '#22d3ee',
                    name: tag?.name,
                    icon: tag?.icon || 'Moon',
                    sessionId: session.id
                }));
            } else if (tagsData.length > 0) {
                // Auto-start first tag
                await startSession(tagsData[0].id);
            }
        }
    };

    // Timer update based on DB start_time
    useEffect(() => {
        if (activeSession && activeTagId) {
            if (timerRef.current) clearInterval(timerRef.current);

            timerRef.current = setInterval(() => {
                const startTime = new Date(activeSession.start_time).getTime();
                const elapsed = Date.now() - startTime;
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

    const startSession = async (tagId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const tag = tags.find(t => t.id === tagId);

        // Insert new active session - DB will set start_time automatically
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

            // Update localStorage for header sync
            localStorage.setItem('active_study_session', JSON.stringify({
                tagId,
                startTime: new Date(newSession.start_time).getTime(),
                color: tag?.color || '#22d3ee',
                name: tag?.name,
                icon: tag?.icon || 'Moon',
                sessionId: newSession.id
            }));
        }
    };

    const endSession = async () => {
        if (!activeSession || !activeTagId) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate duration from DB timestamps
        const { data: session } = await supabase
            .from('active_sessions')
            .select('start_time')
            .eq('id', activeSession.id)
            .single();

        if (session) {
            const startTime = new Date(session.start_time);
            const endTime = new Date();

            // Check if session spanned multiple days
            if (startTime.toDateString() !== endTime.toDateString()) {
                const sessionsToInsert = [];

                // 1. First Day: startTime to 23:59:59.999
                const endOfFirstDay = new Date(startTime);
                endOfFirstDay.setHours(23, 59, 59, 999);
                const durationDay1 = endOfFirstDay.getTime() - startTime.getTime();
                if (durationDay1 > 1000) {
                    sessionsToInsert.push({
                        user_id: user.id,
                        tag_id: activeTagId,
                        duration: durationDay1,
                        created_at: startTime.toISOString()
                    });
                }

                // 2. Intermediate Days (if any, for sessions > 24h)
                let currentDay = new Date(startTime);
                currentDay.setDate(currentDay.getDate() + 1);
                currentDay.setHours(0, 0, 0, 0);

                while (currentDay.toDateString() !== endTime.toDateString()) {
                    sessionsToInsert.push({
                        user_id: user.id,
                        tag_id: activeTagId,
                        duration: 24 * 60 * 60 * 1000, // Full day
                        created_at: new Date(currentDay).toISOString()
                    });
                    currentDay.setDate(currentDay.getDate() + 1);
                }

                // 3. Last Day (Today): 00:00:00 to endTime
                const startOfLastDay = new Date(endTime);
                startOfLastDay.setHours(0, 0, 0, 0);
                const durationLastDay = endTime.getTime() - startOfLastDay.getTime();
                if (durationLastDay > 1000) {
                    sessionsToInsert.push({
                        user_id: user.id,
                        tag_id: activeTagId,
                        duration: durationLastDay,
                        created_at: startOfLastDay.toISOString()
                    });

                    // Update UI total for today
                    setDailyTimes(prev => ({
                        ...prev,
                        [activeTagId]: (prev[activeTagId] || 0) + durationLastDay
                    }));
                }

                if (sessionsToInsert.length > 0) {
                    await supabase.from('study_sessions').insert(sessionsToInsert);
                }
            } else {
                // Normal case: Same day
                const duration = endTime.getTime() - startTime.getTime();
                if (duration >= 1000) {
                    await supabase.from('study_sessions').insert({
                        user_id: user.id,
                        tag_id: activeTagId,
                        duration: duration,
                        created_at: startTime.toISOString()
                    });

                    setDailyTimes(prev => ({
                        ...prev,
                        [activeTagId]: (prev[activeTagId] || 0) + duration
                    }));
                }
            }

            if (onSave) onSave();
        }

        // Delete active session
        await supabase
            .from('active_sessions')
            .delete()
            .eq('id', activeSession.id);

        setActiveSession(null);
    };

    const handleTagClick = async (tagId: string) => {
        if (activeTagId === tagId) return;

        // End current session and save
        if (activeSession) {
            await endSession();
        }

        // Start new session
        await startSession(tagId);
    };

    const addTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase.from('tags').insert([{
            name: newTagName.trim(),
            user_id: user.id,
            icon: 'Cpu' // Default icon
        }]).select().single();

        if (data) {
            setTags([...tags, data]);
            setNewTagName("");
            setShowAddTag(false);
        }
    };

    const updateTag = async (id: string, name: string, color: string, icon: string) => {
        const { error } = await supabase.from('tags')
            .update({ name, color, icon })
            .eq('id', id);

        if (!error) {
            setTags(tags.map(t => t.id === id ? { ...t, name, color, icon } : t));
            setEditingTag(null);

            // Sync with active session if updated tag is active
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
        }
    };

    const deleteTag = async (id: string) => {
        if (!confirm("This will permanently decommission this tag and all associated protocol logs. Proceed?")) return;

        await supabase.from('study_sessions').delete().eq('tag_id', id);
        const { error } = await supabase.from('tags').delete().eq('id', id);

        if (!error) {
            setTags(tags.filter(t => t.id !== id));
            if (activeTagId === id) {
                localStorage.removeItem('active_study_session');
                setActiveTagId(tags.find(t => t.id !== id)?.id || null);
            }
            setEditingTag(null);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl space-y-8 sm:space-y-16 landscape:space-y-4">
            <TimerDisplay time={time} />

            <div className="w-full space-y-6 sm:space-y-8 flex flex-col items-center px-4 landscape:space-y-4">
                <div className="flex items-center justify-between w-full border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-3 h-3 text-neutral-600" />
                        <h2 className="text-[10px] font-bold uppercase text-neutral-600">하는 짓거리</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-2 rounded-lg transition-colors group ${isEditMode ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-600'}`}
                        >
                            <Settings className={`w-4 h-4 group-hover:text-white transition-all ${isEditMode ? 'rotate-90' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddTag(!showAddTag)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                        >
                            <Plus className={`w-4 h-4 text-neutral-600 group-hover:text-white transition-transform duration-300 ${showAddTag ? 'rotate-45' : ''}`} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showAddTag && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={addTag}
                            className="flex gap-2 w-full overflow-hidden"
                        >
                            <input
                                autoFocus
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Initialize new tag..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-suit"
                            />
                            <button type="submit" className="px-6 py-3 bg-white text-black text-[10px] font-bold rounded-xl hover:bg-neutral-200 transition-colors uppercase tracking-widest">
                                Add
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="flex flex-wrap justify-center gap-3 w-full">
                    {tags.map((tag) => (
                        <TagItem
                            key={tag.id}
                            tag={tag}
                            isActive={activeTagId === tag.id}
                            isEditMode={isEditMode}
                            onClick={() => isEditMode ? setEditingTag(tag) : handleTagClick(tag.id)}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {editingTag && (
                    <TagModal
                        tag={editingTag}
                        onClose={() => setEditingTag(null)}
                        onUpdate={updateTag}
                        onDelete={deleteTag}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
