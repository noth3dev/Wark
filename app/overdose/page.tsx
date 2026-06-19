"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Coffee, 
    Plus, 
    History, 
    Zap, 
    Calendar, 
    BarChart3, 
    Trash2, 
    AlertCircle,
    Clock,
    TrendingUp,
    Target,
    Check,
    Pencil,
    Minus,
    ChevronRight,
    Keyboard
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { caffeineService, CaffeineIntake } from "../../lib/services/caffeineService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { 
    format, 
    startOfDay, 
    startOfWeek, 
    startOfMonth,
} from "date-fns";

const CAFFEINE_HALF_LIFE = 5; // hours

interface PresetType {
    name: string;
    amount: number;
    description: string;
}

const PRESETS: PresetType[] = [
    { name: "데자와", amount: 80, description: "부드러운 홍차 음료" },
    { name: "몬스터", amount: 100, description: "강렬한 에너지 드링크" },
    { name: "핫식스", amount: 100, description: "대중적인 에너지 드링크" },
    { name: "Mutant", amount: 200, description: "고함량 익스트림 에너지" },
    { name: "에너지샷", amount: 100, description: "빠르고 진한 한 방" },
];

export default function OverdosePage() {
    const { user } = useAuth();
    const [intakes, setIntakes] = useState<CaffeineIntake[]>([]);
    
    // 섭취 등록 관련 상태
    const [selectedPreset, setSelectedPreset] = useState<string>("데자와");
    const [customAmount, setCustomAmount] = useState<string>("100");
    const [intakeTime, setIntakeTime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [isLoading, setIsLoading] = useState(true);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [viewMode, setViewMode] = useState<"24h" | "7d" | "30d">("24h");
    const [previewAmount, setPreviewAmount] = useState<number | null>(null);

    // 목표 카페인 농도 (DB 연동)
    const [targetLevel, setTargetLevel] = useState<number>(80);
    const [targetInput, setTargetInput] = useState<string>("80");
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [isSavingTarget, setIsSavingTarget] = useState(false);

    // DB에서 목표 농도 불러오기
    useEffect(() => {
        if (!user) return;
        caffeineService.getTarget(user.id).then(val => {
            setTargetLevel(val);
            setTargetInput(String(val));
        });
    }, [user]);

    const handleSaveTarget = async () => {
        if (!user) return;
        const val = parseFloat(targetInput);
        if (isNaN(val) || val <= 0) return;
        setIsSavingTarget(true);
        try {
            await caffeineService.setTarget(user.id, val);
            setTargetLevel(val);
        } catch (e) {
            console.error("Failed to save target:", e);
        } finally {
            setIsSavingTarget(false);
            setIsEditingTarget(false);
        }
    };

    const adjustTarget = async (delta: number) => {
        if (!user) return;
        const newVal = Math.max(1, Math.round((targetLevel + delta) * 10) / 10);
        setTargetLevel(newVal);
        setTargetInput(String(newVal));
        try {
            await caffeineService.setTarget(user.id, newVal);
        } catch (e) {
            console.error("Failed to save target:", e);
        }
    };

    // 다음 섭취 권장 시각
    const nextIntakeInfo = (() => {
        if (currentLevel <= targetLevel || targetLevel <= 0) {
            return { ready: true, hoursUntil: 0, nextTime: null };
        }
        const hoursUntil = CAFFEINE_HALF_LIFE * Math.log2(currentLevel / targetLevel);
        const nextTime = new Date(Date.now() + hoursUntil * 3600 * 1000);
        return { ready: false, hoursUntil, nextTime };
    })();

    const fetchIntakes = useCallback(async () => {
        if (!user) return;
        try {
            const data = await caffeineService.getIntakes(user.id);
            setIntakes(data);
        } catch (error) {
            console.error("Failed to fetch intakes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchIntakes();
    }, [fetchIntakes]);

    const calculateCurrentCaffeine = useCallback(() => {
        const now = new Date();
        let total = 0;
        intakes.forEach(intake => {
            const timeDiff = (now.getTime() - new Date(intake.intake_at).getTime()) / (1000 * 60 * 60);
            if (timeDiff >= 0) {
                total += intake.amount * Math.pow(0.5, timeDiff / CAFFEINE_HALF_LIFE);
            }
        });
        setCurrentLevel(total);
    }, [intakes]);

    useEffect(() => {
        calculateCurrentCaffeine();
        const interval = setInterval(calculateCurrentCaffeine, 100);
        return () => clearInterval(interval);
    }, [calculateCurrentCaffeine]);

    const handleAddIntake = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        let finalAmount = 0;
        if (selectedPreset === "custom") {
            finalAmount = parseFloat(customAmount);
        } else {
            const preset = PRESETS.find(p => p.name === selectedPreset);
            finalAmount = preset ? preset.amount : 100;
        }

        if (isNaN(finalAmount) || finalAmount <= 0) return;

        try {
            await caffeineService.addIntake(user.id, finalAmount, new Date(intakeTime));
            // 시간 초기화
            setIntakeTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
            fetchIntakes();
            window.dispatchEvent(new Event("caffeine-update"));
        } catch (error) {
            console.error("Failed to add intake:", error);
        }
    };

    const handleDeleteIntake = async (id: string) => {
        try {
            await caffeineService.deleteIntake(id);
            fetchIntakes();
            window.dispatchEvent(new Event("caffeine-update"));
        } catch (error) {
            console.error("Failed to delete intake:", error);
        }
    };

    const getStats = () => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const weekStart = startOfWeek(now);
        const monthStart = startOfMonth(now);
        let daily = 0, weekly = 0, monthly = 0;
        intakes.forEach(intake => {
            const date = new Date(intake.intake_at);
            if (date >= todayStart) daily += intake.amount;
            if (date >= weekStart) weekly += intake.amount;
            if (date >= monthStart) monthly += intake.amount;
        });
        return { daily, weekly, monthly };
    };

    const stats = getStats();

    const getStatusColor = (level: number) => {
        if (level < 100) return "text-emerald-400";
        if (level < 250) return "text-amber-400";
        return "text-rose-500";
    };

    const getStatusText = (level: number) => {
        if (level < 100) return "쾌적 / 안전";
        if (level < 200) return "각성 활성화";
        if (level < 300) return "가벼운 흥분";
        return "과다 섭취 경고";
    };

    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; timeStr: string; isFuture: boolean } | null>(null);

    // 그래프 좌표 계산 및 렌더링
    const renderGraph = () => {
        const now = new Date();
        const width = 600;
        const height = 180;
        const padding = { top: 15, bottom: 25, left: 35, right: 15 };
        
        if (viewMode === "24h") {
            // 24시간 범위: 현재 시간 기준 -12시간 ~ +12시간
            const pointsCount = 49; // 30분 간격
            const chartData: { x: number; y: number; val: number; previewVal: number; timeStr: string; isFuture: boolean }[] = [];
            
            const minMaxLevel = Math.max(150, targetLevel * 1.5);
            let maxVal = minMaxLevel;

            for (let i = 0; i < pointsCount; i++) {
                const offsetHours = -12 + (i * 0.5);
                const time = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
                
                // 특정 시간의 카페인 잔여량 계산
                let level = 0;
                intakes.forEach(intake => {
                    const intakeTimeMs = new Date(intake.intake_at).getTime();
                    const timeDiff = (time.getTime() - intakeTimeMs) / (1000 * 60 * 60);
                    if (timeDiff >= 0) {
                        level += intake.amount * Math.pow(0.5, timeDiff / CAFFEINE_HALF_LIFE);
                    }
                });

                // 섭취 시뮬레이션 농도 계산 (현재 시각 이후에만 영향)
                let previewLevel = level;
                if (previewAmount !== null && offsetHours >= 0) {
                    previewLevel += previewAmount * Math.pow(0.5, offsetHours / CAFFEINE_HALF_LIFE);
                }

                if (level > maxVal) maxVal = level;
                if (previewLevel > maxVal) maxVal = previewLevel;

                const isFuture = offsetHours > 0;
                const timeStr = format(time, "HH:mm");
                
                chartData.push({
                    x: padding.left + (i / (pointsCount - 1)) * (width - padding.left - padding.right),
                    y: 0, // 계산 후 적용
                    val: level,
                    previewVal: previewLevel,
                    timeStr,
                    isFuture
                });
            }

            // Y값 좌표 보정
            chartData.forEach(p => {
                p.y = height - padding.bottom - (p.val / maxVal) * (height - padding.top - padding.bottom);
            });

            // Path generation
            let linePath = "";
            let previewLinePath = "";
            let areaPath = `M ${chartData[0].x} ${height - padding.bottom} `;
            
            chartData.forEach((p, idx) => {
                if (idx === 0) {
                    linePath += `M ${p.x} ${p.y} `;
                } else {
                    linePath += `L ${p.x} ${p.y} `;
                }
                areaPath += `L ${p.x} ${p.y} `;

                // Preview path
                const previewY = height - padding.bottom - (p.previewVal / maxVal) * (height - padding.top - padding.bottom);
                if (idx === 0) {
                    previewLinePath += `M ${p.x} ${previewY} `;
                } else {
                    previewLinePath += `L ${p.x} ${previewY} `;
                }
            });
            
            areaPath += `L ${chartData[chartData.length - 1].x} ${height - padding.bottom} Z`;

            // 가이드선 및 타겟선 위치
            const targetY = height - padding.bottom - (targetLevel / maxVal) * (height - padding.top - padding.bottom);
            const currentX = padding.left + (12 / 24) * (width - padding.left - padding.right); // -12h ~ +12h이므로 50%가 현재 시각
            const stepWidth = (width - padding.left - padding.right) / (pointsCount - 1);

            return (
                <div className="relative w-full h-[200px]">
                    <svg className="w-full h-full text-neutral-600 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* 격자선 (수평선 3개) */}
                        {[0.25, 0.5, 0.75].map((ratio, idx) => {
                            const yVal = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
                            const labelVal = Math.round(ratio * maxVal);
                            return (
                                <g key={idx}>
                                    <line x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} className="stroke-neutral-800/60" strokeDasharray="4,4" />
                                    <text x={padding.left - 8} y={yVal + 3} className="fill-neutral-500 font-mono text-[9px] text-right" textAnchor="end">{labelVal}mg</text>
                                </g>
                            );
                        })}

                        {/* 목표 농도 가이드선 */}
                        {targetY > padding.top && targetY < height - padding.bottom && (
                            <g>
                                <line x1={padding.left} y1={targetY} x2={width - padding.right} y2={targetY} className="stroke-amber-500/40" strokeWidth="1.5" strokeDasharray="3,2" />
                                <text x={width - padding.right - 4} y={targetY - 4} className="fill-amber-500/70 font-suit text-[9px] font-semibold" textAnchor="end">목표 농도 ({targetLevel}mg)</text>
                            </g>
                        )}

                        {/* 면적 채우기 */}
                        <path d={areaPath} fill="url(#chartGrad)" />

                        {/* 메인 꺾은선 */}
                        <path d={linePath} fill="none" className="stroke-amber-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* 섭취 시뮬레이션 예상선 (점선) */}
                        {previewAmount !== null && (
                            <g>
                                <path d={previewLinePath} fill="none" className="stroke-emerald-400" strokeWidth="2" strokeDasharray="4,3" />
                                <text 
                                    x={width - padding.right - 4} 
                                    y={height - padding.bottom - (chartData[chartData.length - 1].previewVal / maxVal) * (height - padding.top - padding.bottom) - 6} 
                                    className="fill-emerald-400 font-suit text-[9px] font-bold" 
                                    textAnchor="end"
                                >
                                    +{previewAmount}mg 섭취 시 예상 추이
                                </text>
                            </g>
                        )}

                        {/* 현재 시각 (수직 기준선) */}
                        <line x1={currentX} y1={padding.top} x2={currentX} y2={height - padding.bottom} className="stroke-emerald-400/50" strokeWidth="1" strokeDasharray="4,4" />
                        <circle cx={currentX} cy={chartData[24].y} r="4.5" className="fill-emerald-400 stroke-neutral-950" strokeWidth="2" />
                        
                        {/* 호버 가이드라인 및 서클 */}
                        {hoveredPoint && (
                            <g>
                                <line x1={hoveredPoint.x} y1={padding.top} x2={hoveredPoint.x} y2={height - padding.bottom} className="stroke-amber-400/40" strokeWidth="1.5" strokeDasharray="3,3" />
                                <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" className="fill-amber-400 stroke-neutral-950 animate-pulse" strokeWidth="2.5" />
                            </g>
                        )}

                        {/* 축선 */}
                        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="stroke-neutral-800" strokeWidth="1" />

                        {/* 시간 축 레이블 */}
                        {[0, 6, 12, 18, 24].map((pointIdx, idx) => {
                            const dataIdx = Math.round((pointIdx / 24) * (pointsCount - 1));
                            const p = chartData[dataIdx];
                            if (!p) return null;
                            const isNow = pointIdx === 12;
                            return (
                                <g key={idx}>
                                    <text x={p.x} y={height - 8} className={`font-mono text-[9px] ${isNow ? 'fill-emerald-400 font-bold' : 'fill-neutral-500'}`} textAnchor="middle">
                                        {isNow ? "현재" : p.timeStr}
                                    </text>
                                </g>
                            );
                        })}

                        {/* 상호작용 가능한 투명 영역 (호버 핸들러용) */}
                        {chartData.map((p, i) => (
                            <rect
                                key={`hover-${i}`}
                                x={p.x - stepWidth / 2}
                                y={padding.top}
                                width={stepWidth}
                                height={height - padding.top - padding.bottom}
                                fill="transparent"
                                className="cursor-crosshair"
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseMove={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        ))}
                    </svg>

                    {/* 예측 툴팁 */}
                    {hoveredPoint && (
                        <div 
                            className="absolute bg-neutral-900/95 border border-neutral-800 text-[10px] p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-0.5 z-20 min-w-[100px] backdrop-blur-sm"
                            style={{
                                left: `${(hoveredPoint.x / width) * 100}%`,
                                top: `${(hoveredPoint.y / height) * 100 - 15}%`,
                                transform: "translate(-50%, -100%)",
                            }}
                        >
                            <div className="flex items-center gap-1.5 justify-between">
                                <span className="text-neutral-500 font-semibold font-suit">{hoveredPoint.isFuture ? "예측" : "과거"}</span>
                                <span className="font-mono text-neutral-300 font-bold">{hoveredPoint.timeStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-between border-t border-neutral-800/80 pt-1 mt-1">
                                <span className="text-neutral-500 font-semibold font-suit">농도</span>
                                <span className="font-mono text-amber-400 font-bold">{hoveredPoint.val.toFixed(1)} mg</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            // "7d" 또는 "30d" 누적 섭취량 막대그래프
            const days = viewMode === "7d" ? 7 : 30;
            const barData: { label: string; amount: number; dateStr: string; x: number; y: number }[] = [];
            const today = startOfDay(new Date());

            const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                const start = startOfDay(d);
                const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                let total = 0;
                intakes.forEach(intake => {
                    const t = new Date(intake.intake_at);
                    if (t >= start && t < end) {
                        total += intake.amount;
                    }
                });

                const label = days === 7 
                    ? dayNames[d.getDay()] 
                    : format(d, "d");

                barData.push({
                    label,
                    amount: total,
                    dateStr: format(d, "M월 d일"),
                    x: 0,
                    y: 0
                });
            }

            const maxBarVal = Math.max(200, ...barData.map(b => b.amount));
            const chartWidth = width - padding.left - padding.right;
            const barWidth = days === 7 ? 35 : 10;
            const spacing = (chartWidth - days * barWidth) / (days === 7 ? 6 : 29);

            barData.forEach((b, i) => {
                b.x = padding.left + i * (barWidth + spacing) + barWidth / 2;
                b.y = height - padding.bottom - (b.amount / maxBarVal) * (height - padding.top - padding.bottom);
            });

            return (
                <div className="relative w-full h-[200px]">
                    <svg className="w-full h-full text-neutral-600 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        {/* 격자선 (수평선 3개) */}
                        {[0.25, 0.5, 0.75].map((ratio, idx) => {
                            const yVal = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
                            const labelVal = Math.round(ratio * maxBarVal);
                            return (
                                <g key={idx}>
                                    <line x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} className="stroke-neutral-800/60" strokeDasharray="4,4" />
                                    <text x={padding.left - 8} y={yVal + 3} className="fill-neutral-500 font-mono text-[9px] text-right" textAnchor="end">{labelVal}mg</text>
                                </g>
                            );
                        })}

                        {/* 막대 그리기 */}
                        {barData.map((b, i) => {
                            const barHeight = height - padding.bottom - b.y;
                            const isHovered = hoveredPoint && Math.abs(hoveredPoint.x - b.x) < 5;
                            return (
                                <g key={i}>
                                    <rect
                                        x={b.x - barWidth / 2}
                                        y={b.y}
                                        width={barWidth}
                                        height={Math.max(2, barHeight)}
                                        rx={days === 7 ? 3 : 1}
                                        ry={days === 7 ? 3 : 1}
                                        className={`transition-all duration-200 ${
                                            isHovered ? "fill-amber-400" : "fill-neutral-800 hover:fill-amber-500/80"
                                        }`}
                                    />
                                    {/* 상호작용 투명 사각형 */}
                                    <rect
                                        x={b.x - barWidth / 2 - spacing / 2}
                                        y={padding.top}
                                        width={barWidth + spacing}
                                        height={height - padding.top - padding.bottom}
                                        fill="transparent"
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredPoint({ x: b.x, y: b.y, val: b.amount, timeStr: b.dateStr, isFuture: false })}
                                        onMouseMove={() => setHoveredPoint({ x: b.x, y: b.y, val: b.amount, timeStr: b.dateStr, isFuture: false })}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                </g>
                            );
                        })}

                        {/* 축선 */}
                        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="stroke-neutral-800" strokeWidth="1" />

                        {/* 레이블 */}
                        {barData.map((b, idx) => {
                            const showLabel = days === 7 || idx % 5 === 0 || idx === days - 1;
                            if (!showLabel) return null;
                            return (
                                <text key={idx} x={b.x} y={height - 8} className="fill-neutral-500 font-suit text-[9px]" textAnchor="middle">
                                    {b.label}
                                </text>
                            );
                        })}
                    </svg>

                    {/* 막대그래프 툴팁 */}
                    {hoveredPoint && (
                        <div 
                            className="absolute bg-neutral-900/95 border border-neutral-800 text-[10px] p-2 rounded-lg shadow-xl pointer-events-none flex flex-col gap-0.5 z-20 min-w-[100px] backdrop-blur-sm"
                            style={{
                                left: `${(hoveredPoint.x / width) * 100}%`,
                                top: `${(hoveredPoint.y / height) * 100 - 15}%`,
                                transform: "translate(-50%, -100%)",
                            }}
                        >
                            <div className="flex items-center gap-1.5 justify-between">
                                <span className="text-neutral-500 font-semibold font-suit">날짜</span>
                                <span className="font-mono text-neutral-300 font-bold">{hoveredPoint.timeStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-between border-t border-neutral-800/80 pt-1 mt-1">
                                <span className="text-neutral-500 font-semibold font-suit">섭취량</span>
                                <span className="font-mono text-amber-400 font-bold">{hoveredPoint.val} mg</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] bg-[#0a0a0a]">
                <p className="text-neutral-500 font-suit">로그인 후 카페인 트래커를 이용해보세요.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0a0a0a] text-neutral-200 font-pretendard p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-900 pb-5">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold font-suit tracking-tight text-neutral-100 flex items-center gap-2.5"
                        >
                            <Coffee className="w-6 h-6 text-amber-400" />
                            카페인 트래커
                        </motion.h1>
                        <p className="text-neutral-500 text-xs mt-1.5 font-suit">체내 카페인 수치를 시각화하고 최적의 각성 시기를 관리합니다.</p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 border-neutral-800 bg-neutral-900/50 text-[11px] text-neutral-400 font-suit shrink-0 self-start md:self-auto">
                        <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        평균 반감기: 5시간
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (차트 & 상태) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 현재 농도 정보 및 커스텀 SVG 차트 */}
                        <Card className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl overflow-hidden relative p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider block">CURRENT CAFFEINE LEVEL</span>
                                    <h3 className="text-3xl font-extrabold font-mono text-neutral-100 mt-1 flex items-baseline gap-1">
                                        {currentLevel.toFixed(1)}
                                        <span className="text-xs text-neutral-500 font-medium">mg</span>
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800/80 ${getStatusColor(currentLevel)}`}>
                                        {getStatusText(currentLevel)}
                                    </span>
                                </div>
                            </div>

                            {/* 탭 전환기 */}
                            <div className="flex gap-1.5 mb-3 border-b border-neutral-900 pb-2">
                                {[
                                    { id: "24h", label: "24시간 예측" },
                                    { id: "7d", label: "주간 누적" },
                                    { id: "30d", label: "월간 누적" }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setViewMode(tab.id as any)}
                                        className={`text-[11px] px-2.5 py-1 rounded-md transition-colors font-suit font-semibold cursor-pointer ${
                                            viewMode === tab.id
                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                                        }`}
                                    >
                                        {tab.id === "24h" && previewAmount !== null && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* 그래프 */}
                            {renderGraph()}

                            {/* Info Pills */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Clear time */}
                                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-neutral-900/40 border border-neutral-900/80">
                                    <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-500 font-semibold font-suit">체내 완전 방출 시간</span>
                                        <span className="text-xs font-mono text-neutral-200 mt-0.5">
                                            {currentLevel > 0.5 
                                                ? `약 ${(CAFFEINE_HALF_LIFE * Math.log2(currentLevel / 0.5)).toFixed(1)}시간 후` 
                                                : "완전히 소진됨"}
                                        </span>
                                    </div>
                                </div>

                                {/* Next intake recommendation */}
                                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-all ${
                                    nextIntakeInfo.ready 
                                        ? "bg-emerald-500/5 border-emerald-500/10" 
                                        : "bg-amber-500/5 border-amber-500/10"
                                }`}>
                                    <Target className={`w-4 h-4 shrink-0 ${nextIntakeInfo.ready ? "text-emerald-400" : "text-amber-400"}`} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-500 font-semibold font-suit">다음 권장 섭취 시각</span>
                                        <span className={`text-xs font-mono font-bold mt-0.5 ${nextIntakeInfo.ready ? "text-emerald-400" : "text-amber-400"}`}>
                                            {nextIntakeInfo.ready
                                                ? "지금 즉시 가능"
                                                : nextIntakeInfo.nextTime
                                                    ? `${format(nextIntakeInfo.nextTime, "HH:mm")} (${nextIntakeInfo.hoursUntil.toFixed(1)}시간 후)`
                                                    : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 목표 농도 조절 */}
                        <Card className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-5">
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-200 font-suit flex items-center gap-2">
                                    <Target className="w-4 h-4 text-amber-400" />
                                    목표 각성 농도 설정
                                </h3>
                                <p className="text-neutral-500 text-[11px] font-suit mt-1">
                                    체내 농도가 이 수치 이하로 떨어지면 추가 섭취 알림을 계산합니다.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mt-5">
                                <button
                                    onClick={() => adjustTarget(-10)}
                                    className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                                >
                                    <Minus className="w-4 h-4 text-neutral-400" />
                                </button>

                                <div className="flex-1 text-center">
                                    {isEditingTarget ? (
                                        <div className="flex items-center gap-2 justify-center max-w-[150px] mx-auto">
                                            <Input
                                                type="number"
                                                value={targetInput}
                                                onChange={e => setTargetInput(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && handleSaveTarget()}
                                                className="bg-neutral-900 border-neutral-800 text-center font-mono text-base h-9 focus-visible:ring-amber-500/20"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveTarget}
                                                disabled={isSavingTarget}
                                                className="p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                                            >
                                                <Check className="w-3.5 h-3.5 text-amber-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setTargetInput(String(targetLevel)); setIsEditingTarget(true); }}
                                            className="inline-flex items-center gap-1.5 group cursor-pointer"
                                        >
                                            <span className="text-2xl font-bold font-mono text-amber-400 group-hover:text-amber-300 transition-colors">
                                                {targetLevel}
                                            </span>
                                            <span className="text-neutral-500 text-xs font-suit">mg</span>
                                            <Pencil className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => adjustTarget(10)}
                                    className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                                >
                                    <Plus className="w-4 h-4 text-neutral-400" />
                                </button>
                            </div>

                            {/* 상태 게이지 바 */}
                            <div className="mt-6 space-y-1.5">
                                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                                    <span>0mg</span>
                                    <span className="text-amber-400/80 font-suit">목표치: {targetLevel}mg</span>
                                    <span>300mg</span>
                                </div>
                                <div className="relative h-2 rounded-full bg-neutral-900 overflow-hidden">
                                    {/* 목표 마커 */}
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-amber-500/60 z-10"
                                        style={{ left: `${Math.min((targetLevel / 300) * 100, 100)}%` }}
                                    />
                                    {/* 현재 수치 */}
                                    <motion.div
                                        animate={{ width: `${Math.min((currentLevel / 300) * 100, 100)}%` }}
                                        transition={{ type: "spring", stiffness: 60 }}
                                        className={`absolute top-0 left-0 h-full rounded-full ${
                                            currentLevel < 100 ? "bg-emerald-500" :
                                            currentLevel < 250 ? "bg-amber-500" : "bg-rose-500"
                                        }`}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column (기록 입력 & 목록) */}
                    <div className="space-y-6">
                        {/* 섭취 등록 카드 */}
                        <Card className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-5">
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                                    카페인 섭취 등록
                                </h3>
                                <p className="text-neutral-500 text-[11px] font-suit mt-1">
                                    마신 음료 종류를 골라 손쉽게 기록하세요.
                                </p>
                            </div>

                            <form onSubmit={handleAddIntake} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-neutral-500 uppercase font-semibold font-suit">섭취 종류 선택</label>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        {PRESETS.map(preset => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => setSelectedPreset(preset.name)}
                                                onMouseEnter={() => { setPreviewAmount(preset.amount); setViewMode("24h"); }}
                                                onMouseLeave={() => setPreviewAmount(null)}
                                                className={`p-3 rounded-lg border text-left transition-all font-suit flex flex-col justify-between h-[65px] cursor-pointer ${
                                                    selectedPreset === preset.name
                                                        ? "bg-amber-500/5 border-amber-500/40 text-amber-300"
                                                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-400"
                                                }`}
                                            >
                                                <div className="flex justify-between w-full items-start">
                                                    <span className="text-xs font-bold text-neutral-200">{preset.name}</span>
                                                    <span className="text-[10px] font-mono text-neutral-500">{preset.amount}mg</span>
                                                </div>
                                                <span className="text-[9px] text-neutral-500 font-normal truncate block w-full">{preset.description}</span>
                                            </button>
                                        ))}
                                        
                                        {/* 직접 입력 */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPreset("custom")}
                                            onMouseEnter={() => { setPreviewAmount(parseFloat(customAmount) || 100); setViewMode("24h"); }}
                                            onMouseLeave={() => setPreviewAmount(null)}
                                            className={`p-3 rounded-lg border text-left transition-all font-suit flex flex-col justify-between h-[65px] col-span-2 cursor-pointer ${
                                                selectedPreset === "custom"
                                                    ? "bg-amber-500/5 border-amber-500/40 text-amber-300"
                                                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-400"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Keyboard className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold text-neutral-200">직접 입력</span>
                                            </div>
                                            <span className="text-[9px] text-neutral-500 font-normal">원하는 카페인 함량을 직접 입력합니다.</span>
                                        </button>
                                    </div>
                                </div>

                                {selectedPreset === "custom" && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-1.5"
                                    >
                                        <label className="text-[10px] text-neutral-500 uppercase font-semibold font-suit">카페인 함량 (mg)</label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={customAmount} 
                                                onChange={e => {
                                                    setCustomAmount(e.target.value);
                                                    const amt = parseFloat(e.target.value);
                                                    setPreviewAmount(isNaN(amt) ? null : amt);
                                                }}
                                                onFocus={() => {
                                                    const amt = parseFloat(customAmount);
                                                    setPreviewAmount(isNaN(amt) ? null : amt);
                                                    setViewMode("24h");
                                                }}
                                                onBlur={() => setPreviewAmount(null)}
                                                className="bg-neutral-900 border-neutral-800 text-neutral-100 pr-10 focus-visible:ring-amber-500/20"
                                                placeholder="예: 150"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">mg</span>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-neutral-500 uppercase font-semibold font-suit">섭취 시각</label>
                                    <div className="relative">
                                        <Input 
                                            type="datetime-local" 
                                            value={intakeTime} 
                                            onChange={e => setIntakeTime(e.target.value)}
                                            className="bg-neutral-900 border-neutral-800 text-neutral-100 pl-10 focus-visible:ring-amber-500/20 font-mono text-xs"
                                        />
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-semibold font-suit transition-colors cursor-pointer text-xs h-9">
                                    <Plus className="w-4 h-4 mr-1" />
                                    섭취 기록 등록하기
                                </Button>
                            </form>
                        </Card>

                        {/* 최근 섭취 내역 */}
                        <Card className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-5">
                            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3">
                                <h3 className="text-sm font-semibold text-neutral-200 font-suit flex items-center gap-1.5">
                                    <History className="w-4 h-4 text-neutral-500" />
                                    최근 섭취 로그
                                </h3>
                                <span className="text-[10px] text-neutral-500 font-mono">총 {intakes.length}건</span>
                            </div>
                            
                            <ScrollArea className="h-[200px] pr-2">
                                <div className="space-y-2">
                                    <AnimatePresence initial={false}>
                                        {intakes.length === 0 ? (
                                            <p className="text-center py-10 text-neutral-500 text-xs italic font-suit">섭취 기록이 존재하지 않습니다.</p>
                                        ) : (
                                            intakes.map(intake => (
                                                <motion.div 
                                                    key={intake.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="group flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/50 border border-neutral-900 hover:border-neutral-800 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-400">
                                                            <Coffee className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-neutral-200">{intake.amount} mg</div>
                                                            <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                                                {format(new Date(intake.intake_at), "M월 d일 HH:mm")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteIntake(intake.id)}
                                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-neutral-500 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>
                </div>

                {/* 통계 요약 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "오늘 총 섭취량", value: stats.daily, icon: <Calendar className="w-4 h-4" /> },
                        { label: "주간 총 섭취량", value: stats.weekly, icon: <BarChart3 className="w-4 h-4" /> },
                        { label: "이번 달 총 섭취량", value: stats.monthly, icon: <History className="w-4 h-4" /> }
                    ].map((stat, i) => (
                        <Card key={i} className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] text-neutral-500 font-semibold font-suit flex items-center gap-1">
                                    {stat.icon}
                                    {stat.label}
                                </span>
                                <div className="text-xl font-bold font-mono text-neutral-100">
                                    {stat.value.toLocaleString()} <span className="text-[11px] text-neutral-500 font-normal font-suit">mg</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Info Alert */}
                <Card className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-5">
                    <div className="flex gap-3.5">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-amber-400 font-suit">카페인 섭취 주의 사항</h4>
                            <p className="text-[11px] text-neutral-400 leading-relaxed font-suit">
                                카페인 분해와 신진대사는 개인의 체질에 따라 매우 다릅니다. 나이, 체격 조건, 유전적 특징 및 건강 상태 등이 반감기에 영향을 줍니다.
                                식약처 권장 성인 일일 카페인 최대 섭취 권고량은 400mg입니다.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
