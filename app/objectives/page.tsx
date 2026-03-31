"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHomework, Homework, Subtask } from "../../hooks/useHomework";
import { useAuth } from "../../lib/auth-context";
import { Input } from "../../components/ui/input";
import { 
    Check, Loader2, X, ArrowLeft, ChevronLeft, ChevronRight, 
    Folder, FileText, ChevronDown, ChevronRight as ChevronRightIcon, 
    Plus, Trash2, Calendar, Target, Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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
        deleteSubtask,
        updateHomework,
        updateSubtask
    } = useHomework();
    const [newHomework, setNewHomework] = useState("");
    const [tags, setTags] = useState<any[]>([]);

    const [viewDate, setViewDate] = useState(new Date());
    const currentWeekInfo = useMemo(() => getWeekInfo(viewDate), [viewDate]);
    const currentWeekKey = useMemo(() => formatWeekKey(currentWeekInfo), [currentWeekInfo]);

    useEffect(() => {
        const fetchTags = async () => {
            const { data } = await supabase.from("tags").select("*");
            if (data) setTags(data);
        };
        fetchTags();
    }, []);

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
                            <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none opacity-90">Protocol Objectives</h1>
                            <p className="text-[10px] sm:text-xs font-bold text-neutral-600 uppercase tracking-[0.3em] ml-1 font-mono">Mission control of tactical operations</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigateWeek(-1)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group">
                                <ChevronLeft className="w-5 h-5 text-neutral-600 group-hover:text-white" />
                            </button>
                            <button onClick={() => navigateWeek(1)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group">
                                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Status List */}
                <div className="space-y-6">
                    {filteredHomeworks.length === 0 ? (
                        <div className="py-40 text-center space-y-4 border border-dashed border-white/5 rounded-3xl opacity-20">
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
                                    tags={tags}
                                    onToggle={(id: string) => toggleHomework(h.id, h.status)}
                                    onDelete={(id: string) => deleteHomework(h.id)}
                                    onAddSub={(parentId: string, content: string) => addSubtask(h.id, parentId, content)}
                                    onToggleSub={(subId: string) => toggleSubtask(h.id, subId)}
                                    onDeleteSub={(subId: string) => deleteSubtask(h.id, subId)}
                                    onUpdate={(updates: any) => updateHomework(h.id, updates)}
                                    onUpdateSub={(subId: string, updates: any) => updateSubtask(h.id, subId, updates)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TreeNode({ node, depth, isEditable, tags, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub, onUpdate, onUpdateSub }: any) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(node.content);
    const [editTagId, setEditTagId] = useState(node.tag_id);
    const [subInput, setSubInput] = useState("");

    const hasChildren = node.subtasks && node.subtasks.length > 0;

    const handleSave = () => {
        if (!editContent.trim()) return;
        if (depth === 0) {
            onUpdate({ content: editContent.trim(), tag_id: editTagId });
        } else {
            onUpdateSub(node.id, { content: editContent.trim(), tag_id: editTagId });
        }
        setIsEditing(false);
    };

    return (
        <div className={cn("transition-all", node.status === "completed" && depth === 0 && "opacity-20")}>
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
                            node.status === "completed" ? "bg-blue-500 border-blue-500 text-white" : 
                            node.status === "in_progress" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" :
                            "border-neutral-800 hover:border-blue-500/50"
                        )}
                    >
                        {node.status === "completed" && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                </div>

                <div className="flex-1 flex items-center gap-4 group/item">
                    {isEditing ? (
                        <div className="flex-1 flex flex-col gap-3">
                            <Input 
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-transparent border-0 border-b border-blue-500/50 text-white text-xl rounded-none px-0 focus:ring-0 h-auto py-1"
                            />
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag: any) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => setEditTagId(editTagId === tag.id ? null : tag.id)}
                                        className={cn(
                                            "px-2 py-1 rounded text-[9px] font-bold uppercase transition-all",
                                            editTagId === tag.id ? "bg-white text-black" : "bg-white/5 text-neutral-500 hover:bg-white/10"
                                        )}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="text-[10px] font-black text-blue-500">[ SAVE ]</button>
                                <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-neutral-600">[ CANCEL ]</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {depth === 0 ? <Folder className={cn("w-6 h-6 text-neutral-700", node.status === "completed" && "text-blue-500/30")} /> : <FileText className="w-4 h-4 text-neutral-800" />}
                            <span className={cn(
                                "text-white leading-tight transition-all",
                                depth === 0 ? "text-2xl font-suit" : "text-base font-sans font-medium text-neutral-400",
                                node.status === "completed" && "line-through text-neutral-800 text-sm"
                            )}>
                                {node.content}
                            </span>
                            {node.tag_id && (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tags.find((t: any) => t.id === node.tag_id)?.color || "#444" }} />
                            )}
                        </>
                    )}

                    <div className="flex items-center gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity ml-4">
                        {isEditable && !isEditing && (
                            <>
                                <button onClick={() => setIsEditing(true)} className="p-1.5 text-neutral-700 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10">
                                    <Edit2 className="w-4 h-4" />
                                </button>
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
                                tags={tags}
                                onToggleSub={onToggleSub}
                                onDeleteSub={onDeleteSub}
                                onAddSub={onAddSub}
                                onUpdate={onUpdate}
                                onUpdateSub={onUpdateSub}
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
