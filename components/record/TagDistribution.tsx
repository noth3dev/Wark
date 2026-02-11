"use client";

import { motion } from "framer-motion";
import { Tag } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface TagDistributionProps {
    tags: Tag[];
    getTagTotal: (tagId: string) => number;
    totalToday: number;
    sessionsCount: number;
}

export function TagDistribution({ tags, getTagTotal, totalToday, sessionsCount }: TagDistributionProps) {
    return (
        <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Cognitive Load</h2>
                <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                    {tags.length} Active Tags
                </div>
            </div>

            <div className="grid gap-4">
                {tags.map((tag, idx) => {
                    const total = getTagTotal(tag.id);
                    if (total === 0) return null;
                    const percentage = totalToday > 0 ? ((total / totalToday) * 100).toFixed(1) : "0";

                    return (
                        <motion.div
                            key={tag.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group p-5 rounded-[2rem] bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-all cursor-default"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                    <span className="text-xs font-bold tracking-tight text-white/80 group-hover:text-white transition-colors">{tag.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black font-mono text-neutral-500 uppercase tracking-tighter">{percentage}%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="h-full relative"
                                        style={{ backgroundColor: tag.color || '#22d3ee' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </motion.div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest">Allocated</span>
                                    <p className="text-[11px] font-mono text-neutral-400 font-bold">{formatDuration(total)}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {sessionsCount === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]"
                    >
                        <p className="text-[10px] text-neutral-700 font-bold uppercase tracking-[0.2em]">Void Detected - No Data</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
