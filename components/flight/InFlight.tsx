"use client";

import { motion } from "framer-motion";
import { Airport, HOME_AIRPORT, FlightPhase, getFlightPhaseLabel } from "../../lib/flight/airports";
import { Plane, EyeOff, Headphones, VolumeX, Waves } from "lucide-react";
import { useState, useEffect } from "react";
import { Tag } from "../../lib/types";
import { useAirplaneNoise, NoiseType } from "../../hooks/useAirplaneNoise";

interface InFlightProps {
    destination: Airport;
    tag: Tag;
    progress: number;
    phase: FlightPhase;
    timeLeft: number;
    elapsed: number;
    durationMinutes: number;
    onCancel: () => void;
}

export function InFlight({
    destination,
    tag,
    progress,
    phase,
    timeLeft,
    elapsed,
    durationMinutes,
    onCancel,
}: InFlightProps) {
    const [pureMode, setPureMode] = useState(false);
    const { currentSound, playSound, configs } = useAirplaneNoise();
    const [isNoiseMenuOpen, setIsNoiseMenuOpen] = useState(false);

    useEffect(() => {
        if (pureMode) {
            document.body.classList.add("pure-mode");
        } else {
            document.body.classList.remove("pure-mode");
        }
        return () => document.body.classList.remove("pure-mode");
    }, [pureMode]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const phaseLabel = getFlightPhaseLabel(phase);
    const phaseColor = phase === "takeoff" ? "text-amber-400"
        : phase === "cruise" ? "text-cyan-400"
        : phase === "descent" ? "text-orange-400"
        : phase === "landing" ? "text-emerald-400"
        : "text-neutral-400";

    const noiseControlUI = (
        <>
            <motion.div
                initial={false}
                animate={{ 
                    opacity: isNoiseMenuOpen ? 1 : 0, 
                    y: isNoiseMenuOpen ? 0 : 20,
                    pointerEvents: isNoiseMenuOpen ? 'auto' : 'none'
                }}
                className="fixed bottom-24 left-8 z-50 flex flex-col gap-1.5 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl"
            >
                <button
                    onClick={(e) => { e.stopPropagation(); playSound('none'); setIsNoiseMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left text-[11px] font-bold tracking-widest transition-all ${
                        currentSound === 'none' ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                    소리 음소거
                </button>
                <div className="w-full h-px bg-white/10 my-0.5" />
                {Object.entries(configs).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={(e) => { e.stopPropagation(); playSound(key as NoiseType); setIsNoiseMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left text-[11px] font-bold tracking-widest transition-all ${
                            currentSound === key ? "bg-cyan-500/20 text-cyan-400" : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Waves className="w-3.5 h-3.5 opacity-60" />
                        {config.label}
                    </button>
                ))}
            </motion.div>

            <button
                onClick={(e) => { e.stopPropagation(); setIsNoiseMenuOpen(!isNoiseMenuOpen); }}
                className={`fixed bottom-8 left-8 z-50 flex items-center justify-center p-3.5 rounded-full backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${
                    currentSound !== 'none' || isNoiseMenuOpen ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                    : "bg-black/40 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
            >
                <Headphones className="w-5 h-5" />
            </button>
        </>
    );

    // Pure mode — minimal floating timer
    if (pureMode) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center space-y-6 cursor-pointer py-8"
                onClick={() => setPureMode(false)}
            >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                    {HOME_AIRPORT.code} → {destination.code}
                </p>
                <p className="text-7xl sm:text-8xl font-black tabular-nums tracking-tighter text-white font-mono drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                    {formatTime(timeLeft)}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">
                    탭하여 UI 복원
                </p>

                {/* Hide Header Style */}
                <style>{`body.pure-mode header { display: none !important; }`}</style>
                {noiseControlUI}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <style>{`body.pure-mode header { display: none !important; }`}</style>
            
            {noiseControlUI}
            {/* Glass card */}
            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 space-y-4">
                {/* Status bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-400" />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${phaseColor}`}>
                            {phaseLabel}
                        </span>
                    </div>
                    <button
                        onClick={() => setPureMode(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <EyeOff className="w-3 h-3 text-neutral-500" />
                        <span className="text-[9px] font-bold text-neutral-500">Pure</span>
                    </button>
                </div>

                {/* Route + Progress */}
                <div className="flex items-center gap-4">
                    <div className="text-center flex-shrink-0">
                        <p className="text-xl font-black">{HOME_AIRPORT.code}</p>
                        <p className="text-[9px] text-neutral-500">{HOME_AIRPORT.city}</p>
                    </div>

                    <div className="flex-1 relative h-6 flex items-center">
                        <div className="w-full h-[1.5px] bg-white/10 rounded-full relative">
                            <motion.div
                                className="absolute left-0 top-0 h-full rounded-full"
                                style={{
                                    width: `${progress * 100}%`,
                                    background: tag.color || '#22d3ee',
                                }}
                            />
                        </div>
                        <motion.div
                            className="absolute top-1/2 -translate-y-1/2"
                            style={{ left: `calc(${Math.min(progress * 100, 94)}% - 8px)` }}
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Plane className="w-4 h-4" style={{ color: tag.color || '#22d3ee' }} />
                        </motion.div>
                    </div>

                    <div className="text-center flex-shrink-0">
                        <p className="text-xl font-black">{destination.code}</p>
                        <p className="text-[9px] text-neutral-500">{destination.city}</p>
                    </div>
                </div>

                {/* Timer */}
                <div className="text-center py-2">
                    <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter font-mono">
                        {formatTime(timeLeft)}
                    </p>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-white/5">
                    <InfoCell label="좌석" value={tag.name} color={tag.color} />
                    <InfoCell label="진행률" value={`${Math.round(progress * 100)}%`} />
                    <InfoCell label="경과" value={formatTime(elapsed)} />
                    <InfoCell label="총 시간" value={`${durationMinutes}m`} />
                </div>
            </div>

            {/* Cancel */}
            <button
                onClick={onCancel}
                className="w-full text-center mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600 hover:text-red-500 transition-colors"
            >
                비상 착륙 (세션 취소)
            </button>
        </motion.div>
    );
}

function InfoCell({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="text-center">
            <p className="text-[8px] font-semibold uppercase text-neutral-600 tracking-widest mb-0.5">{label}</p>
            <p className="text-[12px] font-bold" style={color ? { color } : undefined}>{value}</p>
        </div>
    );
}
