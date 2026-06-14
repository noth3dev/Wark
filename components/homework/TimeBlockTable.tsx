"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Homework, Subtask } from "../../hooks/useHomework";
import { useMaterials } from "../../hooks/useMaterials";
import { Tag } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, Square, Check, X, Tag as TagIcon, Trash2, ChevronDown } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";

// Helper component for debounced/local state input
function LocalInput({ value, onChange, placeholder, className, list, onBlurCallback }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string, list?: string, onBlurCallback?: (val: string) => void }) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            list={list}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                if (localValue !== value) {
                    onChange(localValue);
                }
                if (onBlurCallback) {
                    onBlurCallback(localValue);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            className={className}
            placeholder={placeholder}
        />
    );
}

function CustomSubjectSelect({ value, onChange, tags }: { value: string, onChange: (val: string) => void, tags: Tag[] }) {
    const [open, setOpen] = useState(false);
    const selectedTag = tags.find(t => t.id === value);
    const IconComponent = selectedTag?.icon ? (Icons as any)[selectedTag.icon] || TagIcon : TagIcon;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full text-left bg-transparent text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/10 rounded-md px-2 py-1.5 -ml-2 transition-all hover:bg-white/5"
            >
                {selectedTag ? (
                    <>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: selectedTag.color || '#333' }}>
                            <IconComponent className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-neutral-200 truncate flex-1">{selectedTag.name}</span>
                    </>
                ) : (
                    <span className="text-neutral-500 flex-1">-- Select Subject --</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-64 overflow-y-auto">
                        {tags.map(t => {
                            const TagIconComponent = t.icon ? (Icons as any)[t.icon] || TagIcon : TagIcon;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(t.id);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/5 transition-colors text-neutral-300 hover:text-white"
                                >
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: t.color || '#333' }}>
                                        <TagIconComponent className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <span className="truncate">{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

interface TimeBlockTableProps {
    homeworks: Homework[];
    tags: Tag[];
    canEdit: boolean;
    onAddHomework: (content: string, isPlusAlpha?: boolean) => void;
    onUpdateHomework: (id: string, updates: any) => void;
    onDeleteHomework: (id: string) => void;
    onAddSubtask: (hwId: string, parentId: string, content: string, tagId?: string | null) => void;
    onUpdateSubtask: (hwId: string, subId: string, updates: any) => void;
    onDeleteSubtask: (hwId: string, subId: string) => void;
    onToggleSubtask: (hwId: string, subId: string) => void;
    onRunTask: (hwId: string, taskId: string, tagId: string | null) => void;
    onPauseTask: () => void;
    onCopyTaskToEnd?: (data: { content: string; amount_text?: string; subjectContent: string; subjectTagId?: string | null; }) => void;
    activeTaskId?: string;
    currentSessionMs: number;
}

export function TimeBlockTable({
    homeworks,
    tags,
    canEdit,
    onAddHomework,
    onUpdateHomework,
    onDeleteHomework,
    onAddSubtask,
    onUpdateSubtask,
    onDeleteSubtask,
    onToggleSubtask,
    onRunTask,
    onPauseTask,
    onCopyTaskToEnd,
    activeTaskId,
    currentSessionMs
}: TimeBlockTableProps) {
    const [newTimeBlock, setNewTimeBlock] = useState("");
    const { materials, addOrUpdateMaterial } = useMaterials();

    // Flatten homeworks into a structure suitable for rendering with rowSpan
    const rows = useMemo(() => {
        const flattened: any[] = [];

        homeworks.forEach(hw => {
            const subjects = hw.subtasks || [];

            if (subjects.length === 0) {
                flattened.push({
                    type: 'empty_hw',
                    hw,
                    hwRowSpan: 1,
                    isHwFirstRow: true
                });
                return;
            }

            let hwRowSpan = 0;
            const hwRows: any[] = [];

            subjects.forEach(sub => {
                const materials = sub.subtasks || [];
                if (materials.length === 0) {
                    hwRowSpan += 1;
                    hwRows.push({
                        type: 'empty_sub',
                        hw,
                        subject: sub,
                        subjectRowSpan: 1,
                        isSubjectFirstRow: true
                    });
                } else {
                    hwRowSpan += materials.length;
                    materials.forEach((mat, idx) => {
                        hwRows.push({
                            type: 'material',
                            hw,
                            subject: sub,
                            material: mat,
                            subjectRowSpan: materials.length,
                            isSubjectFirstRow: idx === 0
                        });
                    });
                }
            });

            hwRows.forEach((row, idx) => {
                row.hwRowSpan = hwRowSpan;
                row.isHwFirstRow = idx === 0;
                flattened.push(row);
            });
        });

        return flattened;
    }, [homeworks]);

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
        <div className="w-full space-y-6 font-sans">
            <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-neutral-500 font-semibold bg-white/[0.02]">
                            <th className="p-4 w-1/5 border-r border-white/5 font-medium">Time</th>
                            <th className="p-4 w-1/5 border-r border-white/5 font-medium">Subject</th>
                            <th className="p-4 w-1/4 border-r border-white/5 font-medium">Material</th>
                            <th className="p-4 w-auto font-medium">Amount & Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-neutral-500 text-sm">
                                    No tasks scheduled. Add a time block below.
                                </td>
                            </tr>
                        )}
                        {rows.map((row, idx) => {
                            // Determine if this row is the start of a new time block to draw a stronger border
                            const isNewTimeBlock = row.isHwFirstRow && idx !== 0;
                            return (
                                <tr key={`${row.hw.id}-${row.subject?.id || 'none'}-${row.material?.id || 'none'}-${idx}`}
                                    className={cn(
                                        "group/row hover:bg-white/[0.02] transition-colors",
                                        isNewTimeBlock ? "border-t border-white/10" : "border-t border-white/[0.02]"
                                    )}>
                                    {/* Time Cell */}
                                    {row.isHwFirstRow && (
                                        <td rowSpan={row.hwRowSpan} className="p-4 align-top relative group/time border-r border-white/5">
                                            <div className="flex flex-col gap-3">
                                                <LocalInput
                                                    value={row.hw.content}
                                                    onChange={(val) => onUpdateHomework(row.hw.id, { content: val })}
                                                    className="bg-transparent text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/10 rounded-md px-2 py-1 -ml-2 transition-all w-full"
                                                    placeholder="e.g. 09:00 - 12:00"
                                                />
                                                {canEdit && (
                                                    <div className="flex items-center gap-3 mt-1 px-2 opacity-0 group-hover/time:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onAddSubtask(row.hw.id, row.hw.id, "New Subject")}
                                                            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white font-medium transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> Add Subject
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteHomework(row.hw.id)}
                                                            className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors ml-auto"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}

                                    {/* Subject Cell */}
                                    {row.isSubjectFirstRow && row.subject ? (
                                        <td rowSpan={row.subjectRowSpan} className="p-4 align-top relative group/sub bg-white/[0.01] border-r border-white/5">
                                            <div className="flex flex-col gap-3">
                                                <CustomSubjectSelect 
                                                    value={row.subject.tag_id || ""}
                                                    onChange={(val) => onUpdateSubtask(row.hw.id, row.subject.id, { tag_id: val })}
                                                    tags={tags}
                                                />

                                                {canEdit && (
                                                    <div className="flex items-center gap-3 mt-1 px-2 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onAddSubtask(row.hw.id, row.subject.id, "", row.subject.tag_id)}
                                                            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white font-medium transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> Add Task
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteSubtask(row.hw.id, row.subject.id)}
                                                            className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors ml-auto"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    ) : row.isSubjectFirstRow && !row.subject ? (
                                        <td className="p-4 align-middle text-center border-r border-white/5">
                                            <span className="text-sm text-neutral-600">No subject selected</span>
                                        </td>
                                    ) : null}

                                    {/* Material Cell */}
                                    {row.material ? (
                                        <td className="p-4 align-top relative group/mat border-r border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-full p-0.5 border border-white/5 shrink-0">
                                                    <button
                                                        onClick={() => {
                                                            const isCompleted = row.material.status === "completed" || row.material.is_completed;
                                                            onUpdateSubtask(row.hw.id, row.material.id, { 
                                                                is_completed: !isCompleted, 
                                                                status: !isCompleted ? "completed" : "todo" 
                                                            });
                                                            if (!isCompleted && row.subject?.tag_id && row.material.content) {
                                                                addOrUpdateMaterial(row.subject.tag_id, row.material.content, row.material.amount_text);
                                                            }
                                                        }}
                                                        title="Mark as Completed"
                                                        className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", (row.material.status === "completed" || row.material.is_completed) ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-transparent text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10")}
                                                    >
                                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => {
                                                            const isIncomplete = row.material.status === "incomplete";
                                                            onUpdateSubtask(row.hw.id, row.material.id, { 
                                                                is_completed: false, 
                                                                status: !isIncomplete ? "incomplete" : "todo" 
                                                            });
                                                            if (!isIncomplete && onCopyTaskToEnd) {
                                                                onCopyTaskToEnd({
                                                                    content: row.material.content,
                                                                    amount_text: row.material.amount_text,
                                                                    subjectContent: row.subject?.content || "",
                                                                    subjectTagId: row.subject?.tag_id,
                                                                });
                                                            }
                                                        }}
                                                        title="Mark as Incomplete & Defer"
                                                        className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", row.material.status === "incomplete" ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-transparent text-neutral-500 hover:text-red-400 hover:bg-red-500/10")}
                                                    >
                                                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <div className="flex-1 relative">
                                                    <LocalInput
                                                        list={`materials-${row.subject?.tag_id}`}
                                                        value={row.material.content}
                                                        onChange={(val) => onUpdateSubtask(row.hw.id, row.material.id, { content: val })}
                                                        onBlurCallback={(val) => {
                                                            if (val && row.subject?.tag_id) {
                                                                addOrUpdateMaterial(row.subject.tag_id, val, row.material.amount_text || null);
                                                            }
                                                        }}
                                                        className={cn("bg-transparent text-sm font-semibold text-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/10 rounded-md px-2 py-1 -ml-2 w-full transition-all", (row.material.status === "completed" || row.material.is_completed) && "text-blue-500/60 line-through decoration-blue-500", row.material.status === "incomplete" && "text-red-500/60 line-through decoration-red-500", row.material.content.includes("[미완료 이월]") && "text-red-400")}
                                                        placeholder="교재명..."
                                                    />
                                                    <datalist id={`materials-${row.subject?.tag_id}`}>
                                                        {materials.filter(m => m.subject_tag_id === row.subject?.tag_id).map(m => (
                                                            <option key={m.id} value={m.name} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>
                                        </td>
                                    ) : (
                                        <td className="p-4 align-middle text-center border-r border-white/5">
                                            {row.subject && (
                                                <span className="text-xs text-neutral-600 italic">No materials added</span>
                                            )}
                                        </td>
                                    )}

                                    {/* Amount Cell */}
                                    {row.material ? (
                                        <td className="p-4 align-top relative group/amt">
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex items-center gap-2">
                                                    <LocalInput
                                                        value={row.material.amount_text || ""}
                                                        onChange={(val) => {
                                                            onUpdateSubtask(row.hw.id, row.material.id, { amount_text: val });
                                                        }}
                                                        className={cn("bg-transparent text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-white/10 rounded-md px-2 py-1 -ml-2 flex-1 transition-all", (row.material.status === "completed" || row.material.is_completed) && "text-blue-500/60 line-through decoration-blue-500", row.material.status === "incomplete" && "text-red-500/60 line-through decoration-red-500")}
                                                        placeholder="분량 (예: 3단원, p.20~30)"
                                                    />

                                                    <div className="flex items-center gap-2">
                                                        {activeTaskId === row.material.id ? (
                                                            <button
                                                                onClick={onPauseTask}
                                                                className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all shrink-0 animate-pulse"
                                                            >
                                                                <Square className="w-3 h-3" fill="currentColor" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => onRunTask(row.hw.id, row.material.id, row.subject?.tag_id || row.hw.tag_id)}
                                                                className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all shrink-0 opacity-0 group-hover/row:opacity-100"
                                                            >
                                                                <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                                                            </button>
                                                        )}

                                                        {(row.material.time_spent > 0 || activeTaskId === row.material.id) && (
                                                            <div className="text-[10px] font-mono text-neutral-400 tabular-nums min-w-[50px] text-right">
                                                                {formatDuration((row.material.time_spent || 0) + (activeTaskId === row.material.id ? currentSessionMs : 0))}
                                                            </div>
                                                        )}

                                                        {canEdit && (
                                                            <button
                                                                onClick={() => onDeleteSubtask(row.hw.id, row.material.id)}
                                                                className="p-1 text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Hint for last amount */}
                                                {(() => {
                                                    if (row.material.content && row.subject?.tag_id) {
                                                        const matchedMaterial = materials.find(m => m.name === row.material.content && m.subject_tag_id === row.subject.tag_id);
                                                        if (matchedMaterial && matchedMaterial.last_amount_text) {
                                                            return (
                                                                <div className="text-[10px] text-neutral-500 font-medium px-1">
                                                                    마지막 기록: <span className="text-neutral-400">{matchedMaterial.last_amount_text}</span>
                                                                </div>
                                                            );
                                                        }
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </td>
                                    ) : (
                                        <td className="p-4 align-middle text-center">
                                            {row.subject && (
                                                <span className="text-xs text-neutral-600 italic">-</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {canEdit && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (newTimeBlock.trim()) {
                            onAddHomework(newTimeBlock);
                            setNewTimeBlock("");
                        }
                    }}
                    className="flex gap-2"
                >
                    <input
                        value={newTimeBlock}
                        onChange={e => setNewTimeBlock(e.target.value)}
                        placeholder="새로운 시간 추가 (오전, 오후, 일과중 등등)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-white"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-white text-black text-[10px] font-bold rounded-xl hover:bg-neutral-200 transition-colors uppercase tracking-widest shrink-0"
                    >
                        시간 추가
                    </button>
                </form>
            )}
        </div>
    );
}
