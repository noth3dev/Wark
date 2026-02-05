"use client";

import React from "react";
import { TrendingUp, BarChart3, List } from "lucide-react";

type ViewMode = 'distribution' | 'progression' | 'activity';

interface GraphHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    totalCumulative: number;
}

export function GraphHeader({ viewMode, setViewMode, totalCumulative }: GraphHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 px-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="text-sm font-black text-white font-suit uppercase tracking-[0.2em]">Daily Analytics</h3>
                </div>
                <p className="text-[10px] text-neutral-500 font-bold italic tracking-wider">Hourly performance & progression tracking</p>
            </div>

            <div className="flex bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-2xl shadow-inner">
                {(['progression', 'activity', 'distribution'] as ViewMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${viewMode === mode ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-neutral-600 hover:text-neutral-400'}`}
                    >
                        {mode === 'progression' && <TrendingUp className="w-3.5 h-3.5" />}
                        {mode === 'activity' && <BarChart3 className="w-3.5 h-3.5" />}
                        {mode === 'distribution' && <List className="w-3.5 h-3.5" />}
                        {mode}
                    </button>
                ))}
            </div>

            <div className="text-right">
                <span className="text-4xl font-mono font-black text-white px-2 tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    {totalCumulative}
                </span>
                <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.3em] mt-2">Global Resolve</p>
            </div>
        </div>
    );
}
