"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSprint, SprintStatus } from "@/hooks/useSprint";
import { formatDuration } from "@/lib/utils";
import { ChevronLeft, Play, X, Coffee, CheckCircle2, Flame, Timer, Activity, Zap, AlertTriangle } from "lucide-react";
import { StickmanRunner } from "@/components/sprint/StickmanRunner";
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

    const [showHalfway, setShowHalfway] = useState(false);
    const [halfwayTriggered, setHalfwayTriggered] = useState(false);

    useEffect(() => {
        if (status === "sprinting" && !halfwayTriggered) {
            const currentSeconds = duration * 60 - timeLeft;
            const targetSeconds = (duration * 60) / 2;
            if (currentSeconds >= targetSeconds) {
                setHalfwayTriggered(true);
                setShowHalfway(true);
                setTimeout(() => setShowHalfway(false), 5000);
            }
        } else if (status === "idle") {
            setHalfwayTriggered(false);
        }
    }, [timeLeft, status, duration, halfwayTriggered]);


    const toggleFullscreen = async (enter: boolean) => {
        try {
            if (enter) {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } else {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen error", err);
        }
    };

    const handleStartSprint = (mins: number) => {
        startSprint(mins);
        toggleFullscreen(true);
    };

    const handleCancelSprint = () => {
        cancelSprint();
        toggleFullscreen(false);
    };

    if (!mounted) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isSprinting = status === "sprinting" || status === "breaking";

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-16 sm:space-y-24">
                
                {/* Minimal Header - Hide when sprinting */}
                <AnimatePresence>
                    {!isSprinting && (
                        <motion.header 
                            initial={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
                        >
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
                        </motion.header>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-16"
                        >
                            {/* Minimal Top Tag Bar */}
                            {activeTag && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit mx-auto"
                                >
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeTag.color }} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Current Focus:</span>
                                    <span className="text-[11px] font-black uppercase text-white">{activeTag.name}</span>
                                </motion.div>
                            )}

                            <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-4xl mx-auto">
                                {/* Starting Runner Container */}
                                <div className="h-64 flex items-center justify-center w-full">
                                    <StickmanRunner speed={1} />
                                </div>

                                <div className="space-y-12 w-full">
                                    {activeTag ? (
                                        <div className="space-y-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Timer className="w-3 h-3 text-neutral-500" />
                                                <h2 className="text-[10px] font-semibold uppercase text-neutral-500 tracking-[0.3em]">Initialize Operational Duration</h2>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                                                {SPRINT_OPTIONS.map((mins) => (
                                                    <button
                                                        key={mins}
                                                        onClick={() => handleStartSprint(mins)}
                                                        className="px-8 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/40 hover:bg-white/5 transition-all group relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                                                        <span className="text-2xl font-semibold text-neutral-300 group-hover:text-white transition-colors">{mins}</span>
                                                        <span className="text-[8px] font-black uppercase text-neutral-600 group-hover:text-neutral-400 ml-2 tracking-tighter">Min</span>
                                                    </button>
                                                ))}
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
                            <div className="relative w-full max-w-4xl flex items-center justify-center min-h-[320px]">
                                <div className="flex items-center justify-center w-full">
                                    <StickmanRunner speed={status === "sprinting" ? 2.5 : 1.2} />
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
                                    onClick={handleCancelSprint}
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
                                onClick={handleCancelSprint}
                                className="px-12 py-4 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors shadow-2xl"
                            >
                                New Operation
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info - Hide when sprinting */}
                {!isSprinting && (
                    <footer className="pt-16 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-700">
                        <div className="flex items-center gap-2">
                            <Flame className="w-3 h-3" />
                            <span className="text-[9px] font-semibold uppercase tracking-[0.3em]">Antigravity Focus Module v1.0.42</span>
                        </div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.3em]">Station Status: Online</p>
                    </footer>
                )}
            </div>
        </main>
    );
}
