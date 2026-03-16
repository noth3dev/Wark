"use client";

import { motion } from "framer-motion";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface RecordHeaderProps {
    selectedDate: Date;
    isToday: boolean;
    totalToday: number;
    totalSprintToday: number;
    onDateChange: (days: number) => void;
}

export function RecordHeader({ selectedDate, isToday, totalToday, totalSprintToday, onDateChange }: RecordHeaderProps) {
    return (
        <header className="space-y-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden sm:inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary/50 border border-border"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span className="text-[10px] font-semibold uppercase text-neutral-500">Activity Protocol</span>
            </motion.div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 w-full md:w-auto"
                >
                    <div className="flex items-center bg-card border border-border rounded-xl p-1 w-full md:w-auto">
                        <button
                            onClick={() => onDateChange(-1)}
                            className="p-2.5 hover:bg-secondary rounded-lg text-neutral-500 hover:text-white transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 text-center flex-1 md:min-w-[160px]">
                            <p className="text-[10px] font-semibold uppercase text-neutral-500 mb-0.5">
                                {isToday ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white whitespace-nowrap">
                                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                <span className="text-neutral-600 ml-2">{selectedDate.getFullYear()}</span>
                            </h1>
                        </div>
                        <button
                            onClick={() => onDateChange(1)}
                            className="p-2.5 hover:bg-secondary rounded-lg text-neutral-500 hover:text-white transition-all active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-4 text-left md:text-right"
                >
                    <div>
                        <p className="text-[10px] font-semibold uppercase text-neutral-500 mb-0.5">Daily Runtime</p>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white transition-all">
                            {formatDuration(totalToday).split(' ').map((p, i) => (
                                <span key={i} className={i % 2 !== 0 ? "text-neutral-500 text-[10px] sm:text-xs font-medium ml-1 mr-2" : ""}>{p}</span>
                            ))}
                        </p>
                    </div>

                    {totalSprintToday > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <p className="text-[10px] font-semibold uppercase text-cyan-500 mb-0.5">Sprint Total</p>
                            <p className="text-xl sm:text-2xl font-light tracking-tight text-cyan-300">
                                {formatDuration(totalSprintToday).split(' ').map((p, i) => (
                                    <span key={i} className={i % 2 !== 0 ? "text-cyan-500/50 text-[8px] font-medium ml-0.5 mr-1" : ""}>{p}</span>
                                ))}
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </header>
    );
}
