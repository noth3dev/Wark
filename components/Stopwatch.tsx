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

export default function Stopwatch({ onSave }: StopwatchProps) {
    const [time, setTime] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);
    const [dailyTimes, setDailyTimes] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showAddTag, setShowAddTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        const { data: tagsData } = await supabase.from('tags').select('*');
        if (tagsData) {
            setTags(tagsData);

            // Fetch daily totals
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

            // Resume or initialize session
            const savedSession = localStorage.getItem('active_study_session');
            if (savedSession) {
                const { tagId } = JSON.parse(savedSession);
                setActiveTagId(tagId);
            } else if (tagsData.length > 0) {
                const firstTag = tagsData[0];
                setActiveTagId(firstTag.id);
                localStorage.setItem('active_study_session', JSON.stringify({
                    tagId: firstTag.id,
                    startTime: Date.now(),
                    color: firstTag.color || '#22d3ee',
                    name: firstTag.name,
                    icon: firstTag.icon || 'Moon',
                    accumulated: totals[firstTag.id] || 0
                }));
            }
        }
    };

    useEffect(() => {
        if (activeTagId) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                const savedSession = localStorage.getItem('active_study_session');
                if (savedSession) {
                    const { startTime, tagId } = JSON.parse(savedSession);
                    if (tagId === activeTagId) {
                        const elapsed = Date.now() - startTime;
                        const accumulated = dailyTimes[activeTagId] || 0;
                        setTime(accumulated + elapsed);
                    }
                }
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setTime(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [activeTagId, dailyTimes]);

    const handleTagClick = async (tagId: string) => {
        if (activeTagId === tagId) return;

        const savedSession = localStorage.getItem('active_study_session');
        if (savedSession && activeTagId) {
            const { startTime } = JSON.parse(savedSession);
            const finalDuration = Date.now() - startTime;
            await saveSession(activeTagId, finalDuration);

            setDailyTimes(prev => ({
                ...prev,
                [activeTagId]: (prev[activeTagId] || 0) + finalDuration
            }));
        }

        const tag = tags.find(t => t.id === tagId);
        const startTime = Date.now();
        localStorage.setItem('active_study_session', JSON.stringify({
            tagId,
            startTime,
            color: tag?.color || '#22d3ee',
            name: tag?.name,
            icon: tag?.icon || 'Moon',
            accumulated: dailyTimes[tagId] || 0
        }));
        setActiveTagId(tagId);
    };

    const saveSession = async (tagId: string, duration: number) => {
        if (duration < 1000) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('study_sessions').insert([{
                user_id: user.id,
                tag_id: tagId,
                duration: duration
            }]);
            if (onSave) onSave();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
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
