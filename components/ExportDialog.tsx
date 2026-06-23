"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ExportCard } from "./ExportCard";
import { Homework, Subtask } from "../hooks/useHomework";
import { toPng } from "html-to-image";
import { Share2, Download, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

interface ExportDialogProps {
    homeworks: Homework[];
    tags: any[];
    dbGroups: any[];
    dailyTimes: Record<string, number>;
    currentTimeMs: number;
    activeTagId: string | null;
    userName?: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    comment: string;
    viewedUserId?: string;
    selectedDate?: string; // YYYY-MM-DD, 보고 있는 날짜 (없으면 오늘)
}

export function ExportDialog({ 
    homeworks, 
    tags, 
    dbGroups = [],
    dailyTimes, 
    currentTimeMs, 
    activeTagId,
    userName,
    isOpen,
    onOpenChange,
    comment: propComment,
    viewedUserId,
    selectedDate
}: ExportDialogProps) {
    const [mode, setMode] = useState<"daily" | "weekly">("daily");
    const [comment, setComment] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // Today/Weekly loaded states
    const [todaySessions, setTodaySessions] = useState<any[]>([]);
    const [weeklySessions, setWeeklySessions] = useState<any[]>([]);
    const [weeklyComments, setWeeklyComments] = useState<any[]>([]);
    const [loadingWeekly, setLoadingWeekly] = useState(false);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    // 보고 있는 날짜 (selectedDate가 없으면 오늘)
    const displayDateStr = selectedDate || todayStr;
    const isToday = displayDateStr === todayStr;
    
    // Sync external comment with local state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setComment(propComment || "");
        }
    }, [isOpen, propComment]);

    // Calculate start & end of week based on today
    const { startOfWeek, endOfWeek, weeklyRangeText, daysOfWeekList } = useMemo(() => {
        const today = new Date();
        const start = new Date(today);
        const day = today.getDay() || 7; // 1 (Mon) - 7 (Sun)
        start.setDate(today.getDate() - (day - 1));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const rangeStr = `${start.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} ~ ${end.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`;

        // List of days with names
        const list: { dateStr: string; dayName: string }[] = [];
        const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            list.push({
                dateStr: d.toISOString().split('T')[0],
                dayName: dayNames[i]
            });
        }

        return { startOfWeek: start, endOfWeek: end, weeklyRangeText: rangeStr, daysOfWeekList: list };
    }, [todayStr]);

    // Fetch daily + weekly data when dialog is opened
    useEffect(() => {
        if (!isOpen) return;

        const fetchTodaySessions = async () => {
            if (!viewedUserId) return;
            // 선택된 날짜의 시작/끝
            const startOfDay = new Date(displayDateStr);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(displayDateStr);
            endOfDay.setHours(23, 59, 59, 999);

            try {
                const { data } = await supabase
                    .from('study_sessions')
                    .select('id, tag_id, duration, created_at, is_sprint')
                    .eq('user_id', viewedUserId)
                    .gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString())
                    .order('created_at', { ascending: true });
                if (data) {
                    setTodaySessions(data);
                }
            } catch (err) {
                console.error("Failed to fetch today's sessions:", err);
            }
        };

        const fetchWeeklyData = async () => {
            if (!viewedUserId) return;
            setLoadingWeekly(true);
            try {
                // Fetch study sessions for the week
                const { data: sessionData } = await supabase
                    .from("study_sessions")
                    .select("tag_id, duration, created_at")
                    .eq('user_id', viewedUserId)
                    .gte("created_at", startOfWeek.toISOString())
                    .lte("created_at", endOfWeek.toISOString());
                
                setWeeklySessions(sessionData || []);

                // Fetch comments for the week
                const { data: commentData } = await supabase
                    .from("daily_comments")
                    .select("date, comment")
                    .eq('user_id', viewedUserId)
                    .gte("date", startOfWeek.toISOString().split('T')[0])
                    .lte("date", endOfWeek.toISOString().split('T')[0]);

                setWeeklyComments(commentData || []);
            } catch (err) {
                console.error("Failed to fetch weekly export data:", err);
            } finally {
                setLoadingWeekly(false);
            }
        };

        fetchTodaySessions();
        fetchWeeklyData();
    }, [isOpen, startOfWeek, endOfWeek, viewedUserId, displayDateStr]);

    // Gather Daily Data — 선택된 날짜 기준
    const completedToday = useMemo(() => {
        const allTasks: any[] = [];
        const gather = (rootId: string, rootContent: string, path: string[], nodes: Subtask[]) => {
            nodes.forEach(n => {
                const currentPath = [...path, n.content];
                if (!n.subtasks || n.subtasks.length === 0) {
                    allTasks.push({ ...n, rootId, rootContent, path: currentPath });
                }
                if (n.subtasks && n.subtasks.length > 0) {
                    gather(rootId, rootContent, currentPath, n.subtasks);
                }
            });
        };

        homeworks.forEach(h => {
             const path = [h.content];
             if (!h.subtasks || h.subtasks.length === 0) {
                allTasks.push({ ...h, rootId: h.id, rootContent: h.content, path });
             }
             if (h.subtasks && h.subtasks.length > 0) {
                 gather(h.id, h.content, path, h.subtasks);
             }
        });
        
        const filtered = allTasks.filter(item => {
            const doneOnDate = item.is_completed && item.completed_at && item.completed_at.startsWith(displayDateStr);
            const sliderProgress = item.is_slider && item.current_amount > 0;
            return doneOnDate || sliderProgress;
        });
        
        const seen = new Set();
        return filtered.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [homeworks, displayDateStr]);

    // Group-based daily focus times — 선택 날짜 기준
    // 오늘이 아닌 날은 DB 세션에서만 집계 (live timer 제외)
    const timeByGroupToday = useMemo(() => {
        if (isToday) {
            // 오늘: 기존 방식 (dailyTimes + live)
            const groupMap: Record<string, { name: string; color: string; icon: string; duration: number }> = {};
            tags.forEach(tag => {
                const groupIcon = tag.icon || '';
                const group = dbGroups.find((g: any) => g.icon === groupIcon);
                const groupName = group?.name || tag.name || '기타';
                const groupColor = group?.color || tag.color || '#888888';
                const baseTime = dailyTimes[tag.id] || 0;
                const totalMs = activeTagId === tag.id ? currentTimeMs : baseTime;
                if (totalMs > 0) {
                    const key = groupIcon || tag.name;
                    if (!groupMap[key]) {
                        groupMap[key] = { name: groupName, color: groupColor, icon: groupIcon || 'Cpu', duration: 0 };
                    }
                    groupMap[key].duration += totalMs;
                }
            });
            return Object.values(groupMap).sort((a, b) => b.duration - a.duration);
        } else {
            // 과거 날짜: DB 세션에서만 집계
            const groupMap: Record<string, { name: string; color: string; icon: string; duration: number }> = {};
            todaySessions.forEach(s => {
                const tag = tags.find(t => t.id === s.tag_id);
                if (tag) {
                    const groupIcon = tag.icon || '';
                    const group = dbGroups.find((g: any) => g.icon === groupIcon);
                    const groupName = group?.name || tag.name || '기타';
                    const groupColor = group?.color || tag.color || '#888888';
                    const key = groupIcon || tag.name;
                    if (!groupMap[key]) {
                        groupMap[key] = { name: groupName, color: groupColor, icon: groupIcon || 'Cpu', duration: 0 };
                    }
                    groupMap[key].duration += s.duration;
                }
            });
            return Object.values(groupMap).sort((a, b) => b.duration - a.duration);
        }
    }, [isToday, tags, dbGroups, dailyTimes, currentTimeMs, activeTagId, todaySessions]);

    const timeByTagToday = useMemo(() => {
        if (isToday) {
            return tags
                .map(tag => {
                    const baseTime = dailyTimes[tag.id] || 0;
                    const totalMs = activeTagId === tag.id ? currentTimeMs : baseTime;
                    return { name: tag.name, color: tag.color, icon: tag.icon, duration: totalMs };
                })
                .filter(t => t.duration > 0)
                .sort((a, b) => b.duration - a.duration);
        } else {
            const map: Record<string, { name: string; color: string; icon?: string; duration: number }> = {};
            todaySessions.forEach(s => {
                const tag = tags.find(t => t.id === s.tag_id);
                if (tag) {
                    if (!map[s.tag_id]) map[s.tag_id] = { name: tag.name, color: tag.color, icon: tag.icon, duration: 0 };
                    map[s.tag_id].duration += s.duration;
                }
            });
            return Object.values(map).sort((a, b) => b.duration - a.duration);
        }
    }, [isToday, tags, dailyTimes, currentTimeMs, activeTagId, todaySessions]);

    // Gather Weekly Data
    const completedWeekly = useMemo(() => {
        const allTasks: any[] = [];
        const gather = (rootId: string, rootContent: string, path: string[], nodes: Subtask[]) => {
            nodes.forEach(n => {
                const currentPath = [...path, n.content];
                if (!n.subtasks || n.subtasks.length === 0) {
                    allTasks.push({ ...n, rootId, rootContent, path: currentPath });
                }
                if (n.subtasks && n.subtasks.length > 0) {
                    gather(rootId, rootContent, currentPath, n.subtasks);
                }
            });
        };

        homeworks.forEach(h => {
             const path = [h.content];
             if (!h.subtasks || h.subtasks.length === 0) {
                allTasks.push({ ...h, rootId: h.id, rootContent: h.content, path });
             }
             if (h.subtasks && h.subtasks.length > 0) {
                 gather(h.id, h.content, path, h.subtasks);
             }
        });
        
        const filtered = allTasks.filter(item => {
            // Include completed tasks that were finished this week
            const doneThisWeek = item.is_completed && item.completed_at &&
                (() => {
                    const completedDate = new Date(item.completed_at);
                    return completedDate >= startOfWeek && completedDate <= endOfWeek;
                })();
            // Also include slider tasks with any progress (amount progress)
            const sliderProgress = item.is_slider && item.current_amount > 0;
            return doneThisWeek || sliderProgress;
        });

        const seen = new Set();
        return filtered.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [homeworks, startOfWeek, endOfWeek]);

    const weeklyDailyTimes = useMemo(() => {
        return daysOfWeekList.map(day => {
            const dayStart = new Date(day.dateStr);
            const dayEnd = new Date(day.dateStr);
            dayEnd.setHours(23, 59, 59, 999);

            let duration = weeklySessions
                .filter(s => {
                    const sessionDate = new Date(s.created_at);
                    return sessionDate >= dayStart && sessionDate <= dayEnd;
                })
                .reduce((acc, s) => acc + s.duration, 0);

            // Add live session if it fits today's slot AND we are viewing today
            if (day.dateStr === todayStr && activeTagId && isToday) {
                duration += currentTimeMs;
            }

            return {
                dateStr: day.dateStr,
                dayName: day.dayName,
                duration
            };
        });
    }, [daysOfWeekList, weeklySessions, todayStr, activeTagId, currentTimeMs]);

    const weeklyTotalDuration = useMemo(() => {
        return weeklyDailyTimes.reduce((acc, d) => acc + d.duration, 0);
    }, [weeklyDailyTimes]);

    // Group-based weekly focus times
    const timeByGroupWeekly = useMemo(() => {
        const groupMap: Record<string, { name: string; color: string; icon: string; duration: number }> = {};
        
        // Sum up from DB sessions
        weeklySessions.forEach(s => {
            const tag = tags.find(t => t.id === s.tag_id);
            if (tag) {
                const groupIcon = tag.icon || '';
                const group = dbGroups.find((g: any) => g.icon === groupIcon);
                const groupName = group?.name || tag.name || '기타';
                const groupColor = group?.color || tag.color || '#888888';
                
                const key = groupIcon || tag.name;
                if (!groupMap[key]) {
                    groupMap[key] = {
                        name: groupName,
                        color: groupColor,
                        icon: groupIcon || 'Cpu',
                        duration: 0
                    };
                }
                groupMap[key].duration += s.duration;
            }
        });

        // Add live timer session if active
        if (activeTagId) {
            const tag = tags.find(t => t.id === activeTagId);
            if (tag) {
                const groupIcon = tag.icon || '';
                const group = dbGroups.find((g: any) => g.icon === groupIcon);
                const groupName = group?.name || tag.name || '기타';
                const groupColor = group?.color || tag.color || '#888888';
                
                const key = groupIcon || tag.name;
                if (!groupMap[key]) {
                    groupMap[key] = {
                        name: groupName,
                        color: groupColor,
                        icon: groupIcon || 'Cpu',
                        duration: 0
                    };
                }
                groupMap[key].duration += currentTimeMs;
            }
        }

        return Object.values(groupMap).sort((a, b) => b.duration - a.duration);
    }, [weeklySessions, tags, dbGroups, activeTagId, currentTimeMs]);

    const timeByTagWeekly = useMemo(() => {
        const map: Record<string, { name: string; color: string; icon?: string; duration: number }> = {};
        
        // Sum up from DB sessions
        weeklySessions.forEach(s => {
            const tag = tags.find(t => t.id === s.tag_id);
            if (tag) {
                if (!map[s.tag_id]) {
                    map[s.tag_id] = { name: tag.name, color: tag.color, icon: tag.icon, duration: 0 };
                }
                map[s.tag_id].duration += s.duration;
            }
        });

        // Add live timer session if active
        if (activeTagId) {
            const tag = tags.find(t => t.id === activeTagId);
            if (tag) {
                if (!map[activeTagId]) {
                    map[activeTagId] = { name: tag.name, color: tag.color, icon: tag.icon, duration: 0 };
                }
                map[activeTagId].duration += currentTimeMs;
            }
        }

        return Object.values(map).sort((a, b) => b.duration - a.duration);
    }, [weeklySessions, tags, activeTagId, currentTimeMs]);

    // Calculate hourly distribution (timeline) for the selected date
    const hourData = useMemo(() => {
        const startMs = new Date(displayDateStr).setHours(0, 0, 0, 0);
        // live timer 는 오늘 볼 때만 반영
        const activeStartTime = (isToday && activeTagId) ? Date.now() - currentTimeMs : null;

        const distribution = Array.from({ length: 24 }, (_, i) => {
            const hStart = startMs + i * 3600000;
            const hEnd = hStart + 3600000;

            const hourSessions = todaySessions.filter(s => {
                const sStart = new Date(s.created_at).getTime();
                const sEnd = sStart + s.duration;
                return Math.max(sStart, hStart) < Math.min(sEnd, hEnd);
            }).map(s => {
                const sStart = new Date(s.created_at).getTime();
                const sEnd = sStart + s.duration;
                return { 
                    tag_id: s.tag_id, 
                    start: Math.max(sStart, hStart), 
                    end: Math.min(sEnd, hEnd),
                    isSprint: s.is_sprint 
                };
            });

            if (activeStartTime && activeTagId) {
                const sStart = activeStartTime;
                const sEnd = Date.now();
                if (Math.max(sStart, hStart) < Math.min(sEnd, hEnd)) {
                    hourSessions.push({ 
                        tag_id: activeTagId, 
                        start: Math.max(sStart, hStart), 
                        end: Math.min(sEnd, hEnd),
                        isSprint: false 
                    });
                }
            }

            hourSessions.sort((a, b) => a.start - b.start);

            const segments: any[] = [];
            let currentLeft = hStart;

            hourSessions.forEach(s => {
                if (s.start > currentLeft) {
                    segments.push({ type: 'gap', start: currentLeft, duration: s.start - currentLeft });
                    currentLeft = s.start;
                }
                if (s.end > currentLeft) {
                    segments.push({ 
                        type: 'session', 
                        start: currentLeft, 
                        duration: s.end - currentLeft, 
                        tagId: s.tag_id,
                        isSprint: s.isSprint
                    });
                    currentLeft = s.end;
                }
            });

            if (currentLeft < hEnd) {
                segments.push({ type: 'gap', start: currentLeft, duration: hEnd - currentLeft });
            }

            const totalInHour = segments.filter(seg => seg.type === 'session').reduce((acc, curr) => acc + curr.duration, 0);

            return { hour: i, total: totalInHour, segments };
        });

        return distribution;
    }, [todaySessions, activeTagId, currentTimeMs, isToday, displayDateStr]);

    // Task completion dots for timeline
    const completedTaskDots = useMemo(() => {
        return completedToday
            .filter(t => t.completed_at)
            .map(t => ({
                time: new Date(t.completed_at).getTime(),
                label: t.content,
                tagId: t.tag_id
            }));
    }, [completedToday]);

    // Group tasks by book (rootContent) — one card per book
    const taskChunks = useMemo(() => {
        const list = mode === "daily" ? completedToday : completedWeekly;
        if (list.length === 0) return [];

        // Build ordered map: rootContent -> tasks[]
        const grouped: Map<string, any[]> = new Map();
        list.forEach(task => {
            const root = task.rootContent || "기타";
            if (!grouped.has(root)) grouped.set(root, []);
            grouped.get(root)!.push(task);
        });

        // Return as array of chunks (each chunk = tasks for one book)
        return Array.from(grouped.values());
    }, [completedToday, completedWeekly, mode]);

    // Build Cards Definition Array
    const cards = useMemo(() => {
        const cardsList: any[] = [];
        if (mode === "daily") {
            // Cover
            cardsList.push({ cardType: "cover" });

            // Timeline
            const hasActivity = hourData.some(h => h.total > 0) || activeTagId;
            if (hasActivity) {
                cardsList.push({ cardType: "timeline" });
            }

            // Donut chart of groups (only if there is recorded focus time)
            if (timeByGroupToday.length > 0) {
                cardsList.push({ cardType: "donut" });
            }

            // One group-detail page per group that has focus time today
            if (timeByTagToday.length > 0) {
                const activeGroupIcons = Array.from(new Set(timeByTagToday.map(t => t.icon || '').filter(Boolean)));
                activeGroupIcons.forEach(icon => {
                    cardsList.push({ cardType: "group-detail", activeGroupIcon: icon });
                });
            }

            // Completed Tasks (chunked)
            if (taskChunks.length > 0) {
                taskChunks.forEach((chunk) => {
                    cardsList.push({ cardType: "tasks", chunk });
                });
            } else {
                cardsList.push({ cardType: "tasks", chunk: [] });
            }

            // 오늘의 한마디 (Quote card)
            cardsList.push({ cardType: "quote" });
        } else {
            // Weekly Cover
            cardsList.push({ cardType: "cover" });

            // Weekly Chart
            cardsList.push({ cardType: "weekly-chart" });

            // Weekly Tag Groups
            if (timeByGroupWeekly.length > 0) {
                cardsList.push({ cardType: "weekly-tags" });
            }

            // One group-detail page per group that has focus time this week
            if (timeByTagWeekly.length > 0) {
                const activeGroupIcons = Array.from(new Set(timeByTagWeekly.map(t => t.icon || '').filter(Boolean)));
                activeGroupIcons.forEach(icon => {
                    cardsList.push({ cardType: "group-detail", activeGroupIcon: icon });
                });
            }

            // Weekly Tasks (paginated)
            if (taskChunks.length > 0) {
                taskChunks.forEach((chunk) => {
                    cardsList.push({ cardType: "tasks", chunk });
                });
            } else {
                cardsList.push({ cardType: "tasks", chunk: [] });
            }

            // Weekly Reflections
            cardsList.push({ cardType: "reflection" });
        }
        return cardsList;
    }, [mode, timeByGroupToday, timeByGroupWeekly, timeByTagToday, timeByTagWeekly, hourData, activeTagId, taskChunks]);

    // Reset index on mode change
    useEffect(() => {
        setActiveIndex(0);
    }, [mode]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            if (typeof document !== 'undefined' && 'fonts' in document) {
                await (document as any).fonts.ready;
            }
            
            // Loop through each card in DOM and export sequentially
            for (let i = 0; i < cards.length; i++) {
                const cardEl = document.querySelector(`[data-card-index="${i + 1}"]`) as HTMLDivElement;
                if (!cardEl) continue;

                // Minimal delay to let rendering settle
                await new Promise(resolve => setTimeout(resolve, 300));

                const canvasWidth = 600;
                const canvasHeight = 600;

                const dataUrl = await toPng(cardEl, {
                    cacheBust: true,
                    pixelRatio: 2,
                    width: canvasWidth,
                    height: canvasHeight,
                    style: {
                        width: `${canvasWidth}px`,
                        height: `${canvasHeight}px`,
                    }
                });

                const link = document.createElement('a');
                link.download = `card-news-${mode}-${displayDateStr}-${String(i + 1).padStart(2, '0')}.png`;
                link.href = dataUrl;
                link.click();
            }

            if (onOpenChange) onOpenChange(false);
        } catch (err) {
            console.error("Failed to export card news:", err);
            alert("Failed to export all cards. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] max-h-[92vh] bg-[#121214] border-neutral-800 text-white overflow-hidden flex flex-col p-0 rounded-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-neutral-100">
                        <Share2 className="w-5 h-5 text-neutral-200" />
                        카드뉴스 내보내기
                        {!isToday && (
                            <span className="text-sm font-normal text-rose-400 ml-1">
                                ({displayDateStr})
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400 text-xs">
                        오늘 하루 또는 이번 주의 성과를 인스타, 블로그 등에 올리기 좋은 카드뉴스 형태로 내보냅니다.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs selection */}
                <div className="flex border-b border-neutral-800 px-6">
                    <button
                        onClick={() => setMode("daily")}
                        className={cn(
                            "py-3 px-4 text-sm font-semibold border-b-2 transition-all",
                            mode === "daily" ? "border-rose-400 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        일간 카드뉴스 (Daily)
                    </button>
                    <button
                        onClick={() => setMode("weekly")}
                        className={cn(
                            "py-3 px-4 text-sm font-semibold border-b-2 transition-all",
                            mode === "weekly" ? "border-rose-400 text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        주간 카드뉴스 (Weekly)
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 gap-0">
                    {/* Left: Comment & Info input (2/5 size) */}
                    <div className="p-6 space-y-6 bg-neutral-900/30 col-span-2 border-r border-neutral-800 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-6">
                            {mode === "daily" ? (
                                <div className="space-y-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">오늘의 요약</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                            <span className="text-xs text-neutral-500 block">완료 과제</span>
                                            <span className="text-lg font-black text-white">{completedToday.length}개</span>
                                        </div>
                                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                            <span className="text-xs text-neutral-500 block">집중 시간</span>
                                            <span className="text-lg font-black text-white">
                                                {Math.floor(timeByGroupToday.reduce((acc, t) => acc + t.duration, 0) / 60000)}분
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">주간 요약 ({weeklyRangeText})</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                            <span className="text-xs text-neutral-500 block">완료 과제</span>
                                            <span className="text-lg font-black text-rose-300">{completedWeekly.length}개</span>
                                        </div>
                                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                                            <span className="text-xs text-neutral-500 block">총 집중 시간</span>
                                            <span className="text-lg font-black text-white">
                                                {Math.floor(weeklyTotalDuration / 3600000)}시간
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mode === "daily" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">오늘의 한마디 (회고)</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="오늘의 소감이나 명언을 입력해보세요..."
                                        className="w-full h-28 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-sm font-light focus:outline-none focus:border-rose-500/50 transition-all resize-none placeholder:text-neutral-700 text-white"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-neutral-900/50 border border-neutral-800/80 rounded-xl flex items-start gap-2.5 mt-4">
                            <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                                다운로드 시 {cards.length}장의 카드가 순서대로 기기에 저장됩니다. 팝업 차단이 설정되어 있을 경우 해제해주세요.
                            </p>
                        </div>
                    </div>

                    {/* Right: Carousel Preview (3/5 size) */}
                    <div className="relative bg-[#0d0d0f] col-span-3 flex flex-col justify-between overflow-hidden">
                        <div className="p-4 border-b border-neutral-900 bg-neutral-900/20 flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">PREVIEW</span>
                            <span className="text-xs font-bold font-mono text-neutral-400">
                                CARD {activeIndex + 1} OF {cards.length}
                            </span>
                        </div>

                        {/* Interactive Slide Viewer */}
                        <div className="flex-1 flex items-center justify-center p-6 relative">
                            {/* Slide Renderer */}
                            <div className="w-[300px] h-[300px] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative">
                                <div style={{ zoom: 0.5 }} className="w-[600px] h-[600px] origin-top-left absolute left-0 top-0">
                                    {cards[activeIndex] && (
                                        <ExportCard
                                            type={mode}
                                            cardType={cards[activeIndex].cardType}
                                            date={displayDateStr}
                                            cardIndex={activeIndex + 1}
                                            totalCards={cards.length}
                                            userName={userName}
                                            completedTasks={cards[activeIndex].chunk || completedToday}
                                            timeByTag={mode === "daily" ? timeByTagToday : timeByTagWeekly}
                                            timeByGroup={mode === "daily" ? timeByGroupToday : timeByGroupWeekly}
                                            comment={comment}
                                            weeklyRangeText={weeklyRangeText}
                                            weeklyDailyTimes={weeklyDailyTimes}
                                            weeklyTotalDuration={weeklyTotalDuration}
                                            weeklyCompletedCount={completedWeekly.length}
                                            weeklyReflectionComments={weeklyComments.map(c => ({ date: c.date, comment: c.comment }))}
                                            hourData={hourData}
                                            completedTaskDots={completedTaskDots}
                                            tags={tags}
                                            dbGroups={dbGroups}
                                            activeGroupIcon={cards[activeIndex].activeGroupIcon}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Carousel Controls */}
                            {activeIndex > 0 && (
                                <button
                                    onClick={() => setActiveIndex(prev => prev - 1)}
                                    className="absolute left-4 w-9 h-9 rounded-full bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                </button>
                            )}
                            {activeIndex < cards.length - 1 && (
                                <button
                                    onClick={() => setActiveIndex(prev => prev + 1)}
                                    className="absolute right-4 w-9 h-9 rounded-full bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Card Pagination Dots */}
                        <div className="py-4 flex justify-center gap-1.5 shrink-0 bg-neutral-900/10">
                            {cards.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all",
                                        activeIndex === idx ? "bg-rose-400 w-4" : "bg-neutral-700 hover:bg-neutral-500"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-[#121214] flex items-center justify-between sm:justify-between border-t border-neutral-800">
                    <p className="text-[10px] text-neutral-500 font-bold tracking-widest font-mono">
                        LAYOUT: CARD NEWS v2
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost" 
                            onClick={() => onOpenChange?.(false)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                        >
                            닫기
                        </Button>
                        <Button 
                            onClick={handleExport}
                            disabled={isExporting || loadingWeekly}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-6 flex items-center gap-2 h-10 transition-colors text-xs font-semibold"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? "다운로드 중..." : "모든 카드 저장"}
                        </Button>
                    </div>
                </DialogFooter>

                {/* Hidden containers (fully scaled 1:1) to capture with html-to-image */}
                <div 
                    style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -100 }} 
                    className="opacity-0 pointer-events-none flex"
                    aria-hidden="true"
                >
                    {cards.map((card, idx) => (
                        <ExportCard
                            key={idx}
                            type={mode}
                            cardType={card.cardType}
                            date={displayDateStr}
                            cardIndex={idx + 1}
                            totalCards={cards.length}
                            userName={userName}
                            completedTasks={card.chunk || completedToday}
                            timeByTag={mode === "daily" ? timeByTagToday : timeByTagWeekly}
                            timeByGroup={mode === "daily" ? timeByGroupToday : timeByGroupWeekly}
                            comment={comment}
                            weeklyRangeText={weeklyRangeText}
                            weeklyDailyTimes={weeklyDailyTimes}
                            weeklyTotalDuration={weeklyTotalDuration}
                            weeklyCompletedCount={completedWeekly.length}
                            weeklyReflectionComments={weeklyComments.map(c => ({ date: c.date, comment: c.comment }))}
                            hourData={hourData}
                            completedTaskDots={completedTaskDots}
                            tags={tags}
                            dbGroups={dbGroups}
                            activeGroupIcon={card.activeGroupIcon}
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
