"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHomework, Homework } from "../../hooks/useHomework";
import { useStopwatch } from "../../hooks/useStopwatch";
import { useTags } from "../../hooks/useTags";
import { useAuth } from "../../lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Share2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { ExportDialog } from "../../components/ExportDialog";
import { persistenceService } from "../../lib/services/persistenceService";
import { TaskNode } from "./TaskNode";
import { TaskEntry } from "./TaskEntry";

function getFormattedWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setHours(-24 * (day - 1));
    const start = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    d.setHours(24 * 6);
    const end = d.toLocaleDateString('ko-KR', { day: 'numeric' });
    return `${start} — ${end}`;
}

function getWeekInfo(dateStr: string | Date) {
    const d = new Date(dateStr);
    // Move to the Monday of this week (Mon-Sun style)
    const day = d.getDay() || 7; // 1-7
    d.setHours(-24 * (day - 1));
    d.setHours(12, 0, 0, 0); // To normalize time
    
    return { 
        year: d.getFullYear(), 
        month: d.getMonth() + 1, 
        day: d.getDate() 
    };
}

function formatWeekKey(info: { year: number; month: number; day: number }) {
    return `${info.year}-${info.month}-${info.day}`;
}

export default function HomeworkOuterPage({ searchParams, userId: propUserId }: any) {
    const { user, loading: authLoading } = useAuth();
    const userId = propUserId || searchParams?.userId;
    const viewedUserId = userId || user?.id;
    const canEdit = !!user && user.id === viewedUserId;

    const {
        homeworks = [],
        loading: homeworkLoading,
        addHomework,
        toggleHomework,
        deleteHomework,
        addSubtask,
        updateHomework,
        updateSubtask,
        recordTime,
        toggleSubtask,
        deleteSubtask,
        setPlannedDate,
        smartPlan
    } = useHomework(viewedUserId);

    const { tags, dailyTimes, time, activeTagId, activeSession, sessionLoading, handleTagClick: triggerTagTimer } = useStopwatch(undefined, viewedUserId);
    const { addTag } = useTags();

    const [activeTask, setActiveTask] = useState<{ hwId: string, taskId: string, tagId: string | null, startTime: number } | null>(null);
    const [sessionMs, setSessionMs] = useState(0);

    // PERSISTENCE: Load on mount
    useEffect(() => {
        if (!canEdit) return;
        const saved = persistenceService.getActiveTask();
        if (saved) {
            setActiveTask(saved);
        }
    }, [canEdit]);

    // Recalculate Ms when activeTask is set or every second
    useEffect(() => {
        let interval: any;
        if (activeTask) {
            setSessionMs(Date.now() - activeTask.startTime);
            interval = setInterval(() => {
                setSessionMs(Date.now() - activeTask.startTime);
            }, 1000);
        } else {
            setSessionMs(0);
        }
        return () => clearInterval(interval);
    }, [activeTask]);

    // Sync task stop if global tag changes
    useEffect(() => {
        if (sessionLoading) return;
        
        if (activeTask && activeSession && activeTask.tagId !== activeSession.tag_id) {
            pauseTask();
        } else if (activeTask && !activeSession) {
            // If tag session was ended elsewhere, stop task too
            pauseTask();
        }
    }, [activeSession?.tag_id, activeSession === null, sessionLoading]);

    const runTask = (hwId: string, taskId: string, tagId: string | null) => {
        if (activeTask) {
            pauseTask();
        }
        const taskObj = { hwId, taskId, tagId, startTime: Date.now() };
        setActiveTask(taskObj);
        persistenceService.setActiveTask(taskObj);
        setSessionMs(0);
        if (tagId && canEdit) {
            if (activeSession?.tag_id !== tagId) {
                triggerTagTimer(tagId);
            }
        }
    };

    const pauseTask = async () => {
        if (!activeTask) return;
        const currentMs = Date.now() - activeTask.startTime;
        const { hwId, taskId } = activeTask;
        
        setActiveTask(null);
        persistenceService.clearActiveTask();
        setSessionMs(0);
        
        if (currentMs > 1000) {
            await recordTime(hwId, taskId, currentMs);
        }
    };

    const loading = homeworkLoading || (authLoading && !userId);

    const [activeTab, setActiveTab] = useState("tasks");
    const [viewDate, setViewDate] = useState(new Date());
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
    const [hoveredTag, setHoveredTag] = useState<any>(null);

    // Independent tick for real-time UI updates
    // Initialized to 0 and set on mount to prevent hydration mismatch from Date.now()
    const [now, setNow] = useState(0);
    useEffect(() => {
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Calculate live tag durations: saved (dailyTimes) + live (if current tag is running)
    const liveTagTimes = useMemo(() => {
        return tags.map(tag => {
            const saved = dailyTimes[tag.id] || 0;
            let elapsed = 0;
            const isLive = activeSession?.tag_id === tag.id;
            
            if (isLive && activeSession?.start_time) {
                const startTime = new Date(activeSession.start_time).getTime();
                const todayMidnight = new Date().setHours(0,0,0,0);
                const effectiveStartTime = Math.max(startTime, todayMidnight);
                elapsed = Math.max(0, now - effectiveStartTime);
            }
            
            return {
                ...tag,
                ms: saved + elapsed,
                isLive
            };
        });
    }, [tags, dailyTimes, activeSession, now]);

    const weekInfo = useMemo(() => getWeekInfo(viewDate), [viewDate]);
    const weekKey = useMemo(() => formatWeekKey(weekInfo), [weekInfo]);

    const filtered = useMemo(() =>
        homeworks.filter(h => formatWeekKey(getWeekInfo(h.created_at)) === weekKey),
        [homeworks, weekKey]
    );

    const statusFiltered = useMemo(() => {
        if (statusFilter === "all") return filtered;
        if (statusFilter === "done") return filtered.filter(h => h.status === "completed");
        if (statusFilter === "pending") return filtered.filter(h => h.status !== "completed");
        return filtered;
    }, [filtered, statusFilter]);

    const regularTasks = useMemo(() => statusFiltered.filter(h => !h.is_plus_alpha), [statusFiltered]);
    const plusAlphaTasks = useMemo(() => statusFiltered.filter(h => h.is_plus_alpha), [statusFiltered]);

    const progress = useMemo(() => {
        const calc = (tasks: any[]): { t: number; d: number } =>
            tasks.reduce((acc, t) => {
                if (!t.subtasks || t.subtasks.length === 0) {
                    return { t: acc.t + 1, d: acc.d + (t.status === "completed" ? 1 : 0) };
                }
                const sub = calc(t.subtasks);
                return { t: acc.t + sub.t, d: acc.d + sub.d };
            }, { t: 0, d: 0 });

        const allRegularTasksForWeek = filtered.filter(h => !h.is_plus_alpha);
        const { t, d } = calc(allRegularTasksForWeek);
        return t === 0 ? 0 : Math.round((d / t) * 100);
    }, [filtered]);

    const shiftWeek = (n: number) => {
        const d = new Date(viewDate);
        d.setDate(d.getDate() + n * 7);
        setViewDate(d);
    };

    const formatDuration = (ms: number) => {
        if (!ms || ms < 1000) return "0s";
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        if (h > 0) return `${h}h ${m}m ${secs}s`;
        if (m > 0) return `${m}m ${secs}s`;
        return `${secs}s`;
    };

    return (
        <main className="h-full bg-black text-white overflow-y-auto no-scrollbar relative font-suit">
            {/* Progress Bar */}
            <div className="fixed top-[64px] left-0 w-full z-50 h-[1.5px] bg-white/5">
                <motion.div
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-500 transition-all duration-1000"
                />
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-40 space-y-16">
                <header className="space-y-10">
                    <div className="flex items-end justify-between">
                        <div className="space-y-2">
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider">Plan For</p>
                            <h1 className="text-5xl font-semibold tracking-tighter leading-none">{getFormattedWeek(viewDate)}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-neutral-600 font-bold uppercase mb-2">Completion</p>
                            <p className="text-4xl font-mono text-white/20">{progress}%</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-6 border-y border-white/5">
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                            <button onClick={() => shiftWeek(-1)} className="p-2 hover:bg-white/5 rounded-md"><ChevronLeft className="w-4 h-4 text-neutral-400" /></button>
                            <button onClick={() => setViewDate(new Date())} className="px-3 text-[10px] font-bold uppercase text-neutral-400 font-suit">Today</button>
                            <button onClick={() => shiftWeek(1)} className="p-2 hover:bg-white/5 rounded-md"><ChevronRight className="w-4 h-4 text-neutral-400" /></button>
                        </div>

                        {!!user && (
                            <button onClick={() => setIsExportOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                                <Share2 className="w-3 h-3" /> Export Summary
                            </button>
                        )}

                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex-1 flex gap-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-transparent h-auto p-0 flex gap-6">
                                    {["tasks", "timer"].map(t => (
                                        <TabsTrigger key={t} value={t} className="bg-transparent p-0 pb-2 text-sm transition-all data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_#fff] rounded-none text-neutral-600 font-medium uppercase">{t}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </header>

                <div className="min-h-[500px]">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsContent value="tasks" className="m-0 space-y-12 animate-in fade-in duration-700">
                            {canEdit && (
                                <TaskEntry
                                    onCommit={(c, a, t) => addHomework(c, a, t)}
                                    tags={tags}
                                    onAddTag={(n) => addTag(n, user.id)}
                                />
                            )}

                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                <h2 className="text-[10px] font-bold text-neutral-700 uppercase leading-none">Chronicle List</h2>
                                <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
                                    {(["all", "pending", "done"] as const).map(f => (
                                        <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all", statusFilter === f ? "bg-white text-black shadow-lg" : "text-neutral-600 hover:text-neutral-400")}>{f}</button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-32 flex justify-center opacity-40"><Loader2 className="w-8 h-8 animate-spin" /></div>
                            ) : statusFiltered.length === 0 ? (
                                <div className="py-40 text-center space-y-4 opacity-20">
                                    <div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center"><ChevronRight className="w-5 h-5 text-neutral-400" /></div>
                                    <p className="text-[11px] font-bold uppercase text-neutral-400">{statusFilter === 'all' ? "No active objectives for this cycle." : `No tasks matching '${statusFilter}' status.`}</p>
                                </div>
                            ) : (
                                <div className="space-y-20">
                                    {regularTasks.length > 0 && (
                                        <div className="space-y-4">
                                            {regularTasks.map(h => (
                                                <TaskNode 
                                                    key={h.id} 
                                                    node={h} 
                                                    depth={0} 
                                                    canEdit={canEdit} 
                                                    onToggle={(status: string) => toggleHomework(h.id, status)} 
                                                    onDelete={() => deleteHomework(h.id)} 
                                                    onAddSub={(parentId: string, content: string, tagId?: string | null) => addSubtask(h.id, parentId, content, tagId)} 
                                                    onToggleSub={(subId: string) => toggleSubtask(h.id, subId)} 
                                                    onDeleteSub={(subId: string) => deleteSubtask(h.id, subId)} 
                                                    onUpdate={(updates: any) => updateHomework(h.id, updates)} 
                                                    onUpdateSub={(subId: string, updates: any) => updateSubtask(h.id, subId, updates)} 
                                                    rootId={h.id} 
                                                    onSetDate={(targetId: string, date: string | null) => setPlannedDate(h.id, targetId, date)} 
                                                    tags={tags} 
                                                    isRunning={activeTask?.taskId === h.id}
                                                    onRun={runTask}
                                                    onPause={pauseTask}
                                                    currentSessionMs={sessionMs}
                                                    activeTaskId={activeTask?.taskId}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {plusAlphaTasks.length > 0 && (
                                        <div className="space-y-10 pt-10 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] text-neutral-700 font-black uppercase ">추가</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                            </div>
                                            <div className="space-y-4">
                                                {plusAlphaTasks.map(h => (
                                                    <TaskNode 
                                                        key={h.id} 
                                                        node={h} 
                                                        depth={0} 
                                                        canEdit={canEdit} 
                                                        onToggle={(status: string) => toggleHomework(h.id, status)} 
                                                        onDelete={() => deleteHomework(h.id)} 
                                                        onAddSub={(parentId: string, content: string, tagId?: string | null) => addSubtask(h.id, parentId, content, tagId)} 
                                                        onToggleSub={(subId: string) => toggleSubtask(h.id, subId)} 
                                                        onDeleteSub={(subId: string) => deleteSubtask(h.id, subId)} 
                                                        onUpdate={(updates: any) => updateHomework(h.id, updates)} 
                                                        onUpdateSub={(subId: string, updates: any) => updateSubtask(h.id, subId, updates)} 
                                                        rootId={h.id} 
                                                        onSetDate={(targetId: string, date: string | null) => setPlannedDate(h.id, targetId, date)} 
                                                        tags={tags} 
                                                        isRunning={activeTask?.taskId === h.id}
                                                        onRun={runTask}
                                                        onPause={pauseTask}
                                                        currentSessionMs={sessionMs}
                                                        activeTaskId={activeTask?.taskId}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>


                        <TabsContent value="timer" className="m-0 animate-in fade-in duration-500">
                            {/* 24h Summary Donut */}
                            {(() => {
                                const dayMs = 24 * 60 * 60 * 1000;
                                const totalMs = liveTagTimes.reduce((acc, t) => acc + t.ms, 0);
                                const displayTag = hoveredTag || { name: "Total", ms: totalMs, color: "#fff" };

                                return (
                                    <div className="mt-12 flex flex-col items-center justify-center py-12 border border-white/5 rounded-3xl bg-white/[0.01]">
                                        <div className="relative w-56 h-56">
                                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                {/* Background Circle (24h track) */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="42"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="6"
                                                    className="text-white/5"
                                                />
                                                {/* Segments */}
                                                {(() => {
                                                    let cumulativePercent = 0;
                                                    const validTags = liveTagTimes.filter(t => t.ms > 10000); // Small filter to avoid tiny slivers
                                                    return validTags.map((t) => {
                                                        const percent = (t.ms / dayMs) * 100;
                                                        // Circumference for r=42 is 263.89
                                                        const circumference = 2 * Math.PI * 42;
                                                        const gap = 0.5; // Visual gap percentage
                                                        const segmentLength = (percent - gap) * (circumference / 100);
                                                        const offset = -(cumulativePercent * (circumference / 100));
                                                        
                                                        cumulativePercent += percent;
                                                        const isHovered = hoveredTag?.id === t.id;

                                                        return (
                                                            <motion.circle
                                                                key={t.id}
                                                                cx="50"
                                                                cy="50"
                                                                r="42"
                                                                fill="transparent"
                                                                stroke={t.color}
                                                                strokeWidth={isHovered ? 10 : 6}
                                                                strokeDasharray={`${Math.max(0, segmentLength)} ${circumference}`}
                                                                strokeDashoffset={offset}
                                                                strokeLinecap="round"
                                                                onMouseEnter={() => setHoveredTag(t)}
                                                                onMouseLeave={() => setHoveredTag(null)}
                                                                animate={{ strokeWidth: isHovered ? 10 : 6 }}
                                                                className="transition-all cursor-pointer"
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <motion.span 
                                                    key={displayTag.name}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1"
                                                >
                                                    {hoveredTag ? "Highlight" : "Total Activity"}
                                                </motion.span>
                                                <motion.span 
                                                    key={displayTag.ms}
                                                    initial={{ scale: 0.95 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-3xl font-mono tabular-nums tracking-tighter text-white"
                                                >
                                                    {formatDuration(displayTag.ms)}
                                                </motion.span>
                                                <motion.div 
                                                    key={displayTag.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-2 mt-2"
                                                >
                                                    {hoveredTag && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: displayTag.color }} />}
                                                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-tight">{displayTag.name}</span>
                                                </motion.div>
                                            </div>
                                        </div>
                                        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 px-10">
                                            {liveTagTimes.filter(t => t.ms > 0).map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onMouseEnter={() => setHoveredTag(t)}
                                                    onMouseLeave={() => setHoveredTag(null)}
                                                    className={cn(
                                                        "flex items-center gap-2.5 cursor-default transition-all duration-300", 
                                                        hoveredTag && hoveredTag.id !== t.id ? "opacity-30 blur-[1px]" : "opacity-100"
                                                    )}
                                                >
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t.name}</span>
                                                    <span className="text-[10px] font-mono text-neutral-600">
                                                        {Math.round((t.ms / dayMs) * 1000) / 10}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="mt-8 space-y-3">
                                {liveTagTimes.filter(t => t.ms > 0 || t.isLive).sort((a, b) => {
                                    if (a.isLive && !b.isLive) return -1;
                                    if (!a.isLive && b.isLive) return 1;
                                    return b.ms - a.ms;
                                }).map((t, idx) => (
                                    <div 
                                        key={t.id} 
                                        className={cn(
                                            "flex items-center justify-between px-8 py-8 transition-all duration-300 rounded-2xl border",
                                            t.isLive 
                                              ? "bg-blue-500/5 border-blue-500/20" 
                                              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                                {t.isLive && (
                                                    <div className="absolute -inset-1.5 rounded-full border border-blue-500/20 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", t.isLive ? "text-blue-400" : "text-neutral-600")}>
                                                        {t.isLive ? "Recording" : "Total Time"}
                                                    </span>
                                                    {t.isLive && (
                                                        <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                                    )}
                                                </div>
                                                <span className={cn("text-lg font-medium tracking-tight transition-colors block", t.isLive ? "text-white" : "text-neutral-400")}>
                                                    {t.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <span className={cn(
                                                "text-3xl font-mono tabular-nums tracking-tighter transition-all block", 
                                                t.isLive ? "text-blue-400" : "text-neutral-500"
                                            )}>
                                                {formatDuration(t.ms)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {liveTagTimes.filter(t => t.ms > 0 || t.isLive).length === 0 && (
                                    <div className="py-40 text-center space-y-4 opacity-20 border border-dashed border-white/10 rounded-3xl">
                                        <Share2 className="w-6 h-6 text-neutral-400 mx-auto" />
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Zero activities tracked.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <ExportDialog isOpen={isExportOpen} onOpenChange={setIsExportOpen} homeworks={homeworks} tags={tags} dailyTimes={dailyTimes} currentTimeMs={time} activeTagId={activeTagId} userName={user?.email?.split('@')[0]} />
        </main>
    );
}
