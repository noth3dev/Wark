"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Clock, BarChart2, Music, CheckCircle2, Menu, X, Flame, StickyNote, ClipboardList } from "lucide-react"

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
import { MemoPanel } from "./header/MemoPanel"

export function Header() {
    const { user } = useAuth()
    const pathname = usePathname()
    const status = useActiveSessionSync()
    
    // Check if we are in an active sprint to hide the header
    const [isSprintActive, setIsSprintActive] = useState(false);

    useEffect(() => {
        const checkSprint = () => {
            const saved = localStorage.getItem('active_sprint_session');
            if (saved && pathname === '/sprint') {
                try {
                    const data = JSON.parse(saved);
                    // Hide header if sprinting or breaking
                    setIsSprintActive(data.status === 'sprinting' || data.status === 'breaking');
                } catch (e) {
                    setIsSprintActive(false);
                }
            } else {
                setIsSprintActive(false);
            }
        };

        checkSprint();
        const interval = setInterval(checkSprint, 500);
        return () => clearInterval(interval);
    }, [pathname]);

    // Solved Problems State
    const { totalCount, increment, decrement, count } = useSolvedProblems(status.tagId)
    const { dailyTimes, fetchDailyTotals } = useDailyTotals()
    const [isSolvedProblemsOpen, setIsSolvedProblemsOpen] = useState(false)
    const [isMemoOpen, setIsMemoOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Sync daily study totals for average calculation
    useEffect(() => {
        if (user && isSolvedProblemsOpen) {
            fetchDailyTotals(user.id)
        }
    }, [user, isSolvedProblemsOpen, fetchDailyTotals])

    // Keyboard Shortcuts (Space to increment, Alt + M to toggle memo)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSolvedProblemsOpen && e.code === 'Space') {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    increment();
                }
            }
            // Alt + M: Toggle Memo
            if (e.altKey && e.code === 'KeyM') {
                e.preventDefault();
                setIsMemoOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSolvedProblemsOpen, increment]);

    if (isSprintActive) return null;

    return (
        <>
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/60 backdrop-blur-xl">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/wark.svg" alt="Logo" className="h-5 w-auto" />
                    </Link>

                    {user && (
                        <nav className="hidden md:flex items-center gap-1 border-l border-border pl-4">
                            <NavLink href="/" title="Timer" icon={<Clock className="w-4 h-4" />} />
                            <NavLink href="/sprint" title="Sprint" icon={<Flame className="w-4 h-4" />} />
                            <NavLink href="/record" title="Records" icon={<BarChart2 className="w-4 h-4" />} />
                            <NavLink href="/playlist" title="Playlist" icon={<Music className="w-4 h-4" />} />
                            <NavLink href={`/homework-outer/${user?.id}`} title="Homework" icon={<ClipboardList className="w-4 h-4" />} />
                        </nav>
                    )}

                    {user && <ActiveSessionIndicator status={status} />}
                </div>

                {/* Right: Tools & Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {user ? (
                        <>
                            <MusicPlayer />

                            {/* Solved Problems Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setIsSolvedProblemsOpen(!isSolvedProblemsOpen)}
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${isSolvedProblemsOpen
                                    ? 'bg-secondary border-primary/20 text-primary'
                                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                            >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isSolvedProblemsOpen ? 'text-primary' : 'text-neutral-500'}`} />
                                <span className="text-[11px] font-medium font-mono tabular-nums">{totalCount}</span>
                            </motion.button>

                            {/* Memo Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setIsMemoOpen(!isMemoOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${isMemoOpen
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                            >
                                <StickyNote className={`w-3.5 h-3.5 ${isMemoOpen ? 'text-amber-400' : 'text-neutral-500'}`} />
                                <span className="text-[11px] font-medium">메모</span>
                            </motion.button>

                            <BatteryIndicator />
                            <UserProfile />

                            {/* Mobile Menu Toggle */}
                            <button className="md:hidden p-2 text-white ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </>
                    ) : (
                        <Link 
                            href="/"
                            className="text-[10px] font-black text-white bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-full border border-white/10 transition-all uppercase tracking-widest"
                        >
                            Entrance
                        </Link>
                    )}
                </div>

                <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} user={user} />
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

            <MemoPanel
                isOpen={isMemoOpen}
                onClose={() => setIsMemoOpen(false)}
            />
        </>
    )
}
