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
        <header className="space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
            >
                <History className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">Activity Logs</span>
            </motion.div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onDateChange(-1)}
                            className="p-2 hover:bg-white/5 rounded-full border border-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-neutral-500" />
                        </button>
                        <div className="text-center min-w-[200px]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 mb-1">
                                {isToday ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                            <h1 className="text-4xl md:text-6xl font-extralight tracking-tighter">
                                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </h1>
                        </div>
                        <button
                            onClick={() => onDateChange(1)}
                            className="p-2 hover:bg-white/5 rounded-full border border-white/5 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-right"
                >
                    <p className="text-[10px] font-bold uppercase text-neutral-600 mb-1">Lived</p>
                    <p className="text-4xl font-light tracking-tighter text-cyan-400">{formatDuration(totalToday)}</p>
                </motion.div>
            </div>
        </header>
    );
}
