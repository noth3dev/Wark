"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, ListMusic, Heart, Share2 } from "lucide-react";
import { Song } from "../../lib/music-context";

interface FullScreenPlayerProps {
    song: Song | null;
    isVisible: boolean;
    onClose: () => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    volume: number;
    onVolumeChange: (vol: number) => void;
}

export default function FullScreenPlayer({
    song,
    isVisible,
    onClose,
    isPlaying,
    onTogglePlay,
    currentTime,
    duration,
    onSeek,
    volume,
    onVolumeChange,
}: FullScreenPlayerProps) {
    if (!isVisible || !song) return null;

    const videoId = extractYoutubeId(song.youtube_url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col"
            >
                {/* Dynamic Background */}
                <div
                    className="absolute inset-0 z-0 opacity-60 blur-[100px] scale-150 transition-all duration-1000"
                    style={{
                        backgroundImage: `radial-gradient(circle at center, rgba(79, 70, 229, 0.8) 0%, rgba(18, 18, 18, 1) 100%), url(${thumbnailUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Top Header */}
                <div className="relative z-10 p-8 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronDown className="w-8 h-8 text-white" />
                    </button>
                    <div className="text-center">
                        <p className="text-[12px] font-bold text-white/60 uppercase tracking-widest">Playing from collection</p>
                        <p className="text-[14px] font-bold text-white">Antigravity Premium</p>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <MoreHorizontal className="w-8 h-8 text-white" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 gap-12 max-w-7xl mx-auto w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
                        {/* Left: Large Cover Art */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="aspect-square w-full max-w-[500px] mx-auto bg-[#282828] rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <img src={thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
                        </motion.div>

                        {/* Right: Info & Lyrics Placeholder */}
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter line-clamp-2 leading-tight">
                                        {song.title}
                                    </h1>
                                    <Heart className="w-12 h-12 text-[#1DB954] flex-shrink-0" />
                                </div>
                                <p className="text-2xl lg:text-3xl font-bold text-white/60 hover:text-white transition-colors cursor-pointer">
                                    YouTube Artist
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-4">
                                <div className="relative h-2 bg-white/10 rounded-full group cursor-pointer">
                                    <div
                                        className="absolute left-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full"
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    />
                                    <div
                                        className="absolute w-5 h-5 bg-white rounded-full -top-1.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 10px)` }}
                                    />
                                    <input
                                        type="range"
                                        min="0" max={duration || 100} value={currentTime}
                                        onChange={(e) => onSeek(Number(e.target.value))}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                                <div className="flex justify-between text-[16px] font-bold text-white/60">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <button className="p-4 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all">
                                    <Repeat className="w-8 h-8" />
                                </button>
                                <div className="flex items-center gap-8">
                                    <button className="p-4 hover:bg-white/10 rounded-full text-white transition-all hover:scale-110">
                                        <SkipBack className="w-10 h-10 fill-current" />
                                    </button>
                                    <button
                                        onClick={onTogglePlay}
                                        className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                    >
                                        {isPlaying ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-2" />}
                                    </button>
                                    <button className="p-4 hover:bg-white/10 rounded-full text-white transition-all hover:scale-110">
                                        <SkipForward className="w-10 h-10 fill-current" />
                                    </button>
                                </div>
                                <button className="p-4 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all">
                                    <Share2 className="w-8 h-8" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative z-10 p-12 flex items-center justify-between w-full max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-all">
                            <ListMusic className="w-6 h-6" />
                            <span>Queue</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-6 group w-64">
                        <Volume2 className="w-6 h-6 text-white/60 group-hover:text-white" />
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden group-hover:h-2 transition-all">
                            <div className="absolute left-0 h-full bg-white group-hover:bg-[#1DB954]" style={{ width: `${volume}%` }} />
                            <input
                                type="range" min="0" max="100" value={volume}
                                onChange={(e) => onVolumeChange(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function extractYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
