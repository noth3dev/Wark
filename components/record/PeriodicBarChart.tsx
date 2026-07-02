"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TAG_VARIANTS } from "@/lib/tag-variants";
import { getSafeColor, formatDuration } from "@/lib/utils";
import * as Icons from "lucide-react";

interface PeriodicBarChartProps {
    sessions: any[];
    tags: any[];
    groupMode: "tags" | "groups";
    view: "week" | "month";
    currentDate: Date;
    groupNames: Record<string, string>;
}

export function PeriodicBarChart({
    sessions,
    tags,
    groupMode,
    view,
    currentDate,
    groupNames,
}: PeriodicBarChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // 1. Generate dates in range
    const rangeDates = useMemo(() => {
        const dates: Date[] = [];
        let start = new Date(currentDate);
        if (view === "week") {
            const day = start.getDay() || 7;
            start.setDate(start.getDate() - (day - 1));
            start.setHours(0, 0, 0, 0);
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                dates.push(d);
            }
        } else {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
            for (let i = 0; i < daysInMonth; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                dates.push(d);
            }
        }
        return dates;
    }, [currentDate, view]);

    // Helper to format date label
    const formatDateLabel = (d: Date) => {
        if (view === "week") {
            const days = ["월", "화", "수", "목", "금", "토", "일"];
            const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
            return `${days[idx]} (${d.getMonth() + 1}/${d.getDate()})`;
        } else {
            return `${d.getDate()}`;
        }
    };

    // 2. Aggregate data by date
    const dailyData = useMemo(() => {
        // Initialize
        const data: Record<string, { date: Date; label: string; total: number; breakdown: Record<string, number> }> = {};
        
        rangeDates.forEach((d) => {
            // YYYY-MM-DD in local time
            const dateStr = d.toLocaleDateString("sv").split(" ")[0];
            data[dateStr] = {
                date: d,
                label: formatDateLabel(d),
                total: 0,
                breakdown: {},
            };
        });

        sessions.forEach((s) => {
            const localDate = new Date(s.created_at);
            const dateStr = localDate.toLocaleDateString("sv").split(" ")[0];

            if (data[dateStr]) {
                data[dateStr].total += s.duration;
                if (groupMode === "tags") {
                    data[dateStr].breakdown[s.tag_id] = (data[dateStr].breakdown[s.tag_id] || 0) + s.duration;
                } else {
                    const tag = tags.find((t) => t.id === s.tag_id);
                    const key = tag?.icon || "Cpu";
                    data[dateStr].breakdown[key] = (data[dateStr].breakdown[key] || 0) + s.duration;
                }
            }
        });

        return rangeDates.map((d) => {
            const dateStr = d.toLocaleDateString("sv").split(" ")[0];
            return data[dateStr];
        });
    }, [sessions, rangeDates, groupMode, tags]);

    // 3. Find max daily total to scale Y-axis (min scale 1 hour)
    const maxTotal = useMemo(() => {
        const maxVal = Math.max(...dailyData.map((d) => d.total));
        return maxVal > 0 ? maxVal : 3600000; // 1 hour min scale
    }, [dailyData]);

    // Map tags/groups to colors
    const colorMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (groupMode === "tags") {
            tags.forEach((t) => {
                map[t.id] = getSafeColor(t.color, TAG_VARIANTS.find((v) => v.icon === t.icon)?.color || "#22d3ee");
            });
        } else {
            // Group by icon
            tags.forEach((t) => {
                const key = t.icon || "Cpu";
                if (!map[key]) {
                    map[key] = getSafeColor(t.color, TAG_VARIANTS.find((v) => v.icon === key)?.color || "#22d3ee");
                }
            });
        }
        return map;
    }, [tags, groupMode]);

    // Name Map
    const nameMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (groupMode === "tags") {
            tags.forEach((t) => {
                map[t.id] = t.name;
            });
        } else {
            tags.forEach((t) => {
                const key = t.icon || "Cpu";
                map[key] = groupNames[key] || TAG_VARIANTS.find((v) => v.icon === key)?.label || key;
            });
        }
        return map;
    }, [tags, groupMode, groupNames]);

    // Chart Dimensions
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingTop = 20;
    const paddingBottom = 40;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingTop - paddingBottom;

    return (
        <div className="relative bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    일별 학습 흐름
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                    최대: {formatDuration(maxTotal)}
                </span>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full h-[240px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = height - paddingBottom - ratio * chartHeight;
                        const hours = ((ratio * maxTotal) / 3600000).toFixed(1);
                        return (
                            <g key={i} className="opacity-40">
                                <line
                                    x1={paddingX}
                                    y1={y}
                                    x2={width - paddingX}
                                    y2={y}
                                    className="stroke-neutral-800 stroke-[1]"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={paddingX - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="fill-neutral-600 text-[9px] font-mono"
                                >
                                    {hours}h
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {dailyData.map((d, index) => {
                        const numBars = dailyData.length;
                        const barWidth = Math.max(8, (chartWidth / numBars) * 0.6);
                        const space = chartWidth / numBars;
                        const x = paddingX + index * space + (space - barWidth) / 2;

                        let accumulatedHeight = 0;
                        const breakdownArray = Object.entries(d.breakdown).filter(([, val]) => val > 0);

                        return (
                            <g
                                key={index}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Invisible interactive zone */}
                                <rect
                                    x={paddingX + index * space}
                                    y={paddingTop}
                                    width={space}
                                    height={chartHeight}
                                    fill="transparent"
                                />

                                {/* Stacked Bar Segments */}
                                {d.total > 0 ? (
                                    breakdownArray.map(([id, val], segmentIdx) => {
                                        const segmentHeight = (val / maxTotal) * chartHeight;
                                        const y = height - paddingBottom - accumulatedHeight - segmentHeight;
                                        accumulatedHeight += segmentHeight;
                                        const color = colorMap[id] || "#6366f1";

                                        return (
                                            <motion.rect
                                                key={id}
                                                x={x}
                                                y={y}
                                                width={barWidth}
                                                height={segmentHeight}
                                                fill={color}
                                                rx={segmentIdx === breakdownArray.length - 1 ? 4 : 0}
                                                className="transition-all duration-300"
                                                opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
                                            />
                                        );
                                    })
                                ) : (
                                    // Empty day bar outline/placeholder on hover
                                    hoveredIndex === index && (
                                        <rect
                                            x={x}
                                            y={paddingTop}
                                            width={barWidth}
                                            height={chartHeight}
                                            className="fill-neutral-800/10 stroke-neutral-800/35 stroke-[1]"
                                            rx={4}
                                            strokeDasharray="2 2"
                                        />
                                    )
                                )}

                                {/* X-Axis Date Labels */}
                                {(view === "week" || index % Math.max(1, Math.floor(numBars / 6)) === 0 || index === numBars - 1) && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={height - paddingBottom + 18}
                                        textAnchor="middle"
                                        className={`fill-neutral-500 text-[9px] font-mono transition-colors ${
                                            hoveredIndex === index ? "fill-neutral-200 font-bold" : ""
                                        }`}
                                    >
                                        {view === "week" ? d.label.split(" ")[0] : d.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Tooltip Overlay */}
            <AnimatePresence>
                {hoveredIndex !== null && dailyData[hoveredIndex] && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl shadow-2xl space-y-2 text-xs w-full max-w-[280px] mx-auto sm:absolute sm:right-6 sm:top-6 sm:w-[220px]"
                    >
                        <div className="flex justify-between border-b border-neutral-800/80 pb-1.5">
                            <span className="font-bold text-neutral-200">
                                {dailyData[hoveredIndex].label}
                                {view === "month" && "일"}
                            </span>
                            <span className="font-mono font-bold text-indigo-400">
                                {formatDuration(dailyData[hoveredIndex].total)}
                            </span>
                        </div>
                        <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                            {Object.entries(dailyData[hoveredIndex].breakdown).length > 0 ? (
                                Object.entries(dailyData[hoveredIndex].breakdown)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([id, val]) => (
                                        <div key={id} className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: colorMap[id] || "#6366f1" }}
                                                />
                                                <span className="text-neutral-400 truncate">
                                                    {nameMap[id] || "알 수 없음"}
                                                </span>
                                            </div>
                                            <span className="font-mono text-neutral-300">
                                                {formatDuration(val)}
                                            </span>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-[10px] text-neutral-600 italic py-1">학습 기록 없음</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
