"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Clock, ChevronLeft, MapPin, Lock, Unlock, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useFlight } from "@/hooks/useFlight";
import { Airport, getReachableAirports, HOME_AIRPORT, AIRPORTS } from "@/lib/flight/airports";
import { BoardingPass } from "@/components/flight/BoardingPass";
import { InFlight } from "@/components/flight/InFlight";
import { Arrival } from "@/components/flight/Arrival";
import { FlightGlobe } from "@/components/flight/FlightGlobe";
import { SeatPicker } from "@/components/flight/SeatPicker";
import { Tag } from "@/lib/types";

const DURATION_MIN = 25;
const DURATION_MAX = 720;
const DURATION_PRESETS = [25, 30, 60, 90, 120, 180, 360, 600];

export default function FlightPage() {
    const {
        session,
        tags,
        progress,
        phase,
        timeLeft,
        elapsed,
        unlockedCodes,
        mounted,
        startFlight,
        cancelFlight,
        resetFlight,
    } = useFlight();

    const [focusMinutes, setFocusMinutes] = useState(60);
    const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [bookingStep, setBookingStep] = useState<"select" | "seat" | "pass">("select");
    const [showList, setShowList] = useState(false);

    const reachable = useMemo(() => getReachableAirports(focusMinutes), [focusMinutes]);
    const selectedTag = tags.find(t => t.id === selectedTagId) || null;

    const handleGlobeSelect = (airport: Airport) => {
        setSelectedAirport(airport);
    };

    const handleTear = () => {
        if (!selectedAirport || !selectedTagId) return;
        startFlight(selectedAirport, selectedTagId, focusMinutes);
    };

    const handleReset = () => {
        resetFlight();
        setBookingStep("select");
        setSelectedAirport(null);
        setSelectedTagId(null);
    };

    const formatDur = (m: number) =>
        m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}` : `${m}m`;

    if (!mounted) return null;

    // ─── INFLIGHT ───
    if (session?.status === "inflight") {
        const tag = tags.find(t => t.id === session.tagId);
        return (
            <main className="fixed inset-0 bg-black text-white overflow-hidden">
                <FlightGlobe
                    reachableAirports={[]}
                    unlockedCodes={unlockedCodes}
                    isFlying={true}
                    flyingTo={session.destination}
                    flightProgress={progress}
                />
                <div className="absolute inset-0 z-10 flex items-end justify-center pb-8 pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-xl px-4">
                        <InFlight
                            destination={session.destination}
                            tag={tag || { id: "", name: "Focus", color: "#22d3ee" }}
                            progress={progress}
                            phase={phase}
                            timeLeft={timeLeft}
                            elapsed={elapsed}
                            durationMinutes={session.durationMinutes}
                            onCancel={cancelFlight}
                        />
                    </div>
                </div>
            </main>
        );
    }

    // ─── ARRIVED ───
    if (session?.status === "arrived") {
        const tag = tags.find(t => t.id === session.tagId);
        return (
            <main className="fixed inset-0 bg-black text-white overflow-y-auto flex items-center justify-center p-6">
                <Arrival
                    destination={session.destination}
                    tag={tag || { id: "", name: "Focus", color: "#22d3ee" }}
                    durationMinutes={session.durationMinutes}
                    unlockedCount={unlockedCodes.length}
                    onReset={handleReset}
                />
            </main>
        );
    }

    // ─── BOOKING FLOW: Globe fullscreen + glass overlay panels ───
    return (
        <main className="fixed inset-0 bg-black text-white overflow-hidden">
            {/* Full-screen globe background */}
            <FlightGlobe
                selectedAirport={selectedAirport}
                reachableAirports={reachable}
                unlockedCodes={unlockedCodes}
                onSelectAirport={handleGlobeSelect}
            />

            {/* Top bar — glass */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4">
                <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] font-semibold text-neutral-300">Back</span>
                </Link>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
                    <Plane className="w-4 h-4 text-cyan-400" />
                    <span className="text-[12px] font-bold">FocusFlight</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] font-bold text-neutral-300">
                        <span className="text-amber-400">{unlockedCodes.length}</span>/{AIRPORTS.length}
                    </span>
                </div>
            </div>

            {/* Bottom panel — glass card */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-2 pointer-events-none">
                <AnimatePresence mode="wait">
                    {/* STEP 1: Select destination */}
                    {bookingStep === "select" && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="pointer-events-auto max-w-lg mx-auto space-y-3"
                        >
                            {/* Duration control */}
                            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">집중 시간</span>
                                    </div>
                                    <span className="text-lg font-black tabular-nums">{formatDur(focusMinutes)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={DURATION_MIN}
                                    max={DURATION_MAX}
                                    step={5}
                                    value={focusMinutes}
                                    onChange={e => { setFocusMinutes(Number(e.target.value)); setSelectedAirport(null); }}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-grab
                                        [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {DURATION_PRESETS.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => { setFocusMinutes(d); setSelectedAirport(null); }}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
                                                ${focusMinutes === d ? "bg-white text-black" : "bg-white/5 text-neutral-500 hover:bg-white/10"}`}
                                        >
                                            {d >= 60 ? `${d / 60}h` : `${d}m`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selected airport card */}
                            <AnimatePresence>
                                {selectedAirport ? (
                                    <motion.div
                                        key="selected"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-3xl font-black tracking-tight">{selectedAirport.code}</span>
                                                    <span className="text-sm text-neutral-400">{selectedAirport.city}</span>
                                                </div>
                                                <p className="text-[10px] text-neutral-500 mt-0.5">
                                                    {selectedAirport.country} · {formatDur(selectedAirport.flightMinutes)}
                                                    {unlockedCodes.includes(selectedAirport.code) && (
                                                        <span className="text-amber-400 ml-2">● 해제됨</span>
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setBookingStep("seat")}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                                            >
                                                탑승 <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="hint"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center py-2"
                                    >
                                        <p className="text-[11px] text-neutral-500">
                                            지구본에서 목적지를 선택하세요
                                        </p>
                                        <button
                                            onClick={() => setShowList(!showList)}
                                            className="text-[10px] font-bold text-cyan-400 mt-1 hover:text-cyan-300 transition-colors"
                                        >
                                            {showList ? "목록 닫기" : "목록에서 선택 ↑"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Airport list overlay */}
                            <AnimatePresence>
                                {showList && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 max-h-[40vh] overflow-y-auto"
                                    >
                                        <div className="flex items-center justify-between px-1 pb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                {reachable.length}개 도달 가능
                                            </span>
                                            <button onClick={() => setShowList(false)}>
                                                <X className="w-4 h-4 text-neutral-500" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {AIRPORTS.map(airport => {
                                                const isReachable = airport.flightMinutes <= focusMinutes;
                                                const isSelected = selectedAirport?.code === airport.code;
                                                return (
                                                    <button
                                                        key={airport.code}
                                                        onClick={() => { if (isReachable) { handleGlobeSelect(airport); setShowList(false); } }}
                                                        disabled={!isReachable}
                                                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all
                                                            ${isSelected ? "bg-cyan-500/15 border border-cyan-500/30" :
                                                            isReachable ? "hover:bg-white/5 border border-transparent" :
                                                            "opacity-25 cursor-not-allowed border border-transparent"}`}
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-black">{airport.code}</span>
                                                                {unlockedCodes.includes(airport.code) && <Unlock className="w-2.5 h-2.5 text-amber-400" />}
                                                                {!isReachable && <Lock className="w-2.5 h-2.5 text-neutral-600" />}
                                                            </div>
                                                            <p className="text-[9px] text-neutral-500 truncate">{airport.city} · {formatDur(airport.flightMinutes)}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* STEP 2: Seat selection */}
                    {bookingStep === "seat" && (
                        <motion.div
                            key="seat"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="pointer-events-auto max-w-lg mx-auto space-y-3"
                        >
                            <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                            {HOME_AIRPORT.code} → {selectedAirport?.code} · {formatDur(focusMinutes)}
                                        </p>
                                        <h2 className="text-base font-bold mt-0.5">좌석을 선택하세요</h2>
                                    </div>
                                    <button onClick={() => setBookingStep("select")} className="text-[10px] font-bold text-neutral-500 hover:text-white">
                                        ← 돌아가기
                                    </button>
                                </div>
                                <SeatPicker tags={tags} selectedTagId={selectedTagId} onSelect={(id) => { setSelectedTagId(id); }} />
                                {selectedTagId && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setBookingStep("pass")}
                                        className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                                    >
                                        탑승권 발급 <ChevronRight className="w-3.5 h-3.5" />
                                    </motion.button>
                                )}
                                {tags.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-neutral-500 mb-2">태그가 없습니다</p>
                                        <Link href="/" className="text-[11px] font-bold text-cyan-400">메인에서 태그 추가 →</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Boarding Pass */}
                    {bookingStep === "pass" && selectedAirport && selectedTag && (
                        <motion.div
                            key="pass"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="pointer-events-auto max-w-lg mx-auto space-y-3"
                        >
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                    탑승권을 드래그하여 찢으세요
                                </p>
                                <button onClick={() => setBookingStep("seat")} className="text-[10px] font-bold text-neutral-500 hover:text-white">
                                    ← 좌석 변경
                                </button>
                            </div>
                            <BoardingPass
                                destination={selectedAirport}
                                tag={selectedTag}
                                duration={focusMinutes}
                                onTear={handleTear}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
