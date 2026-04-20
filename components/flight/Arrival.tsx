"use client";

import { motion } from "framer-motion";
import { Airport } from "../../lib/flight/airports";
import { CheckCircle2, MapPin, Plane, Trophy } from "lucide-react";
import { Tag } from "../../lib/types";

interface ArrivalProps {
    destination: Airport;
    tag: Tag;
    durationMinutes: number;
    unlockedCount: number;
    onReset: () => void;
}

export function Arrival({ destination, tag, durationMinutes, unlockedCount, onReset }: ArrivalProps) {
    const formatDuration = (m: number) => {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return h > 0 ? `${h}시간 ${mins > 0 ? `${mins}분` : ""}` : `${mins}분`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-col items-center space-y-10 w-full max-w-lg mx-auto py-12"
        >
            {/* Success Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
            >
                <div className="w-28 h-28 rounded-full flex items-center justify-center"
                    style={{ background: `${tag.color || '#22d3ee'}15`, border: `2px solid ${tag.color || '#22d3ee'}33` }}
                >
                    <CheckCircle2 className="w-14 h-14" style={{ color: tag.color || '#22d3ee' }} />
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                >
                    <Trophy className="w-5 h-5 text-black" />
                </motion.div>
            </motion.div>

            {/* Arrival Text */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-3"
            >
                <h2 className="text-4xl font-black tracking-tight">착륙 완료</h2>
                <p className="text-neutral-500 text-sm">
                    {destination.emoji} {destination.city}에 무사히 도착했습니다
                </p>
            </motion.div>

            {/* Flight Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">비행 요약</span>
                    <Plane className="w-4 h-4 text-neutral-600" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <SummaryItem label="목적지" value={`${destination.code} ${destination.city}`} />
                    <SummaryItem label="집중 시간" value={formatDuration(durationMinutes)} />
                    <SummaryItem label="좌석(태그)" value={tag.name} color={tag.color} />
                    <SummaryItem label="해제된 도시" value={`${unlockedCount}개`} />
                </div>
            </motion.div>

            {/* New City Unlocked */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="w-full bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-3xl p-6 text-center space-y-3"
            >
                <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">새 도시 해제!</span>
                </div>
                <p className="text-2xl font-black">
                    {destination.emoji} {destination.city}, {destination.country}
                </p>
                <p className="text-[11px] text-neutral-500">이 도시가 당신의 여행 지도에 추가되었습니다</p>
            </motion.div>

            {/* Return button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={onReset}
                className="px-12 py-4 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors shadow-2xl"
            >
                새로운 여정 시작
            </motion.button>
        </motion.div>
    );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div>
            <p className="text-[8px] font-semibold uppercase text-neutral-600 tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold" style={color ? { color } : undefined}>{value}</p>
        </div>
    );
}
