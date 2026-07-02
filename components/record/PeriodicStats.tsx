"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";
import { formatDuration, getSafeColor } from "@/lib/utils";
import { TAG_VARIANTS } from "@/lib/tag-variants";
import { PeriodicBarChart } from "./PeriodicBarChart";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronDown,
    ChevronUp,
    Edit2,
    Calendar,
    Clock,
    Zap,
} from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodicStatsProps {
    userId: string | undefined;
    tags: Tag[];
    currentDate: Date;
}

export function PeriodicStats({ userId, tags, currentDate }: PeriodicStatsProps) {
    const [view, setView] = useState<"week" | "month">("week");
    const [groupMode, setGroupMode] = useState<"tags" | "groups">("tags");
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [prevSessions, setPrevSessions] = useState<any[]>([]);
    const [groupNames, setGroupNames] = useState<Record<string, string>>({});
    const [editingGroup, setEditingGroup] = useState<string | null>(null);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    const fetchRangeData = async () => {
        if (!userId) return;
        setLoading(true);

        try {
            let start = new Date(currentDate);
            let end = new Date(currentDate);
            let prevStart = new Date(currentDate);
            let prevEnd = new Date(currentDate);

            if (view === "week") {
                const day = start.getDay() || 7;
                start.setDate(start.getDate() - (day - 1));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);

                prevStart = new Date(start);
                prevStart.setDate(prevStart.getDate() - 7);
                prevEnd = new Date(prevStart);
                prevEnd.setDate(prevEnd.getDate() + 6);
                prevEnd.setHours(23, 59, 59, 999);
            } else {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);

                prevStart = new Date(start);
                prevStart.setMonth(prevStart.getMonth() - 1);
                prevEnd = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0);
                prevEnd.setHours(23, 59, 59, 999);
            }

            const [currentRes, prevRes, groupsRes] = await Promise.all([
                supabase
                    .from("study_sessions")
                    .select("tag_id, duration, created_at")
                    .eq("user_id", userId)
                    .gte("created_at", start.toISOString())
                    .lte("created_at", end.toISOString()),
                supabase
                    .from("study_sessions")
                    .select("tag_id, duration, created_at")
                    .eq("user_id", userId)
                    .gte("created_at", prevStart.toISOString())
                    .lte("created_at", prevEnd.toISOString()),
                supabase.from("tag_groups").select("icon, color, name"),
            ]);

            setSessions(currentRes.data || []);
            setPrevSessions(prevRes.data || []);

            const nameMap: Record<string, string> = {};
            groupsRes.data?.forEach((g) => {
                nameMap[g.icon || "Cpu"] = g.name;
            });
            setGroupNames(nameMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRangeData();
    }, [userId, view, currentDate]);

    const saveGroupName = async (icon: string, color: string, name: string) => {
        try {
            const { error } = await supabase
                .from("tag_groups")
                .upsert({ icon, color, name }, { onConflict: "icon" });

            if (!error) {
                setGroupNames((prev) => ({ ...prev, [icon]: name }));
                setEditingGroup(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const tagTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        sessions.forEach((s) => {
            totals[s.tag_id] = (totals[s.tag_id] || 0) + s.duration;
        });
        return totals;
    }, [sessions]);

    const displayStats = useMemo(() => {
        if (groupMode === "tags") {
            return tags
                .map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                    color: getSafeColor(tag.color, TAG_VARIANTS.find((v) => v.icon === tag.icon)?.color || "#22d3ee"),
                    icon: tag.icon,
                    total: tagTotals[tag.id] || 0,
                }))
                .filter((t) => t.total > 0)
                .sort((a, b) => b.total - a.total);
        } else {
            const groups: Record<
                string,
                { key: string; name: string; color: string; icon: string; total: number; tags: any[] }
            > = {};
            tags.forEach((tag) => {
                const key = tag.icon || "Cpu";
                const total = tagTotals[tag.id] || 0;
                if (total > 0) {
                    if (!groups[key]) {
                        groups[key] = {
                            key,
                            name: groupNames[key] || TAG_VARIANTS.find((v) => v.icon === key)?.label || key,
                            color: getSafeColor(tag.color, TAG_VARIANTS.find((v) => v.icon === key)?.color || "#22d3ee"),
                            icon: tag.icon || "",
                            total: 0,
                            tags: [],
                        };
                    }
                    groups[key].total += total;
                    groups[key].tags.push({
                        ...tag,
                        color: getSafeColor(tag.color, TAG_VARIANTS.find((v) => v.icon === tag.icon)?.color || "#22d3ee"),
                        total,
                    });
                }
            });
            return Object.values(groups)
                .map((g) => ({ ...g, tags: g.tags.sort((a, b) => b.total - a.total) }))
                .sort((a, b) => b.total - a.total);
        }
    }, [tags, tagTotals, groupMode, groupNames]);

    const totalDuration = useMemo(
        () => sessions.reduce((acc, s) => acc + s.duration, 0),
        [sessions]
    );
    const prevTotalDuration = useMemo(
        () => prevSessions.reduce((acc, s) => acc + s.duration, 0),
        [prevSessions]
    );

    const comparison = useMemo(() => {
        if (prevTotalDuration === 0) return null;
        const diff = totalDuration - prevTotalDuration;
        const percent = (diff / prevTotalDuration) * 100;
        return { diff, percent };
    }, [totalDuration, prevTotalDuration]);

    const periodDays = view === "week" ? 7 : 30;
    const avgDaily = totalDuration / periodDays;

    // Period label
    const periodLabel = useMemo(() => {
        const d = new Date(currentDate);
        if (view === "week") {
            const day = d.getDay() || 7;
            const mon = new Date(d);
            mon.setDate(d.getDate() - (day - 1));
            const sun = new Date(mon);
            sun.setDate(mon.getDate() + 6);
            return `${mon.getMonth() + 1}/${mon.getDate()} – ${sun.getMonth() + 1}/${sun.getDate()}`;
        } else {
            return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
        }
    }, [currentDate, view]);

    return (
        <div className="space-y-6 font-suit">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-neutral-100">애널리틱스</h2>
                        <p className="text-[11px] text-neutral-500">{periodLabel}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center gap-1 p-1 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
                        {(["week", "month"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    view === v
                                        ? "bg-neutral-800 text-neutral-100 shadow"
                                        : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <Calendar className="w-3 h-3" />
                                {v === "week" ? "주간" : "월간"}
                            </button>
                        ))}
                    </div>

                    {/* Group mode toggle */}
                    <div className="flex items-center gap-1 p-1 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
                        {(["tags", "groups"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setGroupMode(m); setExpandedGroup(null); }}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    groupMode === m
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                {m === "tags" ? "태그" : "그룹"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total */}
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                            총 학습
                        </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-neutral-100 tracking-tight">
                        {formatDuration(totalDuration)}
                    </div>
                    {comparison && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg w-fit",
                                comparison.diff > 0
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                    : comparison.diff < 0
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                                    : "bg-neutral-800 text-neutral-500 border border-neutral-700"
                            )}
                        >
                            {comparison.diff > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : comparison.diff < 0 ? (
                                <TrendingDown className="w-3 h-3" />
                            ) : (
                                <Minus className="w-3 h-3" />
                            )}
                            {Math.abs(comparison.percent).toFixed(1)}% vs 이전 {view === "week" ? "주" : "달"}
                        </div>
                    )}
                </div>

                {/* Daily Average */}
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                            일 평균
                        </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-neutral-100 tracking-tight">
                        {formatDuration(avgDaily)}
                    </div>
                    <div className="text-[11px] text-neutral-600">
                        {view === "week" ? "7일 기준" : "30일 기준"}
                    </div>
                </div>

                {/* Top tag */}
                {displayStats.length > 0 && (
                    <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-neutral-400">
                            {(() => {
                                const top = displayStats[0] as any;
                                const IconComp = top.icon && (Icons as any)[top.icon] ? (Icons as any)[top.icon] : null;
                                return IconComp ? (
                                    <IconComp className="w-3.5 h-3.5" style={{ color: top.color }} />
                                ) : (
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: top.color }} />
                                );
                            })()}
                            <span className="text-[11px] font-semibold uppercase tracking-wider">
                                최다 태그
                            </span>
                        </div>
                        <div className="text-lg font-bold text-neutral-100 truncate">
                            {(displayStats[0] as any).name}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                            {formatDuration((displayStats[0] as any).total)}{" "}
                            <span className="text-neutral-700">
                                ({((displayStats[0] as any).total / totalDuration * 100).toFixed(0)}%)
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bar Chart ── */}
            {!loading && displayStats.length > 0 && (
                <PeriodicBarChart
                    sessions={sessions}
                    tags={tags}
                    groupMode={groupMode}
                    view={view}
                    currentDate={currentDate}
                    groupNames={groupNames}
                />
            )}

            {/* ── Stats List ── */}
            {loading ? (
                <div className="h-48 flex items-center justify-center bg-neutral-900/30 border border-neutral-800/60 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                </div>
            ) : displayStats.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center bg-neutral-900/30 border border-dashed border-neutral-800/60 rounded-xl gap-3">
                    <BarChart3 className="w-7 h-7 text-neutral-700" />
                    <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest">
                        이 기간에 기록이 없습니다
                    </p>
                </div>
            ) : (
                <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800/60">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                            {groupMode === "tags" ? "태그별" : "그룹별"} 분포
                        </span>
                        <span className="ml-auto text-[10px] text-neutral-600">
                            {displayStats.length}개
                        </span>
                    </div>

                    <div className="divide-y divide-neutral-800/40">
                        {displayStats.map((stat: any, idx) => {
                            const IconComponent =
                                stat.icon && (Icons as any)[stat.icon]
                                    ? (Icons as any)[stat.icon]
                                    : null;
                            const isEditing = groupMode === "groups" && editingGroup === stat.key;
                            const isExpanded = groupMode === "groups" && expandedGroup === stat.key;
                            const pct = totalDuration > 0 ? (stat.total / totalDuration) * 100 : 0;

                            // rank badge color
                            const rankColors = ["text-amber-400", "text-neutral-300", "text-neutral-500"];
                            const rankColor = rankColors[idx] ?? "text-neutral-600";

                            return (
                                <motion.div
                                    key={stat.id || stat.key}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                >
                                    <div
                                        className={cn(
                                            "px-4 py-3 transition-colors",
                                            groupMode === "groups" && !editingGroup
                                                ? "cursor-pointer hover:bg-neutral-800/30"
                                                : ""
                                        )}
                                        onClick={() =>
                                            groupMode === "groups" &&
                                            !editingGroup &&
                                            setExpandedGroup(isExpanded ? null : stat.key)
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Rank */}
                                            <span
                                                className={cn(
                                                    "text-[11px] font-black font-mono w-4 text-center shrink-0",
                                                    rankColor
                                                )}
                                            >
                                                {idx + 1}
                                            </span>

                                            {/* Icon */}
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                                                style={{
                                                    backgroundColor: `${stat.color}15`,
                                                    borderColor: `${stat.color}30`,
                                                }}
                                            >
                                                {IconComponent ? (
                                                    <IconComponent
                                                        className="w-3.5 h-3.5"
                                                        style={{ color: stat.color }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: stat.color || "#fff" }}
                                                    />
                                                )}
                                            </div>

                                            {/* Name */}
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <input
                                                        autoFocus
                                                        className="bg-transparent border-b border-indigo-500/40 text-xs font-bold text-white focus:outline-none w-full"
                                                        value={newName}
                                                        onChange={(e) => setNewName(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onBlur={() =>
                                                            saveGroupName(stat.icon, stat.color, newName)
                                                        }
                                                        onKeyDown={(e) =>
                                                            e.key === "Enter" &&
                                                            saveGroupName(stat.icon, stat.color, newName)
                                                        }
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-1.5 group/name">
                                                        <span className="text-xs font-semibold text-neutral-200 truncate">
                                                            {stat.name}
                                                        </span>
                                                        {groupMode === "groups" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingGroup(stat.key);
                                                                    setNewName(stat.name);
                                                                }}
                                                                className="opacity-0 group-hover/name:opacity-100 transition-opacity"
                                                            >
                                                                <Edit2 className="w-2.5 h-2.5 text-neutral-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Duration + pct */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[11px] text-neutral-500 font-mono hidden sm:block">
                                                    {pct.toFixed(1)}%
                                                </span>
                                                <span className="text-xs font-bold font-mono text-neutral-200">
                                                    {formatDuration(stat.total)}
                                                </span>
                                                {groupMode === "groups" && (
                                                    <div className="text-neutral-600">
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-2 ml-10 h-1 rounded-full bg-neutral-800/60 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.04 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: stat.color || "#6366f1" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Group expanded sub-tags */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-3 pt-1 ml-10 space-y-2 border-t border-neutral-800/40">
                                                    {stat.tags.map((tag: any) => {
                                                        const tagPct = ((tag.total / stat.total) * 100).toFixed(0);
                                                        return (
                                                            <div key={tag.id}>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[11px] font-medium text-neutral-500 truncate mr-4">
                                                                        {tag.name}
                                                                    </span>
                                                                    <span className="text-[10px] font-mono text-neutral-600 shrink-0">
                                                                        {formatDuration(tag.total)} · {tagPct}%
                                                                    </span>
                                                                </div>
                                                                <div className="h-0.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${tagPct}%` }}
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            backgroundColor: tag.color || "#fff",
                                                                            opacity: 0.5,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
