"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodicStatsProps {
    userId: string | undefined;
    tags: Tag[];
    currentDate: Date;
}

export function PeriodicStats({ userId, tags, currentDate }: PeriodicStatsProps) {
    const [view, setView] = useState<"week" | "month">("week");
    const [groupMode, setGroupMode] = useState<"tags" | "groups">("tags");
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [prevSessions, setPrevSessions] = useState<any[]>([]);
    const [groupNames, setGroupNames] = useState<Record<string, string>>({});
    const [editingGroup, setEditingGroup] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    const fetchRangeData = async () => {
        if (!userId) return;
        setLoading(true);
        
        try {
            let start = new Date(currentDate);
            let end = new Date(currentDate);
            let prevStart = new Date(currentDate);
            let prevEnd = new Date(currentDate);

            if (view === "week") {
                const day = start.getDay() || 7;
                start.setDate(start.getDate() - (day - 1));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);

                prevStart = new Date(start);
                prevStart.setDate(prevStart.getDate() - 7);
                prevEnd = new Date(prevStart);
                prevEnd.setDate(prevEnd.getDate() + 6);
                prevEnd.setHours(23, 59, 59, 999);
            } else {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);

                prevStart = new Date(start);
                prevStart.setMonth(prevStart.getMonth() - 1);
                prevEnd = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0);
                prevEnd.setHours(23, 59, 59, 999);
            }

            const [currentRes, prevRes, groupsRes] = await Promise.all([
                supabase
                    .from('study_sessions')
                    .select('tag_id, duration, created_at')
                    .eq('user_id', userId)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString()),
                supabase
                    .from('study_sessions')
                    .select('tag_id, duration, created_at')
                    .eq('user_id', userId)
                    .gte('created_at', prevStart.toISOString())
                    .lte('created_at', prevEnd.toISOString()),
                supabase
                    .from('tag_groups')
                    .select('icon, color, name')
                    .eq('user_id', userId)
            ]);

            setSessions(currentRes.data || []);
            setPrevSessions(prevRes.data || []);
            
            const nameMap: Record<string, string> = {};
            groupsRes.data?.forEach(g => {
                nameMap[g.icon || 'Cpu'] = g.name;
            });
            setGroupNames(nameMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRangeData();
    }, [userId, view, currentDate]);

    const saveGroupName = async (icon: string, color: string, name: string) => {
        if (!userId) return;
        const key = `${icon}|${color}`;
        try {
            const { error } = await supabase
                .from('tag_groups')
                .upsert({ user_id: userId, icon, color, name }, { onConflict: 'user_id,icon,color' });
            
            if (!error) {
                setGroupNames(prev => ({ ...prev, [key]: name }));
                setEditingGroup(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const displayStats = useMemo(() => {
        const tagTotals: Record<string, number> = {};
        sessions.forEach(s => {
            tagTotals[s.tag_id] = (tagTotals[s.tag_id] || 0) + s.duration;
        });

        if (groupMode === "tags") {
            return tags
                .map(tag => ({
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    icon: tag.icon,
                    total: tagTotals[tag.id] || 0
                }))
                .filter(t => t.total > 0)
                .sort((a, b) => b.total - a.total);
        } else {
            const groups: Record<string, { key: string, name: string, color: string, icon: string, total: number }> = {};
            tags.forEach(tag => {
                const key = tag.icon || 'Cpu';
                const total = tagTotals[tag.id] || 0;
                if (total > 0) {
                    if (!groups[key]) {
                        groups[key] = { 
                            key, 
                            name: groupNames[key] || "Untitled Group", 
                            color: tag.color || "#fff", 
                            icon: tag.icon || "", 
                            total: 0 
                        };
                    }
                    groups[key].total += total;
                }
            });
            return Object.values(groups).sort((a, b) => b.total - a.total);
        }
    }, [tags, sessions, groupMode, groupNames]);

    const totalDuration = useMemo(() => sessions.reduce((acc, s) => acc + s.duration, 0), [sessions]);
    const prevTotalDuration = useMemo(() => prevSessions.reduce((acc, s) => acc + s.duration, 0), [prevSessions]);

    const comparison = useMemo(() => {
        if (prevTotalDuration === 0) return null;
        const diff = totalDuration - prevTotalDuration;
        const percent = (diff / prevTotalDuration) * 100;
        return { diff, percent };
    }, [totalDuration, prevTotalDuration]);

    return (
        <div className="space-y-12 py-10 font-suit">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.03] pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                        <h2 className="text-[9px] font-black uppercase text-neutral-600 tracking-[0.3em]">Temporal Insights</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <p className="text-3xl sm:text-4xl font-semibold tracking-tighter text-white capitalize">{view}</p>
                        <div className="flex bg-white/[0.02] p-1 rounded-lg border border-white/5 h-9">
                            {(["week", "month"] as const).map(v => (
                                <button 
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={cn(
                                        "px-4 rounded-md text-[9px] font-bold uppercase transition-all tracking-widest",
                                        view === v ? "bg-white text-black" : "text-neutral-500 hover:text-neutral-300"
                                    )}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex bg-white/[0.02] p-1 rounded-lg border border-white/5 h-9">
                    {(["tags", "groups"] as const).map(m => (
                        <button 
                            key={m}
                            onClick={() => setGroupMode(m)} 
                            className={cn(
                                "px-4 rounded-md text-[9px] font-black uppercase tracking-widest transition-all", 
                                groupMode === m ? "bg-white text-black" : "text-neutral-600 hover:text-neutral-400"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center border border-white/5 rounded-[40px] bg-white/[0.01]">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-800" />
                </div>
            ) : displayStats.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[40px] bg-white/[0.01] space-y-4 grayscale">
                    <BarChart3 className="w-8 h-8 text-neutral-800" />
                    <p className="text-[10px] font-bold uppercase text-neutral-700 tracking-widest">No spectral data detected in this cycle.</p>
                </div>
            ) : (
                <div className="space-y-16">
                    {/* Primary Focus: Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayStats.map((stat: any, idx) => {
                             const IconComponent = stat.icon && (Icons as any)[stat.icon] ? (Icons as any)[stat.icon] : null;
                             const isEditing = groupMode === 'groups' && editingGroup === stat.key;

                             return (
                                <motion.div
                                    key={stat.id || stat.key}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-10 rounded-[40px] border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-6 flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    style={{ borderColor: `${stat.color}33` }}
                                                >
                                                    {IconComponent ? (
                                                        <IconComponent className="w-5 h-5" style={{ color: stat.color }} />
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color || "#fff" }} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isEditing ? (
                                                        <input
                                                            autoFocus
                                                            className="bg-transparent border-b border-white/20 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none w-full"
                                                            value={newName}
                                                            onChange={e => setNewName(e.target.value)}
                                                            onBlur={() => saveGroupName(stat.icon, stat.color, newName)}
                                                            onKeyDown={e => e.key === 'Enter' && saveGroupName(stat.icon, stat.color, newName)}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 group/title">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neutral-400 transition-colors truncate">
                                                                {stat.name}
                                                            </span>
                                                            {groupMode === 'groups' && (
                                                                <button 
                                                                    onClick={() => { setEditingGroup(stat.key); setNewName(stat.name); }}
                                                                    className="opacity-0 group-hover/title:opacity-100 transition-opacity"
                                                                >
                                                                    <Icons.Edit2 className="w-2.5 h-2.5 text-neutral-700" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-800">
                                                        <span>{((stat.total / totalDuration) * 100).toFixed(0)}%</span>
                                                        <div className="h-2 w-px bg-white/5" />
                                                        <span>{view === 'week' ? 'Weekly Share' : 'Monthly Share'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-4xl font-semibold tracking-tighter text-white tabular-nums">
                                                {formatDuration(stat.total)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Minimal Background Progress */}
                                    <div className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.total / totalDuration) * 100}%` }}
                                            className="h-full"
                                            style={{ backgroundColor: stat.color || "#fff" }}
                                        />
                                    </div>
                                </motion.div>
                             );
                        })}
                    </div>

                    {/* Secondary Context: Total Summary */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/[0.01] border border-white/[0.03] rounded-[40px] p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-12"
                    >
                        <div className="space-y-2 text-center md:text-left">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-700 block">Global Result</span>
                            <div className="text-5xl sm:text-7xl font-semibold tracking-tighter text-white tabular-nums leading-none">
                                {formatDuration(totalDuration)}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-12">
                             {comparison && (
                                <div className="space-y-4">
                                    <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest block text-center md:text-right">Performance</span>
                                    <div className={cn(
                                        "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center gap-2.5 border backdrop-blur-md",
                                        comparison.diff >= 0 ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-rose-500/5 text-rose-400 border-rose-500/10"
                                    )}>
                                        {comparison.diff >= 0 ? <Icons.ArrowUpRight className="w-4 h-4" /> : <Icons.ArrowDownRight className="w-4 h-4" />}
                                        {Math.abs(comparison.percent).toFixed(1)}% Trend
                                    </div>
                                </div>
                             )}
                             <div className="h-16 w-px bg-white/[0.03] hidden sm:block" />
                             <div className="space-y-4 text-center md:text-right">
                                <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest block">Average Daily</span>
                                <div className="text-2xl font-mono text-white/40">{formatDuration(totalDuration / (view === 'week' ? 7 : 30))}</div>
                             </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
