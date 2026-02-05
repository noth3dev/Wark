"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "@/lib/types";
import { List, TrendingUp, BarChart3, Clock } from "lucide-react";

interface SolvedProblemsGraphProps {
    logs: { created_at: string; tag_id: string | null }[];
    tags: Tag[];
    dailyTimes?: Record<string, number>;
}

type ViewMode = 'distribution' | 'progression' | 'activity';

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

// Helper to format duration
const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

export function SolvedProblemsGraph({ logs, tags, dailyTimes }: SolvedProblemsGraphProps) {
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
    const maxHourly = Math.max(...stats.hourly.map(h => h.total), 1);

    const width = 800;
    const height = 400;
    const paddingX = 60;
    const paddingTop = 120;
    const paddingBottom = 60;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingTop - paddingBottom;

    const points = useMemo(() => stats.hourly.map((h, i) => {
        const x = paddingX + (i / 23) * graphWidth;
        const val = viewMode === 'progression' ? h.cumulative : h.total;
        const max = viewMode === 'progression' ? maxCumulative : maxHourly;
        const y = height - paddingBottom - (val / max) * graphHeight;
        return { x, y, ...h };
    }), [stats.hourly, viewMode, maxCumulative, maxHourly, graphWidth, graphHeight]);

    const pathData = useMemo(() => points.reduce((acc, p, i) => {
        return i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`;
    }, ""), [points]);

    const renderGrid = () => (
        <g>
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
        </g>
    );

    const renderXAxis = () => (
        <g>
            {stats.hourly.filter(h => h.hour % 4 === 0).map((h, i) => (
                <text
                    key={i}
                    x={paddingX + (h.hour / 23) * graphWidth}
                    y={height - paddingBottom + 35}
                    className="fill-neutral-600 text-[10px] font-mono font-bold"
                    textAnchor="middle"
                >
                    {h.hour.toString().padStart(2, '0')}:00
                </text>
            ))}
        </g>
    );

    return (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-10 overflow-hidden text-white/90 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <h3 className="text-sm font-black text-white font-suit uppercase tracking-[0.2em]">Daily Analytics</h3>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-bold italic tracking-wider">Hourly performance & progression tracking</p>
                </div>

                <div className="flex bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-2xl shadow-inner">
                    {(['progression', 'activity', 'distribution'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${viewMode === mode ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-neutral-600 hover:text-neutral-400'}`}
                        >
                            {mode === 'progression' && <TrendingUp className="w-3.5 h-3.5" />}
                            {mode === 'activity' && <BarChart3 className="w-3.5 h-3.5" />}
                            {mode === 'distribution' && <List className="w-3.5 h-3.5" />}
                            {mode}
                        </button>
                    ))}
                </div>

                <div className="text-right">
                    <span className="text-4xl font-mono font-black text-white px-2 tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                        {stats.hourly[23].cumulative}
                    </span>
                    <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.3em] mt-2">Global Resolve</p>
                </div>
            </div>

            <div className="relative min-h-[400px] w-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {viewMode !== 'distribution' ? (
                        <motion.div
                            key="graph-view"
                            initial={{ opacity: 0, scale: 0.99, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.01, y: -10 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
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
                                            <stop key={i} offset={`${(i / 23) * 100}%`} stopColor={h.topTagColor} stopOpacity="0.15" />
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

                                {renderGrid()}

                                {/* Activity Bars (Background) */}
                                {viewMode === 'activity' && points.map((p, i) => (
                                    <motion.rect
                                        key={`bar-${i}`}
                                        initial={{ height: 0, y: height - paddingBottom }}
                                        animate={{
                                            height: (p.total / maxHourly) * graphHeight,
                                            y: height - paddingBottom - (p.total / maxHourly) * graphHeight
                                        }}
                                        x={p.x - 12}
                                        width={24}
                                        fill={p.topTagColor}
                                        className="opacity-20 hover:opacity-40 transition-opacity duration-300"
                                        rx={6}
                                    />
                                ))}

                                {/* Progression Line and Area */}
                                {viewMode === 'progression' && (
                                    <>
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
                                            className="stroke-[6]"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </>
                                )}

                                {/* Interactive Layers */}
                                {points.map((p, i) => (
                                    <g key={i}>
                                        <rect
                                            x={p.x - 16}
                                            y={0}
                                            width={32}
                                            height={height}
                                            fill="transparent"
                                            onMouseEnter={() => setHoveredPoint(p)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                            className="cursor-pointer"
                                        />
                                        {p.total > 0 && viewMode === 'progression' && (
                                            <motion.circle
                                                animate={{
                                                    r: hoveredPoint?.hour === p.hour ? 10 : 7,
                                                    strokeWidth: hoveredPoint?.hour === p.hour ? 5 : 3
                                                }}
                                                cx={p.x}
                                                cy={p.y}
                                                fill={p.topTagColor}
                                                className="stroke-[#0a0a0a] transition-all"
                                            />
                                        )}
                                        {p.total > 0 && viewMode === 'activity' && (
                                            <motion.rect
                                                animate={{
                                                    opacity: hoveredPoint?.hour === p.hour ? 1 : 0.6,
                                                    scale: hoveredPoint?.hour === p.hour ? 1.05 : 1
                                                }}
                                                x={p.x - 12}
                                                y={height - paddingBottom - (p.total / maxHourly) * graphHeight}
                                                width={24}
                                                height={(p.total / maxHourly) * graphHeight}
                                                fill={p.topTagColor}
                                                rx={6}
                                            />
                                        )}
                                    </g>
                                ))}

                                {renderXAxis()}
                            </svg>

                            {/* Enhanced Tooltip */}
                            <AnimatePresence>
                                {hoveredPoint && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 15 }}
                                        style={{
                                            left: `${(hoveredPoint.x / width) * 100}%`,
                                            top: `${(hoveredPoint.y / height) * 100}%`
                                        }}
                                        className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-[115%]"
                                    >
                                        <div className="bg-neutral-950/90 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] min-w-[220px] space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{hoveredPoint.hour}:00 Status</span>
                                                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">Timeline Entry</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                                    <span className="text-[10px] font-black text-white">
                                                        {viewMode === 'progression' ? `Σ ${hoveredPoint.cumulative}` : `+ ${hoveredPoint.total}`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {Object.entries(hoveredPoint.tagCounts).length > 0 ? (
                                                    Object.entries(hoveredPoint.tagCounts).map(([tagId, count]) => {
                                                        const tag = tagMap[tagId] || { name: 'Uncategorized', color: '#525252' };
                                                        const totalDuration = dailyTimes?.[tagId] || 0;
                                                        const tagTotalCount = stats.tagTotals[tagId] || 0;
                                                        const avgSeconds = tagTotalCount > 0 ? totalDuration / tagTotalCount : 0;

                                                        return (
                                                            <div key={tagId} className="space-y-1.5 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                                                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-tight truncate max-w-[100px]">
                                                                            {tag.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs font-mono font-black text-white">+{count}</span>
                                                                </div>
                                                                {avgSeconds > 0 && (
                                                                    <div className="flex items-center gap-1.5 pl-3.5">
                                                                        <Clock className="w-2.5 h-2.5 text-neutral-600" />
                                                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter">
                                                                            Avg: {formatDuration(avgSeconds)} / Obj
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em] text-center py-2 italic font-suit">Maintained Status</p>
                                                )}
                                            </div>

                                            {hoveredPoint.total > 0 && viewMode === 'progression' && (
                                                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Hourly Yield</span>
                                                    <span className="text-[10px] font-black text-cyan-400">+{hoveredPoint.total} Units</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-4 h-4 bg-neutral-950/90 border-r border-b border-white/10 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-2" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="distribution-view"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4 }}
                            className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {Object.entries(stats.tagTotals).map(([tagId, count]) => {
                                const tag = tagMap[tagId] || { name: 'Uncategorized', color: '#525252' };
                                const totalDuration = dailyTimes?.[tagId] || 0;
                                const avgSeconds = count > 0 ? totalDuration / count : 0;

                                return (
                                    <div key={tagId} className="group relative flex flex-col p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 shadow-xl overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: tag.color }} />
                                                <div>
                                                    <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">{tag.name}</h4>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-mono font-black text-white">{count}</span>
                                                        <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">Resolutions</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {avgSeconds > 0 && (
                                                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-neutral-600" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest leading-none mb-1">Avg Tempo</p>
                                                        <p className="text-xs font-mono font-black text-cyan-400">{formatDuration(avgSeconds)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                    </div>
                                );
                            })}
                            {Object.keys(stats.tagTotals).length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                                    <p className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.5em]">No synchronization recorded for current cycle</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
