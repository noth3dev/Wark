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
import { TimeBlockTable } from "../../components/homework/TimeBlockTable";
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
        setPlannedDate,
        copyIncompleteTaskToHw
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

    const dayKey = useMemo(() => {
        const d = new Date(viewDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, [viewDate]);

    const filtered = useMemo(() => {
        return homeworks.filter(h => {
            const createdDate = new Date(h.created_at).toISOString().split('T')[0];
            const plannedDate = h.planned_date;
            return plannedDate ? plannedDate === dayKey : createdDate === dayKey;
        });
    }, [homeworks, dayKey]);

    const statusFiltered = useMemo(() => {
        if (statusFilter === "all") return filtered;
        if (statusFilter === "done") return filtered.filter(h => h.status === "completed");
        if (statusFilter === "pending") return filtered.filter(h => h.status !== "completed");
        return filtered;
    }, [filtered, statusFilter]);

    const regularTasks = useMemo(() => statusFiltered.filter(h => !h.is_plus_alpha), [statusFiltered]);
    const plusAlphaTasks = useMemo(() => statusFiltered.filter(h => h.is_plus_alpha), [statusFiltered]);

    const copyTaskToEnd = useCallback(async (data: {
        content: string;
        amount_text?: string;
        subjectContent: string;
        subjectTagId?: string | null;
    }) => {
        const dayRegular = filtered.filter(h => !h.is_plus_alpha);
        if (dayRegular.length === 0) return;
        const lastHw = dayRegular[dayRegular.length - 1];
        // Atomic single-state-update copy
        await copyIncompleteTaskToHw(lastHw.id, data);
    }, [filtered, copyIncompleteTaskToHw]);

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

    const shiftDay = (n: number) => {
        const d = new Date(viewDate);
        d.setDate(d.getDate() + n);
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
                    formattedWeek={viewDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                    progress={progress}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onShiftWeek={shiftDay}
                    onToday={() => setViewDate(new Date())}
                    onExport={() => setIsExportOpen(true)}
                />

                <div className="min-h-[500px]">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsContent value="tasks" className="m-0 space-y-12 animate-in fade-in duration-700">
                            {loading ? (
                                <div className="py-32 flex justify-center opacity-40"><Icons.Loader2 className="w-8 h-8 animate-spin" /></div>
                            ) : (
                                <div className="space-y-20">
                                    <TimeBlockTable 
                                        homeworks={regularTasks}
                                        tags={tags}
                                        canEdit={canEdit}
                                        onAddHomework={addHomework}
                                        onUpdateHomework={updateHomework}
                                        onDeleteHomework={deleteHomework}
                                        onAddSubtask={addSubtask}
                                        onUpdateSubtask={updateSubtask}
                                        onDeleteSubtask={deleteSubtask}
                                        onToggleSubtask={toggleSubtask}
                                        onRunTask={runTask}
                                        onPauseTask={pauseTask}
                                        onCopyTaskToEnd={copyTaskToEnd}
                                        activeTaskId={activeTask?.taskId}
                                        currentSessionMs={sessionMs}
                                    />
                                    
                                    {plusAlphaTasks.length > 0 && (
                                        <div className="space-y-10 pt-10 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] text-neutral-700 font-black uppercase ">추가 (Plus Alpha)</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                            </div>
                                            <TimeBlockTable 
                                                homeworks={plusAlphaTasks}
                                                tags={tags}
                                                canEdit={canEdit}
                                                onAddHomework={(content) => addHomework(content, true)}
                                                onUpdateHomework={updateHomework}
                                                onDeleteHomework={deleteHomework}
                                                onAddSubtask={addSubtask}
                                                onUpdateSubtask={updateSubtask}
                                                onDeleteSubtask={deleteSubtask}
                                                onToggleSubtask={toggleSubtask}
                                                onRunTask={runTask}
                                                onPauseTask={pauseTask}
                                                onCopyTaskToEnd={copyTaskToEnd}
                                                activeTaskId={activeTask?.taskId}
                                                currentSessionMs={sessionMs}
                                            />
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
