"use client";

import React, { useState, useMemo } from "react";
import { useHomework, Homework, Subtask } from "../../hooks/useHomework";
import { useAuth } from "../../lib/auth-context";
import { Input } from "../../components/ui/input";
import { 
    Check, Loader2, X, ArrowLeft, ChevronLeft, ChevronRight, 
    Folder, FileText, ChevronDown, ChevronRight as ChevronRightIcon, 
    Plus, Trash2, Calendar, Target 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import Link from "next/link";

// Week calculation
function getWeekInfo(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) date = new Date();
    const month = date.getMonth() + 1;
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay(); 
    const offsetDate = date.getDate() + dayOfWeek - 1;
    const week = Math.floor(offsetDate / 7) + 1;
    return { month, week, year: date.getFullYear() };
}

function formatWeekKey(info: { year: number, month: number, week: number }) {
    return `${info.year}-${info.month}-${info.week}`;
}

export default function ObjectivesPage() {
    const { user } = useAuth();
    const { 
        homeworks = [], 
        loading: homeworkLoading, 
        addHomework, 
        toggleHomework, 
        deleteHomework,
        addSubtask,
        toggleSubtask,
        deleteSubtask
    } = useHomework();
    const [newHomework, setNewHomework] = useState("");

    const [viewDate, setViewDate] = useState(new Date());
    const currentWeekInfo = useMemo(() => getWeekInfo(viewDate), [viewDate]);
    const currentWeekKey = useMemo(() => formatWeekKey(currentWeekInfo), [currentWeekInfo]);

    const navigateWeek = (direction: number) => {
        const nextDate = new Date(viewDate);
        nextDate.setDate(viewDate.getDate() + (direction * 7));
        setViewDate(nextDate);
    };

    const filteredHomeworks = useMemo(() => {
        if (!Array.isArray(homeworks)) return [];
        return homeworks.filter(h => {
            const hInfo = getWeekInfo(new Date(h.created_at));
            return formatWeekKey(hInfo) === currentWeekKey;
        });
    }, [homeworks, currentWeekKey]);

    const progress = useMemo(() => {
        const calculateProgress = (tasks: (Homework | Subtask)[]): { total: number; done: number } =>
            tasks.reduce((acc, t) => {
                if (!t.subtasks || t.subtasks.length === 0) {
                    return { total: acc.total + 1, done: acc.done + (t.is_completed ? 1 : 0) };
                }
                const sub = calculateProgress(t.subtasks);
                return { total: acc.total + sub.total, done: acc.done + sub.done };
            }, { total: 0, done: 0 });

        const res = calculateProgress(filteredHomeworks);
        return res.total === 0 ? 0 : Math.round((res.done / res.total) * 100);
    }, [filteredHomeworks]);

    return (
        <div className="h-full bg-black text-white selection:bg-white/10 overflow-x-hidden overflow-y-auto no-scrollbar relative font-sans">
            
            <div className="fixed top-[64px] left-0 w-full z-[100] h-[2px] bg-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" />
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-24 sm:pt-40 pb-60 space-y-20">
                
                {/* Header Context */}
                <header className="space-y-12">
                    <div className="flex items-center justify-between">
                        <Link href="/homework-outer" className="flex items-center gap-2 text-neutral-600 hover:text-white transition-all text-[11px] font-semibold uppercase tracking-widest group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            ROOT_HUB
                        </Link>
                        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[11px] font-bold text-neutral-300">SYSTEM DATE: {currentWeekInfo.month}월 {currentWeekInfo.week}주</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end gap-10">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black tracking-[0.5em] text-neutral-800 uppercase">Strategic Operation Terminal</span>
                            <h1 className="text-6xl sm:text-9xl font-suit font-semibold tracking-tighter text-white leading-none">OBJECTIVES</h1>
                        </div>
                        <div className="text-right pb-1">
                            <div className="text-[10px] font-black text-neutral-700 tracking-widest uppercase mb-2">Completion Rate</div>
                            <div className="text-8xl font-mono tabular-nums leading-none text-white/10">{progress}%</div>
                        </div>
                    </div>

                    {/* Navigation Controller */}
                    <div className="flex items-center gap-8 py-10 border-y border-white/5">
                        <div className="flex gap-2">
                             <button onClick={() => navigateWeek(-1)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft className="w-6 h-6" /></button>
                             <button onClick={() => navigateWeek(1)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronRight className="w-6 h-6" /></button>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-neutral-700 dark:text-neutral-600 uppercase tracking-widest">Active Directory</p>
                            <p className="text-2xl font-suit">{currentWeekInfo.year} / {currentWeekInfo.month}월 {currentWeekInfo.week}주차</p>
                        </div>
                        <button onClick={() => setViewDate(new Date())} className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold transition-all hover:bg-white/10">GO_TODAY</button>
                    </div>
                </header>

                {/* Input Surface */}
                {user && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-4 group focus-within:border-white/20 transition-all duration-500 shadow-2xl">
                         <form onSubmit={(e) => { e.preventDefault(); if (newHomework.trim()) { addHomework(newHomework.trim()); setNewHomework(""); } }} className="relative flex items-center">
                            <Folder className="absolute left-8 w-8 h-8 text-neutral-800 group-focus-within:text-blue-500/50 transition-colors" />
                            <Input
                                value={newHomework}
                                onChange={(e) => setNewHomework(e.target.value)}
                                placeholder="Create new primary node..."
                                className="h-24 bg-transparent border-none rounded-none pl-24 pr-40 text-4xl font-suit focus:ring-0 placeholder:text-neutral-900"
                            />
                            <button type="submit" className="absolute right-6 h-12 px-10 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">CREATE</button>
                         </form>
                    </div>
                )}

                {/* Infinite Explorer Stack */}
                <div className="space-y-4">
                    {homeworkLoading ? (
                        <div className="py-40 flex flex-col items-center gap-6 opacity-20">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <p className="text-[10px] font-bold tracking-widest uppercase">Initializing Directory Stack...</p>
                        </div>
                    ) : filteredHomeworks.length === 0 ? (
                        <div className="py-40 text-center border border-dashed border-white/5 rounded-[3rem] opacity-20 space-y-6">
                            <Target className="w-16 h-16 mx-auto stroke-[1]" />
                            <p className="text-[11px] font-bold tracking-[0.4em] uppercase">No active protocols in this directory.</p>
                        </div>
                    ) : (
                        filteredHomeworks.map(h => (
                            <div key={h.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                                <TreeNode 
                                    node={h} 
                                    depth={0} 
                                    isEditable={!!user}
                                    onToggle={(id: string) => toggleHomework(h.id, h.is_completed)}
                                    onDelete={(id: string) => deleteHomework(h.id)}
                                    onAddSub={(parentId: string, content: string) => addSubtask(h.id, parentId, content)}
                                    onToggleSub={(subId: string) => toggleSubtask(h.id, subId)}
                                    onDeleteSub={(subId: string) => deleteSubtask(h.id, subId)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TreeNode({ node, depth, isEditable, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub }: any) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [subInput, setSubInput] = useState("");

    const hasChildren = node.subtasks && node.subtasks.length > 0;

    return (
        <div className={cn("transition-all", node.is_completed && depth === 0 && "opacity-20")}>
            <div className={cn(
                "group flex items-center gap-4 py-6 pr-8 hover:bg-white/[0.03] transition-colors",
                depth > 0 && "py-4"
            )} style={{ paddingLeft: `${depth * 40 + 24}px` }}>
                
                {/* Visual Line Connectors for Depth */}
                {depth > 0 && (
                    <div className="absolute left-0 top-0 h-full w-px bg-white/5" style={{ left: `${depth * 40}px` }} />
                )}

                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn("p-1 hover:bg-white/10 rounded transition-all", !hasChildren && "opacity-0 invisible")}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronRightIcon className="w-4 h-4 text-neutral-600" />}
                    </button>
                    <button 
                        onClick={() => depth === 0 ? onToggle(node.id) : onToggleSub(node.id)}
                        className={cn(
                            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                            node.is_completed ? "bg-blue-500 border-blue-500 text-white" : "border-neutral-800 hover:border-blue-500/50"
                        )}
                    >
                        {node.is_completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                </div>

                <div className="flex-1 flex items-center gap-4 group/item">
                    {depth === 0 ? <Folder className={cn("w-6 h-6 text-neutral-700", node.is_completed && "text-blue-500/30")} /> : <FileText className="w-4 h-4 text-neutral-800" />}
                    <span className={cn(
                        "text-white leading-tight transition-all",
                        depth === 0 ? "text-2xl font-suit" : "text-base font-sans font-medium text-neutral-400",
                        node.is_completed && "line-through text-neutral-800"
                    )}>
                        {node.content}
                    </span>

                    <div className="flex items-center gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity ml-4">
                        {isEditable && (
                            <>
                                <button onClick={() => setIsAdding(!isAdding)} className="p-1.5 text-neutral-700 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10">
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button onClick={() => depth === 0 ? onDelete(node.id) : onDeleteSub(node.id)} className="p-1.5 text-neutral-800 hover:text-red-500 transition-colors bg-white/5 rounded-lg border border-white/10">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        {/* Nested Subtasks */}
                        {node.subtasks?.map((child: any) => (
                            <TreeNode 
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                isEditable={isEditable}
                                onToggleSub={onToggleSub}
                                onDeleteSub={onDeleteSub}
                                onAddSub={onAddSub}
                            />
                        ))}

                        {/* Inline Input for New Subtask */}
                        {isAdding && (
                            <div className="py-2" style={{ paddingLeft: `${(depth + 1) * 40 + 24}px` }}>
                                <form onSubmit={(e) => { e.preventDefault(); if (subInput.trim()) { onAddSub(node.id, subInput.trim()); setSubInput(""); setIsAdding(false); } }} className="flex items-center gap-4 group/form">
                                    <FileText className="w-4 h-4 text-blue-500/50" />
                                    <Input 
                                        autoFocus
                                        value={subInput}
                                        onChange={(e) => setSubInput(e.target.value)}
                                        placeholder="Add child node..."
                                        className="h-10 bg-transparent border-0 border-b border-white/5 rounded-none px-0 text-base focus:border-white/30 focus:ring-0 placeholder:text-neutral-900"
                                    />
                                    <button type="submit" className="text-[10px] font-black uppercase text-blue-500/80 hover:text-blue-500">[ DEPLOY ]</button>
                                    <button onClick={() => setIsAdding(false)} className="text-[10px] font-black uppercase text-neutral-800 hover:text-white">[ CANCEL ]</button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
