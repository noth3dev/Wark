"use client";

import { Tag } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface HourSegment {
    type: 'session' | 'gap';
    start: number;
    duration: number;
    tagId?: string;
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
}

export function DailyTimetable({ hourData, tags, onFillGap }: DailyTimetableProps) {
    return (
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Chronicle Map</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">Idle</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
                        <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-1">
                {hourData.map(({ hour, total: totalInHour, segments: hourSegments }) => {
                    return (
                        <div key={hour} className="group flex items-center gap-4 py-1">
                            <div className="w-10 text-[10px] font-mono font-black text-neutral-800 tabular-nums text-right group-hover:text-neutral-500 transition-colors">
                                {hour.toString().padStart(2, '0')}
                            </div>
                            <div className="relative flex-1 h-10 bg-neutral-950 border border-white/[0.03] rounded-2xl overflow-hidden group-hover:border-white/10 transition-all flex shadow-inner">
                                {/* Segmented Fill */}
                                {hourSegments.map((seg, i) => {
                                    if (seg.type === 'session') {
                                        const tag = tags.find(t => t.id === seg.tagId);
                                        return (
                                            <div
                                                key={i}
                                                className="h-full relative overflow-hidden transition-all group/seg"
                                                style={{
                                                    width: `${(seg.duration / 3600000) * 100}%`,
                                                    backgroundColor: `${tag?.color || '#22d3ee'}1a`, // Lower opacity
                                                }}
                                                title={`${tag?.name}: ${formatDuration(seg.duration)}`}
                                            >
                                                <div
                                                    className="absolute inset-y-0 left-0 w-1 opacity-60"
                                                    style={{ backgroundColor: tag?.color || '#22d3ee' }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover/seg:opacity-100 transition-opacity" />
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => onFillGap(seg.start, seg.duration)}
                                                className="h-full hover:bg-white/5 transition-all relative group/gap"
                                                style={{
                                                    width: `${(seg.duration / 3600000) * 100}%`,
                                                }}
                                            >
                                                <div className="absolute inset-0 border-r border-white/[0.02] last:border-r-0" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/gap:opacity-100 transition-opacity">
                                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                                </div>
                                            </button>
                                        );
                                    }
                                })}

                                {/* Details on Hover */}
                                <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                                    {totalInHour > 0 && (
                                        <span className="ml-auto text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all text-neutral-600 font-mono tracking-tighter">
                                            {Math.floor(totalInHour / 60000)}m / 60m
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
