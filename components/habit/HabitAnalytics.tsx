"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Habit } from "../../lib/services/habitService";

interface HabitAnalyticsProps {
    habits: Habit[];
    dates: Date[];
    completions: Record<string, boolean>;
}

export function HabitAnalytics({ habits, dates, completions }: HabitAnalyticsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const height = 100;

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            setWidth(entries[0].contentRect.width);
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const points = useMemo(() => {
        if (width === 0) return [];
        const stepX = width / (dates.length > 1 ? dates.length - 1 : 1);
        
        return dates.map((date, i) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const count = habits.filter(h => completions[`${h.id}:${dateStr}`]).length;
            const percentage = habits.length === 0 ? 0 : (count / habits.length) * 100;
            
            return {
                x: i * stepX,
                y: height - (percentage * height / 100),
                percentage
            };
        });
    }, [habits, dates, completions, width]);

    const linePath = useMemo(() => {
        if (points.length < 2) return "";
        
        // Simple smoothing using cubic bezier
        return points.reduce((path, p, i, arr) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            
            const prev = arr[i - 1];
            const cp1x = prev.x + (p.x - prev.x) / 3;
            const cp2x = prev.x + (p.x - prev.x) / 3 * 2;
            
            return `${path} C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
        }, "");
    }, [points]);

    return (
        <div className="mt-12 flex items-start h-32 border-t border-white/5 pt-12">
            {/* Identity spacer */}
            <div className="w-48 shrink-0" />

            {/* SVG Graph Area */}
            <div ref={containerRef} className="flex-1 h-full relative group">
                <svg className="overflow-visible w-full h-full">
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                            <stop offset="50%" stopColor="rgba(96, 165, 250, 0.6)" />
                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
                        </linearGradient>
                    </defs>

                    {/* Shadow/Glow under the line - Kept subtle for "water vibration" feel */}
                    <motion.path 
                        d={linePath}
                        animate={{ d: linePath }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 80, 
                            damping: 15, 
                            mass: 1 
                        }}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="blur-2xl"
                    />
                    
                    {/* Main Line with Smooth Wobble */}
                    <motion.path 
                        d={linePath}
                        animate={{ d: linePath }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 80, 
                            damping: 15, // Smooth vibration without being messy
                            mass: 1 
                        }}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Dots */}
                    {points.map((p, i) => (
                        <g key={i} className="group/dot">
                            <motion.circle 
                                cx={p.x} 
                                animate={{ cy: p.y }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 80, 
                                    damping: 15
                                }}
                                r="3" 
                                className="fill-blue-400/80 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                            />
                            {/* Hidden larger hit area for tooltip */}
                            <motion.circle 
                                cx={p.x} 
                                animate={{ cy: p.y }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 80, 
                                    damping: 15
                                }}
                                r="12" 
                                fill="transparent"
                                className="cursor-pointer"
                            />
                            {/* Percentage tooltip */}
                            <motion.text
                                x={p.x}
                                animate={{ y: p.y - 15 }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 80, 
                                    damping: 15
                                }}
                                className="text-[10px] font-mono font-black fill-blue-300 opacity-0 group-hover/dot:opacity-100 transition-opacity text-center overflow-visible select-none"
                                textAnchor="middle"
                            >
                                {Math.round(p.percentage)}%
                            </motion.text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
