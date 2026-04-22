"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface HabitHeaderProps {
    progress: number;
    daysToShow: number;
    onShiftWeek: (n: number) => void;
    onResetToCurrentWeek: () => void;
    onAdjustRange: (delta: number) => void;
    onAddHabit: () => void;
}

export function HabitHeader({ 
    progress, 
    daysToShow,
    onShiftWeek, 
    onResetToCurrentWeek, 
    onAdjustRange,
    onAddHabit 
}: HabitHeaderProps) {
    return (
        <header className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-1.5">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Rituals</p>
                    <h1 className="text-3xl sm:text-5xl font-semibold tracking-tighter leading-none text-neutral-100">Habit Tracker</h1>
                </div>
                <div className="flex sm:block items-end justify-between sm:text-right border-t border-white/10 sm:border-0 pt-4 sm:pt-0">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase mb-2">Today&apos;s Focus</p>
                    <p className="text-3xl sm:text-4xl font-mono text-white/40">{progress}%</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-y border-white/10">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 shadow-sm">
                        <button onClick={() => onShiftWeek(-1)} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                            <ChevronLeft className="w-4 h-4 text-neutral-300" />
                        </button>
                        <button 
                            onClick={onResetToCurrentWeek} 
                            className="px-3 text-[10px] font-bold uppercase text-neutral-300 hover:text-white transition-colors"
                        >
                            Current
                        </button>
                        <button onClick={() => onShiftWeek(1)} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                            <ChevronRight className="w-4 h-4 text-neutral-300" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 shadow-sm">
                        <button onClick={() => onAdjustRange(-1)} className="px-2.5 py-1.5 hover:bg-white/10 rounded-md text-neutral-300 font-bold">-</button>
                        <span className="px-2 text-[10px] font-mono font-bold text-neutral-500">{daysToShow}D</span>
                        <button onClick={() => onAdjustRange(1)} className="px-2.5 py-1.5 hover:bg-white/10 rounded-md text-neutral-300 font-bold">+</button>
                    </div>

                    <button 
                        onClick={onAddHabit}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-[10px] font-black text-neutral-200 hover:bg-white/20 hover:text-white uppercase tracking-tighter transition-all"
                    >
                        <Plus className="w-3 h-3" /> New Habit
                    </button>
                </div>
            </div>
        </header>
    );
}
