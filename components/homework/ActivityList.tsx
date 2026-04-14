"use client";

import React from "react";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";

interface ActivityListProps {
    liveTagTimes: any[];
    formatDuration: (ms: number) => string;
}

export function ActivityList({ liveTagTimes, formatDuration }: ActivityListProps) {
    const sortedActivities = [...liveTagTimes].filter(t => t.ms > 0 || t.isLive).sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return b.ms - a.ms;
    });

    return (
        <div className="mt-8 space-y-3">
            {sortedActivities.map((t) => (
                <div 
                    key={t.id} 
                    className={cn(
                        "flex items-center justify-between px-8 py-8 transition-all duration-300 rounded-2xl border",
                        t.isLive 
                          ? "bg-blue-500/5 border-blue-500/20" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    )}
                >
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {t.icon && (Icons as any)[t.icon] ? (
                                (() => {
                                    const Icon = (Icons as any)[t.icon];
                                    return <Icon className="w-4 h-4" style={{ color: t.color }} />;
                                })()
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                            )}
                            {t.isLive && (
                                <div className="absolute -inset-2 rounded-full border border-blue-500/20 animate-pulse" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", t.isLive ? "text-blue-400" : "text-neutral-600")}>
                                    {t.isLive ? "Recording" : "Total Time"}
                                </span>
                                {t.isLive && (
                                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                )}
                            </div>
                            <span className={cn("text-lg font-medium tracking-tight transition-colors block", t.isLive ? "text-white" : "text-neutral-400")}>
                                {t.name}
                            </span>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <span className={cn(
                            "text-3xl font-mono tabular-nums tracking-tighter transition-all block", 
                            t.isLive ? "text-blue-400" : "text-neutral-500"
                        )}>
                            {formatDuration(t.ms)}
                        </span>
                    </div>
                </div>
            ))}
            {sortedActivities.length === 0 && (
                <div className="py-40 text-center space-y-4 opacity-20 border border-dashed border-white/10 rounded-3xl">
                    <Icons.Share2 className="w-6 h-6 text-neutral-400 mx-auto" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Zero activities tracked.</p>
                </div>
            )}
        </div>
    );
}
