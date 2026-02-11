"use client";

import { motion } from "framer-motion";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface RecordHeaderProps {
    selectedDate: Date;
    isToday: boolean;
    totalToday: number;
    onDateChange: (days: number) => void;
}

export function RecordHeader({ selectedDate, isToday, totalToday, onDateChange }: RecordHeaderProps) {
    return (
        <header className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80">Activity Engine v2.0</span>
            </motion.div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-6"
                >
                    <div className="flex items-center bg-white/5 border border-white/5 rounded-2xl p-1 shadow-2xl">
                        <button
                            onClick={() => onDateChange(-1)}
                            className="p-3 hover:bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-6 text-center min-w-[180px]">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-1">
                                {isToday ? "Operational Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                            <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter text-white">
                                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                <span className="text-neutral-700 ml-2">{selectedDate.getFullYear()}</span>
                            </h1>
                        </div>
                        <button
                            onClick={() => onDateChange(1)}
                            className="p-3 hover:bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative group cursor-default"
                >
                    <div className="absolute -inset-4 bg-cyan-500/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-1">Total Runtime</p>
                        <p className="text-5xl font-light tracking-tighter text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            {formatDuration(totalToday).split(' ').map((p, i) => (
                                <span key={i} className={i % 2 !== 0 ? "text-neutral-600 text-sm font-bold ml-1 mr-2" : ""}>{p}</span>
                            ))}
                        </p>
                    </div>
                </motion.div>
            </div>
        </header>
    );
}
