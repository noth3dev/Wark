"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export interface Song {
    id: string;
    playlist_id: string;
    title: string;
    youtube_url: string;
    order_index: number;
}

export interface Playlist {
    id: string;
    name: string;
    user_id: string;
    songs?: Song[];
}

interface MusicContextType {
    currentPlaylist: Playlist | null;
    currentSong: Song | null;
    isPlaying: boolean;
    isLooping: boolean;
    duration: number;
    currentTime: number;
    playPlaylist: (playlist: Playlist, startIndex?: number) => void;
    playSongByIndex: (index: number) => void;
    togglePlay: () => void;
    toggleLoop: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seekTo: (seconds: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
    const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
    const [currentSongIndex, setCurrentSongIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentSong = currentPlaylist?.songs?.[currentSongIndex] || null;

    useEffect(() => {
        // Load YouTube API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }
    }, []);

    useEffect(() => {
        // Load initial state from localStorage
        const savedState = localStorage.getItem('music_playback_state');
        if (savedState) {
            try {
                const { playlist, index, time, isLooping: savedLoop, isPlaying: savedPlaying } = JSON.parse(savedState);
                if (playlist && playlist.songs && playlist.songs[index]) {
                    setCurrentPlaylist(playlist);
                    setCurrentSongIndex(index);
                    setCurrentTime(time || 0);
                    setIsLooping(savedLoop);
                    setIsPlaying(savedPlaying);
                }
            } catch (e) {
                console.error('Failed to load saved music state:', e);
                localStorage.removeItem('music_playback_state');
            }
        }
    }, []);

    useEffect(() => {
        if (currentSong && window.YT && window.YT.Player) {
            const videoId = extractYoutubeId(currentSong.youtube_url);
            if (!videoId) return;

            if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                playerRef.current.loadVideoById({
                    videoId: videoId,
                    startSeconds: 0
                });
                setCurrentTime(0);
                setDuration(0);
                if (isPlaying) {
                    playerRef.current.playVideo();
                }
            } else {
                setCurrentTime(0);
                setDuration(0);
                playerRef.current = new window.YT.Player('youtube-player', {
                    height: '0',
                    width: '0',
                    videoId: videoId,
                    playerVars: {
                        autoplay: isPlaying ? 1 : 0,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        rel: 0,
                        start: 0,
                        origin: typeof window !== 'undefined' ? window.location.origin : '',
                    },
                    events: {
                        onReady: (event: any) => {
                            if (isPlaying) event.target.playVideo();
                        },
                        onStateChange: (event: any) => {
                            if (event.data === 0) {
                                if (isLooping) {
                                    event.target.seekTo(0);
                                    event.target.playVideo();
                                } else {
                                    nextTrack();
                                }
                            }
                            if (event.data === 1) setIsPlaying(true);
                            if (event.data === 2) setIsPlaying(false);
                        },
                        onError: (e: any) => {
                            console.error("YT Player Error:", e);
                            nextTrack();
                        }
                    }
                });
            }
        }
    }, [currentSong]);

    // Save state periodically
    useEffect(() => {
        if (currentPlaylist && currentSongIndex >= 0) {
            const state = {
                playlist: currentPlaylist,
                index: currentSongIndex,
                time: currentTime,
                isLooping,
                isPlaying
            };
            localStorage.setItem('music_playback_state', JSON.stringify(state));
        }
    }, [currentPlaylist, currentSongIndex, currentTime, isLooping, isPlaying]);

    // Progress timer
    useEffect(() => {
        if (isPlaying && playerRef.current) {
            timerRef.current = setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    setCurrentTime(playerRef.current.getCurrentTime());
                    setDuration(playerRef.current.getDuration());
                }
            }, 500);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying]);

    const playPlaylist = (playlist: Playlist, startIndex = 0) => {
        setCurrentPlaylist(playlist);
        setCurrentSongIndex(startIndex);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleLoop = () => setIsLooping(!isLooping);

    const nextTrack = () => {
        if (!currentPlaylist?.songs || currentPlaylist.songs.length === 0) return;
        setCurrentTime(0);  // Reset time for new track
        setCurrentSongIndex(prev => (prev + 1) % currentPlaylist.songs!.length);
    };

    const prevTrack = () => {
        if (!currentPlaylist?.songs || currentPlaylist.songs.length === 0) return;
        setCurrentTime(0);  // Reset time for new track
        setCurrentSongIndex(prev => (prev - 1 + currentPlaylist.songs!.length) % currentPlaylist.songs!.length);
    };

    const seekTo = (seconds: number) => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(seconds, true);
            setCurrentTime(seconds);
        }
    };

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const playSongByIndex = (index: number) => {
        if (!currentPlaylist?.songs) return;
        setCurrentTime(0);  // Reset time for new track
        setCurrentSongIndex(index);
        setIsPlaying(true);
    };

    return (
        <MusicContext.Provider value={{
            currentPlaylist,
            currentSong,
            isPlaying,
            isLooping,
            duration,
            currentTime,
            playPlaylist,
            playSongByIndex,
            togglePlay,
            toggleLoop,
            nextTrack,
            prevTrack,
            seekTo
        }}>
            {children}
            {/* Stable container for YouTube player to avoid React reconciliation errors */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
                <div id="youtube-player"></div>
            </div>
        </MusicContext.Provider>
    );
}

export function useMusic() {
    const context = useContext(MusicContext);
    if (context === undefined) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
}
