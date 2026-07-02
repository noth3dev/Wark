"use client";

import { useState } from "react";
import { Tag } from "@/lib/types";
import { formatDuration, getSafeColor } from "@/lib/utils";
import { TAG_VARIANTS } from "@/lib/tag-variants";

interface HourSegment {
    type: 'session' | 'gap';
    start: number;
    duration: number;
    tagId?: string;
    isSprint?: boolean;
}

interface HourData {
    hour: number;
    total: number;
    segments: HourSegment[];
}

interface CompletedTaskDot {
    time: number;
    label: string;
    tagId?: string | null;
}

interface DailyTimetableProps {
    hourData: HourData[];
    tags: Tag[];
    onFillGap: (startTime: number, duration: number) => void;
    onFillAll: () => void;
    completedTaskDots?: CompletedTaskDot[];
}

export function DailyTimetable({ hourData, tags, onFillGap, onFillAll, completedTaskDots = [] }: DailyTimetableProps) {
    const [hoveredDot, setHoveredDot] = useState<CompletedTaskDot | null>(null);
    const [hoveredDotPos, setHoveredDotPos] = useState({ x: 0, y: 0 });

    return (
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-[10px] font-semibold uppercase text-neutral-500">Timeline</h2>
                    <button
                        onClick={onFillAll}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-neutral-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                    >
                        Auto-Fill Gaps
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                        <span className="text-[9px] font-medium text-neutral-600 uppercase">Idle</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                        <span className="text-[9px] font-medium text-neutral-600 uppercase">Active</span>
                    </div>
                    {completedTaskDots.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[9px] font-medium text-neutral-600 uppercase">Done</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-1">
                {hourData.map(({ hour, total: totalInHour, segments: hourSegments }) => {
                    // Filter dots that fall within this hour
                    const dotsInHour = completedTaskDots.filter(dot => {
                        const dotDate = new Date(dot.time);
                        return dotDate.getHours() === hour;
                    });

                    return (
                        <div key={hour} className="group flex items-center gap-2 sm:gap-3 py-0.5">
                            <div className="w-6 sm:w-8 text-[9px] sm:text-[10px] font-mono text-neutral-600 tabular-nums text-right">
                                {hour.toString().padStart(2, '0')}
                            </div>
                            <div className="relative flex-1 h-8 bg-black/20 border border-border rounded-lg overflow-visible flex group-hover:border-neutral-700 transition-colors">
                                <div className="absolute inset-0 rounded-lg overflow-hidden flex">
                                    {hourSegments.map((seg, i) => {
                                        if (seg.type === 'session') {
                                            const tag = tags.find(t => t.id === seg.tagId);
                                            const safeColor = tag ? getSafeColor(tag.color, TAG_VARIANTS.find(v => v.icon === tag.icon)?.color || '#22d3ee') : '#333';
                                            return (
                                                <div
                                                    key={i}
                                                    className={`h-full relative transition-all ${
                                                        seg.isSprint 
                                                            ? "z-10 shadow-[0_0_25px_-5px_currentcolor] ring-1 ring-inset ring-white/20" 
                                                            : ""
                                                    }`}
                                                    style={{
                                                        width: `${(seg.duration / 3600000) * 100}%`,
                                                        backgroundColor: `${safeColor}${seg.isSprint ? '99' : '33'}`,
                                                        color: safeColor
                                                    }}
                                                    title={`${tag?.name}${seg.isSprint ? ' (Sprint)' : ''}: ${formatDuration(seg.duration)}`}
                                                >
                                                    {seg.isSprint && (
                                                        <>
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                                            <div className="absolute inset-0 animate-pulse bg-current opacity-20" />
                                                        </>
                                                    )}
                                                    <div
                                                        className={`absolute inset-y-0 left-0 w-1 ${seg.isSprint ? "shadow-[0_0_15px_2px_currentcolor] bg-white" : ""}`}
                                                        style={{ backgroundColor: seg.isSprint ? undefined : safeColor }}
                                                    />
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => onFillGap(seg.start, seg.duration)}
                                                    className="h-full hover:bg-white/5 transition-all relative"
                                                    style={{
                                                        width: `${(seg.duration / 3600000) * 100}%`,
                                                    }}
                                                >
                                                    <div className="absolute inset-0 border-r border-border/20 last:border-r-0" />
                                                </button>
                                            );
                                        }
                                    })}
                                </div>

                                {/* Completed task dots overlay */}
                                {dotsInHour.map((dot, i) => {
                                    const dotDate = new Date(dot.time);
                                    const minuteFraction = (dotDate.getMinutes() * 60 + dotDate.getSeconds()) / 3600;
                                    const tag = tags.find(t => t.id === dot.tagId);
                                    const dotColor = tag ? getSafeColor(tag.color, TAG_VARIANTS.find(v => v.icon === tag.icon)?.color || '#34d399') : '#34d399';
                                    
                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-1/2 -translate-y-1/2 z-20"
                                            style={{ left: `${minuteFraction * 100}%` }}
                                            onMouseEnter={(e) => {
                                                setHoveredDot(dot);
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredDotPos({ x: rect.left, y: rect.top });
                                            }}
                                            onMouseLeave={() => setHoveredDot(null)}
                                        >
                                            {/* Outer glow ring */}
                                            <div
                                                className="w-2.5 h-2.5 rounded-full -translate-x-1/2 cursor-pointer transition-transform hover:scale-150"
                                                style={{
                                                    backgroundColor: dotColor,
                                                    boxShadow: `0 0 6px 2px ${dotColor}66`
                                                }}
                                            />
                                            {/* Tooltip */}
                                            {hoveredDot === dot && (
                                                <div
                                                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-2xl pointer-events-none z-50 whitespace-nowrap"
                                                >
                                                    <div className="text-[10px] font-semibold text-white max-w-[200px] truncate">{dot.label}</div>
                                                    <div className="text-[9px] text-neutral-500 font-mono">
                                                        {dotDate.getHours().toString().padStart(2,'0')}:{dotDate.getMinutes().toString().padStart(2,'0')} 완료
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                                    {totalInHour > 0 && (
                                        <span className="ml-auto text-[9px] font-mono text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {Math.floor(totalInHour / 60000)}m
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
