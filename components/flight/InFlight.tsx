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

    // Pure mode — iOS lock screen style glass clock
    if (pureMode) {
        // Split time into parts for tighter layout
        const h = Math.floor(timeLeft / 3600);
        const m = Math.floor((timeLeft % 3600) / 60);
        const s = timeLeft % 60;
        const topLine = h > 0 ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` : m.toString().padStart(2, "0");
        const bottomLine = h > 0 ? s.toString().padStart(2, "0") : s.toString().padStart(2, "0");
        const displayTime = h > 0
            ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
            : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setPureMode(false)}
            >
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    {/* Route label — like the date on iOS */}
                    <p className="text-sm font-medium text-white/40 tracking-wide mb-2">
                        {HOME_AIRPORT.code} → {destination.code}
                    </p>

                    {/* Glass clock text */}
                    <div className="relative">
                        <p
                            className="font-black tabular-nums tracking-tight font-mono leading-[0.85] select-none text-center"
                            style={{
                                fontSize: 'clamp(120px, 32vw, 360px)',
                                WebkitTextStroke: '1.5px rgba(255,255,255,0.15)',
                                WebkitTextFillColor: 'transparent',
                                backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.1) 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                paintOrder: 'stroke fill',
                            }}
                        >
                            {displayTime}
                        </p>
                    </div>

                    {/* ETA in small text */}
                    <p className="text-xs font-medium text-white/20 mt-4 tracking-wide">
                        ETA{' '}
                        <span className="text-white/30">
                            {(() => {
                                const eta = new Date(Date.now() + timeLeft * 1000);
                                return `${eta.getHours().toString().padStart(2, "0")}:${eta.getMinutes().toString().padStart(2, "0")}`;
                            })()}
                        </span>
                    </p>

                    {/* Tap hint */}
                    <p className="absolute bottom-12 text-[9px] font-medium uppercase tracking-[0.3em] text-white/10">
                        Tap to restore
                    </p>
                </div>

                <style>{`body.pure-mode header { display: none !important; }`}</style>
                {noiseControlUI}
            </motion.div>
        );
    }

    // Derived values for HUD
    const timeRemainingLabel = (() => {
        const h = Math.floor(timeLeft / 3600);
        const m = Math.floor((timeLeft % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    })();

    // Approximate "distance" from flight duration (cruise speed ~900km/h)
    const totalDistanceKm = Math.round(durationMinutes * 15); // rough avg
    const remainingKm = Math.round(totalDistanceKm * (1 - progress));

    const currentClock = (() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    })();

    const etaClock = (() => {
        const eta = new Date(Date.now() + timeLeft * 1000);
        return `${eta.getHours().toString().padStart(2, "0")}:${eta.getMinutes().toString().padStart(2, "0")}`;
    })();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <style>{`body.pure-mode header { display: none !important; }`}</style>
            
            {noiseControlUI}

            {/* HUD Overlay — transparent, floating on globe */}
            <div className="space-y-4">

                {/* Top bar: Phase + Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
                        <span className={`text-[9px] font-black uppercase tracking-[0.25em] ${phaseColor}`}>
                            {phaseLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPureMode(true)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <EyeOff className="w-3 h-3 text-neutral-500" />
                            <span className="text-[8px] font-bold text-neutral-500">Pure</span>
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-2 py-1 rounded-lg text-[8px] font-bold text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            취소
                        </button>
                    </div>
                </div>

                {/* Route line: ICN ——✈—— NRT */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-neutral-400">{HOME_AIRPORT.code}</span>
                    <div className="flex-1 relative h-4 flex items-center">
                        <div className="w-full h-[1px] bg-white/10" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] rounded-full" 
                             style={{ width: `${progress * 100}%`, background: tag.color || '#22d3ee' }} />
                        <motion.div
                            className="absolute top-1/2 -translate-y-1/2"
                            style={{ left: `calc(${Math.min(progress * 100, 95)}% - 6px)` }}
                            animate={{ y: [0, -1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Plane className="w-3 h-3" style={{ color: tag.color || '#22d3ee' }} />
                        </motion.div>
                    </div>
                    <span className="text-[10px] font-black text-white">{destination.code}</span>
                </div>

                {/* Bottom HUD: Time Remaining — Clock — Distance Remaining */}
                <div className="flex items-end justify-between pt-2">
                    {/* Left: Time Remaining */}
                    <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Time Remaining</p>
                        <p className="text-2xl font-black tabular-nums tracking-tight text-white font-mono">
                            {timeRemainingLabel}
                        </p>
                    </div>

                    {/* Center: Current clock + ETA */}
                    <div className="text-center flex flex-col items-center">
                        <p className="text-xl font-black tabular-nums text-white font-mono">{currentClock}</p>
                        <p className="text-[8px] font-bold text-neutral-500 mt-0.5">
                            ETA <span className="text-amber-400 font-black">{etaClock}</span>
                        </p>
                    </div>

                    {/* Right: Distance Remaining */}
                    <div className="text-right">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Distance Remaining</p>
                        <p className="text-2xl font-black tabular-nums tracking-tight text-white font-mono">
                            {remainingKm.toLocaleString()} km
                        </p>
                    </div>
                </div>

            </div>
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
