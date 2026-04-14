"use client";

import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";

interface StatsDonutProps {
    liveTagTimes: any[];
    hoveredTag: any;
    setHoveredTag: (tag: any) => void;
    formatDuration: (ms: number) => string;
}

export function StatsDonut({
    liveTagTimes,
    hoveredTag,
    setHoveredTag,
    formatDuration
}: StatsDonutProps) {
    const dayMs = 24 * 60 * 60 * 1000;
    const totalMs = liveTagTimes.reduce((acc, t) => acc + t.ms, 0);
    const displayTag = hoveredTag || { name: "Total Activity", ms: totalMs, color: "#fff" };

    return (
        <div className="mt-12 flex flex-col items-center justify-center py-12 border border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="relative w-56 h-56">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-white/5"
                    />
                    {(() => {
                        let cumulativePercent = 0;
                        const validTags = liveTagTimes.filter(t => t.ms > 10000);
                        return validTags.map((t) => {
                            const percent = (t.ms / dayMs) * 100;
                            const circumference = 2 * Math.PI * 42;
                            const gap = 0.5;
                            const segmentLength = (percent - gap) * (circumference / 100);
                            const offset = -(cumulativePercent * (circumference / 100));
                            
                            cumulativePercent += percent;
                            const isHovered = hoveredTag?.id === t.id;

                            return (
                                <motion.circle
                                    key={t.id}
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="transparent"
                                    stroke={t.color}
                                    strokeWidth={isHovered ? 10 : 6}
                                    strokeDasharray={`${Math.max(0, segmentLength)} ${circumference}`}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    onMouseEnter={() => setHoveredTag(t)}
                                    onMouseLeave={() => setHoveredTag(null)}
                                    animate={{ strokeWidth: isHovered ? 10 : 6 }}
                                    className="transition-all cursor-pointer"
                                />
                            );
                        });
                    })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <motion.span 
                        key={displayTag.name}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1"
                    >
                        {hoveredTag ? "Highlight" : "Total Activity"}
                    </motion.span>
                    <motion.span 
                        key={displayTag.ms}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-mono tabular-nums tracking-tighter text-white"
                    >
                        {formatDuration(displayTag.ms)}
                    </motion.span>
                    <motion.div 
                        key={displayTag.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 mt-2"
                    >
                        {hoveredTag && (
                            hoveredTag.icon && (Icons as any)[hoveredTag.icon] ? (
                                (() => {
                                    const Icon = (Icons as any)[hoveredTag.icon];
                                    return <Icon className="w-3 h-3" style={{ color: displayTag.color }} />;
                                })()
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: displayTag.color }} />
                            )
                        )}
                        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-tight">{displayTag.name}</span>
                    </motion.div>
                </div>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 px-10">
                {liveTagTimes.filter(t => t.ms > 0).map(t => (
                    <div 
                        key={t.id} 
                        onMouseEnter={() => setHoveredTag(t)}
                        onMouseLeave={() => setHoveredTag(null)}
                        className={cn(
                            "flex items-center gap-2.5 cursor-default transition-all duration-300", 
                            hoveredTag && hoveredTag.id !== t.id ? "opacity-30 blur-[1px]" : "opacity-100"
                        )}
                    >
                        {t.icon && (Icons as any)[t.icon] ? (
                            (() => {
                                const Icon = (Icons as any)[t.icon];
                                return <Icon className="w-2.5 h-2.5" style={{ color: t.color }} />;
                            })()
                        ) : (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        )}
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t.name}</span>
                        <span className="text-[10px] font-mono text-neutral-600">
                            {Math.round((t.ms / dayMs) * 1000) / 10}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
