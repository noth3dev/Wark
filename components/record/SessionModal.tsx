"use client";

import { motion } from "framer-motion";
import { X, Loader2, Check, Clock, Tag as TagIcon, Calendar } from "lucide-react";
import { Tag, Session } from "@/lib/types";

interface SessionModalProps {
    editingSession: Session | null;
    tags: Tag[];
    editTagId: string;
    setEditTagId: (id: string) => void;
    editCreatedAt: string;
    setEditCreatedAt: (date: string) => void;
    editEndedAt: string;
    setEditEndedAt: (date: string) => void;
    editDuration: { h: number; m: number; s: number };
    setEditDuration: (h: number, m: number, s: number) => void;
    isSaving: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function SessionModal({
    editingSession,
    tags,
    editTagId,
    setEditTagId,
    editCreatedAt,
    setEditCreatedAt,
    editEndedAt,
    setEditEndedAt,
    editDuration,
    setEditDuration,
    isSaving,
    onClose,
    onSave
}: SessionModalProps) {
    if (!editingSession) return null;

    const selectedTag = tags.find(t => t.id === editTagId);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-neutral-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl no-scrollbar"
            >
                {/* Accent bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-0.5 transition-colors duration-500 shadow-[0_0_20px_currentcolor]"
                    style={{ backgroundColor: selectedTag?.color || '#22d3ee' }}
                />

                {/* Header */}
                <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold tracking-tight text-white">
                            {editingSession.id === 'new' ? 'Add Record' : 'Edit Session'}
                        </h3>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                            {editingSession.id === 'new' ? 'Create a new study entry' : `ID: ${editingSession.id.slice(0, 8)}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-6">
                    {/* Tag Selection */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                            <TagIcon className="w-3 h-3 text-neutral-500" />
                            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500">Category</label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => setEditTagId(tag.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${editTagId === tag.id
                                        ? 'bg-white/10 border-white/20 text-white shadow-[0_4px_12px_rgba(255,255,255,0.05)]'
                                        : 'bg-white/[0.02] border-white/5 text-neutral-500 hover:border-white/10'
                                    }`}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                    <span className="font-medium text-sm">{tag.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Start Time */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-neutral-500" />
                                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500">Start Time</label>
                            </div>
                            <input
                                type="datetime-local"
                                step="1"
                                value={editCreatedAt}
                                onChange={(e) => setEditCreatedAt(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-mono"
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-neutral-500" />
                                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500">End Time</label>
                            </div>
                            <input
                                type="datetime-local"
                                step="1"
                                value={editEndedAt}
                                onChange={(e) => setEditEndedAt(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500">Duration</label>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <DurationInput label="Hr" value={editDuration.h} onChange={(v) => setEditDuration(v, editDuration.m, editDuration.s)} />
                            <DurationInput label="Min" value={editDuration.m} onChange={(v) => setEditDuration(editDuration.h, v, editDuration.s)} />
                            <DurationInput label="Sec" value={editDuration.s} onChange={(v) => setEditDuration(editDuration.h, editDuration.m, v)} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 bg-neutral-900/95 backdrop-blur-sm px-5 py-4 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-lg text-sm font-bold text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-[2] py-3 rounded-lg text-sm font-black uppercase bg-white text-black hover:bg-neutral-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>{editingSession.id === 'new' ? 'Confirm' : 'Save'}</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function DurationInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
    return (
        <div className="space-y-1">
            <input
                type="number"
                min="0"
                max={label === 'Hr' ? 23 : 59}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-mono tabular-nums"
            />
            <p className="text-[8px] text-center text-neutral-600 uppercase font-bold tracking-widest">{label}</p>
        </div>
    );
}
