"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ListMusic, Repeat, SkipBack, SkipForward, Play, Pause, Music } from "lucide-react";
import { useMusic, Song, Playlist } from "../../lib/music-context";

interface MusicPlayerDropdownProps {
    currentSong: Song;
    currentPlaylist: Playlist | null;
    isPlaying: boolean;
    isLooping: boolean;
    togglePlay: () => void;
    toggleLoop: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    playSongByIndex: (index: number) => void;
    currentTime: number;
    duration: number;
    seekTo: (seconds: number) => void;
}

export function MusicPlayer() {
    const {
        currentSong, currentPlaylist, isPlaying, isLooping,
        togglePlay, toggleLoop, nextTrack, prevTrack, playSongByIndex,
        currentTime, duration, seekTo
    } = useMusic();
    const [isOpen, setIsOpen] = useState(false);

    if (!currentSong) return null;

    return (
        <div className="relative hidden sm:block">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all duration-300 ${isOpen
                    ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                    }`}
            >
                <div className="relative">
                    <Music className={`w-3.5 h-3.5 ${isOpen ? 'text-cyan-400' : 'text-neutral-500'}`} />
                    {isPlaying && (
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    )}
                </div>
                <div className="flex flex-col items-start max-w-[80px]">
                    <span className={`text-[10px] font-black uppercase tracking-tight truncate w-full ${isOpen ? 'text-cyan-400' : 'text-neutral-300'}`}>
                        {currentSong.title}
                    </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-neutral-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
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
    );
}

function MusicPlayerDropdown(props: MusicPlayerDropdownProps) {
    const [focusedIndex, setFocusedIndex] = useState<number>(props.currentPlaylist?.songs?.findIndex((s) => s.id === props.currentSong.id) ?? 0);
    const listRef = React.useRef<HTMLDivElement>(null);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!props.currentPlaylist?.songs) return;
            const len = props.currentPlaylist.songs.length;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => (prev + 1) % len);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => (prev - 1 + len) % len);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                props.playSongByIndex(focusedIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [props.currentPlaylist, focusedIndex, props.playSongByIndex]);

    // Scroll focused item into view
    React.useEffect(() => {
        const focusedElement = listRef.current?.children[focusedIndex] as HTMLElement;
        if (focusedElement) {
            focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [focusedIndex]);

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

                <div
                    ref={listRef}
                    className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar"
                >
                    {props.currentPlaylist?.songs?.map((song, idx) => (
                        <button
                            key={song.id}
                            onClick={() => {
                                setFocusedIndex(idx);
                                props.playSongByIndex(idx);
                            }}
                            onMouseEnter={() => setFocusedIndex(idx)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${focusedIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                            <span className={`text-[11px] font-medium truncate flex-1 text-left ${props.currentSong.id === song.id ? 'text-cyan-400' : focusedIndex === idx ? 'text-white' : 'text-neutral-500'}`}>
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
    );
}
