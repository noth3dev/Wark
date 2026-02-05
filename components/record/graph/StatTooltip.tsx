"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { GraphPoint } from "../../../hooks/useSolvedProblemsStats";

interface StatTooltipProps {
    point: GraphPoint;
    tagMap: Record<string, { name: string, color: string }>;
    dailyTimes?: Record<string, number>;
    viewMode: string;
    width: number;
    height: number;
    tagTotals: Record<string, number>;
}

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

export function StatTooltip({ point, tagMap, dailyTimes, viewMode, width, height, tagTotals }: StatTooltipProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            style={{
                left: `${(point.x / width) * 100}%`,
                top: `${(point.y / height) * 100}%`
            }}
            className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-[115%]"
        >
            <div className="bg-neutral-950/90 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] min-w-[220px] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{point.hour}:00 Status</span>
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">Timeline Entry</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                        <span className="text-[10px] font-black text-white">
                            {viewMode === 'progression' ? `Σ ${point.cumulative}` : `+ ${point.total}`}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {Object.entries(point.tagCounts).length > 0 ? (
                        Object.entries(point.tagCounts).map(([tagId, count]) => {
                            const tag = tagMap[tagId] || { name: 'Uncategorized', color: '#525252' };
                            const totalDuration = dailyTimes?.[tagId] || 0;
                            const tagTotalCount = tagTotals[tagId] || 0;
                            const avgSeconds = tagTotalCount > 0 ? totalDuration / tagTotalCount : 0;

                            return (
                                <div key={tagId} className="space-y-1.5 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-tight truncate max-w-[100px]">
                                                {tag.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-white">+{count}</span>
                                    </div>
                                    {avgSeconds > 0 && (
                                        <div className="flex items-center gap-1.5 pl-3.5">
                                            <Clock className="w-2.5 h-2.5 text-neutral-600" />
                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter">
                                                Avg: {formatDuration(avgSeconds)} / Obj
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em] text-center py-2 italic font-suit">Maintained Status</p>
                    )}
                </div>

                {point.total > 0 && viewMode === 'progression' && (
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Hourly Yield</span>
                        <span className="text-[10px] font-black text-cyan-400">+{point.total} Units</span>
                    </div>
                )}
            </div>
            <div className="w-4 h-4 bg-neutral-950/90 border-r border-b border-white/10 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-2" />
        </motion.div>
    );
}
