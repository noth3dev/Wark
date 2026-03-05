"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, ListMusic, Heart, Share2, X, Music, User, Info } from "lucide-react";
import { Song, Playlist } from "../../lib/music-context";
import { useState } from "react";

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
    currentPlaylist: Playlist | null;
    onPlaySong: (index: number) => void;
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
    currentPlaylist,
    onPlaySong,
}: FullScreenPlayerProps) {
    const [activeTab, setActiveTab] = useState<'queue' | 'recent'>('queue');

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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-sans"
            >
                {/* Dynamic Background Gradient */}
                <div
                    className="absolute inset-0 z-0 opacity-80 transition-all duration-1000"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 40%, rgba(185, 28, 28, 0.4) 0%, rgba(18, 18, 18, 1) 100%)`,
                        // Note: In a real app, we'd extract the dominant color. Using a deep red/maroon for the reference look.
                    }}
                />

                {/* Header Section */}
                <div className="relative z-10 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-white/60" />
                        <span className="text-[13px] font-bold text-white/80">{currentPlaylist?.name || "Now Playing"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Info className="w-5 h-5 text-white/60" /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Share2 className="w-5 h-5 text-white/60" /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><User className="w-5 h-5 text-white/60" /></button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MoreHorizontal className="w-5 h-5 text-white/60" /></button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Content */}
                <div className="relative z-10 flex-1 flex overflow-hidden px-12 pb-12 gap-12 max-w-[1600px] mx-auto w-full">

                    {/* Left Column: Huge Cover Art & Primary Controls */}
                    <div className="flex-1 flex flex-col justify-center items-center gap-12">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="aspect-square w-full max-w-[560px] bg-[#282828] rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden group relative"
                        >
                            <img src={thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
                        </motion.div>

                        {/* Mobile-style simplified title/controls for the left side if needed, 
                    but following the 3-panel screenshot, the right side has the queue. */}
                        <div className="w-full max-w-[560px] space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <h1 className="text-4xl font-black text-white tracking-tighter truncate">{song.title}</h1>
                                    <p className="text-xl font-bold text-white/60 hover:text-white transition-colors cursor-pointer">YouTube Artist</p>
                                </div>
                                <Heart className="w-8 h-8 text-[#1DB954]" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Queue & Details */}
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
                                                <p className="text-[12px] text-white/60 truncate">YouTube Artist</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[14px] font-bold text-white/50 uppercase tracking-widest">다음 재생 {currentPlaylist?.name}</h3>
                                        {(currentPlaylist?.songs || []).slice(1).map((s, idx) => (
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
                                                    <p className="text-[11px] text-white/40 truncate">YouTube Artist</p>
                                                </div>
                                                <span className="text-[11px] text-white/40">3:20</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-white/20">
                                    <Clock3 className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-bold">최근 재생 내역이 없습니다.</p>
                                </div>
                            )}

                            {/* Artist Details & Credits (Mocked like in the image) */}
                            <div className="pt-8 space-y-6">
                                <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                                    <h4 className="text-[16px] font-bold text-white">아티스트 상세정보</h4>
                                    <div className="w-full aspect-video bg-[#282828] rounded-xl overflow-hidden relative group">
                                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                            <p className="text-[20px] font-black text-white">YouTube Artist</p>
                                            <p className="text-[13px] font-bold text-white/80">월별 리스너 12,450,112명</p>
                                        </div>
                                    </div>
                                    <p className="text-[13px] text-white/60 line-clamp-3">
                                        스포티파이 스타일의 프리미엄 디자인이 적용된 음악 라이브러리입니다. YouTube 소스를 통해 고음질의 음악을 감상하실 수 있습니다.
                                    </p>
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold rounded-full transition-all">
                                        팔로우하기
                                    </button>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[16px] font-bold text-white">크레딧</h4>
                                        <button className="text-[12px] font-bold text-white/40 hover:text-white transition-colors">모두 표시</button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[14px] font-bold text-white">YouTube Artist</p>
                                            <p className="text-[12px] text-white/50">주요 아티스트</p>
                                        </div>
                                        <button className="px-4 py-1.5 border border-white/20 rounded-full text-[12px] font-bold text-white hover:border-white transition-colors">팔로우</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Playback Controls Footer */}
                <div className="relative z-10 px-12 py-8 flex flex-col items-center gap-4 w-full">
                    <div className="w-full max-w-[800px] flex flex-col items-center gap-4">
                        <div className="flex items-center gap-8">
                            <button className="p-2 text-white/40 hover:text-white transition-colors"><Repeat className="w-5 h-5" /></button>
                            <button className="p-2 text-white/80 hover:text-white transition-colors hover:scale-110"><SkipBack className="w-8 h-8 fill-current" /></button>
                            <button
                                onClick={onTogglePlay}
                                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl"
                            >
                                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                            </button>
                            <button className="p-2 text-white/80 hover:text-white transition-colors hover:scale-110"><SkipForward className="w-8 h-8 fill-current" /></button>
                            <button className="p-2 text-white/40 hover:text-white transition-colors"><ListMusic className="w-5 h-5" /></button>
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

function Clock3(props: any) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
