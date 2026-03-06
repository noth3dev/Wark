"use client";

import { motion } from "framer-motion";
import { X, Heart, Music, Maximize2 } from "lucide-react";
import { Song, Playlist } from "../../lib/music-context";

interface NowPlayingSidebarProps {
    song: Song | null;
    playlist: Playlist | null;
    isVisible: boolean;
    onClose: () => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onExpand?: () => void;
}

export default function NowPlayingSidebar({
    song,
    playlist,
    isVisible,
    onClose,
    isPlaying,
    onTogglePlay,
    onExpand,
}: NowPlayingSidebarProps) {
    if (!isVisible) return null;

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = song ? extractYoutubeId(song.youtube_url) : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isVisible ? 300 : 0, opacity: isVisible ? 1 : 0 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[var(--pl-player)] border-l border-[var(--pl-border)] flex flex-col overflow-hidden h-full"
        >
            <div className="p-4 flex items-center justify-between gap-2 overflow-hidden">
                <h3 className="text-[16px] font-bold text-[var(--pl-text)] truncate">{playlist?.name || "Now Playing"}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={onExpand} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Expand to full screen">
                        <Maximize2 className="w-5 h-5 text-[var(--pl-text-muted)]" />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Close">
                        <X className="w-5 h-5 text-[var(--pl-text-muted)]" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {/* Cover Art */}
                <div className="aspect-square w-full rounded-xl bg-[var(--pl-elevated)] overflow-hidden shadow-2xl">
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={song?.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-12 h-12 text-[var(--pl-text-muted)]" />
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[20px] font-bold text-[var(--pl-text)] line-clamp-2 leading-tight">
                            {song?.title || "No track selected"}
                        </h4>
                        <Heart className="w-5 h-5 text-[var(--pl-text-muted)] hover:text-[var(--theme-color)] cursor-pointer transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-[14px] text-[var(--pl-text-muted)]">
                        {(song as any)?.channel_title || 'YouTube'}
                    </p>
                </div>

                {/* Queue Preview */}
                {playlist?.songs && playlist.songs.length > 1 && (
                    <div className="space-y-3">
                        <h5 className="text-[13px] font-bold text-white/60 uppercase tracking-widest">Next in queue</h5>
                        {playlist.songs.slice(0, 5).map((s, i) => {
                            const sVid = extractYoutubeId(s.youtube_url);
                            return (
                                <div key={s.id} className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded bg-[var(--pl-elevated)] overflow-hidden flex-shrink-0">
                                        <img src={`https://img.youtube.com/vi/${sVid}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[13px] font-medium truncate ${song?.id === s.id ? 'text-[var(--theme-color)]' : 'text-[var(--pl-text)]'}`}>{s.title}</p>
                                        <p className="text-[11px] text-[var(--pl-text-muted)] truncate">{(s as any).channel_title || 'YouTube'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Source Info */}
                <div className="bg-[var(--pl-surface)] rounded-xl p-4 space-y-2">
                    <h5 className="text-[13px] font-bold text-[var(--pl-text)]">Source</h5>
                    <p className="text-[12px] text-[var(--pl-text-muted)]">
                        YouTube • Streaming
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
