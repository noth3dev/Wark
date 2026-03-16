"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSprint, SprintStatus } from "@/hooks/useSprint";
import { formatDuration } from "@/lib/utils";
import { ChevronLeft, Play, X, Coffee, CheckCircle2, Flame, Timer, Activity, Zap, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const SPRINT_OPTIONS = [30, 60, 80, 90, 100];

export default function SprintPage() {
    const {
        status,
        activeTag,
        duration,
        timeLeft,
        startSprint,
        cancelSprint,
        mounted
    } = useSprint();

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-16 sm:space-y-24">
                
                {/* Minimal Header */}
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-6">
                        <Link href="/" className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary/50 border border-border">
                            <ChevronLeft className="w-3 h-3 text-neutral-400" />
                            <span className="text-[10px] font-semibold uppercase text-neutral-500">Back to Hub</span>
                        </Link>
                        
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-neutral-500 mb-0.5">Focus Terminal</p>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
                                Sprint Mode
                                <span className="text-neutral-600 ml-3 text-xl font-normal lowercase tracking-normal">active</span>
                            </h1>
                        </div>
                    </div>

                    <div className="text-left md:text-right">
                        <p className="text-[10px] font-semibold uppercase text-neutral-500 mb-0.5">System Clock</p>
                        <p className="text-2xl font-light tracking-tight text-white font-mono">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </p>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid lg:grid-cols-12 gap-12 sm:gap-16"
                        >
                            {/* Left Side: Setup */}
                            <div className="lg:col-span-12 space-y-12">
                                {activeTag ? (
                                    <div className="flex flex-col md:flex-row gap-12 items-center">
                                        <div className="flex-1 space-y-8 w-full md:w-auto">
                                            <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-card border border-border">
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 border border-white/5">
                                                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: activeTag.color }} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase text-neutral-500 mb-0.5">Current Focus</p>
                                                    <p className="text-2xl font-semibold text-white tracking-tight">{activeTag.name}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 border-b border-border pb-4">
                                                    <Timer className="w-3 h-3 text-neutral-500" />
                                                    <h2 className="text-[10px] font-semibold uppercase text-neutral-500">Select Sprint Duration</h2>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                    {SPRINT_OPTIONS.map((mins) => (
                                                        <button
                                                            key={mins}
                                                            onClick={() => startSprint(mins)}
                                                            className="p-6 rounded-[2rem] bg-card border border-border hover:border-neutral-700 hover:bg-secondary/30 transition-all text-center group"
                                                        >
                                                            <span className="block text-3xl font-semibold text-neutral-300 group-hover:text-white mb-1">{mins}</span>
                                                            <span className="text-[9px] font-semibold uppercase text-neutral-600">Minutes</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 bg-card/30 border border-dashed border-red-500/20 rounded-[3rem] space-y-6">
                                        <AlertTriangle className="w-12 h-12 text-red-500/50" />
                                        <div className="text-center space-y-2">
                                            <h3 className="text-xl font-semibold text-white">No Active Tag Detected</h3>
                                            <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                                                Sprint mode requires an active study session. Please start the main timer first.
                                            </p>
                                        </div>
                                        <Link href="/" className="px-6 py-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors">
                                            Go to Timer
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {(status === "sprinting" || status === "breaking") && (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center space-y-16 py-12"
                        >
                            <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                                <svg className="absolute w-full h-full -rotate-90">
                                    <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <motion.circle
                                        cx="50%"
                                        cy="50%"
                                        r="48%"
                                        fill="none"
                                        stroke={status === "sprinting" ? "white" : "#10b981"}
                                        strokeWidth="2"
                                        strokeDasharray="100 100"
                                        initial={{ pathLength: 1 }}
                                        animate={{ pathLength: timeLeft / (status === "sprinting" ? duration * 60 : duration * 0.1 * 60) }}
                                        transition={{ duration: 1, ease: "linear" }}
                                    />
                                </svg>
                                
                                <div className="text-center space-y-2">
                                    <h2 className="text-7xl sm:text-9xl font-light tracking-tighter tabular-nums leading-none">
                                        {formatTime(timeLeft)}
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-[0.4em] ${status === "sprinting" ? "text-neutral-500" : "text-emerald-500"}`}>
                                        {status === "sprinting" ? "Operational" : "Recovery"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-8">
                                <div className="flex items-center gap-12 text-center bg-card/50 px-8 py-4 rounded-3xl border border-border">
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase text-neutral-600 mb-1 tracking-widest">Focus</p>
                                        <p className="text-lg font-medium tracking-tight">{activeTag?.name}</p>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div>
                                        <p className="text-[9px] font-semibold uppercase text-neutral-600 mb-1 tracking-widest">Target</p>
                                        <p className="text-lg font-medium tracking-tight">{duration}m</p>
                                    </div>
                                </div>

                                <button
                                    onClick={cancelSprint}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Abort Session Protocol</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === "finished" && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border rounded-[3rem] p-12 sm:p-24 text-center space-y-8"
                        >
                            <div className="inline-flex p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-4xl font-semibold tracking-tight text-white italic">Protocol Mastered</h2>
                                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em]">Session data has been committed to core</p>
                            </div>

                            <button
                                onClick={cancelSprint}
                                className="px-12 py-4 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors shadow-2xl"
                            >
                                New Operation
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info */}
                <footer className="pt-16 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-700">
                    <div className="flex items-center gap-2">
                        <Flame className="w-3 h-3" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.3em]">Antigravity Focus Module v1.0.42</span>
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.3em]">Station Status: Online</p>
                </footer>
            </div>
        </main>
    );
}
