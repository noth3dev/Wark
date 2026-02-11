"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, BarChart2, Music, CheckCircle2, Menu, X } from "lucide-react"

import { useAuth } from "../lib/auth-context"
import { useSolvedProblems } from "../hooks/useSolvedProblems"
import { useDailyTotals } from "../hooks/useDailyTotals"
import { useActiveSessionSync } from "../hooks/useActiveSessionSync"

import { SolvedProblemsPanel } from "./header/SolvedProblemsPanel"
import { NavLink } from "./header/NavLink"
import { BatteryIndicator } from "./header/BatteryIndicator"
import { UserProfile } from "./header/UserProfile"
import { MobileMenu } from "./header/MobileMenu"
import { MusicPlayer } from "./header/MusicPlayer"
import { ActiveSessionIndicator } from "./header/ActiveSessionIndicator"

export function Header() {
    const { user } = useAuth()
    const status = useActiveSessionSync()

    // Solved Problems State
    const { totalCount, increment, decrement, count } = useSolvedProblems(status.tagId)
    const { dailyTimes, fetchDailyTotals } = useDailyTotals()
    const [isSolvedProblemsOpen, setIsSolvedProblemsOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Sync daily study totals for average calculation
    useEffect(() => {
        if (user && isSolvedProblemsOpen) {
            fetchDailyTotals(user.id)
        }
    }, [user, isSolvedProblemsOpen, fetchDailyTotals])

    // Keyboard Shortcuts (Space to increment)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSolvedProblemsOpen && e.code === 'Space') {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    increment();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSolvedProblemsOpen, increment]);

    if (!user) return null;

    return (
        <>
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/60 backdrop-blur-xl">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/wark.svg" alt="Logo" className="h-5 w-auto" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 border-l border-border pl-4">
                        <NavLink href="/" title="Timer" icon={<Clock className="w-4 h-4" />} />
                        <NavLink href="/record" title="Records" icon={<BarChart2 className="w-4 h-4" />} />
                        <NavLink href="/playlist" title="Playlist" icon={<Music className="w-4 h-4" />} />
                    </nav>

                    <ActiveSessionIndicator status={status} />
                </div>

                {/* Right: Tools & Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <MusicPlayer />

                    {/* Solved Problems Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsSolvedProblemsOpen(!isSolvedProblemsOpen)}
                        className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all duration-300 ${isSolvedProblemsOpen
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                            }`}
                    >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSolvedProblemsOpen ? 'text-cyan-400' : 'text-neutral-500'}`} />
                        <span className="text-[10px] font-black font-mono tracking-tight tabular-nums">{totalCount}</span>
                    </motion.button>

                    <BatteryIndicator />
                    <UserProfile />

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2 text-white ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
            </header>

            <SolvedProblemsPanel
                isOpen={isSolvedProblemsOpen}
                count={count}
                increment={increment}
                decrement={decrement}
                tagId={status.tagId}
                dailyTimes={dailyTimes}
                activeSeconds={status.seconds}
            />
        </>
    )
}
