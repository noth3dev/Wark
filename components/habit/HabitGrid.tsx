"use client";

import React from "react";
import { format, isSameDay } from "date-fns";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Habit } from "../../lib/services/habitService";
import { Tag } from "../../lib/types";
import { HabitRow } from "./HabitRow";

interface HabitGridProps {
    habits: Habit[];
    dates: Date[];
    completions: Record<string, boolean>;
    tags: Tag[];
    isLoading: boolean;
    today: Date;
    onToggle: (habitId: string, date: Date) => void;
    onDelete: (habitId: string) => void;
}

export function HabitGrid({
    habits,
    dates,
    completions,
    tags,
    isLoading,
    today,
    onToggle,
    onDelete
}: HabitGridProps) {
    const [dragMode, setDragMode] = React.useState<boolean | null>(null);

    const handleCellMouseDown = React.useCallback((habitId: string, date: Date, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        setDragMode(nextStatus);
        onToggle(habitId, date);
    }, [onToggle]);

    const handleCellMouseEnter = React.useCallback((habitId: string, date: Date, currentStatus: boolean) => {
        if (dragMode !== null && currentStatus !== dragMode) {
            onToggle(habitId, date);
        }
    }, [dragMode, onToggle]);

    React.useEffect(() => {
        const handleMouseUp = () => setDragMode(null);
        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, []);

    return (
        <div className="overflow-x-auto no-scrollbar select-none">
            <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="pb-6 w-48 bg-transparent">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Identity</span>
                        </th>
                        {dates.map((date, i) => (
                            <th key={i} className="pb-6 px-2 text-center">
                                <div className={cn(
                                    "flex flex-col items-center gap-1 opacity-50",
                                    isSameDay(date, today) && "opacity-100"
                                )}>
                                    <span className="text-[9px] font-black uppercase tracking-tighter text-neutral-400">{format(date, "EEE")}</span>
                                    <span className="text-sm font-mono font-black text-neutral-200">{format(date, "d")}</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {habits.map((habit) => (
                        <HabitRow 
                            key={habit.id}
                            habit={habit}
                            dates={dates}
                            completions={completions}
                            tags={tags}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onCellMouseDown={handleCellMouseDown}
                            onCellMouseEnter={handleCellMouseEnter}
                        />
                    ))}
                </tbody>
                
                <tfoot>
                    <tr className="border-t border-white/10 bg-white/[0.01]">
                        <td className="py-4 pr-4">
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest pl-2">Efficiency Rate</span>
                        </td>
                        {dates.map((date, i) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            const count = habits.filter(h => completions[`${h.id}:${dateStr}`]).length;
                            const perc = habits.length === 0 ? 0 : Math.round((count / habits.length) * 100);
                            
                            return (
                                <td key={i} className="py-4 px-1.5 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-1 h-8 bg-white/5 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                                            <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: `${perc}%` }}
                                                className="absolute bottom-0 left-0 w-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                                transition={{ 
                                                    type: "spring", 
                                                    stiffness: 150, 
                                                    damping: 12, 
                                                    mass: 0.8 
                                                }}
                                            />
                                        </div>
                                        <motion.span 
                                            animate={{ 
                                                color: perc === 100 ? "#60a5fa" : "#525252",
                                                scale: perc === 100 ? 1.1 : 1
                                            }}
                                            className={cn(
                                                "text-[8px] font-mono font-bold transition-colors"
                                            )}
                                        >
                                            {perc}%
                                        </motion.span>
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                </tfoot>
            </table>

            {habits.length === 0 && !isLoading && (
                <div className="py-40 text-center space-y-4 opacity-20">
                    <div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center">
                        <Icons.ChevronRight className="w-5 h-5 text-neutral-400" />
                    </div>
                    <p className="text-[11px] font-bold uppercase text-neutral-400">No rituals established.</p>
                </div>
            )}
        </div>
    );
}
