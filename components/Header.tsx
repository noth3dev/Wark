"use client"

import React from "react"
import * as Icons from "lucide-react"
import Link from "next/link"
import { useAuth } from "../lib/auth-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    LogOut,
    Settings,
    User,
    Clock,
    BarChart2,
    Music,
    SkipForward,
    SkipBack,
    Repeat,
    ChevronDown,
    ListMusic,
    Pause,
    Play,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { useMusic } from "../lib/music-context"
import { motion, AnimatePresence } from "framer-motion"

export function Header() {
    const { user, signOut, profileName } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const [headerTime, setHeaderTime] = useState("00:00:00")
    const [headerTag, setHeaderTag] = useState("")
    const [headerColor, setHeaderColor] = useState("#22d3ee")
    const [headerIcon, setHeaderIcon] = useState("Moon")
    const {
        currentSong, currentPlaylist, isPlaying, isLooping,
        togglePlay, toggleLoop, nextTrack, prevTrack, playSongByIndex,
        currentTime, duration, seekTo
    } = useMusic()
    const [isPlayerOpen, setIsPlayerOpen] = useState(false)

    // Sync stopwatch data for header
    useEffect(() => {
        const updateHeader = () => {
            const savedSession = localStorage.getItem('active_study_session');
            if (savedSession) {
                const { startTime, color, name, accumulated, icon } = JSON.parse(savedSession);
                const elapsed = Date.now() - startTime;
                const total = (accumulated || 0) + elapsed;

                setHeaderColor(color || "#22d3ee");
                setHeaderTag(name || "");
                setHeaderIcon(icon || "Moon");

                const h = Math.floor(total / 3600000);
                const m = Math.floor((total % 3600000) / 60000);
                const s = Math.floor((total % 60000) / 1000);
                setHeaderTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                setHeaderTime("00:00:00");
                setHeaderColor("#22d3ee");
            }
        };

        const interval = setInterval(updateHeader, 1000);
        return () => clearInterval(interval);
    }, []);

    // 메뉴 열릴 때 스크롤 방지
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isMenuOpen])

    const formatHeaderTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!user) return null



    const baseDisplayName = profileName || user.email || "me"
    const nameSlug = encodeURIComponent(baseDisplayName)

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 system-select-container">
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="/wark.svg"
                            alt="Logo"
                            className="h-5 w-auto"
                        />
                    </Link>
                </div>

                {/* 데스크톱 네비게이션 */}
                <nav className="hidden md:flex items-center gap-1 border-l border-border pl-4 overflow-hidden">
                    <Link
                        href="/"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
                        title="Timer"
                    >
                        <Clock className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/record"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
                        title="Records"
                    >
                        <BarChart2 className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/playlist"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
                        title="Playlist"
                    >
                        <Music className="w-4 h-4" />
                    </Link>
                </nav>

                {/* Persistent Mini Stopwatch / Music Player */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {pathname !== "/" && (
                        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 bg-[#0f1115] border-2 rounded-full transition-all duration-500 max-w-[120px] sm:max-w-none" style={{ borderColor: headerColor }}>
                            {headerIcon && (Icons as any)[headerIcon] ? (
                                React.createElement((Icons as any)[headerIcon], {
                                    className: "w-2.5 h-2.5 sm:w-3 sm:h-3 text-white transition-colors",
                                })
                            ) : (
                                <div
                                    className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                />
                            )}
                            <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-tight text-white whitespace-nowrap">{headerTime}</span>
                            <span className="hidden xs:inline text-[8px] sm:text-[10px] text-white font-bold uppercase tracking-wider truncate max-w-[40px] sm:max-w-none">{headerTag}</span>
                        </div>
                    )}

                    {currentSong && (
                        <div className="relative">
                            <motion.div
                                onClick={() => setIsPlayerOpen(!isPlayerOpen)}
                                className="flex items-center gap-4 px-4 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex flex-col items-start min-w-[80px] max-w-[150px]">
                                    <span className="text-[10px] font-bold text-white truncate w-full">{currentSong.title}</span>

                                </div>
                                <ChevronDown className={`w-3 h-3 text-neutral-600 transition-transform duration-300 ${isPlayerOpen ? 'rotate-180' : ''}`} />
                            </motion.div>

                            <AnimatePresence>
                                {isPlayerOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-4 w-72 bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-[100] overflow-hidden"
                                    >
                                        <div className="space-y-6">
                                            {/* Header */}
                                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <ListMusic className="w-3 h-3 text-cyan-400" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Current Queue</span>
                                                </div>
                                                <button onClick={toggleLoop} className={`p-1.5 rounded-lg transition-colors ${isLooping ? 'text-cyan-400 bg-cyan-400/10' : 'text-neutral-600 hover:text-white'}`}>
                                                    <Repeat className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Track List */}
                                            <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {currentPlaylist?.songs?.map((song, idx) => (
                                                    <button
                                                        key={song.id}
                                                        onClick={() => playSongByIndex(idx)}
                                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${currentSong.id === song.id
                                                            ? 'bg-white/10'
                                                            : 'hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <span className={`text-[11px] font-medium truncate flex-1 text-left ${currentSong.id === song.id ? 'text-white' : 'text-neutral-500'
                                                            }`}>
                                                            {song.title}
                                                        </span>
                                                        {currentSong.id === song.id && isPlaying && (
                                                            <div className="flex gap-0.5 items-end h-2 ml-2">
                                                                <motion.div animate={{ height: [2, 8, 2] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-cyan-400" />
                                                                <motion.div animate={{ height: [4, 2, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-cyan-400" />
                                                                <motion.div animate={{ height: [3, 8, 3] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-cyan-400" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Seekbar */}
                                            <div className="space-y-2 pt-4 border-t border-white/5">
                                                <div className="relative group h-4 flex items-center cursor-pointer">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={duration || 100}
                                                        value={currentTime}
                                                        onChange={(e) => seekTo(Number(e.target.value))}
                                                        className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
                                                    />
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-cyan-400"
                                                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                    <motion.div
                                                        className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                        style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 5px)` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[9px] font-mono font-bold text-neutral-600 tabular-nums">
                                                    <span>{formatHeaderTime(currentTime)}</span>
                                                    <span>{formatHeaderTime(duration)}</span>
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5">
                                                <button onClick={prevTrack} className="text-neutral-400 hover:text-white transition-colors">
                                                    <SkipBack className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                                    className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                                                >
                                                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                                </button>
                                                <button onClick={nextTrack} className="text-neutral-400 hover:text-white transition-colors">
                                                    <SkipForward className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* 유저 배지 (드롭다운 메뉴) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 px-3 py-1.5 bg-secondary hover:bg-accent border border-border rounded-full transition-all outline-none cursor-pointer">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            <span className="text-xs text-foreground font-medium truncate max-w-[100px]">{baseDisplayName}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border backdrop-blur-xl">
                        <DropdownMenuLabel className="font-suit text-xs text-muted-foreground">Account</DropdownMenuLabel>
                        <DropdownMenuItem className="flex flex-col items-start gap-0.5 cursor-default focus:bg-transparent px-2 py-2">
                            <span className="text-sm font-bold text-foreground font-suit">{baseDisplayName}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span className="text-sm">Profile Settings</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="text-sm">Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 모바일 햄버거 메뉴 버튼 */}
                <button
                    className="p-2 -mr-2 text-muted-foreground hover:text-foreground md:hidden transition-colors cursor-pointer"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <div className="relative w-4 h-4 overflow-visible" />
                </button>
            </div>

            {/* 모바일 메뉴 (간소화) */}
            {isMenuOpen && (
                <nav className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-2xl border-b border-border md:hidden animate-in slide-in-from-top-4 duration-300 shadow-2xl overflow-hidden z-[40]">
                    <div className="flex flex-col p-2 space-y-1">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-6 py-4 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium font-suit">Timer</span>
                        </Link>
                    </div>
                </nav>
            )}
        </header>
    )
}
