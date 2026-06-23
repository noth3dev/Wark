"use client";

import React, { useMemo } from "react";
import { formatDuration } from "../lib/utils";
import * as Icons from "lucide-react";

interface ExportCardProps {
    type: "daily" | "weekly";
    cardType: "cover" | "focus" | "tasks" | "reflection" | "weekly-chart" | "weekly-tags" | "donut" | "timeline" | "quote" | "group-detail";
    date: string;
    cardIndex: number;
    totalCards: number;
    userName?: string;
    
    // Daily & Weekly Data
    completedTasks?: any[];
    timeByTag?: { name: string; color: string; icon?: string; duration: number }[];
    timeByGroup?: { name: string; color: string; icon?: string; duration: number }[];
    comment?: string;
    
    // Weekly Specific Data
    weeklyRangeText?: string;
    weeklyDailyTimes?: { dateStr: string; dayName: string; duration: number }[];
    weeklyTotalDuration?: number;
    weeklyCompletedCount?: number;
    weeklyReflectionComments?: { date: string; comment: string }[];

    // Timeline Data
    hourData?: any[];
    completedTaskDots?: any[];
    tags?: any[];
    dbGroups?: any[];
    activeGroupIcon?: string;
}

export const ExportCard = React.forwardRef<HTMLDivElement, ExportCardProps>(
    ({
        type,
        cardType,
        date,
        cardIndex,
        totalCards,
        userName,
        completedTasks = [],
        timeByTag = [],
        timeByGroup = [],
        comment,
        weeklyRangeText,
        weeklyDailyTimes = [],
        weeklyTotalDuration = 0,
        weeklyCompletedCount = 0,
        weeklyReflectionComments = [],
        hourData = [],
        completedTaskDots = [],
        tags = [],
        dbGroups = [],
        activeGroupIcon
    }, ref) => {
        const totalMs = type === "weekly" ? weeklyTotalDuration : timeByGroup.reduce((acc, t) => acc + t.duration, 0);

        const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long"
        });

        // Cover Slide Renderer
        const renderCover = () => {
            if (type === "weekly") {
                return (
                    <div className="w-full h-full bg-gradient-to-br from-[#2E1F1A] to-[#1A100E] text-white p-12 flex flex-col justify-between select-none relative overflow-hidden">
                        {/* Background subtle graphics */}
                        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl" />
                        
                        <div className="space-y-4 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold tracking-wider text-rose-200">
                                📊 WEEKLY REPORT
                            </div>
                            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mt-6">
                                이번 주의 학습 성장<br/>
                                <span className="text-rose-300">리포트</span>
                            </h1>
                            <p className="text-sm text-neutral-400 font-light mt-2">
                                {weeklyRangeText || "주간 학습 요약"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10 mt-6">
                            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/5 space-y-2">
                                <span className="text-xs text-neutral-500 block">총 집중 시간</span>
                                <span className="text-2xl font-black text-white font-mono">{formatDuration(weeklyTotalDuration)}</span>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/5 space-y-2">
                                <span className="text-xs text-neutral-500 block">완료한 과제</span>
                                <span className="text-2xl font-black text-rose-300 font-mono">{weeklyCompletedCount}개</span>
                            </div>
                        </div>

                        <div className="flex justify-end items-center relative z-10 pt-4 border-t border-white/10">
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">
                                CARD {cardIndex}/{totalCards}
                            </span>
                        </div>
                    </div>
                );
            }

            // Calculate game achievements based on today's performance
            const getAchievements = () => {
                const list = [];
                const hours = totalMs / (3600 * 1000);
                
                // 1. 공부 시간 기반 뱃지
                if (hours >= 6) {
                    list.push({
                        name: "👑 공부의 신",
                        desc: "6시간 이상 초인적 몰입",
                        rarity: "LEGENDARY",
                        rarityLabel: "LEGENDARY",
                        bgGradient: "from-purple-950/80 via-fuchsia-900/60 to-pink-950/80",
                        borderColor: "border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
                        textColor: "text-purple-100",
                        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-400/30"
                    });
                } else if (hours >= 4) {
                    list.push({
                        name: "🔥 집중 스퍼트",
                        desc: "4시간 이상 몰입 달성",
                        rarity: "PLATINUM",
                        rarityLabel: "PLATINUM",
                        bgGradient: "from-slate-900/80 via-cyan-950/60 to-blue-950/80",
                        borderColor: "border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
                        textColor: "text-cyan-100",
                        badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
                    });
                } else if (hours >= 2) {
                    list.push({
                        name: "⚡ 파워 스터디",
                        desc: "2시간 이상 공부 달성",
                        rarity: "GOLD",
                        rarityLabel: "GOLD",
                        bgGradient: "from-amber-950/80 via-yellow-950/60 to-amber-900/70",
                        borderColor: "border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                        textColor: "text-amber-100",
                        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    });
                } else if (hours >= 0.5) {
                    list.push({
                        name: "🌱 새싹 러너",
                        desc: "30분 이상 학습 시동",
                        rarity: "SILVER",
                        rarityLabel: "SILVER",
                        bgGradient: "from-slate-800/90 to-zinc-700/80",
                        borderColor: "border-slate-400/40",
                        textColor: "text-slate-100",
                        badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/30"
                    });
                } else if (hours > 0) {
                    list.push({
                        name: "🏃 페이싱 스타트",
                        desc: "오늘의 학습 개시",
                        rarity: "BRONZE",
                        rarityLabel: "BRONZE",
                        bgGradient: "from-stone-900/90 to-amber-950/80",
                        borderColor: "border-amber-800/40",
                        textColor: "text-amber-200/90",
                        badgeBg: "bg-amber-850/20 text-amber-400 border-amber-900/30"
                    });
                }

                // 2. 완료 과제 기반 뱃지
                if (completedTasks.length >= 8) {
                    list.push({
                        name: "🎯 갓생 마스터",
                        desc: "과제 8개 이상 폭풍 완료",
                        rarity: "LEGENDARY",
                        rarityLabel: "LEGENDARY",
                        bgGradient: "from-purple-950/80 via-fuchsia-900/60 to-pink-950/80",
                        borderColor: "border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
                        textColor: "text-purple-100",
                        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-400/30"
                    });
                } else if (completedTasks.length >= 5) {
                    list.push({
                        name: "✨ 미션 올클리어",
                        desc: "과제 5개 이상 완료",
                        rarity: "PLATINUM",
                        rarityLabel: "PLATINUM",
                        bgGradient: "from-slate-900/80 via-cyan-950/60 to-blue-950/80",
                        borderColor: "border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
                        textColor: "text-cyan-100",
                        badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
                    });
                } else if (completedTasks.length >= 3) {
                    list.push({
                        name: "📋 계획적 공부",
                        desc: "과제 3개 이상 완수",
                        rarity: "GOLD",
                        rarityLabel: "GOLD",
                        bgGradient: "from-amber-950/80 via-yellow-950/60 to-amber-900/70",
                        borderColor: "border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                        textColor: "text-amber-100",
                        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    });
                } else if (completedTasks.length >= 1) {
                    list.push({
                        name: "✅ 첫 단추",
                        desc: "과제 1개 이상 완료",
                        rarity: "SILVER",
                        rarityLabel: "SILVER",
                        bgGradient: "from-slate-800/90 to-zinc-700/80",
                        borderColor: "border-slate-400/40",
                        textColor: "text-slate-100",
                        badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/30"
                    });
                }

                // 3. 시간대별/특수 조건 뱃지
                const isEarlyBird = completedTaskDots && completedTaskDots.some((dot: any) => {
                    const h = new Date(dot.time).getHours();
                    return h >= 5 && h < 9;
                });
                if (isEarlyBird) {
                    list.push({
                        name: "🌅 아침형 인간",
                        desc: "오전 9시 이전 학습",
                        rarity: "SILVER",
                        rarityLabel: "SILVER",
                        bgGradient: "from-slate-800/90 to-zinc-700/80",
                        borderColor: "border-slate-400/40",
                        textColor: "text-slate-100",
                        badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/30"
                    });
                }

                const isNightOwl = completedTaskDots && completedTaskDots.some((dot: any) => {
                    const h = new Date(dot.time).getHours();
                    return h >= 22 || h < 2;
                });
                if (isNightOwl) {
                    list.push({
                        name: "🌃 올빼미 공부꾼",
                        desc: "야간 집중 학습 진행",
                        rarity: "SILVER",
                        rarityLabel: "SILVER",
                        bgGradient: "from-slate-800/90 to-zinc-700/80",
                        borderColor: "border-slate-400/40",
                        textColor: "text-slate-100",
                        badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/30"
                    });
                }

                const hasAlpha = completedTasks.some(t => t.is_plus_alpha);
                if (hasAlpha) {
                    list.push({
                        name: "💎 한계 돌파",
                        desc: "플러스 알파 과제 해결",
                        rarity: "GOLD",
                        rarityLabel: "GOLD",
                        bgGradient: "from-amber-950/80 via-yellow-950/60 to-amber-900/70",
                        borderColor: "border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                        textColor: "text-amber-100",
                        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    });
                }

                if (list.length === 0) {
                    list.push({
                        name: "👟 러닝 메이트",
                        desc: "새로운 집중 기록 대기 중",
                        rarity: "BRONZE",
                        rarityLabel: "BRONZE",
                        bgGradient: "from-stone-900/90 to-amber-950/80",
                        borderColor: "border-amber-800/40",
                        textColor: "text-amber-200/90",
                        badgeBg: "bg-amber-850/20 text-amber-400 border-amber-900/30"
                    });
                }

                return list;
            };

            // Daily Cover
            return (
                <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white p-8 flex flex-col justify-between select-none relative overflow-hidden font-suit">
                    <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
                    
                    <div className="space-y-3 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold tracking-wider text-blue-200">
                            📝 DAILY ARCHIVE
                        </div>
                        <h1 className="text-4xl font-extrabold leading-none tracking-tight mt-4">
                            {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </h1>
                        <p className="text-xs text-neutral-400 font-light mt-1">
                            {formattedDate}
                        </p>
                    </div>

                    {/* Stats stamps/badges in cover card */}
                    <div className="grid grid-cols-2 gap-4 relative z-10 mt-3">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                            <span className="text-[10px] text-neutral-500 block font-semibold">총 공부 시간</span>
                            <span className="text-xl font-black text-white font-mono">{formatDuration(totalMs)}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                            <span className="text-[10px] text-neutral-500 block font-semibold">완료한 과제</span>
                            <span className="text-xl font-black text-blue-300 font-mono">{completedTasks.length}개</span>
                        </div>
                    </div>

                    {/* 도전 과제 뱃지 구역 */}
                    <div className="space-y-2 relative z-10 my-3">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block font-mono">🏆 획득 도전 과제</span>
                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                            {getAchievements().map((ach, idx) => (
                                <div 
                                    key={idx} 
                                    className={`px-3 py-1.5 rounded-xl border bg-gradient-to-br ${ach.bgGradient} ${ach.borderColor} flex items-center justify-between shadow-md gap-3 w-full`}
                                >
                                    <div className="flex flex-col text-left">
                                        <span className={`text-xs font-black tracking-tight leading-none ${ach.textColor}`}>{ach.name}</span>
                                        <span className="text-[8px] text-white/50 font-medium leading-none mt-1">{ach.desc}</span>
                                    </div>
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${ach.badgeBg}`}>
                                        {ach.rarityLabel}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10 pt-2 border-t border-white/5">
                        <div className="text-xs font-bold text-neutral-200">
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md mr-1.5 font-semibold text-[10px]">하루하루 쌓이는</span>
                            기록의 힘
                        </div>
                    </div>

                    <div className="flex justify-end items-center relative z-10 pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">
                            CARD {cardIndex}/{totalCards}
                        </span>
                    </div>
                </div>
            );
        };

        // Ticket layout wrapper for content slides
        const renderContentWrapper = (title: string, subtitle: string, children: React.ReactNode, extraHeader?: React.ReactNode) => {
            return (
                <div className="w-full h-full bg-[#f4f4f5] text-[#18181b] p-10 flex flex-col justify-between select-none relative font-suit">
                    {/* Rounded Ticket Card inside */}
                    <div className="flex-1 bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 flex flex-col justify-between overflow-hidden">
                        <div className="space-y-6 flex-1 flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b border-neutral-100 pb-4 shrink-0">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block font-mono">REPORT DETAIL</span>
                                    <h2 className="text-xl font-bold text-neutral-800 tracking-tight">{title}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {extraHeader}
                                    <span className="text-xs font-bold text-neutral-400 font-mono bg-neutral-100 px-2.5 py-1 rounded-full">
                                        {subtitle}
                                    </span>
                                </div>
                            </div>

                            {/* Main Scrollable Content */}
                            <div className="flex-1 overflow-hidden">
                                {children}
                            </div>
                        </div>

                        {/* Footer inside Card */}
                        <div className="flex justify-end items-center pt-4 border-t border-neutral-100 mt-4 shrink-0">
                            <span className="text-xs font-bold text-neutral-400 font-mono">
                                {cardIndex} / {totalCards}
                            </span>
                        </div>
                    </div>
                </div>
            );
        };

        // Render Focus Time (Individual Tags, styled like /record cards)
        const renderFocus = () => {
            const activeTags = timeByTag.filter(t => t.duration > 0);
            const numRows = activeTags.length || 1;
            const containerHeight = 280;
            const rowTotalHeight = Math.floor(containerHeight / numRows);
            
            // Sizing parameters dynamically chosen based on tag counts
            const rowHeight = Math.min(68, Math.max(34, rowTotalHeight - 6));
            const gapY = Math.min(10, Math.max(2, rowTotalHeight - rowHeight));
            const fontSizeTitle = Math.min(12, Math.max(8, Math.floor(rowHeight * 0.22)));
            const fontSizeMeta = Math.min(10, Math.max(7, Math.floor(rowHeight * 0.18)));
            const barHeight = Math.min(4, Math.max(1.5, Math.floor(rowHeight * 0.08)));
            const iconSize = Math.min(20, Math.max(10, Math.floor(rowHeight * 0.35)));

            return renderContentWrapper(
                "오늘의 태그별 집중 시간",
                "TAG FOCUS TIME",
                <div className="h-full flex flex-col justify-center py-1">
                    <div className="flex flex-col" style={{ gap: `${gapY}px` }}>
                        {activeTags.map((t, idx) => {
                            const IconComponent = t.icon && (Icons as any)[t.icon] ? (Icons as any)[t.icon] : null;
                            const color = t.color || '#3b82f6';
                            const percent = Math.round((t.duration / (totalMs || 1)) * 100);
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="p-2.5 rounded-2xl bg-neutral-50/50 border border-neutral-200/40 flex flex-col justify-between"
                                    style={{ height: `${rowHeight}px` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {IconComponent ? (
                                                <IconComponent className="shrink-0" style={{ color, width: `${iconSize}px`, height: `${iconSize}px` }} />
                                            ) : (
                                                <div className="rounded-full bg-current shrink-0" style={{ backgroundColor: color, width: `${iconSize*0.5}px`, height: `${iconSize*0.5}px` }} />
                                            )}
                                            <span 
                                                className="font-bold text-neutral-700 truncate"
                                                style={{ fontSize: `${fontSizeTitle}px` }}
                                            >
                                                {t.name}
                                            </span>
                                        </div>
                                        <span 
                                            className="font-mono font-bold text-neutral-500 tabular-nums"
                                            style={{ fontSize: `${fontSizeMeta}px` }}
                                        >
                                            {percent}%
                                        </span>
                                    </div>

                                    <div className="space-y-1 mt-1">
                                        <div className="w-full bg-neutral-200/60 rounded-full overflow-hidden" style={{ height: `${barHeight}px` }}>
                                            <div 
                                                className="h-full rounded-full" 
                                                style={{ backgroundColor: color, width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-neutral-400 font-bold tracking-tight">
                                            <span className="uppercase" style={{ fontSize: `${fontSizeMeta - 2}px` }}>Recorded</span>
                                            <span className="font-mono" style={{ fontSize: `${fontSizeMeta}px` }}>{formatDuration(t.duration)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // Render Group Detail (One page per Group)
        const renderGroupDetail = () => {
            const group = dbGroups.find((g: any) => g.icon === activeGroupIcon);
            const groupName = group?.name || "기타";
            const groupColor = group?.color || "#888888";
            
            // Find tags belonging to this group icon
            const groupTags = timeByTag.filter(t => (t.icon || '') === activeGroupIcon && t.duration > 0);
            const groupDuration = groupTags.reduce((acc, t) => acc + t.duration, 0);

            const numRows = groupTags.length || 1;
            const containerHeight = 240;
            const rowTotalHeight = Math.floor(containerHeight / numRows);
            const rowHeight = Math.min(68, Math.max(36, rowTotalHeight - 6));
            const gapY = Math.min(10, Math.max(2, rowTotalHeight - rowHeight));
            const fontSizeTitle = Math.min(12, Math.max(8, Math.floor(rowHeight * 0.22)));
            const fontSizeMeta = Math.min(10, Math.max(7, Math.floor(rowHeight * 0.18)));
            const barHeight = Math.min(4, Math.max(1.5, Math.floor(rowHeight * 0.08)));

            const IconComponent = activeGroupIcon && (Icons as any)[activeGroupIcon] ? (Icons as any)[activeGroupIcon] : null;

            return renderContentWrapper(
                `${groupName} 그룹 상세`,
                "GROUP DETAIL",
                <div className="h-full flex flex-col justify-between py-1">
                    {/* Group Header Stats */}
                    <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-2 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl flex items-center justify-center bg-white border border-neutral-200" style={{ color: groupColor }}>
                                {IconComponent ? <IconComponent className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                            </div>
                            <span className="text-sm font-black text-neutral-800 uppercase tracking-wider">{groupName}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black font-mono text-neutral-900">{formatDuration(groupDuration)}</span>
                            <div className="text-[10px] text-neutral-400 font-bold font-mono">
                               전체의 {Math.round((groupDuration / (totalMs || 1)) * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Tags in this group */}
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-col" style={{ gap: `${gapY}px` }}>
                            {groupTags.map((t, idx) => {
                                const percentInGroup = Math.round((t.duration / (groupDuration || 1)) * 100);
                                return (
                                    <div 
                                        key={idx} 
                                        className="p-2.5 rounded-xl bg-neutral-50/50 border border-neutral-200/30 flex flex-col justify-between"
                                        style={{ height: `${rowHeight}px` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span 
                                                className="font-bold text-neutral-700 truncate"
                                                style={{ fontSize: `${fontSizeTitle}px` }}
                                            >
                                                {t.name}
                                            </span>
                                            <span 
                                                className="font-mono font-bold text-neutral-500"
                                                style={{ fontSize: `${fontSizeMeta}px` }}
                                            >
                                                {percentInGroup}%
                                            </span>
                                        </div>

                                        <div className="space-y-1 mt-1">
                                            <div className="w-full bg-neutral-200/60 rounded-full overflow-hidden" style={{ height: `${barHeight}px` }}>
                                                <div 
                                                    className="h-full rounded-full" 
                                                    style={{ backgroundColor: groupColor, width: `${percentInGroup}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-neutral-400 font-bold tracking-tight">
                                                <span className="uppercase" style={{ fontSize: `${fontSizeMeta - 2}px` }}>Recorded</span>
                                                <span className="font-mono" style={{ fontSize: `${fontSizeMeta}px` }}>{formatDuration(t.duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        };

        // Render Donut Graph
        const renderDonut = () => {
            const groupData = timeByGroup.filter(g => g.duration > 0);
            const totalMs = groupData.reduce((acc, g) => acc + g.duration, 0);

            return renderContentWrapper(
                "오늘의 집중 영역",
                "ACTIVITY DONUT",
                <div className="flex flex-col items-center justify-center h-full py-2 space-y-6">
                    <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="#f4f4f5"
                                strokeWidth="8"
                            />
                            {(() => {
                                let cumulativePercent = 0;
                                return groupData.map((g, idx) => {
                                    const percent = (g.duration / (totalMs || 1)) * 100;
                                    const circumference = 2 * Math.PI * 38;
                                    const gap = groupData.length > 1 ? 0.8 : 0;
                                    const segmentLength = Math.max(0, (percent - gap) * (circumference / 100));
                                    const offset = -(cumulativePercent * (circumference / 100));
                                    
                                    cumulativePercent += percent;

                                    return (
                                        <circle
                                            key={idx}
                                            cx="50"
                                            cy="50"
                                            r="38"
                                            fill="transparent"
                                            stroke={g.color || '#3b82f6'}
                                            strokeWidth="8"
                                            strokeDasharray={`${segmentLength} ${circumference}`}
                                            strokeDashoffset={offset}
                                            strokeLinecap="round"
                                        />
                                    );
                                });
                            })()}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">TOTAL</span>
                            <span className="text-xl font-extrabold font-mono text-neutral-800">
                                {formatDuration(totalMs)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full px-4 shrink-0">
                        {groupData.slice(0, 4).map((g, idx) => {
                            const IconComponent = g.icon && (Icons as any)[g.icon] ? (Icons as any)[g.icon] : null;
                            const color = g.color || '#3b82f6';
                            return (
                                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                                        {IconComponent ? (
                                            <IconComponent className="w-2.5 h-2.5" style={{ color }} />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                        )}
                                    </div>
                                    <span className="truncate flex-1">{g.name}</span>
                                    <span className="font-mono text-neutral-400 text-[10px]">
                                        {Math.round((g.duration / (totalMs || 1)) * 100)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // Render Timeline Card
        const renderTimeline = () => {
            const activeHours = hourData.filter(h => h.total > 0).map(h => h.hour);
            const minHour = activeHours.length > 0 ? Math.max(0, Math.min(...activeHours) - 1) : 8;
            const maxHour = activeHours.length > 0 ? Math.min(23, Math.max(...activeHours) + 1) : 21;
            const slicedHours = hourData.slice(minHour, maxHour + 1);

            // Dynamically calculate sizing to fit all hours inside ~300px container
            const numRows = slicedHours.length;
            const containerHeight = 300;
            const rowTotalHeight = Math.floor(containerHeight / numRows);
            const barHeight = Math.min(20, Math.max(10, rowTotalHeight - 4));
            const fontSize = Math.min(10, Math.max(7, Math.floor(barHeight * 0.75)));
            const gapY = Math.min(6, Math.max(1.5, rowTotalHeight - barHeight));
            const dotSize = Math.min(6, Math.max(3, Math.floor(barHeight * 0.35)));

            return renderContentWrapper(
                "오늘의 타임라인",
                "TIMELINE",
                <div className="h-full flex flex-col justify-center">
                    <div className="flex flex-col" style={{ gap: `${gapY}px` }}>
                        {slicedHours.map(({ hour, total: totalInHour, segments: hourSegments }) => {
                            const dotsInHour = completedTaskDots.filter(dot => {
                                const dotDate = new Date(dot.time);
                                return dotDate.getHours() === hour;
                            });

                            return (
                                <div key={hour} className="flex items-center gap-2" style={{ height: `${barHeight}px` }}>
                                    <div 
                                        className="w-5 font-mono text-neutral-400 font-bold tabular-nums text-right shrink-0"
                                        style={{ fontSize: `${fontSize}px` }}
                                    >
                                        {hour.toString().padStart(2, '0')}
                                    </div>
                                    <div 
                                        className="relative flex-1 bg-neutral-100/80 border border-neutral-200/40 rounded-md overflow-hidden flex h-full"
                                    >
                                        {hourSegments.map((seg: any, i: number) => {
                                            if (seg.type === 'session') {
                                                const tag = (tags || []).find(t => t.id === seg.tagId);
                                                const color = tag?.color || '#a1a1aa';
                                                return (
                                                    <div
                                                        key={i}
                                                        className="h-full relative shrink-0"
                                                        style={{
                                                            width: `${(seg.duration / 3600000) * 100}%`,
                                                            backgroundColor: `${color}88`,
                                                        }}
                                                    >
                                                        <div 
                                                            className="absolute inset-y-0 left-0 w-0.5" 
                                                            style={{ backgroundColor: color }} 
                                                        />
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div
                                                        key={i}
                                                        className="h-full shrink-0 border-r border-neutral-200/20 last:border-r-0"
                                                        style={{
                                                            width: `${(seg.duration / 3600000) * 100}%`,
                                                        }}
                                                    />
                                                );
                                            }
                                        })}

                                        {/* Completed task dots overlay */}
                                        {dotsInHour.map((dot: any, i: number) => {
                                            const dotDate = new Date(dot.time);
                                            const minuteFraction = (dotDate.getMinutes() * 60 + dotDate.getSeconds()) / 3600;
                                            const tag = (tags || []).find(t => t.id === dot.tagId);
                                            const dotColor = tag?.color || '#10b981';
                                            
                                            return (
                                                <div
                                                    key={i}
                                                    className="absolute top-1/2 -translate-y-1/2 z-20"
                                                    style={{ left: `${minuteFraction * 100}%` }}
                                                >
                                                    <div
                                                        className="rounded-full -translate-x-1/2 bg-emerald-500 border border-white shadow-sm"
                                                        style={{
                                                            width: `${dotSize}px`,
                                                            height: `${dotSize}px`,
                                                            backgroundColor: dotColor,
                                                            boxShadow: `0 0 3px ${dotColor}`
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {totalInHour > 0 && (
                                        <div 
                                            className="w-8 font-mono text-neutral-400 font-semibold text-left shrink-0"
                                            style={{ fontSize: `${fontSize}px` }}
                                        >
                                            {Math.round(totalInHour / 60000)}m
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // Render 오늘의 한마디 (Quote) Card
        const renderQuote = () => {
            return (
                <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white p-12 flex flex-col justify-between select-none relative overflow-hidden font-suit">
                    <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
                    
                    <div className="space-y-4 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold tracking-wider text-blue-200">
                            💬 오늘의 한마디
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-4">
                        <Icons.Quote className="w-10 h-10 text-blue-300/40 mb-6 self-start" />
                        <p className="text-xl font-medium text-neutral-100 leading-relaxed italic text-center w-full break-words font-suit font-serif">
                            {comment ? `"${comment}"` : "오늘 하루도 최선을 다해 한 걸음 더 나아갔습니다."}
                        </p>
                        <Icons.Quote className="w-10 h-10 text-blue-300/40 mt-6 self-end rotate-180" />
                    </div>

                    <div className="flex justify-end items-center relative z-10 pt-4 border-t border-white/10">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">
                            CARD {cardIndex}/{totalCards}
                        </span>
                    </div>
                </div>
            );
        };

        // Render Weekly Daily Study Chart
        const renderWeeklyChart = () => {
            const maxDuration = Math.max(...weeklyDailyTimes.map(d => d.duration), 1000);
            return renderContentWrapper(
                "요일별 학습 패턴",
                "DAILY STATS",
                <div className="h-full flex flex-col justify-between py-2">
                    <div className="text-center space-y-1">
                        <span className="text-[11px] font-bold text-neutral-400 tracking-wider">이번 주 총 학습 시간</span>
                        <div className="text-3xl font-extrabold font-mono text-neutral-900">
                            {formatDuration(weeklyTotalDuration)}
                        </div>
                    </div>

                    {/* Simple Beautiful Bar Chart */}
                    <div className="flex items-end justify-between h-[200px] px-2 pt-6">
                        {weeklyDailyTimes.map((day, idx) => {
                            const heightPercentage = Math.max(8, Math.min(100, (day.duration / maxDuration) * 100));
                            const isToday = new Date(day.dateStr).toDateString() === new Date(date).toDateString();
                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                                    <div className="text-[10px] font-mono text-neutral-500 font-bold">
                                        {day.duration > 0 ? `${Math.round(day.duration / 3600000)}h` : ""}
                                    </div>
                                    <div className="w-6 bg-neutral-100 rounded-full h-[120px] relative overflow-hidden flex items-end">
                                        <div 
                                            className={`w-full rounded-full transition-all duration-500 ${isToday ? "bg-rose-400" : "bg-neutral-800"}`}
                                            style={{ height: `${heightPercentage}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-semibold ${isToday ? "text-rose-400 font-bold" : "text-neutral-600"}`}>
                                        {day.dayName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // Render Weekly Tags Chart (by Group)
        const renderWeeklyTags = () => {
            return renderContentWrapper(
                "주간 집중 카테고리",
                "WEEKLY TAGS",
                <div className="space-y-4 h-full flex flex-col justify-center font-suit">
                    <div className="text-center space-y-1 mb-2">
                        <span className="text-[11px] font-bold text-neutral-400 tracking-wider">가장 많이 학습한 카테고리</span>
                        {timeByGroup.length > 0 ? (
                            <div className="text-xl font-bold text-neutral-800">
                                <span className="bg-yellow-100 text-neutral-900 px-2 py-0.5 rounded mr-1">
                                    {timeByGroup[0].name}
                                </span>
                                ({formatDuration(timeByGroup[0].duration)})
                            </div>
                        ) : (
                            <div className="text-sm text-neutral-500 font-medium">학습 기록이 없습니다.</div>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 no-scrollbar">
                        {timeByGroup.slice(0, 4).map((t, idx) => {
                            const color = t.color || '#3b82f6';
                            return (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold text-neutral-600">
                                        <span>{t.name}</span>
                                        <span className="font-mono text-neutral-800">{formatDuration(t.duration)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ backgroundColor: color, width: `${(t.duration / (totalMs || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // Render Tasks Slide — one card per book (rootContent)
        const renderTasks = () => {
            // All tasks on this card belong to the same book
            const bookName = completedTasks.length > 0 ? (completedTasks[0].rootContent || "기타") : null;

            // Aggregate slider progress across all tasks on this card
            const sliderTasks = completedTasks.filter(t => t.is_slider && t.total_amount > 0);
            const totalCurrent = sliderTasks.reduce((s, t) => s + (t.current_amount || 0), 0);
            const totalMax = sliderTasks.reduce((s, t) => s + (t.total_amount || 0), 0);
            const groupPercent = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : null;

            return renderContentWrapper(
                bookName ? `📚 ${bookName}` : (type === "weekly" ? "이번 주 완료한 주요 과제" : "오늘 완료한 과제"),
                "COMPLETED TASKS",
                <div className="h-full flex flex-col py-1 font-suit">
                    {/* Book-level aggregate progress bar */}
                    {groupPercent !== null && (
                        <div className="mb-3 space-y-1 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">전체 진도</span>
                                <span className="text-[9px] font-mono font-black text-emerald-600">
                                    {totalCurrent}/{totalMax} · {groupPercent}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${Math.min(100, groupPercent)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Task list */}
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 no-scrollbar flex-1">
                        {completedTasks.length > 0 ? (
                            completedTasks.map((task, idx) => {
                                // Mid-path: between root and leaf (e.g. 단원 > 소단원)
                                const midPath = task.path && task.path.length > 2
                                    ? task.path.slice(1, -1).join(" > ")
                                    : null;
                                const pct = task.is_slider && task.total_amount > 0
                                    ? Math.min(100, Math.round((task.current_amount / task.total_amount) * 100))
                                    : null;

                                return (
                                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 border border-neutral-150">
                                        {/* Checkbox */}
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${task.is_completed ? "border-emerald-500 bg-emerald-50" : "border-blue-400 bg-blue-50"}`}>
                                            {task.is_completed
                                                ? <Icons.Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                                                : <Icons.Minus className="w-2.5 h-2.5 text-blue-500 stroke-[3]" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            {midPath && (
                                                <div className="text-[9px] font-semibold text-neutral-400 truncate">
                                                    {midPath}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-[11px] font-bold truncate flex-1 ${task.is_completed ? "text-neutral-700" : "text-neutral-600"}`}>
                                                    {task.content}
                                                </p>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {task.is_slider && task.total_amount > 0 && (
                                                        <span className="text-[9px] font-mono font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                                                            {task.current_amount}/{task.total_amount}
                                                            {task.amount_text ? ` ${task.amount_text}` : ""}
                                                        </span>
                                                    )}
                                                    {task.is_plus_alpha && (
                                                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">α</span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Per-task progress bar */}
                                            {pct !== null && (
                                                <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden mt-0.5">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-400"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center space-y-2">
                                <Icons.Inbox className="w-8 h-8 mx-auto text-neutral-300" />
                                <p className="text-xs text-neutral-400 font-semibold uppercase font-mono">완료된 과제가 없습니다</p>
                            </div>
                        )}
                    </div>
                </div>,
                <span className="text-[10px] font-bold text-neutral-500 font-mono bg-neutral-100 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <Icons.Clock className="w-3.5 h-3.5 text-neutral-400" /> {formatDuration(totalMs)}
                </span>
            );
        };



        // Render Reflection Slide
        const renderReflection = () => {
            if (type === "weekly") {
                return renderContentWrapper(
                    "이번 주의 배움과 생각",
                    "WEEKLY REFLECTION",
                    <div className="space-y-4 h-full flex flex-col justify-center">
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            {weeklyReflectionComments.length > 0 ? (
                                weeklyReflectionComments.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                                        <div className="text-[10px] font-bold text-neutral-400 font-mono">
                                            {new Date(item.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                                        </div>
                                        <p className="text-sm font-medium text-neutral-700 leading-relaxed italic">
                                            "{item.comment}"
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center space-y-2">
                                    <Icons.MessageSquareOff className="w-8 h-8 mx-auto text-neutral-300" />
                                    <p className="text-xs text-neutral-400 font-semibold uppercase font-mono">NO REFLECTIONS RECORDED</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            return renderContentWrapper(
                "오늘의 회고",
                "DAILY NOTE",
                <div className="h-full flex flex-col justify-center items-center px-4">
                    <Icons.Quote className="w-8 h-8 text-neutral-300 mb-4 self-start" />
                    <p className="text-lg font-medium text-neutral-800 leading-relaxed italic text-center w-full px-4 break-words font-suit">
                        {comment ? `"${comment}"` : "오늘 하루도 최선을 다해 한 걸음 더 나아갔습니다."}
                    </p>
                    <Icons.Quote className="w-8 h-8 text-neutral-300 mt-4 self-end rotate-180" />
                </div>
            );
        };

        const renderCardBody = () => {
            switch (cardType) {
                case "cover":
                    return renderCover();
                case "focus":
                    return renderFocus();
                case "group-detail":
                    return renderGroupDetail();
                case "donut":
                    return renderDonut();
                case "timeline":
                    return renderTimeline();
                case "quote":
                    return renderQuote();
                case "weekly-chart":
                    return renderWeeklyChart();
                case "weekly-tags":
                    return renderWeeklyTags();
                case "tasks":
                    return renderTasks();
                case "reflection":
                    return renderReflection();
                default:
                    return null;
            }
        };

        return (
            <div
                ref={ref}
                className="w-[600px] h-[600px] relative overflow-hidden bg-black flex shrink-0 shadow-lg"
                data-card-index={cardIndex}
            >
                {renderCardBody()}
            </div>
        );
    }
);

ExportCard.displayName = "ExportCard";

