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
    repeatMode: 'none' | 'all' | 'one';
    shuffleMode: boolean;
    recentlyPlayed: Song[];
    likedSongs: string[]; // YouTube Video IDs
    volume: number;
    duration: number;
    currentTime: number;
    playPlaylist: (playlist: Playlist, startIndex?: number) => void;
    playSongByIndex: (index: number) => void;
    togglePlay: () => void;
    toggleShuffle: () => void;
    toggleLike: (song: Song) => Promise<void>;
    setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
    setVolume: (volume: number) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seekTo: (seconds: number) => void;
    extractYoutubeId: (url: string) => string | null;
    currentSongIndex: number;
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
    const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
    const [shuffleMode, setShuffleMode] = useState(false);
    const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
    const [likedSongs, setLikedSongs] = useState<string[]>([]);
    const [volume, setVolume] = useState(100);
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
        const savedRecentlyPlayed = localStorage.getItem('music_recently_played');

        if (savedRecentlyPlayed) {
            try { setRecentlyPlayed(JSON.parse(savedRecentlyPlayed)); } catch (e) { console.error(e); }
        }

        if (savedState) {
            try {
                const { playlist, index, time, repeatMode: savedRepeat, volume: savedVolume, isPlaying: savedPlaying, shuffleMode: savedShuffle } = JSON.parse(savedState);
                if (playlist && playlist.songs && playlist.songs[index]) {
                    setCurrentPlaylist(playlist);
                    setCurrentSongIndex(index);
                    setCurrentTime(time || 0);
                    setRepeatMode(savedRepeat || 'none');
                    setShuffleMode(!!savedShuffle);
                    setVolume(savedVolume ?? 100);
                    setIsPlaying(savedPlaying);
                }
            } catch (e) {
                console.error('Failed to load saved music state:', e);
                localStorage.removeItem('music_playback_state');
            }
        }
        fetchLikedSongs();
    }, []);

    const fetchLikedSongs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from('liked_songs')
                .select('song_id')
                .eq('user_id', user.id);
            if (error) throw error;
            setLikedSongs(data.map(item => item.song_id));
        } catch (err) { console.error("Error fetching liked songs:", err); }
    };

    const toggleLike = async (song: Song) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const videoId = extractYoutubeId(song.youtube_url);
            if (!videoId) return;

            if (likedSongs.includes(videoId)) {
                const { error } = await supabase
                    .from('liked_songs')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('song_id', videoId);
                if (error) throw error;
                setLikedSongs(prev => prev.filter(id => id !== videoId));
            } else {
                const { error } = await supabase
                    .from('liked_songs')
                    .insert({
                        user_id: user.id,
                        song_id: videoId,
                        title: song.title,
                        youtube_url: song.youtube_url,
                        thumbnail_url: `https://img.youtube.com/vi/${videoId}/default.jpg`
                    });
                if (error) throw error;
                setLikedSongs(prev => [...prev, videoId]);
            }
        } catch (err) { console.error("Error toggling like:", err); }
    };

    const toggleShuffle = () => setShuffleMode(!shuffleMode);

    useEffect(() => {
        if (currentSong) {
            // Update recently played
            setRecentlyPlayed(prev => {
                const filtered = prev.filter(s => s.id !== currentSong.id);
                const updated = [currentSong, ...filtered].slice(0, 50);
                localStorage.setItem('music_recently_played', JSON.stringify(updated));
                return updated;
            });

            if (window.YT && window.YT.Player) {
                const videoId = extractYoutubeId(currentSong.youtube_url);
                if (!videoId) return;

                if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                    playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
                    setCurrentTime(0);
                    setDuration(0);
                    if (isPlaying) playerRef.current.playVideo();
                    playerRef.current.setVolume(volume);
                } else {
                    setCurrentTime(0);
                    setDuration(0);
                    playerRef.current = new window.YT.Player('youtube-player', {
                        height: '0', width: '0', videoId: videoId,
                        playerVars: { autoplay: isPlaying ? 1 : 0, controls: 0, disablekb: 1, fs: 0, rel: 0, start: 0, origin: typeof window !== 'undefined' ? window.location.origin : '' },
                        events: {
                            onReady: (event: any) => { event.target.setVolume(volume); if (isPlaying) event.target.playVideo(); },
                            onStateChange: (event: any) => {
                                if (repeatMode === 'one') {
                                    event.target.seekTo(0);
                                    event.target.playVideo();
                                } else {
                                    nextTrack();
                                }
                                if (event.data === 1) setIsPlaying(true);
                                if (event.data === 2) setIsPlaying(false);
                            },
                            onError: (e: any) => { console.error("YT Player Error:", e); nextTrack(); }
                        }
                    });
                }
            }
        }
    }, [currentSong]);

    useEffect(() => {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(volume);
        }
    }, [volume]);

    useEffect(() => {
        if (currentPlaylist && currentSongIndex >= 0) {
            const state = { playlist: currentPlaylist, index: currentSongIndex, time: currentTime, repeatMode, volume, isPlaying, shuffleMode };
            localStorage.setItem('music_playback_state', JSON.stringify(state));
        }
    }, [currentPlaylist, currentSongIndex, currentTime, repeatMode, volume, isPlaying, shuffleMode]);

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
        if (isPlaying) { playerRef.current.pauseVideo(); }
        else { playerRef.current.playVideo(); }
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        if (!currentPlaylist?.songs || currentPlaylist.songs.length === 0) return;
        setCurrentTime(0);

        if (repeatMode === 'one') {
            // Re-trigger current index to reset playback
            const currentIndex = currentSongIndex;
            setCurrentSongIndex(-1);
            setTimeout(() => setCurrentSongIndex(currentIndex), 10);
            return;
        }

        if (shuffleMode) {
            const nextIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
            setCurrentSongIndex(nextIndex);
        } else {
            if (repeatMode === 'all') {
                setCurrentSongIndex(prev => (prev + 1) % currentPlaylist.songs!.length);
            } else {
                // repeatMode === 'none'
                if (currentSongIndex < currentPlaylist.songs.length - 1) {
                    setCurrentSongIndex(prev => prev + 1);
                } else {
                    setIsPlaying(false);
                    // Reset to first song but keep it paused (Spotify style)
                    setCurrentSongIndex(0);
                }
            }
        }
    };

    const prevTrack = () => {
        if (!currentPlaylist?.songs || currentPlaylist.songs.length === 0) return;

        // If we've played more than 3 seconds, just restart the song
        if (currentTime > 3) {
            seekTo(0);
            return;
        }

        setCurrentTime(0);
        if (shuffleMode) {
            const nextIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
            setCurrentSongIndex(nextIndex);
        } else {
            setCurrentSongIndex(prev => (prev - 1 + currentPlaylist.songs!.length) % currentPlaylist.songs!.length);
        }
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
        setCurrentTime(0);
        setCurrentSongIndex(index);
        setIsPlaying(true);
    };

    return (
        <MusicContext.Provider value={{
            currentPlaylist, currentSong, isPlaying, repeatMode, shuffleMode, recentlyPlayed, likedSongs,
            volume, duration, currentTime, playPlaylist, playSongByIndex, togglePlay, toggleShuffle, toggleLike,
            setRepeatMode, setVolume, nextTrack, prevTrack, seekTo, extractYoutubeId, currentSongIndex
        }}>
            {children}
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
