"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Tag } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

import * as Icons from "lucide-react";

interface TagDistributionProps {
    tags: Tag[];
    getTagTotal: (tagId: string) => number;
    groupedTotals: Record<string, number>;
    totalToday: number;
    sessionsCount: number;
}

export function TagDistribution({ tags, getTagTotal, groupedTotals, totalToday, sessionsCount }: TagDistributionProps) {
    const [viewType, setViewType] = useState<'individual' | 'grouped'>('individual');

    const groupedData = useMemo(() => {
        const uniqueGroups: Record<string, { icon?: string, color?: string, total: number }> = {};
        tags.forEach(tag => {
            const key = `${tag.icon || ''}|${tag.color || ''}`;
            if (!uniqueGroups[key]) {
                uniqueGroups[key] = { icon: tag.icon, color: tag.color, total: groupedTotals[key] || 0 };
            }
        });
        return Object.values(uniqueGroups).filter(g => g.total > 0).sort((a, b) => b.total - a.total);
    }, [tags, groupedTotals]);

    return (
        <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setViewType('individual')}
                        className={`text-[10px] font-semibold uppercase transition-colors ${viewType === 'individual' ? 'text-white' : 'text-neutral-500 hover:text-neutral-400'}`}
                    >
                        Tags
                    </button>
                    <button
                        onClick={() => setViewType('grouped')}
                        className={`text-[10px] font-semibold uppercase transition-colors ${viewType === 'grouped' ? 'text-white' : 'text-neutral-500 hover:text-neutral-400'}`}
                    >
                        Groups
                    </button>
                </div>
                <div className="px-2 py-0.5 rounded bg-secondary/50 border border-border text-[9px] font-medium text-neutral-500 uppercase">
                    {viewType === 'individual' ? `${tags.length} Active` : `${groupedData.length} Types`}
                </div>
            </div>

            <div className="grid gap-3">
                {viewType === 'individual' ? (
                    tags.map((tag, idx) => {
                        const total = getTagTotal(tag.id);
                        if (total === 0) return null;
                        const percentage = totalToday > 0 ? ((total / totalToday) * 100).toFixed(1) : "0";

                        return (
                            <motion.div
                                key={tag.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group p-4 rounded-3xl bg-card border border-border hover:border-neutral-700 transition-all cursor-default"
                            >
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        {tag.icon && (Icons as any)[tag.icon] ? (
                                            (() => {
                                                const Icon = (Icons as any)[tag.icon];
                                                return <Icon className="w-3 h-3" style={{ color: tag.color || '#22d3ee' }} />;
                                            })()
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color || '#22d3ee' }} />
                                        )}
                                        <span className="text-[11px] font-medium text-neutral-400 group-hover:text-white transition-colors">{tag.name}</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-neutral-600 tabular-nums">{percentage}%</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="h-0.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className="h-full"
                                            style={{ backgroundColor: tag.color || '#22d3ee' }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] text-neutral-700 uppercase font-black tracking-widest">Recorded</span>
                                        <p className="text-[10px] font-mono text-neutral-500">{formatDuration(total)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    groupedData.map((group, idx) => {
                        const key = `${group.icon}|${group.color}`;
                        const percentage = totalToday > 0 ? ((group.total / totalToday) * 100).toFixed(1) : "0";
                        const IconComponent = group.icon && (Icons as any)[group.icon] ? (Icons as any)[group.icon] : null;

                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group p-4 rounded-3xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-all cursor-default"
                            >
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2 rounded-xl border flex items-center justify-center bg-black/40"
                                            style={{ borderColor: `${group.color || '#22d3ee'}22`, color: group.color || '#22d3ee' }}
                                        >
                                            {IconComponent ? <IconComponent className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300">Type Summary</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-neutral-600 tabular-nums">{percentage}%</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className="h-full"
                                            style={{ backgroundColor: group.color || '#22d3ee' }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] text-neutral-700 uppercase font-black tracking-widest">Cumulative</span>
                                        <p className="text-[10px] font-mono text-neutral-400">{formatDuration(group.total)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}

                {sessionsCount === 0 && (
                    <div className="py-12 text-center border border-dashed border-white/5 rounded-3xl bg-neutral-900/20">
                        <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">No spectral data detected</p>
                    </div>
                )}
            </div>
        </div>
    );
}
