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
        <div className="lg:col-span-8 space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 border-b border-white/5 pb-4">24H Protocol Execution</h2>
            {hourData.map(({ hour, total: totalInHour, segments: hourSegments }) => {
                return (
                    <div key={hour} className="group flex items-center gap-6 py-2">
                        <div className="w-12 text-[10px] font-mono font-bold text-neutral-700 tabular-nums">
                            {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="relative flex-1 h-12 bg-white/5 rounded-xl overflow-hidden border border-white/[0.02] group-hover:border-white/10 transition-colors flex">
                            {/* Segmented Fill */}
                            {hourSegments.map((seg, i) => {
                                if (seg.type === 'session') {
                                    const tag = tags.find(t => t.id === seg.tagId);
                                    return (
                                        <div
                                            key={i}
                                            className="h-full border-r border-white/5 last:border-r-0"
                                            style={{
                                                width: `${(seg.duration / 3600000) * 100}%`,
                                                backgroundColor: `${tag?.color || '#22d3ee'}33`, // 20% opacity hex
                                                borderColor: `${tag?.color || '#22d3ee'}44`
                                            }}
                                            title={`${tag?.name}: ${formatDuration(seg.duration)}`}
                                        />
                                    );
                                } else {
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => onFillGap(seg.start, seg.duration)}
                                            className="h-full hover:bg-white/10 transition-colors border-r border-white/5 last:border-r-0 group/gap relative"
                                            style={{
                                                width: `${(seg.duration / 3600000) * 100}%`,
                                            }}
                                        >
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
                                    <span className="ml-auto text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 font-mono">
                                        {Math.floor(totalInHour / 60000)}분 / 60분
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
