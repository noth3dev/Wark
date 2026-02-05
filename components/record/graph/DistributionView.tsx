"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface DistributionViewProps {
    tagTotals: Record<string, number>;
    tagMap: Record<string, { name: string, color: string }>;
    dailyTimes?: Record<string, number>;
}

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

export function DistributionView({ tagTotals, tagMap, dailyTimes }: DistributionViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {Object.entries(tagTotals).map(([tagId, count]) => {
                const tag = tagMap[tagId] || { name: 'Uncategorized', color: '#525252' };
                const totalDuration = dailyTimes?.[tagId] || 0;
                const avgSeconds = count > 0 ? totalDuration / count : 0;

                return (
                    <div key={tagId} className="group relative flex flex-col p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 shadow-xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: tag.color }} />
                                <div>
                                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">{tag.name}</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-mono font-black text-white">{count}</span>
                                        <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">Resolutions</span>
                                    </div>
                                </div>
                            </div>

                            {avgSeconds > 0 && (
                                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-neutral-600" />
                                    <div>
                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest leading-none mb-1">Avg Tempo</p>
                                        <p className="text-xs font-mono font-black text-cyan-400">{formatDuration(avgSeconds)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </div>
                );
            })}
            {Object.keys(tagTotals).length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.5em]">No synchronization recorded for current cycle</p>
                </div>
            )}
        </motion.div>
    );
}
