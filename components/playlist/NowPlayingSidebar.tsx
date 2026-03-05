"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Heart, PlusCircle, MoreHorizontal, User, Info, DollarSign } from "lucide-react";
import { Song, Playlist } from "../../lib/music-context";

interface NowPlayingSidebarProps {
    song: Song | null;
    playlist: Playlist | null;
    isVisible: boolean;
    onClose: () => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
}

export default function NowPlayingSidebar({
    song,
    playlist,
    isVisible,
    onClose,
    isPlaying,
    onTogglePlay,
}: NowPlayingSidebarProps) {
    if (!isVisible) return null;

    const videoId = song ? extractYoutubeId(song.youtube_url) : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-[300px] bg-black border-l border-white/5 flex flex-col overflow-hidden h-full"
        >
            <div className="p-4 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-white">Now Playing</h3>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-neutral-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {/* Cover Art */}
                <div className="aspect-square w-full rounded-xl bg-[#282828] overflow-hidden shadow-2xl overflow-hidden group relative">
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={song?.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Info className="w-12 h-12 text-neutral-600" />
                        </div>
                    )}
                </div>

                {/* Title & Artist */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[20px] font-bold text-white line-clamp-1 hover:underline cursor-pointer">
                            {song?.title || "No track selected"}
                        </h4>
                        <Heart className="w-5 h-5 text-[#1DB954]" />
                    </div>
                    <p className="text-[14px] text-neutral-400 hover:text-white cursor-pointer transition-colors">
                        YouTube Artist
                    </p>
                </div>

                {/* Artist Card */}
                <div className="bg-[#181818] rounded-xl overflow-hidden group">
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center">
                                <User className="w-6 h-6 text-neutral-400" />
                            </div>
                            <div>
                                <p className="text-[14px] font-bold text-white">About the artist</p>
                            </div>
                        </div>
                        <p className="text-[13px] text-neutral-400 line-clamp-3">
                            This track is sourced from YouTube. Experience premium sound quality and visual immersion.
                        </p>
                        <button className="text-[12px] font-bold text-white uppercase tracking-widest border border-white/20 rounded-full px-4 py-1.5 hover:scale-105 transition-all">
                            Follow
                        </button>
                    </div>
                </div>

                {/* Credits */}
                <div className="bg-[#181818] rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h5 className="text-[14px] font-bold text-white">Credits</h5>
                        <button className="text-[12px] font-bold text-neutral-400 hover:text-white">Show all</button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[14px] font-bold text-white">Source</p>
                                <p className="text-[12px] text-neutral-400">YouTube</p>
                            </div>
                            <button className="text-[12px] font-bold text-white border border-white/20 rounded-full px-4 py-1.5">Identify</button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function extractYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
