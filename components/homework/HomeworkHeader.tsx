"use client";

import React from "react";
import * as Icons from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { motion } from "framer-motion";

interface HomeworkHeaderProps {
    formattedWeek: string;
    progress: number;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onShiftWeek: (n: number) => void;
    onToday: () => void;
    onExport: () => void;
}

export function HomeworkHeader({
    formattedWeek,
    progress,
    activeTab,
    onTabChange,
    onShiftWeek,
    onToday,
    onExport
}: HomeworkHeaderProps) {
    return (
        <header className="space-y-8 sm:space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-0">
                <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-[9px] sm:text-[10px] text-neutral-600 font-bold uppercase tracking-wider">Plan For</p>
                    <h1 className="text-3xl sm:text-5xl font-semibold tracking-tighter leading-none">{formattedWeek}</h1>
                </div>
                <div className="flex sm:block items-end justify-between sm:text-right border-t border-white/5 sm:border-0 pt-4 sm:pt-0">
                    <p className="text-[9px] sm:text-[10px] text-neutral-600 font-bold uppercase mb-1 sm:mb-2">Completion</p>
                    <p className="text-3xl sm:text-4xl font-mono text-white/20">{progress}%</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-y border-white/5">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                        <button onClick={() => onShiftWeek(-1)} className="p-2 hover:bg-white/5 rounded-md">
                            <Icons.ChevronLeft className="w-4 h-4 text-neutral-400" />
                        </button>
                        <button onClick={onToday} className="px-3 text-[10px] font-bold uppercase text-neutral-400 font-suit">Today</button>
                        <button onClick={() => onShiftWeek(1)} className="p-2 hover:bg-white/5 rounded-md">
                            <Icons.ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>
                    </div>

                    <button onClick={onExport} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-tighter shrink-0">
                        <Icons.Share2 className="w-3 h-3" /> <span className="hidden xs:inline">Export Summary</span><span className="xs:hidden">Export</span>
                    </button>
                </div>

                <div className="hidden sm:block h-4 w-px bg-white/10" />
                <div className="flex-1 flex gap-2">
                    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                        <TabsList className="bg-transparent h-auto p-0 flex gap-6 w-full sm:w-auto">
                            {["tasks", "timer", "exams"].map(t => (
                                <TabsTrigger key={t} value={t} className="bg-transparent p-0 pb-2 text-sm transition-all data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_#fff] rounded-none text-neutral-600 font-medium uppercase flex-1 sm:flex-none">
                                    {t}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </div>
        </header>
    );
}
