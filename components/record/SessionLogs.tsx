"use client";

import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Tag, Session } from "@/lib/types";
import { formatDurationShort } from "@/lib/utils";

interface SessionLogsProps {
    sessions: Session[];
    tags: Tag[];
    onAddRecord: () => void;
    onEditSession: (session: Session) => void;
    onDeleteSession: (id: string) => void;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onSelectAll: (ids: string[]) => void;
    onDeleteMultiple: (ids: string[]) => void;
}

export function SessionLogs({ 
    sessions, tags, onAddRecord, onEditSession, onDeleteSession,
    selectedIds, onToggleSelect, onSelectAll, onDeleteMultiple 
}: SessionLogsProps) {
    const isAllSelected = sessions.length > 0 && selectedIds.length === sessions.length;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Session Narrative</h2>
                    {sessions.length > 0 && (
                        <button
                            onClick={() => isAllSelected ? onSelectAll([]) : onSelectAll(sessions.map(s => s.id))}
                            className="text-[9px] font-bold uppercase text-neutral-500 hover:text-white transition-colors"
                        >
                            {isAllSelected ? "Deselect All" : "Select All"}
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => onDeleteMultiple(selectedIds)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                        >
                            <Trash2 className="w-3 h-3" />
                            Delete {selectedIds.length}
                        </motion.button>
                    )}
                    <button
                        onClick={onAddRecord}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-[10px] font-black uppercase hover:bg-neutral-200 transition-all"
                    >
                        <Plus className="w-3 h-3" />
                        Add
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                {sessions.map((session, idx) => {
                    const tag = tags.find(t => t.id === session.tag_id);
                    const isSelected = selectedIds.includes(session.id);
                    return (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                                isSelected 
                                    ? "bg-white/5 border-white/15" 
                                    : "bg-transparent border-transparent hover:bg-white/[0.03]"
                            }`}
                        >
                            {/* Checkbox */}
                            <button 
                                onClick={() => onToggleSelect(session.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                                    isSelected 
                                        ? "bg-white border-white text-black" 
                                        : "border-white/10 hover:border-white/30"
                                }`}
                            >
                                {isSelected && <div className="w-2 h-2 bg-black rounded-sm" />}
                            </button>

                            {/* Color dot */}
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag?.color || '#22d3ee' }} />

                            {/* Tag name */}
                            <span className="text-sm font-medium text-white/90 min-w-0 truncate">{tag?.name || 'Unidentified'}</span>

                            {/* Time */}
                            <span className="text-[10px] text-neutral-600 font-mono tabular-nums shrink-0">
                                {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>

                            {/* Sprint badge */}
                            {session.is_sprint && (
                                <span className="text-[7px] font-black text-cyan-500 uppercase bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.5 rounded shrink-0">Sprint</span>
                            )}

                            {/* Duration - push right */}
                            <span className="ml-auto text-sm font-mono tabular-nums text-white/70 shrink-0">
                                {formatDurationShort(session.duration)}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => onEditSession(session)}
                                    className="p-1.5 hover:bg-white/10 rounded-md text-neutral-500 hover:text-white transition-all"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => onDeleteSession(session.id)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-md text-neutral-500 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
                {sessions.length === 0 && (
                    <div className="py-16 text-center border border-dashed border-white/5 rounded-xl">
                        <p className="text-[10px] text-neutral-800 font-bold uppercase tracking-[0.3em]">No Temporal Records Identified</p>
                    </div>
                )}
            </div>
        </section>
    );
}
