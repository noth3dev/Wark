"use client";

import { motion } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-light tracking-tight">
                        {editingSession.id === 'new' ? 'Add New Record' : 'Edit Session'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Tag Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tag</label>
                        <div className="grid grid-cols-2 gap-2">
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => setEditTagId(tag.id)}
                                    className={`p-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${editTagId === tag.id
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-white/[0.02] border-white/5 text-neutral-500 hover:border-white/10'
                                        }`}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Time */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Start Time</label>
                        <input
                            type="datetime-local"
                            value={editCreatedAt}
                            onChange={(e) => setEditCreatedAt(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                        />
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Duration</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={editDuration.h}
                                    onChange={(e) => setEditDuration({ ...editDuration, h: parseInt(e.target.value) || 0 })}
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                />
                                <p className="text-[9px] text-center text-neutral-600 uppercase font-black">Hr</p>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={editDuration.m}
                                    onChange={(e) => setEditDuration({ ...editDuration, m: parseInt(e.target.value) || 0 })}
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                />
                                <p className="text-[9px] text-center text-neutral-600 uppercase font-black">Min</p>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={editDuration.s}
                                    onChange={(e) => setEditDuration({ ...editDuration, s: parseInt(e.target.value) || 0 })}
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                />
                                <p className="text-[9px] text-center text-neutral-600 uppercase font-black">Sec</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 p-4 rounded-2xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-1 p-4 rounded-2xl text-sm font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {editingSession.id === 'new' ? 'Add Record' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
