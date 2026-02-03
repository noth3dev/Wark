"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Move, Plus, Minus } from "lucide-react";

interface SolvedProblemsPanelProps {
    isOpen: boolean;
    count: number;
    increment: () => void;
    decrement: () => void;
}

export function SolvedProblemsPanel({ isOpen, count, increment, decrement }: SolvedProblemsPanelProps) {
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
                    className="fixed top-24 left-[calc(50%-5rem)] w-40 bg-black/60 border border-white/10 rounded-[2.5rem] p-5 shadow-2xl z-[101] cursor-default group"
                    style={{
                        touchAction: 'none',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-1.5 grayscale opacity-50">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-white">Solved</span>
                            </div>
                            <Move className="w-2.5 h-2.5 opacity-20 cursor-move" />
                        </div>

                        <div className="text-5xl font-mono font-black text-white px-2 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                            {count}
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={decrement}
                                className="w-8 h-8 rounded-full bg-white/10 border border-white/5 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all active:scale-90 text-neutral-400"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={increment}
                                className="w-8 h-8 rounded-full bg-white/10 border border-white/5 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all active:scale-90 text-neutral-400"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Space to +1</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
