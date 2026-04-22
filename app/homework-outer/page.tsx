"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useHomework } from "../../hooks/useHomework";
import { useStopwatch } from "../../hooks/useStopwatch";
import { useTags } from "../../hooks/useTags";
import { useAuth } from "../../lib/auth-context";
import { Tabs, TabsContent } from "../../components/ui/tabs";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { ExportDialog } from "../../components/ExportDialog";
import { persistenceService } from "../../lib/services/persistenceService";
import { TaskNode } from "./TaskNode";
import { TaskEntry } from "./TaskEntry";
import { getFormattedWeek, getWeekInfo, formatWeekKey } from "../../lib/timeUtils";
import { HomeworkHeader } from "../../components/homework/HomeworkHeader";
import { StatsDonut } from "../../components/homework/StatsDonut";
import { ActivityList } from "../../components/homework/ActivityList";
import { ExamsView } from "../../components/homework/ExamsView";

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
        setPlannedDate
    } = useHomework(viewedUserId);

    const { tags, dailyTimes, time, activeTagId, activeSession, sessionLoading, handleTagClick: triggerTagTimer } = useStopwatch(undefined, viewedUserId);
    const { addTag } = useTags();

    const [activeTask, setActiveTask] = useState<{ hwId: string, taskId: string, tagId: string | null, startTime: number } | null>(null);
    const [sessionMs, setSessionMs] = useState(0);

    // Sync task stop if global tag changes
    const pauseTask = useCallback(async () => {
        if (!activeTask) return;
        const currentMs = Date.now() - activeTask.startTime;
        const { hwId, taskId } = activeTask;
        
        setActiveTask(null);
        persistenceService.clearActiveTask();
        setSessionMs(0);
        
        if (currentMs > 1000) {
            await recordTime(hwId, taskId, currentMs);
        }
    }, [activeTask, recordTime]);

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

    useEffect(() => {
        if (sessionLoading) return;
        
        if (activeTask && activeSession && activeTask.tagId !== activeSession.tag_id) {
            pauseTask();
        } else if (activeTask && !activeSession) {
            pauseTask();
        }
    }, [activeSession?.tag_id, activeSession === null, sessionLoading, activeTask, pauseTask]);

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

    const [activeTab, setActiveTab] = useState("tasks");
    const [viewDate, setViewDate] = useState(new Date());
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
    const [hoveredTag, setHoveredTag] = useState<any>(null);

    const [now, setNow] = useState(0);
    useEffect(() => {
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

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

    const loading = homeworkLoading || (authLoading && !userId);

    return (
        <main className="h-full bg-black text-white overflow-y-auto no-scrollbar relative font-suit">
            <div className="fixed top-[64px] left-0 w-full z-50 h-[1.5px] bg-white/5">
                <motion.div
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-500 transition-all duration-1000"
                />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-40 space-y-12 sm:space-y-16">
                <HomeworkHeader 
                    formattedWeek={getFormattedWeek(viewDate)}
                    progress={progress}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onShiftWeek={shiftWeek}
                    onToday={() => setViewDate(new Date())}
                    onExport={() => setIsExportOpen(true)}
                />

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
                                <div className="py-32 flex justify-center opacity-40"><Icons.Loader2 className="w-8 h-8 animate-spin" /></div>
                            ) : statusFiltered.length === 0 ? (
                                <div className="py-40 text-center space-y-4 opacity-20">
                                    <div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center"><Icons.ChevronRight className="w-5 h-5 text-neutral-400" /></div>
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
                            <StatsDonut 
                                liveTagTimes={liveTagTimes}
                                hoveredTag={hoveredTag}
                                setHoveredTag={setHoveredTag}
                                formatDuration={formatDuration}
                            />
                            <ActivityList 
                                liveTagTimes={liveTagTimes}
                                formatDuration={formatDuration}
                            />
                        </TabsContent>

                        <TabsContent value="exams" className="m-0 animate-in fade-in duration-500">
                            <ExamsView canEdit={canEdit} tags={tags} userId={viewedUserId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <ExportDialog isOpen={isExportOpen} onOpenChange={setIsExportOpen} homeworks={homeworks} tags={tags} dailyTimes={dailyTimes} currentTimeMs={time} activeTagId={activeTagId} userName={user?.email?.split('@')[0]} />
        </main>
    );
}
