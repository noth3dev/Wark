"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { useGoals, Goal } from "../../hooks/useGoals";
import { supabase } from "../../lib/supabase";
import { 
    Target, Plus, Trash2, Calendar, Clock, CheckCircle2, 
    ChevronRight, ArrowUpRight, Loader2, X, AlertCircle,
    ChevronLeft, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

// Helper to format duration
const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

// Helper to get start of period
const getPeriodStart = (period: "daily" | "weekly" | "monthly" | "yearly") => {
    const now = new Date();
    if (period === "daily") {
        now.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
        now.setDate(diff);
        now.setHours(0, 0, 0, 0);
    } else if (period === "monthly") {
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
    } else if (period === "yearly") {
        now.setMonth(0, 1);
        now.setHours(0, 0, 0, 0);
    }
    return now.toISOString();
};

export default function GoalPage() {
    const { user } = useAuth();
    const { goals, loading, addGoal, deleteGoal } = useGoals();
    const [progressData, setProgressData] = useState<Record<string, number>>({});
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tags, setTags] = useState<any[]>([]);
    
    // Filter by period in the UI
    const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yearly">("weekly");

    // Form state
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"duration" | "count">("duration");
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
    const [targetValue, setTargetValue] = useState("");
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchTags = async () => {
            const { data } = await supabase.from("tags").select("*").eq("user_id", user.id);
            if (data) setTags(data);
        };
        fetchTags();
    }, [user]);

    // Fetch progress for each goal
    useEffect(() => {
        if (!user || goals.length === 0) return;

        const fetchProgress = async () => {
            const results: Record<string, number> = {};

            for (const goal of goals) {
                const startTime = getPeriodStart(goal.period);
                
                if (goal.type === "duration") {
                    let query = supabase
                        .from("study_sessions")
                        .select("duration")
                        .eq("user_id", user.id)
                        .gte("created_at", startTime);
                    
                    if (goal.tag_id) {
                        query = query.eq("tag_id", goal.tag_id);
                    }

                    const { data } = await query;
                    const totalDuration = (data || []).reduce((acc, s) => acc + s.duration, 0);
                    results[goal.id] = totalDuration;
                } else {
                    let query = supabase
                        .from("solved_problems")
                        .select("count")
                        .eq("user_id", user.id)
                        .gte("date", startTime.split('T')[0]);

                    if (goal.tag_id) {
                        query = query.eq("tag_id", goal.tag_id);
                    }

                    const { data } = await query;
                    const totalCount = (data || []).reduce((acc, s) => acc + s.count, 0);
                    results[goal.id] = totalCount;
                }
            }
            setProgressData(results);
        };

        fetchProgress();
    }, [user, goals]);

    const filteredGoals = useMemo(() => {
        return goals.filter(g => g.period === activeTab || (activeTab === "weekly" && g.period === "daily"));
    }, [goals, activeTab]);

    const overallProgress = useMemo(() => {
        if (filteredGoals.length === 0) return 0;
        const total = filteredGoals.reduce((acc, g) => {
            const current = progressData[g.id] || 0;
            return acc + Math.min(1, current / g.target_value);
        }, 0);
        return Math.round((total / filteredGoals.length) * 100);
    }, [filteredGoals, progressData]);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !targetValue) return;

        let val = parseInt(targetValue);
        if (type === "duration") {
            val = val * 60 * 60 * 1000;
        }

        await addGoal({
            title,
            type,
            period,
            target_value: val,
            tag_id: selectedTagId
        });

        setIsAddModalOpen(false);
        setTitle("");
        setTargetValue("");
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="h-full bg-black text-white overflow-y-auto no-scrollbar relative font-suit selection:bg-blue-500/20">
            {/* Top Progress Bar */}
            <div className="fixed top-[64px] left-0 w-full z-50 h-[1.5px] bg-white/5">
                <motion.div
                    animate={{ width: `${overallProgress}%` }}
                    className="h-full bg-blue-500 transition-all duration-1000"
                />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-40 space-y-12 sm:space-y-16">
                
                {/* Header Section (Matching /homework-outer) */}
                <header className="space-y-8 sm:space-y-10 border-y border-white/5 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-0">
                        <div className="space-y-1.5 sm:space-y-2">
                            <p className="text-[9px] sm:text-[10px] text-neutral-600 font-bold uppercase tracking-wider">Strategic Mission</p>
                            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tighter leading-none uppercase">Objective <span className="text-blue-500 italic">Control</span></h1>
                        </div>
                        <div className="flex sm:block items-end justify-between sm:text-right border-t border-white/5 sm:border-0 pt-4 sm:pt-0">
                            <p className="text-[9px] sm:text-[10px] text-neutral-600 font-bold uppercase mb-1 sm:mb-2">Total Yield</p>
                            <p className="text-3xl sm:text-4xl font-mono text-white/20">{overallProgress}%</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-6">
                        <div className="flex items-center justify-between sm:justify-start gap-4">
                            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-md text-[10px] font-bold uppercase text-white transition-all">
                                    <Plus className="w-3 h-3" /> Initiation
                                </button>
                            </div>
                        </div>

                        <div className="hidden sm:block h-4 w-px bg-white/10" />
                        <div className="flex-1 flex gap-2">
                            <div className="flex gap-8">
                                {["weekly", "monthly", "yearly"].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setActiveTab(t as any)}
                                        className={cn(
                                            "pb-2 text-[11px] font-bold uppercase transition-all relative",
                                            activeTab === t ? "text-white" : "text-neutral-600 hover:text-neutral-400"
                                        )}
                                    >
                                        {t}
                                        {activeTab === t && (
                                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Section */}
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-bold text-neutral-700 uppercase leading-none">{activeTab} Operational Status</h2>
                    </div>

                    {filteredGoals.length === 0 ? (
                        <div className="py-40 text-center space-y-4 opacity-20">
                            <div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center">
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                            </div>
                            <p className="text-[11px] font-bold uppercase text-neutral-400">No active protocols for this cycle.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredGoals.map((goal) => {
                                const current = progressData[goal.id] || 0;
                                const progress = Math.min(100, Math.round((current / goal.target_value) * 100));
                                const tag = tags.find(t => t.id === goal.tag_id);

                                return (
                                    <motion.div 
                                        layout
                                        key={goal.id} 
                                        className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 p-6 sm:p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                        <Target className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-base sm:text-lg font-semibold tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                                                            {goal.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold uppercase text-neutral-600">{goal.period} cycle</span>
                                                            {tag && (
                                                                <>
                                                                    <div className="w-1 h-1 rounded-full bg-neutral-800" />
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                                                                        <span className="text-[9px] font-bold uppercase text-neutral-500">{tag.name}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => deleteGoal(goal.id)}
                                                    className="p-2 text-neutral-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-mono text-neutral-600 uppercase tracking-tighter">
                                                    <span>progress status</span>
                                                    <span>{progress}% complete</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1 }}
                                                        className="h-full bg-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-8">
                                            <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">current / target</p>
                                            <div className="text-right">
                                                <p className="text-xl sm:text-2xl font-mono tabular-nums leading-none">
                                                    {goal.type === "duration" ? formatDuration(current) : current}
                                                </p>
                                                <p className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest mt-1">
                                                    OF {goal.type === "duration" ? formatDuration(goal.target_value) : goal.target_value}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Goal Modal (Tactical Style) */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-black border border-white/10 rounded-2xl p-8 space-y-10"
                        >
                            <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                <h2 className="text-xl font-bold uppercase tracking-tight">Protocol Deployment</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-neutral-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddGoal} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-neutral-600">objective title</label>
                                        <input 
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-colors"
                                            placeholder="Enter protocol name..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-neutral-600">metric</label>
                                            <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
                                                <button type="button" onClick={() => setType("duration")} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", type === "duration" ? "bg-white text-black" : "text-neutral-500")}>Time</button>
                                                <button type="button" onClick={() => setType("count")} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", type === "count" ? "bg-white text-black" : "text-neutral-500")}>Count</button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-neutral-600">frequency</label>
                                            <select value={period} onChange={(e: any) => setPeriod(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2 text-[10px] font-bold uppercase text-white focus:outline-none">
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                                <option value="daily">Daily</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-neutral-600">{type === "duration" ? "target hours" : "target quantity"}</label>
                                        <input 
                                            required
                                            type="number"
                                            value={targetValue}
                                            onChange={(e) => setTargetValue(e.target.value)}
                                            className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/20"
                                            placeholder={type === "duration" ? "e.g. 40" : "e.g. 100"}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-neutral-600">tag association</label>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => setSelectedTagId(null)} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all", selectedTagId === null ? "bg-white border-white text-black" : "bg-white/5 border-white/5 text-neutral-500")}>Global</button>
                                            {tags.map(tag => (
                                                <button key={tag.id} type="button" onClick={() => setSelectedTagId(tag.id)} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all", selectedTagId === tag.id ? "bg-white border-white text-black" : "bg-white/5 border-white/5 text-neutral-500")}>{tag.name}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-white text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all">
                                    Confirm Deployment
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </main>
    );
}
