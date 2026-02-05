"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "@/lib/types";
import { useSolvedProblemsStats, GraphPoint, HourlyStats } from "@/hooks/useSolvedProblemsStats";
import { GraphHeader } from "./graph/GraphHeader";
import { StatTooltip } from "./graph/StatTooltip";
import { DistributionView } from "./graph/DistributionView";

interface SolvedProblemsGraphProps {
    logs: { created_at: string; tag_id: string | null }[];
    tags: Tag[];
    dailyTimes?: Record<string, number>;
}

type ViewMode = 'distribution' | 'progression' | 'activity';

export function SolvedProblemsGraph({ logs, tags, dailyTimes }: SolvedProblemsGraphProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('progression');
    const [hoveredPoint, setHoveredPoint] = useState<GraphPoint | null>(null);

    const width = 800;
    const height = 400;
    const paddingX = 60;
    const paddingTop = 120;
    const paddingBottom = 60;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingTop - paddingBottom;

    const {
        stats,
        points,
        pathData,
        tagMap,
        maxHourly
    } = useSolvedProblemsStats({
        logs,
        tags,
        viewMode,
        width,
        height,
        paddingX,
        paddingBottom,
        graphWidth,
        graphHeight
    });

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
            <GraphHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                totalCumulative={stats.hourly[23].cumulative}
            />

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

                            <AnimatePresence>
                                {hoveredPoint && (
                                    <StatTooltip
                                        point={hoveredPoint}
                                        tagMap={tagMap}
                                        dailyTimes={dailyTimes}
                                        viewMode={viewMode}
                                        width={width}
                                        height={height}
                                        tagTotals={stats.tagTotals}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <DistributionView
                            tagTotals={stats.tagTotals}
                            tagMap={tagMap}
                            dailyTimes={dailyTimes}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
