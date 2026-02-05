"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Move, Plus, Minus, Clock } from "lucide-react";

interface SolvedProblemsPanelProps {
    isOpen: boolean;
    count: number;
    increment: () => void;
    decrement: () => void;
    tagId: string | null;
    dailyTimes?: Record<string, number>;
    activeSeconds?: number;
}

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

export function SolvedProblemsPanel({
    isOpen,
    count,
    increment,
    decrement,
    tagId,
    dailyTimes,
    activeSeconds
}: SolvedProblemsPanelProps) {
    // If we are currently studying this tag, use the live timer (activeSeconds)
    // Otherwise fallback to dailyTimes fetched from the DB
    const duration = (tagId && activeSeconds && activeSeconds > 0)
        ? activeSeconds
        : (tagId && dailyTimes ? dailyTimes[tagId] || 0 : 0);

    const avgSeconds = count > 0 ? duration / count : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="fixed top-24 left-[calc(50%-5rem)] w-44 bg-black/80 border border-white/10 rounded-[3rem] p-6 shadow-2xl z-[101] cursor-default group"
                    style={{
                        touchAction: 'none',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7)'
                    }}
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-1.5 grayscale opacity-50">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Focus Unit</span>
                            </div>
                            <Move className="w-2.5 h-2.5 opacity-20 cursor-move" />
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <div className="text-6xl font-mono font-black text-white px-2 tracking-tighter tabular-nums drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                                {count}
                            </div>
                            {avgSeconds > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full"
                                >
                                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter">
                                        {formatDuration(avgSeconds)}
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={decrement}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-90 text-neutral-500 shadow-inner"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={increment}
                                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/20 transition-all active:scale-95 text-neutral-300 shadow-xl"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[8px] text-neutral-600 font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">Command + Space</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
