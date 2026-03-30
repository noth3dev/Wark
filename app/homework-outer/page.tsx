"use client";

import React, { useState, useMemo } from "react";
import { useHomework, Homework, Subtask } from "../../hooks/useHomework";
import { useStopwatch } from "../../hooks/useStopwatch";
import { useAuth } from "../../lib/auth-context";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Check, Loader2, X, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatDuration } from "../../lib/utils";
import * as Utils from "../../lib/homework-utils";
import { ExportDialog } from "../../components/ExportDialog";
import { Share2 } from "lucide-react";

function getFormattedWeek(dateStr: string | Date) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const getWeekOfMonth = (d: Date) => {
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const dayOfWeek = firstDay.getDay();
        return Math.floor((d.getDate() + dayOfWeek - 1) / 7) + 1;
    };

    // 주차의 시작(일요일)과 끝(토요일)을 구함
    const day = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - day);
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + (6 - day));

    const startMonth = startOfWeek.getMonth() + 1;
    const startWeek = getWeekOfMonth(startOfWeek);
    const endMonth = endOfWeek.getMonth() + 1;
    const endWeek = getWeekOfMonth(endOfWeek);

    if (startMonth !== endMonth) {
        return `${startMonth}월 ${startWeek}주차(${endMonth}월 ${endWeek}주차)`;
    }
    return `${startMonth}월 ${startWeek}주차`;
}

function getWeekInfo(dateStr: string | Date) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { month: 0, week: 0, year: 0 };
    const month = date.getMonth() + 1;
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay(); 
    const offsetDate = date.getDate() + dayOfWeek - 1;
    const week = Math.floor(offsetDate / 7) + 1;
    return { month, week, year: date.getFullYear() };
}

function formatWeekKey(info: { year: number; month: number; week: number }) {
    return `${info.year}-${info.month}-${info.week}`;
}

