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
}

export function SessionLogs({ sessions, tags, onAddRecord, onEditSession, onDeleteSession }: SessionLogsProps) {
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Session Narrative</h2>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddRecord}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Archive New
                </motion.button>
            </div>

            <div className="grid gap-4">
                {sessions.map((session, idx) => {
                    const tag = tags.find(t => t.id === session.tag_id);
                    return (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group flex items-center justify-between p-6 rounded-[2.5rem] bg-neutral-900/60 border border-white/5 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentcolor]" style={{ backgroundColor: tag?.color || '#22d3ee' }} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold tracking-tight text-white/90">{tag?.name || 'Unidentified'}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest whitespace-nowrap">
                                            {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </p>
                                        <div className="w-1 h-1 rounded-full bg-neutral-800" />
                                        <p className="text-[10px] text-neutral-700 font-bold uppercase tracking-widest">Entry #{session.id.slice(0, 4)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-lg font-extralight tracking-tighter text-white/80 tabular-nums">
                                        {formatDurationShort(session.duration).split(':').map((v, i) => (
                                            <span key={i} className={i === 0 ? "text-white" : "text-neutral-500"}>
                                                {v}{i < 2 ? <span className="text-[10px] font-bold mx-0.5">:</span> : ""}
                                            </span>
                                        ))}
                                    </p>
                                    <p className="text-[9px] text-neutral-700 uppercase tracking-[0.2em] font-black">Runtime</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => onEditSession(session)}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-neutral-500 hover:text-white transition-all active:scale-90"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteSession(session.id)}
                                        className="p-3 bg-white/5 hover:bg-red-500/10 rounded-2xl text-neutral-500 hover:text-red-400 transition-all active:scale-90"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                {sessions.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-[10px] text-neutral-800 font-bold uppercase tracking-[0.3em]">No Temporal Records Identified</p>
                    </div>
                )}
            </div>
        </section>
    );
}
