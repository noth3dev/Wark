"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Clock, BarChart2, Music, CheckCircle2, Menu, X, Flame, StickyNote, ClipboardList, HardDrive, Coffee, Plane, Activity, FileText, ChevronDown, Sparkles } from "lucide-react"

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
import { caffeineService } from "../lib/services/caffeineService"

export function Header() {
    const { user } = useAuth()
    const pathname = usePathname()
    const status = useActiveSessionSync()

    // Check if we are in an active sprint to hide the header
    const [isSprintActive, setIsSprintActive] = useState(false);
    const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

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

    // Close playground dropdown on outside click
    useEffect(() => {
        if (!isPlaygroundOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.playground-dropdown-container')) {
                setIsPlaygroundOpen(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [isPlaygroundOpen]);

    const [isCaffeineOpen, setIsCaffeineOpen] = useState(false)
    const [targetLevel, setTargetLevel] = useState<number>(80)

    // Close caffeine dropdown on outside click
    useEffect(() => {
        if (!isCaffeineOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.caffeine-dropdown-container')) {
                setIsCaffeineOpen(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [isCaffeineOpen]);

    // Solved Problems State
    const { totalCount, increment, decrement, count } = useSolvedProblems(status.tagId)
    const { dailyTimes, fetchDailyTotals } = useDailyTotals()
    const [isSolvedProblemsOpen, setIsSolvedProblemsOpen] = useState(false)
    const [isMemoOpen, setIsMemoOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Caffeine State & Live Calculation
    const [caffeineLevel, setCaffeineLevel] = useState<number>(0)

    useEffect(() => {
        if (!user) return
        let active = true
        let interval: any

        const updateCaffeine = async () => {
            try {
                const [intakes, target] = await Promise.all([
                    caffeineService.getIntakes(user.id),
                    caffeineService.getTarget(user.id)
                ])
                if (!active) return
                setTargetLevel(target)
                const calculateCaffeine = () => {
                    const now = new Date()
                    let total = 0
                    intakes.forEach(intake => {
                        const timeDiff = (now.getTime() - new Date(intake.intake_at).getTime()) / (1000 * 60 * 60)
                        if (timeDiff >= 0) {
                            total += intake.amount * Math.pow(0.5, timeDiff / 5) // half-life 5 hours
                        }
                    })
                    setCaffeineLevel(total)
                }
                calculateCaffeine()
                clearInterval(interval)
                interval = setInterval(calculateCaffeine, 500)
            } catch (e) {
                console.error(e)
            }
        }

        updateCaffeine()
        // Refresh the source data from database every 15 seconds
        const dataInterval = setInterval(updateCaffeine, 15000)

        // Listen for customized event if we want instant update
        const handleIntakeAdded = () => updateCaffeine()
        window.addEventListener("caffeine-update", handleIntakeAdded)

        return () => {
            active = false
            clearInterval(dataInterval)
            clearInterval(interval)
            window.removeEventListener("caffeine-update", handleIntakeAdded)
        }
    }, [user])

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

    const playgroundItems = [
        { href: "/sprint", title: "Sprint", icon: <Flame className="w-4 h-4" /> },
        { href: "/drive", title: "Drive", icon: <HardDrive className="w-4 h-4" /> },
        { href: "/flight", title: "Flight", icon: <Plane className="w-4 h-4" /> },
        { href: "/habit", title: "Habit", icon: <CheckCircle2 className="w-4 h-4" /> },
        { href: "/repeat", title: "Repeat", icon: <Activity className="w-4 h-4" /> },
        { href: "/overdose", title: "Caffeine", icon: <Coffee className="w-4 h-4" /> },
    ];

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
                            <NavLink href="/record" title="Records" icon={<BarChart2 className="w-4 h-4" />} />
                            <NavLink href="/playlist" title="Playlist" icon={<Music className="w-4 h-4" />} />
                            <NavLink href={`/homework-outer/${user?.id}`} title="Homework" icon={<ClipboardList className="w-4 h-4" />} />
                            <NavLink href="/overdose" title="Overdose" icon={<Coffee className="w-4 h-4" />} />
                            <NavLink href="/silmo" title="Silmo" icon={<FileText className="w-4 h-4" />} />
                        </nav>
                    )}

                    {user && <ActiveSessionIndicator status={status} />}
                </div>

                {/* Right: Tools & Profile */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                    {user ? (
                        <>
                            {/* Playground Dropdown (Right side) */}
                            <div className="hidden md:block relative playground-dropdown-container">
                                <button
                                    onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                        isPlaygroundOpen
                                            ? 'text-white bg-white/10'
                                            : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                    }`}
                                    title="Playground"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <ChevronDown className="w-3 h-3 transition-transform duration-200" style={{ transform: isPlaygroundOpen ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                <AnimatePresence>
                                    {isPlaygroundOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute right-0 mt-2 w-36 rounded-xl border border-white/10 bg-neutral-950/90 backdrop-blur-xl p-1.5 shadow-2xl z-[100]"
                                        >
                                            <div className="px-2 py-1 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                                                Playground
                                            </div>
                                            <div className="h-[1px] bg-white/5 my-1 mx-1" />
                                            <div className="flex flex-col gap-0.5">
                                                {playgroundItems.map((item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setIsPlaygroundOpen(false)}
                                                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                                            pathname === item.href
                                                                ? 'bg-white/10 text-white'
                                                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span className={pathname === item.href ? 'text-primary' : 'text-neutral-400'}>
                                                            {item.icon}
                                                        </span>
                                                        <span>{item.title}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="hidden sm:block">
                                <MusicPlayer />
                            </div>

                            {/* Solved Problems Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setIsSolvedProblemsOpen(!isSolvedProblemsOpen)}
                                className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all duration-200 ${isSolvedProblemsOpen
                                    ? 'bg-secondary border-primary/20 text-primary'
                                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                            >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isSolvedProblemsOpen ? 'text-primary' : 'text-neutral-500'}`} />
                                <span className="text-[11px] font-medium font-mono tabular-nums">{totalCount}</span>
                            </motion.button>

                            {/* Caffeine Indicator */}
                            <div className="relative caffeine-dropdown-container">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setIsCaffeineOpen(!isCaffeineOpen)}
                                    className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                        isCaffeineOpen
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                            : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                                >
                                    <Coffee className={`w-3.5 h-3.5 ${isCaffeineOpen ? 'text-amber-400' : 'text-neutral-500'}`} />
                                    <span className="text-[11px] font-medium font-mono tabular-nums">{caffeineLevel.toFixed(1)} mg</span>
                                </motion.button>

                                <AnimatePresence>
                                    {isCaffeineOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl p-3.5 shadow-2xl z-[100]"
                                        >
                                            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-suit mb-2">
                                                카페인 실시간 상태
                                            </div>
                                            <div className="h-[1px] bg-white/5 my-2" />
                                            <div className="space-y-2 text-[11px]">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 font-suit">현재 농도</span>
                                                    <span className="font-mono text-neutral-200 font-bold">{caffeineLevel.toFixed(1)} mg</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 font-suit">목표 기준치</span>
                                                    <span className="font-mono text-neutral-400">{targetLevel} mg</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 font-suit">다음 권장 섭취</span>
                                                    <span className="font-mono text-amber-400 font-bold">
                                                        {caffeineLevel <= targetLevel ? (
                                                            "즉시 가능"
                                                        ) : (
                                                            `${format(new Date(Date.now() + 5 * Math.log2(caffeineLevel / targetLevel) * 3600 * 1000), "HH:mm")} (${(5 * Math.log2(caffeineLevel / targetLevel)).toFixed(1)}h 후)`
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-500 font-suit">완전 소진 시간</span>
                                                    <span className="font-mono text-neutral-400">
                                                        {caffeineLevel > 0.5 
                                                            ? `${(5 * Math.log2(caffeineLevel / 0.5)).toFixed(1)}시간 후` 
                                                            : "소진됨"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-[1px] bg-white/5 my-3" />
                                            <Link
                                                href="/overdose"
                                                onClick={() => setIsCaffeineOpen(false)}
                                                className="block text-center w-full py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors font-suit"
                                            >
                                                자세히 보기 & 등록하기
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Memo Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setIsMemoOpen(!isMemoOpen)}
                                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all duration-200 ${isMemoOpen
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                            >
                                <StickyNote className={`w-3.5 h-3.5 ${isMemoOpen ? 'text-amber-400' : 'text-neutral-500'}`} />
                                <span className="text-[11px] font-medium hidden md:inline">메모</span>
                            </motion.button>

                            <div className="hidden sm:block">
                                <BatteryIndicator />
                            </div>
                            <UserProfile />

                            {/* Mobile Menu Toggle */}
                            <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
