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
        <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Detailed Session Logs</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddRecord}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:bg-white/10 transition-all"
                >
                    <Plus className="w-3 h-3" />
                    Add Record
                </motion.button>
            </div>

            <div className="grid gap-3">
                {sessions.map((session) => {
                    const tag = tags.find(t => t.id === session.tag_id);
                    return (
                        <motion.div
                            key={session.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: tag?.color || '#22d3ee' }}
                                />
                                <div>
                                    <p className="text-sm font-medium">{tag?.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-neutral-500 font-mono">
                                        {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm font-mono">{formatDurationShort(session.duration)}</p>
                                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">Duration</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEditSession(session)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteSession(session.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                {sessions.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                        <p className="text-xs text-neutral-600">No individual records found for this day.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
