"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, SkipBack, SkipForward, Repeat, Volume2,
    Heart, X, Music, Clock3, Shuffle, ListMusic, ChevronRight, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { Song, Playlist } from "../../lib/music-context";
import { useState, useEffect, useRef } from "react";
import Stopwatch from "../Stopwatch";
import * as LucideIcons from "lucide-react";

interface FullScreenPlayerProps {
    song: Song | null;
    isVisible: boolean;
    onClose: () => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    volume: number;
    onVolumeChange: (vol: number) => void;
    currentPlaylist: Playlist | null;
    onPlaySong: (index: number) => void;
    recentlyPlayed: Song[];
    shuffleMode: boolean;
    onToggleShuffle: () => void;
    repeatMode: 'none' | 'all' | 'one';
    onSetRepeatMode: (mode: 'none' | 'all' | 'one') => void;
    likedSongs: string[];
    onToggleLike: (song: Song) => Promise<void>;
    extractYoutubeId: (url: string) => string | null;
    currentSongIndex: number;
    themeColor: string;
    tagStatus: any;
}

export default function FullScreenPlayer({
    song,
    isVisible,
    onClose,
    isPlaying,
    onTogglePlay,
    onNext,
    onPrev,
    currentTime,
    duration,
    onSeek,
    volume,
    onVolumeChange,
    currentPlaylist,
    onPlaySong,
    recentlyPlayed,
    shuffleMode,
    onToggleShuffle,
    repeatMode,
    onSetRepeatMode,
    likedSongs,
    onToggleLike,
    extractYoutubeId,
    currentSongIndex,
    themeColor,
    tagStatus,
}: FullScreenPlayerProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');
    const [bgColor, setBgColor] = useState('rgba(30, 30, 30, 1)');
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastSongIndex = useRef(currentSongIndex);
    const TagIcon = (LucideIcons as any)[tagStatus.icon || 'Moon'] || LucideIcons.Moon;

    useEffect(() => {
        if (currentSongIndex !== lastSongIndex.current) {
            setDirection(currentSongIndex > lastSongIndex.current ? 1 : -1);
            lastSongIndex.current = currentSongIndex;
        }
    }, [currentSongIndex]);

    // Extract dominant color from thumbnail
    useEffect(() => {
        if (!song || !isVisible) return;
        const videoId = extractYoutubeId(song.youtube_url);
        if (!videoId) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        img.onload = () => {
            try {
                const canvas = canvasRef.current || document.createElement('canvas');
                canvas.width = 4;
                canvas.height = 4;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, 4, 4);
                const data = ctx.getImageData(0, 0, 4, 4).data;

                // Sample multiple pixels and average
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                // Darken the color for background
                const darken = 0.6;
                r = Math.floor(r * darken);
                g = Math.floor(g * darken);
                b = Math.floor(b * darken);

                setBgColor(`rgb(${r}, ${g}, ${b})`);
            } catch {
                setBgColor('rgb(30, 40, 50)');
            }
        };
        img.onerror = () => setBgColor('rgb(30, 40, 50)');
    }, [song, isVisible]);

    if (!isVisible || !song) return null;

    const videoId = extractYoutubeId(song.youtube_url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
    const isLiked = videoId ? likedSongs.includes(videoId) : false;

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggleRepeat = () => {
        const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
        onSetRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
    };

    // Get songs after current index for "Next Up" queue
    const upcomingSongs = currentPlaylist?.songs
        ? currentPlaylist.songs.slice(currentSongIndex + 1)
        : [];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] overflow-hidden flex flex-col"
                style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
            >
                {/* Dynamic Background — extracted from cover art */}
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 z-0 transition-all duration-[2000ms]" style={{ background: bgColor }} />
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-8 py-5">
                    <div className="flex items-center gap-3">
                        <Music className="w-4 h-4 text-white/60" />
                        <span className="text-[13px] font-semibold text-white/80 tracking-tight">
                            {currentPlaylist?.name || "Now Playing"}
                        </span>
                    </div>

                    {/* Top Center: Tag Information */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/80 pointer-events-none">
                        <TagIcon className="w-3.5 h-3.5" style={{ color: themeColor }} />
                        <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
                            <span>{tagStatus.tag || "Untitled"}</span>
                            <span className="opacity-30">|</span>
                            <span className="tabular-nums">{tagStatus.time}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
                            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            {sidebarOpen ? (
                                <PanelRightClose className="w-5 h-5 text-white/70" />
                            ) : (
                                <PanelRightOpen className="w-5 h-5 text-white/70" />
                            )}
                        </button>
                        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex-1 flex overflow-hidden">
                    {/* Center: Cover Art or Stopwatch */}
                    <div className={`flex-1 flex flex-col items-center justify-center transition-all duration-300 ${sidebarOpen ? 'pr-0' : ''}`}>
                        <div className="relative w-full max-w-[min(55vh,520px)] aspect-square group overflow-hidden">
                            <AnimatePresence mode="wait">
                                {!isFlipped ? (
                                    <motion.div
                                        key="thumbnail"
                                        initial={{ y: 0, opacity: 1 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -500, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                        className="absolute inset-0 w-full h-full cursor-pointer"
                                        onClick={() => setIsFlipped(true)}
                                    >
                                        <AnimatePresence mode="wait" custom={direction}>
                                            <motion.div
                                                key={song.id}
                                                custom={direction}
                                                initial={direction === 0 ? { scale: 0.92, opacity: 0 } : { x: direction * 100, opacity: 0, scale: 0.95 }}
                                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                                exit={{ x: -direction * 100, opacity: 0, scale: 0.95 }}
                                                transition={{
                                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                                    opacity: { duration: 0.3 }
                                                }}
                                                className="w-full h-full rounded-lg shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden"
                                            >
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={song.title}
                                                    className="w-full h-full object-cover"
                                                    draggable={false}
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="stopwatch"
                                        initial={{ y: 500, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 500, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                        className="absolute inset-0 w-full h-full p-8 overflow-y-auto no-scrollbar scroll-smooth flex flex-col"
                                    >
                                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                            <button
                                                onClick={() => setIsFlipped(false)}
                                                className="text-[11px] font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1 group"
                                            >
                                                <LucideIcons.ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                                                Back to Cover
                                            </button>
                                        </div>
                                        <div className="flex-1 flex items-center justify-center scale-75 lg:scale-90 origin-center transform-gpu">
                                            <Stopwatch />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Sidebar (toggleable) */}
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 380, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                className="flex flex-col bg-black/40 backdrop-blur-xl border-l border-white/5 overflow-hidden"
                            >
                                <div className="p-5 flex items-center gap-5 border-b border-white/5 flex-shrink-0">
                                    <button
                                        onClick={() => setActiveTab('queue')}
                                        className={`text-[13px] font-bold transition-colors pb-1 ${activeTab === 'queue' ? "text-white border-b-2" : "text-white/40 hover:text-white"}`}
                                        style={activeTab === 'queue' ? { borderColor: themeColor } : {}}
                                    >
                                        Queue
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('recent')}
                                        className={`text-[13px] font-bold transition-colors pb-1 ${activeTab === 'recent' ? "text-white border-b-2" : "text-white/40 hover:text-white"}`}
                                        style={activeTab === 'recent' ? { borderColor: themeColor } : {}}
                                    >
                                        Recently Played
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                                    {activeTab === 'queue' ? (
                                        <>
                                            {/* Now Playing */}
                                            <div className="space-y-3">
                                                <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Now Playing</h3>
                                                <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                                    <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                                                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-semibold truncate" style={{ color: themeColor }}>{song.title}</p>
                                                        <p className="text-[11px] text-white/40 truncate">{(song as any).channel_title || 'YouTube'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Next Up */}
                                            {upcomingSongs.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Next Up</h3>
                                                    {upcomingSongs.slice(0, 20).map((s, idx) => {
                                                        const sVideoId = extractYoutubeId(s.youtube_url);
                                                        return (
                                                            <div
                                                                key={`${s.id}-${idx}`}
                                                                onClick={() => onPlaySong(currentSongIndex + 1 + idx)}
                                                                className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors group cursor-pointer"
                                                            >
                                                                <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative">
                                                                    <img src={`https://img.youtube.com/vi/${sVideoId}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <Play className="w-4 h-4 fill-white text-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-[13px] font-medium text-white truncate">{s.title}</p>
                                                                    <p className="text-[11px] text-white/30 truncate">{(s as any).channel_title || 'YouTube'}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentlyPlayed.length > 0 ? (
                                                recentlyPlayed.map((s, idx) => {
                                                    const sVideoId = extractYoutubeId(s.youtube_url);
                                                    return (
                                                        <div
                                                            key={`recent-${s.id}-${idx}`}
                                                            onClick={() => onPlaySong(idx)}
                                                            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors group cursor-pointer"
                                                        >
                                                            <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative">
                                                                <img src={`https://img.youtube.com/vi/${sVideoId}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Play className="w-4 h-4 fill-white text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[13px] font-medium text-white truncate">{s.title}</p>
                                                                <p className="text-[11px] text-white/30 truncate">Played recently</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-white/20 pt-16">
                                                    <Clock3 className="w-10 h-10 mb-3" />
                                                    <p className="text-sm font-medium">No recent history</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom: Song Info + Controls */}
                <div className="relative z-10 px-8 pb-6 pt-4">
                    <div className="max-w-[720px] mx-auto flex flex-col gap-4">
                        {/* Song Info Row */}
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1 mr-4">
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.h2
                                        key={song.id + '-title'}
                                        custom={direction}
                                        initial={direction === 0 ? { y: 8, opacity: 0 } : { x: direction * 40, opacity: 0 }}
                                        animate={{ x: 0, y: 0, opacity: 1 }}
                                        exit={{ x: -direction * 40, opacity: 0 }}
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        className="text-xl font-bold text-white truncate leading-tight"
                                    >
                                        {song.title}
                                    </motion.h2>
                                </AnimatePresence>
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.p
                                        key={song.id + '-channel'}
                                        custom={direction}
                                        initial={direction === 0 ? { opacity: 0 } : { x: direction * 30, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -direction * 30, opacity: 0 }}
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        className="text-sm text-white/50 truncate mt-0.5"
                                    >
                                        {(song as any).channel_title || 'YouTube'}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <Heart
                                    onClick={(e) => { e.stopPropagation(); onToggleLike(song); }}
                                    style={isLiked ? { color: themeColor, fill: themeColor } : {}}
                                    className={`w-5 h-5 cursor-pointer hover:scale-110 transition-all ${isLiked ? "" : "text-white/40 hover:text-white"}`}
                                />
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-white/50 min-w-[36px] text-right tabular-nums">{formatTime(currentTime)}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full group cursor-pointer relative">
                                <div
                                    className="absolute left-0 h-full bg-white group-hover:bg-white rounded-full transition-colors"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%`, backgroundColor: 'var(--theme-color, white)' }}
                                />
                                <div
                                    className="absolute w-3 h-3 bg-white rounded-full -top-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
                                />
                                <input
                                    type="range"
                                    min="0" max={duration || 100} value={currentTime}
                                    onChange={(e) => onSeek(Number(e.target.value))}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <span className="text-[11px] font-medium text-white/50 min-w-[36px] tabular-nums">{formatTime(duration)}</span>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 mx-auto">
                                <button
                                    onClick={onToggleShuffle}
                                    className={`p-1.5 transition-colors ${shuffleMode ? "" : "text-white/40 hover:text-white"}`}
                                    style={shuffleMode ? { color: themeColor } : {}}
                                >
                                    <Shuffle className="w-5 h-5" />
                                </button>
                                <button onClick={onPrev} className="p-1.5 text-white/70 hover:text-white transition-colors">
                                    <SkipBack className="w-6 h-6 fill-current" />
                                </button>
                                <button
                                    onClick={onTogglePlay}
                                    className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                                </button>
                                <button onClick={onNext} className="p-1.5 text-white/70 hover:text-white transition-colors">
                                    <SkipForward className="w-6 h-6 fill-current" />
                                </button>
                                <button
                                    onClick={handleToggleRepeat}
                                    className={`p-1.5 transition-colors relative ${repeatMode !== 'none' ? "" : "text-white/40 hover:text-white"}`}
                                    style={repeatMode !== 'none' ? { color: themeColor } : {}}
                                >
                                    <Repeat className="w-5 h-5" />
                                    {repeatMode === 'one' && (
                                        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black" style={{ color: themeColor }}>1</span>
                                    )}
                                </button>
                            </div>

                            {/* Volume — far right */}
                            <div className="absolute right-8 bottom-8 flex items-center gap-2 w-32 group">
                                <Volume2 className="w-4 h-4 text-white/40 group-hover:text-white transition-colors flex-shrink-0" />
                                <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
                                    <div className="absolute left-0 h-full bg-white group-hover:bg-white transition-colors" style={{ width: `${volume}%`, backgroundColor: 'var(--theme-color, white)' }} />
                                    <input
                                        type="range" min="0" max="100" value={volume}
                                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
