"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, ListMusic, Heart, Share2, X, Music, User, Info, Clock3, Shuffle } from "lucide-react";
import { Song, Playlist } from "../../lib/music-context";
import { useState } from "react";

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
}: FullScreenPlayerProps) {
    const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');

    if (!isVisible || !song) return null;

    const videoId = extractYoutubeId(song.youtube_url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
    const isLiked = videoId ? likedSongs.includes(videoId) : false;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggleRepeat = () => {
        const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
        onSetRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-sans"
            >
                {/* Dynamic Background Gradient */}
                <div
                    className="absolute inset-0 z-0 opacity-80 transition-all duration-1000"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 40%, rgba(79, 70, 229, 0.4) 0%, rgba(18, 18, 18, 1) 100%)`,
                    }}
                />

                {/* Header Section */}
                <div className="relative z-10 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-white/60" />
                        <span className="text-[13px] font-bold text-white/80">{currentPlaylist?.name || "Now Playing"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Content */}
                <div className="relative z-10 flex-1 flex overflow-hidden px-12 pb-12 gap-12 max-w-[1600px] mx-auto w-full">

                    {/* Left Column: Huge Cover Art & Primary Info */}
                    <div className="flex-1 flex flex-col justify-center items-center gap-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="aspect-square w-full max-w-[560px] bg-[#282828] rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden group relative"
                        >
                            <img src={thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
                        </motion.div>

                        <div className="w-full max-w-[560px] space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <h1 className="text-4xl font-black text-white tracking-tighter truncate">{song.title}</h1>
                                    <p className="text-xl font-bold text-white/60">YouTube Track</p>
                                </div>
                                <Heart
                                    onClick={(e) => { e.stopPropagation(); onToggleLike(song); }}
                                    className={`w-8 h-8 cursor-pointer hover:scale-110 transition-transform ${isLiked ? "text-[#1DB954] fill-[#1DB954]" : "text-white/40 hover:text-white"}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Queue & History */}
                    <div className="w-[450px] flex flex-col bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5">
                        <div className="p-6 flex items-center gap-6 border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('queue')}
                                className={`text-[14px] font-bold transition-colors ${activeTab === 'queue' ? "text-white border-b-2 border-[#1DB954] pb-1" : "text-white/40 hover:text-white"}`}
                            >
                                재생목록
                            </button>
                            <button
                                onClick={() => setActiveTab('recent')}
                                className={`text-[14px] font-bold transition-colors ${activeTab === 'recent' ? "text-white border-b-2 border-[#1DB954] pb-1" : "text-white/40 hover:text-white"}`}
                            >
                                최근 재생한 항목
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {activeTab === 'queue' ? (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="text-[14px] font-bold text-white/50 uppercase tracking-widest">지금 재생 중</h3>
                                        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                                            <div className="w-12 h-12 rounded bg-[#282828] overflow-hidden flex-shrink-0">
                                                <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-bold text-[#1DB954] truncate">{song.title}</p>
                                                <p className="text-[12px] text-white/60 truncate">YouTube Source</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[14px] font-bold text-white/50 uppercase tracking-widest">다음 재생</h3>
                                        {(currentPlaylist?.songs || []).slice(1, 15).map((s, idx) => (
                                            <div
                                                key={s.id}
                                                onClick={() => onPlaySong(idx + 1)}
                                                className="flex items-center gap-4 hover:bg-white/5 p-2 rounded-lg transition-colors group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative">
                                                    <img src={`https://img.youtube.com/vi/${extractYoutubeId(s.youtube_url)}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Play className="w-4 h-4 fill-white text-white" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-bold text-white truncate">{s.title}</p>
                                                    <p className="text-[11px] text-white/40 truncate">YouTube Track</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {recentlyPlayed.length > 0 ? (
                                        recentlyPlayed.map((s, idx) => (
                                            <div
                                                key={`${s.id}-${idx}`}
                                                onClick={() => {
                                                    const p: Playlist = { id: 'history', name: 'History', user_id: '', songs: recentlyPlayed };
                                                    onPlaySong(idx);
                                                }}
                                                className="flex items-center gap-4 hover:bg-white/5 p-2 rounded-lg transition-colors group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative">
                                                    <img src={`https://img.youtube.com/vi/${extractYoutubeId(s.youtube_url)}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Play className="w-4 h-4 fill-white text-white" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-bold text-white truncate">{s.title}</p>
                                                    <p className="text-[11px] text-white/40 truncate">Played recently</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-white/20 pt-20">
                                            <Clock3 className="w-12 h-12 mb-4" />
                                            <p className="text-sm font-bold">최근 재생 내역이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Playback Controls Footer */}
                <div className="relative z-10 px-12 py-8 flex flex-col items-center gap-4 w-full">
                    <div className="w-full max-w-[800px] flex flex-col items-center gap-4">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={onToggleShuffle}
                                className={`p-2 transition-colors ${shuffleMode ? "text-[#1DB954]" : "text-white/40 hover:text-white"}`}
                            >
                                <Shuffle className="w-5 h-5" />
                            </button>
                            <button onClick={onPrev} className="p-2 text-white/80 hover:text-white transition-colors hover:scale-110"><SkipBack className="w-8 h-8 fill-current" /></button>
                            <button
                                onClick={onTogglePlay}
                                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl"
                            >
                                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                            </button>
                            <button onClick={onNext} className="p-2 text-white/80 hover:text-white transition-colors hover:scale-110"><SkipForward className="w-8 h-8 fill-current" /></button>
                            <button
                                onClick={handleToggleRepeat}
                                className={`p-2 transition-colors ${repeatMode !== 'none' ? "text-[#1DB954]" : "text-white/40 hover:text-white"}`}
                            >
                                <Repeat className={`w-5 h-5 ${repeatMode === 'one' ? "stroke-[3px]" : ""}`} />
                                {repeatMode === 'one' && <span className="absolute text-[8px] font-bold">1</span>}
                            </button>
                        </div>

                        {/* Progress Slider */}
                        <div className="w-full flex items-center gap-4">
                            <span className="text-[11px] font-bold text-white/40 min-w-[40px] text-right">{formatTime(currentTime)}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full group cursor-pointer relative">
                                <div
                                    className="absolute left-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                                <div
                                    className="absolute w-4 h-4 bg-white rounded-full -top-1.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
                                />
                                <input
                                    type="range"
                                    min="0" max={duration || 100} value={currentTime}
                                    onChange={(e) => onSeek(Number(e.target.value))}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            <span className="text-[11px] font-bold text-white/40 min-w-[40px]">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="absolute right-12 bottom-12 flex items-center gap-6">
                        <div className="flex items-center gap-3 w-40 group">
                            <Volume2 className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                            <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
                                <div className="absolute left-0 h-full bg-white group-hover:bg-[#1DB954]" style={{ width: `${volume}%` }} />
                                <input
                                    type="range" min="0" max="100" value={volume}
                                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
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
