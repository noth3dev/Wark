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
        <div className="lg:col-span-4 space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 border-b border-white/5 pb-4">Tag Distribution</h2>
            <div className="space-y-4">
                {tags.map(tag => {
                    const total = getTagTotal(tag.id);
                    if (total === 0) return null;
                    const percentage = totalToday > 0 ? ((total / totalToday) * 100).toFixed(1) : "0";

                    return (
                        <motion.div
                            key={tag.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                    <span className="text-sm font-bold tracking-tight">{tag.name}</span>
                                </div>
                                <span className="text-[10px] font-bold font-mono text-neutral-500">{percentage}%</span>
                            </div>
                            <div className="space-y-1">
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className="h-full"
                                        style={{ backgroundColor: tag.color || '#22d3ee' }}
                                    />
                                </div>
                                <p className="text-[10px] text-right font-mono text-neutral-600 pt-1">{formatDuration(total)}</p>
                            </div>
                        </motion.div>
                    );
                })}
                {sessionsCount === 0 && (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                        <p className="text-xs text-neutral-600">No data recorded today.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
