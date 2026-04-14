"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight as ChevronRightIcon, Check, X, Save, Edit2, Play, Pause, Plus } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "../../components/ui/input";

function formatDuration(ms: number) {
    if (!ms || ms < 1000) return "";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function calculateRecursiveTime(node: any, activeTaskId?: string, sessionMs: number = 0): number {
    let total = node.time_spent || 0;
    if (node.id === activeTaskId) total += sessionMs;
    if (node.subtasks && node.subtasks.length > 0) {
        let childSum = 0;
        node.subtasks.forEach((child: any) => {
            childSum += calculateRecursiveTime(child, activeTaskId, sessionMs);
        });
        return childSum;
    }
    return total;
}

export function TaskNode({
    node, depth, canEdit, onToggle, onDelete, onAddSub, onToggleSub,
    onDeleteSub, onUpdate, onUpdateSub, rootId, onSetDate, tags,
    isRunning, onRun, onPause, currentSessionMs = 0, activeTaskId
}: any) {
    const [expanded, setExpanded] = useState(true);
    const [adding, setAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(node.content);
    const [editTagId, setEditTagId] = useState(node.tag_id);
    const [input, setInput] = useState("");
    const [newTagId, setNewTagId] = useState<string | null>(null);
    const [hovered, setHovered] = useState(false);
    const hasChildren = (node.subtasks?.length ?? 0) > 0;

    const totalTime = useMemo(
        () => calculateRecursiveTime(node, activeTaskId, currentSessionMs),
        [node, activeTaskId, currentSessionMs]
    );

    const handleSave = () => {
        if (!editContent.trim()) return;
        if (depth === 0) {
            onUpdate({ content: editContent.trim(), tag_id: editTagId });
        } else {
            onUpdateSub(node.id, { content: editContent.trim(), tag_id: editTagId });
        }
        setIsEditing(false);
    };

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onAddSub(node.id, input.trim(), newTagId);
        setInput("");
        setNewTagId(null);
        setAdding(false);
    };

    const indentSize = typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 32;

    return (
        <div className={cn("transition-opacity duration-1000", node.status === "completed" && depth === 0 && "opacity-50")}>
            {/* ── Row ── */}
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={cn(
                    "relative flex items-center gap-4 py-3.5 rounded-xl -mx-4 px-4 transition-colors group",
                    hovered && "bg-white/[0.03]",
                    isEditing && "bg-white/[0.05] ring-1 ring-white/10",
                    isRunning && "bg-blue-500/[0.04] ring-1 ring-blue-500/20"
                )}
                style={{ paddingLeft: `${depth * indentSize + 16}px` }}
            >
                {depth > 0 && (
                    <div className="absolute w-px bg-white/[0.06]" style={{ left: `${depth * indentSize}px`, top: 0, bottom: 0 }} />
                )}

                {/* Expand / Collapse */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn("shrink-0 text-neutral-700 hover:text-neutral-400 transition-colors p-0.5", !hasChildren && "invisible")}
                >
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>

                {/* Checkbox */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => (depth === 0 ? onToggle(node.status) : onToggleSub(node.id))}
                        className={cn(
                            "w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-all duration-300",
                            node.status === "completed"
                                ? "bg-blue-500 border-blue-500"
                                : node.status === "in_progress"
                                    ? "border-blue-500/60 bg-blue-500/10"
                                    : "border-neutral-800 hover:border-neutral-600 bg-white/[0.02]"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {node.status === "completed" && (
                                <motion.div key="c" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                                </motion.div>
                            )}
                            {node.status === "in_progress" && (
                                <motion.div key="p" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                    {isRunning && (
                        <motion.div
                            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -inset-1.5 rounded-full border border-blue-500/30 pointer-events-none"
                        />
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 min-w-0 flex items-center gap-4">
                    {isEditing ? (
                        <div className="flex-1 flex flex-col gap-3">
                            <Input
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none px-0 text-base font-medium focus:border-white/50 focus:ring-0 placeholder:text-neutral-800 shadow-none text-white"
                            />
                            <div className="flex flex-wrap gap-1.5">
                                {tags?.map((tag: any) => {
                                    const Icon = tag.icon && (Icons as any)[tag.icon] ? (Icons as any)[tag.icon] : null;
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => setEditTagId(editTagId === tag.id ? null : tag.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold transition-all",
                                                editTagId === tag.id ? "bg-white text-black border-white" : "bg-white/5 border-white/5 text-neutral-600 hover:text-neutral-400"
                                            )}
                                        >
                                            {Icon ? (
                                                <Icon className="w-2.5 h-2.5" style={{ color: tag.color || "#22d3ee" }} />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color || "#22d3ee" }} />
                                            )}
                                            {tag.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSave} className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase">
                                    <Save className="w-3.5 h-3.5" /> CONFIRM
                                </button>
                                <button onClick={() => { setIsEditing(false); setEditContent(node.content); setEditTagId(node.tag_id); }} className="text-[10px] font-black text-neutral-600 hover:text-white transition-colors uppercase">
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Task name */}
                            <span className={cn(
                                "truncate",
                                depth === 0 ? "text-base font-medium tracking-tight" : "text-sm text-neutral-300 font-light",
                                node.status === "completed" && "line-through text-neutral-600"
                            )}>
                                {depth === 0 && node.is_plus_alpha && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 mr-2 not-italic">ALPHA</span>
                                )}
                                {node.content}
                            </span>

                            {node.status === "completed" && node.completed_at?.startsWith(new Date().toISOString().split("T")[0]) && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-neutral-500 border border-white/5 shrink-0 uppercase">Done Today</span>
                            )}

                            {/* Badges: tag + time */}
                            <div className="flex items-center gap-1.5 ml-auto shrink-0">
                                                {(() => {
                                                    const tag = tags?.find((t: any) => t.id === node.tag_id);
                                                    if (!tag) return null;
                                                    const Icon = tag.icon && (Icons as any)[tag.icon] ? (Icons as any)[tag.icon] : null;
                                                    return (
                                                        <span className="h-6 px-2 rounded-md bg-white/[0.04] border border-white/5 text-[8px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase transition-colors hover:text-neutral-300">
                                                            {Icon ? (
                                                                <Icon className="w-3 h-3" style={{ color: tag.color || "#22d3ee" }} />
                                                            ) : (
                                                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: tag.color || "#444" }} />
                                                            )}
                                                            {tag.name}
                                                        </span>
                                                    );
                                                })()}
                                {totalTime > 0 && (
                                    <span className={cn(
                                        "h-6 px-2 rounded-md border font-mono text-[9px] flex items-center",
                                        isRunning ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" : "bg-white/[0.04] text-neutral-600 border-white/5"
                                    )}>
                                        {formatDuration(totalTime)}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Actions ── */}
                {canEdit && !isEditing && (
                    <div className={cn(
                        "flex items-center gap-1 shrink-0",
                        "md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                        // Force visible on mobile/tablet or if it's the active task
                        (isRunning || (typeof window !== 'undefined' && window.innerWidth < 1024)) && "opacity-100"
                    )}>
                        {/* Play / Pause — always visible for leaf tasks */}
                        {!hasChildren && (
                            isRunning ? (
                                <button
                                    onClick={() => onPause()}
                                    className="h-7 w-7 flex items-center justify-center rounded-md text-blue-400 bg-blue-500/15 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
                                >
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => onRun(rootId, node.id, node.tag_id)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md text-neutral-700 hover:text-blue-400 bg-white/[0.04] border border-white/5 hover:bg-blue-500/10 hover:border-blue-500/20 transition-colors"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </button>
                            )
                        )}

                        <button
                            onClick={() => setIsEditing(true)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-neutral-600 hover:text-white bg-white/[0.04] border border-white/5 hover:bg-white/[0.1] transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setAdding(!adding)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-neutral-600 hover:text-white bg-white/[0.04] border border-white/5 hover:bg-white/[0.1] transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => (depth === 0 ? onDelete() : onDeleteSub(node.id))}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-red-500/50 hover:text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Children ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {node.subtasks?.map((child: any) => (
                            <TaskNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                canEdit={canEdit}
                                onToggle={onToggle}
                                onToggleSub={onToggleSub}
                                onDeleteSub={onDeleteSub}
                                onAddSub={onAddSub}
                                onUpdate={onUpdate}
                                onUpdateSub={onUpdateSub}
                                rootId={rootId}
                                onSetDate={onSetDate}
                                isRunning={activeTaskId === child.id}
                                onRun={onRun}
                                onPause={onPause}
                                currentSessionMs={currentSessionMs}
                                activeTaskId={activeTaskId}
                                tags={tags}
                            />
                        ))}
                        {adding && (
                            <motion.form
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onSubmit={submitAdd}
                                className="flex flex-col gap-3 py-4"
                                style={{ paddingLeft: `${(depth + 1) * indentSize + 20}px` }}
                            >
                                <div className="flex items-center gap-4 bg-white/[0.02] rounded-xl border border-white/5 p-3 mr-4">
                                    <Input
                                        autoFocus
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Add subtask..."
                                        className="h-7 bg-transparent border-0 rounded-none px-0 text-sm font-light focus:ring-0 placeholder:text-neutral-800 shadow-none flex-1"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button type="submit" className="px-3 py-1 rounded-md bg-white text-black text-[10px] font-black uppercase">ADD</button>
                                        <button type="button" onClick={() => setAdding(false)} className="p-1 text-neutral-600 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 ml-1">
                                    {tags?.map((tag: any) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => setNewTagId(newTagId === tag.id ? null : tag.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black transition-all uppercase",
                                                newTagId === tag.id ? "bg-white text-black border-white" : "bg-white/5 border-white/5 text-neutral-600 hover:text-neutral-400"
                                            )}
                                        >
                                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: tag.color }} />
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </motion.form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
