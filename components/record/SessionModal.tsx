"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, Clock, Tag as TagIcon, Calendar } from "lucide-react";
import { Tag, Session } from "@/lib/types";

interface SessionModalProps {
    editingSession: Session | null;
    tags: Tag[];
    editTagId: string;
    setEditTagId: (id: string) => void;
    editCreatedAt: string;
    setEditCreatedAt: (date: string) => void;
    editDuration: { h: number; m: number; s: number };
    setEditDuration: (duration: { h: number; m: number; s: number }) => void;
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
    editDuration,
    setEditDuration,
    isSaving,
    onClose,
    onSave
}: SessionModalProps) {
    if (!editingSession) return null;

    const selectedTag = tags.find(t => t.id === editTagId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative w-full max-w-lg bg-neutral-900/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
            >
                {/* Visual Accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-1 transition-colors duration-500"
                    style={{ backgroundColor: selectedTag?.color || '#22d3ee' }}
                />

                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold tracking-tight text-white font-suit">
                            {editingSession.id === 'new' ? 'Add Record' : 'Edit Session'}
                        </h3>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                            {editingSession.id === 'new' ? 'Create a new study entry' : `Session ID: ${editingSession.id.slice(0, 8)}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/5 rounded-2xl transition-all active:scale-95 group"
                    >
                        <X className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="p-8 space-y-10">
                    {/* Tag Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <TagIcon className="w-3.5 h-3.5 text-neutral-500" />
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Category Tag</label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => setEditTagId(tag.id)}
                                    className={`relative p-4 rounded-2xl border text-sm transition-all flex flex-col items-start gap-2 group overflow-hidden ${editTagId === tag.id
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-white/[0.02] border-white/5 text-neutral-500 hover:border-white/10 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className="w-3 h-3 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.2)]" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                    <span className="font-medium">{tag.name}</span>
                                    {editTagId === tag.id && (
                                        <motion.div
                                            layoutId="activeTag"
                                            className="absolute bottom-0 left-0 right-0 h-0.5"
                                            style={{ backgroundColor: tag.color || '#22d3ee' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Start Time */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Start Time</label>
                            </div>
                            <div className="relative group">
                                <input
                                    type="datetime-local"
                                    step="1"
                                    value={editCreatedAt}
                                    onChange={(e) => setEditCreatedAt(e.target.value)}
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Duration</label>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <DurationInput
                                    label="Hr"
                                    value={editDuration.h}
                                    onChange={(v) => setEditDuration({ ...editDuration, h: v })}
                                />
                                <DurationInput
                                    label="Min"
                                    value={editDuration.m}
                                    onChange={(v) => setEditDuration({ ...editDuration, m: v })}
                                />
                                <DurationInput
                                    label="Sec"
                                    value={editDuration.s}
                                    onChange={(v) => setEditDuration({ ...editDuration, s: v })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 p-5 rounded-[1.5rem] text-sm font-bold text-neutral-500 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-[2] p-5 rounded-[1.5rem] text-sm font-suit font-black uppercase tracking-widest bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5 stroke-[3]" />
                                <span>{editingSession.id === 'new' ? 'Confirm Record' : 'Apply Changes'}</span>
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
        <div className="space-y-2">
            <input
                type="number"
                min="0"
                max={label === 'Hr' ? 23 : 59}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-mono tabular-nums"
            />
            <p className="text-[8px] text-center text-neutral-600 uppercase font-black tracking-widest">{label}</p>
        </div>
    );
}
