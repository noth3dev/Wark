"use client";

import React from "react";
import * as Icons from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Habit } from "../../lib/services/habitService";
import { Tag } from "../../lib/types";
import { cn } from "../../lib/utils";

interface HabitRowProps {
    habit: Habit;
    dates: Date[];
    completions: Record<string, boolean>;
    tags: Tag[];
    onToggle: (habitId: string, date: Date) => void;
    onDelete: (habitId: string) => void;
    onCellMouseDown: (habitId: string, date: Date, currentStatus: boolean) => void;
    onCellMouseEnter: (habitId: string, date: Date, currentStatus: boolean) => void;
}

export function HabitRow({
    habit,
    dates,
    completions,
    tags,
    onToggle,
    onDelete,
    onCellMouseDown,
    onCellMouseEnter
}: HabitRowProps) {
    const tag = tags.find(t => t.id === habit.tag_id);
    const Icon = (habit.icon ? (Icons as any)[habit.icon] : null) || Icons.Check;

    return (
        <tr className="group hover:bg-white/[0.03] transition-colors">
            <td className="py-3.5 pr-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm">
                            <Icon style={{ color: habit.color }} className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-semibold tracking-tight text-neutral-100">{habit.name}</p>
                            {tag && (
                                <div className="flex items-center gap-1 opacity-60">
                                    <span className="text-[8px] font-bold uppercase text-neutral-500">{tag.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => onDelete(habit.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-500 transition-all"
                    >
                        <Icons.X className="w-3 h-3" />
                    </button>
                </div>
            </td>
            {dates.map((date, i) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const key = `${habit.id}:${dateStr}`;
                const completed = completions[key] || false;
                return (
                    <td key={i} className="py-3.5 px-1.5">
                        <div className="flex justify-center">
                            <div
                                onMouseDown={(e) => {
                                    if (e.button === 0) onCellMouseDown(habit.id, date, completed);
                                }}
                                onMouseEnter={() => onCellMouseEnter(habit.id, date, completed)}
                                className={cn(
                                    "relative w-7 h-7 rounded-lg border transition-all duration-500 flex items-center justify-center group/cell shadow-sm overflow-hidden cursor-pointer",
                                    completed 
                                        ? "border-transparent bg-white/[0.05]" 
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                                )}
                                style={completed ? { 
                                    backgroundColor: `${habit.color}25`,
                                    boxShadow: `inset 0 0 10px ${habit.color}15, 0 0 15px ${habit.color}10` 
                                } : {}}
                            >
                                {/* Unchecked Inner Circle */}
                                {!completed && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover/cell:bg-white/30 transition-all scale-90" />
                                )}

                                {/* Checked Glowing Dot */}
                                <motion.div 
                                    layout
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-full absolute"
                                    )}
                                    initial={false}
                                    animate={{ 
                                        scale: completed ? 1 : 0,
                                        opacity: completed ? 1 : 0
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25
                                    }}
                                    style={{ 
                                        backgroundColor: habit.color, 
                                        boxShadow: `0 0 15px ${habit.color}, 0 0 6px ${habit.color}CC` 
                                    }}
                                />
                            </div>
                        </div>
                    </td>
                );
            })}
        </tr>
    );
}
