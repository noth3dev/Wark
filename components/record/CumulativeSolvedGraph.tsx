"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "@/lib/types";
import { List, TrendingUp, CheckCircle2 } from "lucide-react";

interface SolvedProblemsGraphProps {
    logs: { created_at: string; tag_id: string | null }[];
    tags: Tag[];
}

type ViewMode = 'distribution' | 'progression';

interface HourlyStats {
    hour: number;
    total: number;
    cumulative: number;
    tagCounts: Record<string, number>;
    topTagColor: string;
}

interface GraphPoint extends HourlyStats {
    x: number;
    y: number;
}


export function SolvedProblemsGraph({ logs, tags }: SolvedProblemsGraphProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('progression');
    const [hoveredPoint, setHoveredPoint] = useState<GraphPoint | null>(null);


    const tagMap = useMemo(() => {
        const map: Record<string, { name: string, color: string }> = {};
        tags.forEach(t => map[t.id] = { name: t.name, color: t.color || "#22d3ee" });
        return map;
    }, [tags]);

    const stats = useMemo(() => {
        const hourly = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            total: 0,
            cumulative: 0,
            tagCounts: {} as Record<string, number>,
            topTagColor: "#333333"
        })) as HourlyStats[];


        const tagTotals: Record<string, number> = {};

        logs.forEach(log => {
            const date = new Date(log.created_at);
            const hour = date.getHours();
            const tagId = log.tag_id || 'no_tag';

            hourly[hour].total++;
            hourly[hour].tagCounts[tagId] = (hourly[hour].tagCounts[tagId] || 0) + 1;
            tagTotals[tagId] = (tagTotals[tagId] || 0) + 1;
        });

        let rollingSum = 0;
        hourly.forEach((h, i) => {
            rollingSum += h.total;
            h.cumulative = rollingSum;

            const topTagEntry = Object.entries(h.tagCounts).sort((a, b) => b[1] - a[1])[0];
            if (topTagEntry) {
                h.topTagColor = tagMap[topTagEntry[0]]?.color || "#22d3ee";
            } else if (i > 0) {
                h.topTagColor = hourly[i - 1].topTagColor;
            }
        });

        return { hourly, tagTotals };
    }, [logs, tagMap]);

    const maxCumulative = Math.max(...stats.hourly.map(h => h.cumulative), 1);

    const width = 800;
    const height = 380; // Increased height
    const paddingX = 60;
    const paddingTop = 100; // More room for tooltips
    const paddingBottom = 50;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingTop - paddingBottom;

    const points = stats.hourly.map((h, i) => {
        const x = paddingX + (i / 23) * graphWidth;
        const y = height - paddingBottom - (h.cumulative / maxCumulative) * graphHeight;
        return { x, y, ...h };
    });

    const pathData = points.reduce((acc, p, i) => {
        return i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`;
    }, "");

    return (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8 overflow-hidden text-white/90">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white font-suit uppercase tracking-widest">푼 문제수</h3>
                    <p className="text-[10px] text-neutral-500 font-medium italic">하루기준 문제수 기록</p>
                </div>

                <div className="flex bg-neutral-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setViewMode('progression')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'progression' ? 'bg-white/10 text-white shadow-xl' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Progression
                    </button>
                    <button
                        onClick={() => setViewMode('distribution')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'distribution' ? 'bg-white/10 text-white shadow-xl' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        <List className="w-3.5 h-3.5" />
                        Breakdown
                    </button>
                </div>

                <div className="text-right">
                    <span className="text-3xl font-mono font-black text-white px-2 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        {stats.hourly[23].cumulative}
                    </span>
                    <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Total Resolved</p>
                </div>
            </div>

            <div className="relative min-h-[300px] w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {viewMode === 'progression' ? (
                        <motion.div
                            key="prog"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="w-full h-full relative"
                        >
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                        {stats.hourly.map((h, i) => (
                                            <stop key={i} offset={`${(i / 23) * 100}%`} stopColor={h.topTagColor} />
                                        ))}
                                    </linearGradient>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="1" y2="0">
                                        {stats.hourly.map((h, i) => (
                                            <stop key={i} offset={`${(i / 23) * 100}%`} stopColor={h.topTagColor} stopOpacity="0.2" />
                                        ))}
                                    </linearGradient>
                                    <linearGradient id="verticalFade" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="white" stopOpacity="1" />
                                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                                    </linearGradient>
                                    <mask id="areaMask">
                                        <rect x="0" y="0" width={width} height={height} fill="url(#verticalFade)" />
                                    </mask>
                                </defs>

                                {/* Grid Lines */}
                                {[0, 0.5, 1].map((p, i) => (
                                    <line
                                        key={i}
                                        x1={paddingX}
                                        y1={height - paddingBottom - p * graphHeight}
                                        x2={width - paddingX}
                                        y2={height - paddingBottom - p * graphHeight}
                                        className="stroke-white/5 stroke-[1]"
                                        strokeDasharray="4 4"
                                    />
                                ))}

                                {/* The Horizontal Gradient Area */}
                                <g mask="url(#areaMask)">
                                    <path
                                        d={`${pathData} L${points[23].x},${height - paddingBottom} L${points[0].x},${height - paddingBottom} Z`}
                                        fill="url(#areaGrad)"
                                    />
                                </g>

                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    d={pathData}
                                    fill="none"
                                    stroke="url(#lineGrad)"
                                    className="stroke-[5]"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {points.map((p, i) => (
                                    <g key={i}>
                                        <rect
                                            x={p.x - 15}
                                            y={0}
                                            width={30}
                                            height={height}
                                            fill="transparent"
                                            onMouseEnter={() => setHoveredPoint(p)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                            className="cursor-pointer"
                                        />
                                        {p.total > 0 && (
                                            <motion.circle
                                                animate={{
                                                    r: hoveredPoint?.hour === p.hour ? 8 : 6,
                                                    strokeWidth: hoveredPoint?.hour === p.hour ? 4 : 3
                                                }}
                                                cx={p.x}
                                                cy={p.y}
                                                fill={p.topTagColor}
                                                className="stroke-[#0a0a0a]"
                                            />
                                        )}
                                    </g>
                                ))}

                                {stats.hourly.filter(h => h.hour % 4 === 0).map((h, i) => (
                                    <text
                                        key={i}
                                        x={paddingX + (h.hour / 23) * graphWidth}
                                        y={height - paddingBottom + 30}
                                        className="fill-neutral-600 text-[10px] font-mono font-bold"
                                        textAnchor="middle"
                                    >
                                        {h.hour.toString().padStart(2, '0')}:00
                                    </text>
                                ))}
                            </svg>

                            {/* Enhanced Tooltip */}
                            <AnimatePresence>
                                {hoveredPoint && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            left: `${(hoveredPoint.x / width) * 100}%`,
                                            top: `${(hoveredPoint.y / height) * 100}%`
                                        }}
                                        className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-[110%]"
                                    >
                                        <div className="bg-neutral-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[180px] space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{hoveredPoint.hour}:00 Timeline</span>
                                                <div className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold text-neutral-400">
                                                    ACC. {hoveredPoint.cumulative}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {Object.entries(hoveredPoint.tagCounts).length > 0 ? (
                                                    Object.entries(hoveredPoint.tagCounts).map(([tagId, count]) => {
                                                        const tag = tagMap[tagId] || { name: 'Uncategorized', color: '#525252' };
                                                        return (
                                                            <div key={tagId} className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight truncate max-w-[80px]">
                                                                        {tag.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-mono font-black text-white">+{count}</span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest text-center py-1">Steady Progress</p>
                                                )}
                                            </div>

                                            {hoveredPoint.total > 0 && (
                                                <div className="pt-2 border-t border-white/5 text-right font-suit">
                                                    <span className="text-[9px] font-bold text-neutral-500">Hourly Yield: </span>
                                                    <span className="text-[10px] font-black text-cyan-400">+{hoveredPoint.total} Problems</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-3 h-3 bg-neutral-900 border-r border-b border-white/10 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="breakdown"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {Object.entries(stats.tagTotals).map(([tagId, count]) => {
                                const tag = tagMap[tagId] || { name: 'Uncategorized', color: '#525252' };
                                return (
                                    <div key={tagId} className="group relative flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.06] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: tag.color }} />
                                            <div>
                                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{tag.name}</h4>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-mono font-black text-white">{count}</span>
                                                    <span className="text-[8px] font-bold text-neutral-600">PROBLEMS</span>
                                                </div>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-white/5 group-hover:text-white/20 transition-colors" />
                                    </div>
                                );
                            })}
                            {Object.keys(stats.tagTotals).length === 0 && (
                                <div className="col-span-full py-12 text-center">
                                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">No achievements recorded for this cycle</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