export default function HomeworkOuterPage({ userId }: { userId?: string }) {
    const { user, loading: authLoading } = useAuth();
    
    // Explicitly define which user we are viewing
    const viewedUserId = userId || user?.id;
    const canEdit = !!user && user.id === viewedUserId;

    const { 
        homeworks = [], 
        loading: homeworkLoading, 
        addHomework, 
        toggleHomework, 
        deleteHomework, 
        addSubtask, 
        toggleSubtask, 
        deleteSubtask,
        setPlannedDate,
        smartPlan
    } = useHomework(viewedUserId);
    
    const { tags, dailyTimes, time, activeTagId } = useStopwatch(undefined, viewedUserId);

    const loading = homeworkLoading || (authLoading && !userId);

    const [activeTab, setActiveTab] = useState("tasks");
    const [viewDate, setViewDate] = useState(new Date());
    const [newHomework, setNewHomework] = useState("");
    const [isPlusAlpha, setIsPlusAlpha] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);

    const weekInfo = useMemo(() => getWeekInfo(viewDate), [viewDate]);
    const weekKey = useMemo(() => formatWeekKey(weekInfo), [weekInfo]);

    const filtered = useMemo(() =>
        homeworks.filter(h => formatWeekKey(getWeekInfo(h.created_at)) === weekKey),
        [homeworks, weekKey]
    );

    const regularTasks = useMemo(() => filtered.filter(h => !h.is_plus_alpha), [filtered]);
    const plusAlphaTasks = useMemo(() => filtered.filter(h => h.is_plus_alpha), [filtered]);

    const progress = useMemo(() => {
        const calc = (tasks: any[]): { t: number; d: number } =>
            tasks.reduce((acc, t) => {
                if (!t.subtasks || t.subtasks.length === 0) {
                    return { t: acc.t + 1, d: acc.d + (t.is_completed ? 1 : 0) };
                }
                const sub = calc(t.subtasks);
                return { t: acc.t + sub.t, d: acc.d + sub.d };
            }, { t: 0, d: 0 });
            
        const { t, d } = calc(filtered);
        return t === 0 ? 0 : Math.round((d / t) * 100);
    }, [filtered]);

    const shiftWeek = (n: number) => {
        const d = new Date(viewDate);
        d.setDate(d.getDate() + n * 7);
        setViewDate(d);
    };

    return (
        <main className="h-full bg-black text-white overflow-y-auto no-scrollbar relative font-suit">
            {/* Minimalist Progress Indicator */}
            <div className="fixed top-[64px] left-0 w-full z-50 h-[2px] bg-white/5">
                <motion.div
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000"
                />
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-40 space-y-16">

                {/* Aesthetic Header */}
                <header className="space-y-10">
                    <div className="flex items-end justify-between">
                        <div className="space-y-2">
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.3em]"
                            >
                                Intelligence Hub
                            </motion.p>
                            <motion.h1 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl font-semibold tracking-tighter leading-none"
                            >
                                {getFormattedWeek(viewDate)}
                            </motion.h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.3em] mb-2">Efficiency</p>
                            <p className="text-4xl font-mono text-white/10 leading-none">{progress}%</p>
                        </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-4 py-6 border-y border-white/5">
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                            <button onClick={() => shiftWeek(-1)} className="p-2 hover:bg-white/5 rounded-md transition-colors">
                                <ChevronLeft className="w-4 h-4 text-neutral-400" />
                            </button>
                            <button onClick={() => setViewDate(new Date())} className="px-3 text-[10px] font-bold uppercase tracking-tight text-neutral-400 hover:text-white transition-colors">
                                Today
                            </button>
                            <button onClick={() => shiftWeek(1)} className="p-2 hover:bg-white/5 rounded-md transition-colors">
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </button>
                        </div>
                        
                        {!!user && (
                            <button 
                                onClick={() => setIsExportOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 hover:bg-blue-500/20 transition-all uppercase tracking-tighter"
                            >
                                <Share2 className="w-3 h-3" />
                                Export Summary
                            </button>
                        )}
                        
                        <div className="h-4 w-px bg-white/10" />

                        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
                                <TabsList className="bg-transparent h-auto p-0 flex gap-6">
                                    <TabsTrigger value="tasks" className="bg-transparent p-0 pb-2 text-sm transition-all data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_#fff] rounded-none text-neutral-600 font-medium">
                                        Tasks
                                    </TabsTrigger>
                                    <TabsTrigger value="planner" className="bg-transparent p-0 pb-2 text-sm transition-all data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_#fff] rounded-none text-neutral-600 font-medium">
                                        Smart Plan
                                    </TabsTrigger>
                                    <TabsTrigger value="timer" className="bg-transparent p-0 pb-2 text-sm transition-all data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_#fff] rounded-none text-neutral-600 font-medium">
                                        History
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {activeTab === 'planner' && canEdit && (
                            <button 
                                onClick={() => smartPlan(filtered)}
                                className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold hover:bg-blue-500/20 transition-all flex items-center gap-2"
                            >
                                <Loader2 className="w-3 h-3 animate-spin-slow" />
                                AUTO_GEN_PLAN
                            </button>
                        )}
                    </div>
                </header>

                {/* Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Content Area */}
                <div className="min-h-[500px]">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsContent value="tasks" className="m-0 outline-none space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* New task input */}
                            {canEdit && (
                                <form onSubmit={e => { e.preventDefault(); if (newHomework.trim()) { addHomework(newHomework.trim(), isPlusAlpha); setNewHomework(""); setIsPlusAlpha(false); } }} className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl px-6 h-16 focus-within:border-white/10 transition-all">
                                        <Input
                                            value={newHomework}
                                            onChange={e => setNewHomework(e.target.value)}
                                            placeholder={isPlusAlpha ? "+α Additional Goal..." : "Initiate new objective..."}
                                            className="bg-transparent border-0 px-0 text-lg font-suit focus:ring-0 placeholder:text-neutral-800 shadow-none flex-1 font-light"
                                        />
                                        <div className="flex items-center gap-3 shrink-0">
                                            <button 
                                                type="button"
                                                onClick={() => setIsPlusAlpha(!isPlusAlpha)}
                                                className={cn(
                                                    "text-[10px] font-black px-2 py-1 rounded-md transition-all border",
                                                    isPlusAlpha ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "text-neutral-700 border-transparent hover:text-neutral-500"
                                                )}
                                            >
                                                +α
                                            </button>
                                            <button type="submit" className="text-[10px] font-black text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all uppercase tracking-tighter">
                                                Commit
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* Task list with improved nesting visibility */}
                            {loading ? (
                                <div className="py-32 flex justify-center opacity-10">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-40 text-center space-y-4 opacity-20">
                                    <div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center">
                                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">No active objectives for this cycle.</p>
                                </div>
                            ) : (
                                <div className="space-y-20">
                                    {regularTasks.length > 0 && (
                                        <div className="space-y-4">
                                            {regularTasks.map(h => (
                                                <TreeNode
                                                    key={h.id}
                                                    node={h}
                                                    depth={0}
                                                    canEdit={canEdit}
                                                    onToggle={() => toggleHomework(h.id, h.is_completed)}
                                                    onDelete={() => deleteHomework(h.id)}
                                                    onAddSub={(pId: string, c: string) => addSubtask(h.id, pId, c)}
                                                    onToggleSub={(sId: string) => toggleSubtask(h.id, sId)}
                                                    onDeleteSub={(sId: string) => deleteSubtask(h.id, sId)}
                                                    rootId={h.id}
                                                    onSetDate={setPlannedDate}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {plusAlphaTasks.length > 0 && (
                                        <div className="space-y-10 pt-10 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.4em]">추가</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                            </div>
                                            <div className="space-y-4">
                                                {plusAlphaTasks.map(h => (
                                                    <TreeNode
                                                        key={h.id}
                                                        node={h}
                                                        depth={0}
                                                        canEdit={!!user}
                                                        onToggle={() => toggleHomework(h.id, h.is_completed)}
                                                        onDelete={() => deleteHomework(h.id)}
                                                        onAddSub={(pId: string, c: string) => addSubtask(h.id, pId, c)}
                                                        onToggleSub={(sId: string) => toggleSubtask(h.id, sId)}
                                                        onDeleteSub={(sId: string) => deleteSubtask(h.id, sId)}
                                                        rootId={h.id}
                                                        onSetDate={setPlannedDate}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="planner" className="m-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <PlannerBoard homeworks={filtered} onUpdateDate={setPlannedDate} />
                        </TabsContent>

                        <TabsContent value="timer" className="m-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden mt-8">
                                {tags
                                    .map(tag => {
                                        const baseTime = dailyTimes[tag.id] || 0;
                                        const isLive = activeTagId === tag.id;
                                        const totalMs = isLive ? time : baseTime;
                                        return { ...tag, ms: totalMs };
                                    })
                                    .filter(t => t.ms > 0)
                                    .sort((a, b) => b.ms - a.ms)
                                    .map((t, idx) => (
                                        <div key={t.id} className={cn(
                                            "flex items-center justify-between px-8 py-8 group transition-colors hover:bg-white/[0.01]",
                                            idx !== 0 && "border-t border-white/[0.03]"
                                        )}>
                                            <div className="flex items-center gap-6">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                                <div className="space-y-1">
                                                    <span className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest leading-none block">Tag</span>
                                                    <span className="text-lg font-medium text-neutral-400 group-hover:text-white transition-colors block">{t.name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <span className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest leading-none block">Duration</span>
                                                <span className="text-2xl font-mono text-neutral-500 group-hover:text-neutral-200 transition-colors tabular-nums block">
                                                    {formatDuration(t.ms)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                {tags.filter(tag => (dailyTimes[tag.id] || 0) > 0 || activeTagId === tag.id).length === 0 && (
                                    <div className="py-32 text-center opacity-20">
                                        <p className="text-[11px] font-bold uppercase tracking-widest">No activity logged for this cycle.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                </Tabs>
            </div>

            <ExportDialog 
                isOpen={isExportOpen}
                onOpenChange={setIsExportOpen}
                homeworks={homeworks}
                tags={tags}
                dailyTimes={dailyTimes}
                currentTimeMs={time}
                activeTagId={activeTagId}
                userName={user?.email?.split('@')[0]}
            />
        </main>
    );
}

function TreeNode({ node, depth, canEdit, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub, rootId, onSetDate }: any) {
    const [expanded, setExpanded] = useState(true);
    const [adding, setAdding] = useState(false);
    const [input, setInput] = useState("");
    const hasChildren = (node.subtasks?.length ?? 0) > 0;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onAddSub(node.id, input.trim());
        setInput("");
        setAdding(false);
    };

    // Responsive Indentation
    const indentSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 32;

    return (
        <div className={cn("transition-opacity duration-1000", node.is_completed && depth === 0 && "opacity-20")}>
            <div
                className="group relative flex items-center gap-2 md:gap-4 py-3 md:py-4 hover:bg-white/[0.02] transition-all rounded-xl -mx-2 md:-mx-4 px-2 md:px-4"
                style={{ paddingLeft: `${depth * indentSize + (depth > 0 ? 8 : 16)}px` }}
            >
                {/* Indent line */}
                {depth > 0 && (
                    <div className="absolute w-px bg-white/[0.03]" style={{ left: `${depth * indentSize}px`, top: 0, bottom: 0 }} />
                )}

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn("text-neutral-800 hover:text-neutral-400 transition-colors shrink-0 p-1", !hasChildren && "invisible")}
                >
                    {expanded
                        ? <ChevronDown className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        : <ChevronRightIcon className="w-3 md:w-3.5 h-3 md:h-3.5" />
                    }
                </button>

                {/* Checkbox with micro-animation */}
                <button
                    onClick={() => depth === 0 ? onToggle() : onToggleSub(node.id)}
                    className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-300",
                        node.is_completed
                            ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            : "border-neutral-800 hover:border-neutral-600 bg-white/[0.02]"
                    )}
                >
                    <AnimatePresence>
                        {node.is_completed && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Check className="w-2 md:w-2.5 h-2 md:h-2.5 text-white stroke-[4]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* Content */}
                <div className={cn(
                    "flex-1 flex flex-col gap-0.5 transition-all overflow-hidden",
                    depth === 0 ? "text-base md:text-lg font-medium tracking-tight" : "text-xs md:text-sm text-neutral-400",
                    node.is_completed && "line-through text-neutral-800"
                )}>
                    <div className="flex items-center gap-2 md:gap-3">
                        {depth === 0 && node.is_plus_alpha && (
                            <span className="text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                ALPHA
                            </span>
                        )}
                        <span className="truncate">{node.content}</span>
                        {node.planned_date && (
                             <span className="ml-auto text-[8px] md:text-[9px] font-bold text-neutral-700 bg-white/5 px-1 md:px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                                {new Date(node.planned_date).toLocaleDateString('ko-KR', { weekday: 'short' })}
                             </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {canEdit && (
                    <div className="flex items-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setAdding(!adding)} className="text-[8px] md:text-[9px] font-bold text-neutral-700 hover:text-white transition-colors bg-white/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md border border-white/5">
                            ADD
                        </button>
                        <button onClick={() => depth === 0 ? onDelete() : onDeleteSub(node.id)} className="text-neutral-800 hover:text-red-500 transition-colors p-1 md:p-1.5">
                            <X className="w-3.5 md:w-4 h-3.5 md:h-4" />
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {node.subtasks?.map((child: any) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                canEdit={canEdit}
                                onToggleSub={onToggleSub}
                                onDeleteSub={onDeleteSub}
                                onAddSub={onAddSub}
                                rootId={rootId}
                                onSetDate={onSetDate}
                            />
                        ))}
                        {adding && (
                            <motion.form
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onSubmit={submit}
                                className="flex items-center gap-3 py-3"
                                style={{ paddingLeft: `${(depth + 1) * indentSize + (depth > 0 ? 8 : 16) + 20}px` }}
                            >
                                <Input
                                    autoFocus
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Task name..."
                                    className="h-7 bg-transparent border-0 border-b border-white/5 rounded-none px-0 text-xs md:text-sm font-light focus:border-white/20 focus:ring-0 placeholder:text-neutral-800 shadow-none flex-1"
                                />
                                <div className="flex items-center gap-2">
                                    <button type="submit" className="text-[8px] font-black text-white hover:text-blue-400 transition-colors uppercase tracking-widest">OK</button>
                                    <button type="button" onClick={() => setAdding(false)} className="text-[8px] font-black text-neutral-700 hover:text-white transition-colors uppercase tracking-widest">X</button>
                                </div>
                            </motion.form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import {
    DndContext, 
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function PlannerBoard({ homeworks, onUpdateDate }: { homeworks: Homework[], onUpdateDate: any }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const weekDates = useMemo(() => {
        const dates = Utils.getWeekDates();
        return dates;
    }, []);

    const flatItems = useMemo(() => {
        const items: any[] = [];
        const gather = (rootId: string, rootContent: string, nodes: Subtask[]) => {
            nodes.forEach(n => {
                if (!n.subtasks || n.subtasks.length === 0) {
                    items.push({ ...n, rootId, rootContent });
                } else {
                    gather(rootId, rootContent, n.subtasks);
                }
            });
        };
        homeworks.forEach(h => {
             if (!h.subtasks || h.subtasks.length === 0) {
                 items.push({ ...h, rootId: h.id, rootContent: h.content });
             } else {
                 gather(h.id, h.content, h.subtasks || []);
             }
        });
        return items;
    }, [homeworks]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setActiveItem(flatItems.find(i => i.id === event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveItem(null);
        if (!over) return;

        const overId = over.id as string;
        let targetDate = overId;
        
        if (overId.length !== 10 && overId !== 'unplanned') {
            const overItem = flatItems.find(i => i.id === overId);
            if (overItem) targetDate = overItem.planned_date || "";
        }

        const dateToSet = targetDate === 'unplanned' ? null : targetDate;
        const item = flatItems.find(i => i.id === active.id);
        
        if (item) {
            onUpdateDate(item.rootId, item.id, dateToSet);
        }
    };

    return (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 md:space-y-12 pb-24 mt-8 md:mt-12 animate-in fade-in duration-700">
                {weekDates.map(date => {
                    const dayItems = flatItems.filter(i => i.planned_date === date);
                    const isToday = date === new Date().toISOString().split('T')[0];
                    return (
                        <div key={date} className="space-y-3 md:space-y-4 group">
                             <div className="flex items-center gap-4 md:gap-6">
                                <div className="text-right w-12 md:w-16 space-y-0.5">
                                    <span className="text-[8px] md:text-[9px] text-neutral-800 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] block leading-none">
                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <span className={cn(
                                        "text-xl md:text-2xl font-mono leading-none block",
                                        isToday ? "text-blue-500" : "text-neutral-700 group-hover:text-neutral-500 transition-colors"
                                    )}>
                                        {new Date(date).getDate()}
                                    </span>
                                </div>
                                <div className="h-[1px] flex-1 bg-white/[0.03] group-hover:bg-white/[0.08] transition-colors" />
                             </div>
                             
                             <div 
                                id={date}
                                className={cn(
                                    "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 rounded-3xl pb-2 transition-all min-h-[40px]",
                                    dayItems.length === 0 ? "opacity-30" : "bg-transparent"
                                )}
                             >
                                <SortableContext items={dayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {dayItems.map(item => (
                                        <PlannerItem key={item.id} item={item} isGhost={activeId === item.id} />
                                    ))}
                                </SortableContext>
                                {dayItems.length === 0 && (
                                    <div className="sm:col-span-2 xl:col-span-3 py-2 text-center opacity-10 group-hover:opacity-30 transition-opacity">
                                        <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em]">Empty</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    );
                })}
                
                {/* Backlog Column */}
                <div className="space-y-4 md:space-y-6 pt-12 md:pt-16">
                    <div className="flex items-center gap-4 md:gap-6">
                        <span className="text-[8px] md:text-[10px] text-neutral-800 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] whitespace-nowrap">Unscheduled</span>
                        <div className="h-[1px] flex-1 bg-blue-500/10" />
                    </div>
                    
                    <div 
                        id="unplanned"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 min-h-[100px] p-4 md:p-6 rounded-2xl bg-white/[0.01] border border-white/5 border-dashed"
                    >
                        {flatItems.filter(i => !i.planned_date).map(item => (
                            <PlannerItem key={item.id} item={item} isGhost={activeId === item.id} />
                        ))}
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId && activeItem ? (
                    <div className="bg-[#121212] border border-blue-500/30 rounded-xl p-3 md:p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8)] scale-105 transition-transform cursor-grabbing ring-1 ring-white/5 max-w-[250px] md:max-w-none">
                         <div className="space-y-1.5 md:space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-500" />
                                <span className="text-[7px] md:text-[8px] text-blue-400 font-black uppercase tracking-[0.3em] font-suit truncate">
                                    {activeItem.rootContent}
                                </span>
                            </div>
                            <h4 className="text-sm md:text-base font-medium tracking-tight text-white font-suit leading-tight truncate">
                                {activeItem.content}
                            </h4>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function PlannerItem({ item, isGhost }: { item: any, isGhost?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isGhost ? 0.1 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group relative bg-[#0a0a0a]/50 border border-white/[0.05] rounded-xl p-3 md:p-4 transition-all hover:border-white/10 active:scale-98 cursor-grab",
                item.is_completed && "opacity-30 grayscale-[50%]",
                isDragging && "z-10 bg-blue-500/5 border-blue-500/20"
            )}
        >
            <div className="space-y-1.5 md:space-y-2">
                 <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-1 h-1 rounded-full bg-neutral-900 group-hover:bg-blue-500 transition-colors shrink-0" />
                    <span className="text-[8px] md:text-[9px] text-neutral-700 font-bold uppercase tracking-widest font-suit truncate group-hover:text-neutral-500 transition-colors">
                        {item.rootContent}
                    </span>
                 </div>
                 <h4 className={cn(
                     "text-sm md:text-base font-medium tracking-tight text-neutral-400 group-hover:text-white transition-colors font-suit leading-tight truncate",
                     item.is_completed && "line-through text-neutral-700"
                 )}>
                    {item.content}
                 </h4>
            </div>
        </div>
    );
}
