"use client";

import { useMemo } from "react";
import { Tag } from "@/lib/types";

export interface HourlyStats {
    hour: number;
    total: number;
    cumulative: number;
    tagCounts: Record<string, number>;
    topTagColor: string;
}

export interface GraphPoint extends HourlyStats {
    x: number;
    y: number;
}

interface UseSolvedProblemsStatsProps {
    logs: { created_at: string; tag_id: string | null }[];
    tags: Tag[];
    viewMode: 'progression' | 'activity' | 'distribution';
    width: number;
    height: number;
    paddingX: number;
    paddingBottom: number;
    graphWidth: number;
    graphHeight: number;
}

export function useSolvedProblemsStats({
    logs,
    tags,
    viewMode,
    width,
    height,
    paddingX,
    paddingBottom,
    graphWidth,
    graphHeight
}: UseSolvedProblemsStatsProps) {
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

    const points = useMemo(() => stats.hourly.map((h, i) => {
        const x = paddingX + (i / 23) * graphWidth;
        const val = viewMode === 'progression' ? h.cumulative : h.total;
        const max = viewMode === 'progression' ? maxCumulative : maxHourly;
        const y = height - paddingBottom - (val / max) * graphHeight;
        return { x, y, ...h };
    }), [stats.hourly, viewMode, maxCumulative, maxHourly, graphWidth, graphHeight, paddingX, paddingBottom, height]);

    const pathData = useMemo(() => points.reduce((acc, p, i) => {
        return i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`;
    }, ""), [points]);

    return {
        stats,
        points,
        pathData,
        tagMap,
        maxHourly,
        maxCumulative
    };
}
