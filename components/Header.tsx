"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import * as LucideIcons from "lucide-react"
import {
    Clock, BarChart2, Music, CheckCircle2, ChevronDown, ListMusic, Repeat,
    SkipBack, SkipForward, Play, Pause, LogOut, User,
    BatteryCharging, BatteryLow, BatteryMedium, BatteryFull
} from "lucide-react"

import { useAuth } from "../lib/auth-context"
import { useMusic } from "../lib/music-context"
import { useBattery } from "../hooks/useBattery"
import { useSolvedProblems } from "../hooks/useSolvedProblems"
import { SolvedProblemsPanel } from "./header/SolvedProblemsPanel"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

export function Header() {
    const { user, signOut, profileName } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const { level, charging, supported } = useBattery()

    // Status State
    const [status, setStatus] = useState({
        time: "00:00:00",
        tag: "",
        tagId: null as string | null,
        color: "#22d3ee",
        icon: "Moon"
    })

    // Music Player State
    const {
        currentSong, currentPlaylist, isPlaying, isLooping,
        togglePlay, toggleLoop, nextTrack, prevTrack, playSongByIndex,
        currentTime, duration, seekTo
    } = useMusic()
    const [isPlayerOpen, setIsPlayerOpen] = useState(false)

    // Solved Problems State (Tracked by current active tag)
    const { count, totalCount, increment, decrement } = useSolvedProblems(status.tagId)
    const [isSolvedProblemsOpen, setIsSolvedProblemsOpen] = useState(false)

    // Mobile Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // 1. Sync stopwatch data (Status)
    useEffect(() => {
        const updateStatus = () => {
            const savedSession = localStorage.getItem('active_study_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                const sessionStart = new Date(session.startTime);
                const now = new Date();

                const effectiveStartTime = (sessionStart.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : sessionStart.getTime();

                const elapsed = Date.now() - effectiveStartTime;
                const total = (session.accumulated || 0) + elapsed;

                const h = Math.floor(total / 3600000);
                const m = Math.floor((total % 3600000) / 60000);
                const s = Math.floor((total % 60000) / 1000);

                setStatus({
                    time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
                    tag: session.name || "",
                    tagId: session.tagId || null,
                    color: session.color || "#22d3ee",
                    icon: session.icon || "Moon"
                });
            } else {
                setStatus(prev => ({ ...prev, time: "00:00:00", tag: "", tagId: null }));
            }
        };

        const interval = setInterval(updateStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    // 2. Keyboard Shortcuts (Space to increment)
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

    // 3. Scroll lock for mobile menu
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isMenuOpen]);

    if (!user) return null;

    const baseDisplayName = profileName || user.email || "me";

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

                    {/* Active Session Info (Visible when not on home) */}
                    {pathname !== "/" && (
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0f1115] border-2 rounded-full transition-all duration-500" style={{ borderColor: status.color }}>
                            {status.icon && (LucideIcons as any)[status.icon] ?
                                React.createElement((LucideIcons as any)[status.icon], { className: "w-3 h-3 text-white" })
                                : <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            }
                            <span className="text-[11px] font-mono font-bold text-white tabular-nums">{status.time}</span>
                            <span className="hidden xs:inline text-[10px] text-white font-bold uppercase tracking-wider">{status.tag}</span>
                        </div>
                    )}
                </div>

                {/* Right: Tools & Profile */}
                <div className="flex items-center gap-3 sm:gap-6">
                    {/* Music Mini Player */}
                    {currentSong && (
                        <div className="relative hidden sm:block">
                            <button
                                onClick={() => setIsPlayerOpen(!isPlayerOpen)}
                                className="flex items-center gap-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex flex-col items-start max-w-[120px]">
                                    <span className="text-[10px] font-bold text-white truncate w-full">{currentSong.title}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 text-neutral-600 transition-transform ${isPlayerOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isPlayerOpen && (
                                    <MusicPlayerDropdown
                                        currentSong={currentSong}
                                        currentPlaylist={currentPlaylist}
                                        isPlaying={isPlaying}
                                        isLooping={isLooping}
                                        togglePlay={togglePlay}
                                        toggleLoop={toggleLoop}
                                        nextTrack={nextTrack}
                                        prevTrack={prevTrack}
                                        playSongByIndex={playSongByIndex}
                                        currentTime={currentTime}
                                        duration={duration}
                                        seekTo={seekTo}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Solved Problems Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsSolvedProblemsOpen(!isSolvedProblemsOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isSolvedProblemsOpen
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold font-mono">{totalCount}</span>
                    </motion.button>

                    {/* Battery */}
                    {supported && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-full text-muted-foreground transition-colors hover:text-foreground">
                            <BatteryIcon level={level} charging={charging} />
                            <span className="text-[10px] font-mono font-bold">{Math.round(level * 100)}%</span>
                        </div>
                    )}

                    {/* User Profile */}
                    <UserProfileDropdown displayName={baseDisplayName} signOut={signOut} router={router} />

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <LucideIcons.X className="w-6 h-6" /> : <LucideIcons.Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <MobileMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
            </header>

            {/* Draggable Solved Problems Panel (Z-index 101) */}
            <SolvedProblemsPanel
                isOpen={isSolvedProblemsOpen}
                count={count}
                increment={increment}
                decrement={decrement}
            />
        </>
    )
}

function NavLink({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) {
    return (
        <Link href={href} className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title={title}>
            {icon}
        </Link>
    )
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
    if (charging) return <BatteryCharging className="w-3.5 h-3.5" />;
    if (level <= 0.2) return <BatteryLow className="w-3.5 h-3.5" />;
    if (level <= 0.6) return <BatteryMedium className="w-3.5 h-3.5" />;
    return <BatteryFull className="w-3.5 h-3.5" />;
}

function UserProfileDropdown({ displayName, signOut, router }: any) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-full transition-all outline-none cursor-pointer">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    <span className="text-xs text-white font-medium truncate max-w-[80px]">{displayName}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-white/10 backdrop-blur-xl rounded-2xl">
                <DropdownMenuLabel className="font-suit text-xs text-neutral-500">Account</DropdownMenuLabel>
                <DropdownMenuItem className="px-2 py-2">
                    <span className="text-sm font-bold text-white">{displayName}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function MobileMenu({ isOpen, setIsOpen }: any) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.nav
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="absolute top-full left-0 w-full bg-neutral-900 border-b border-white/10 md:hidden overflow-hidden"
                >
                    <div className="flex flex-col p-4 gap-2">
                        <MobileNavLink href="/" icon={<Clock className="w-5 h-5" />} label="Timer" onClick={() => setIsOpen(false)} />
                        <MobileNavLink href="/record" icon={<BarChart2 className="w-5 h-5" />} label="Records" onClick={() => setIsOpen(false)} />
                        <MobileNavLink href="/playlist" icon={<Music className="w-5 h-5" />} label="Playlist" onClick={() => setIsOpen(false)} />
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    )
}

function MobileNavLink({ href, icon, label, onClick }: any) {
    return (
        <Link href={href} className="flex items-center gap-4 px-6 py-4 text-neutral-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all" onClick={onClick}>
            {icon}
            <span className="text-base font-bold font-suit">{label}</span>
        </Link>
    )
}

function MusicPlayerDropdown(props: any) {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-72 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-[100]"
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                        <ListMusic className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Current Queue</span>
                    </div>
                    <button onClick={props.toggleLoop} className={`p-1.5 rounded-lg transition-colors ${props.isLooping ? 'text-cyan-400 bg-cyan-400/10' : 'text-neutral-600 hover:text-white'}`}>
                        <Repeat className="w-3 h-3" />
                    </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {props.currentPlaylist?.songs?.map((song: any, idx: number) => (
                        <button
                            key={song.id}
                            onClick={() => props.playSongByIndex(idx)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${props.currentSong.id === song.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                            <span className={`text-[11px] font-medium truncate flex-1 text-left ${props.currentSong.id === song.id ? 'text-white' : 'text-neutral-500'}`}>
                                {song.title}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-white/5">
                    <div className="relative h-1 bg-white/5 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = x / rect.width;
                        props.seekTo(percent * props.duration);
                    }}>
                        <motion.div className="h-full bg-cyan-400" style={{ width: `${(props.currentTime / (props.duration || 1)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono font-bold text-neutral-600 tabular-nums">
                        <span>{formatTime(props.currentTime)}</span>
                        <span>{formatTime(props.duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4">
                    <button onClick={props.prevTrack} className="text-neutral-500 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
                    <button onClick={props.togglePlay} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                        {props.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <button onClick={props.nextTrack} className="text-neutral-500 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
                </div>
            </div>
        </motion.div>
    )
}
