"use client";

import { Tag } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

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

interface DailyTimetableProps {
    hourData: HourData[];
    tags: Tag[];
    onFillGap: (startTime: number, duration: number) => void;
    onFillAll: () => void;
}

export function DailyTimetable({ hourData, tags, onFillGap, onFillAll }: DailyTimetableProps) {
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
                </div>
            </div>

            <div className="grid gap-1">
                {hourData.map(({ hour, total: totalInHour, segments: hourSegments }) => {
                    return (
                        <div key={hour} className="group flex items-center gap-2 sm:gap-3 py-0.5">
                            <div className="w-6 sm:w-8 text-[9px] sm:text-[10px] font-mono text-neutral-600 tabular-nums text-right">
                                {hour.toString().padStart(2, '0')}
                            </div>
                            <div className="relative flex-1 h-8 bg-black/20 border border-border rounded-lg overflow-hidden flex group-hover:border-neutral-700 transition-colors">
                                {hourSegments.map((seg, i) => {
                                    if (seg.type === 'session') {
                                        const tag = tags.find(t => t.id === seg.tagId);
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
                                                    backgroundColor: `${tag?.color || '#333'}${seg.isSprint ? '99' : '33'}`,
                                                    color: tag?.color || '#333'
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
                                                    style={{ backgroundColor: seg.isSprint ? undefined : (tag?.color || '#333') }}
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
