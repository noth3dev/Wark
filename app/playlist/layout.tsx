"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import {
    Play, Pause, Volume2, Repeat, SkipBack, SkipForward,
    ListMusic, Maximize2, Heart, Shuffle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import PlaylistSidebar from "../../components/playlist/PlaylistSidebar";
import NowPlayingSidebar from "../../components/playlist/NowPlayingSidebar";
import FullScreenPlayer from "../../components/playlist/FullScreenPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useActiveSessionSync } from "../../hooks/useActiveSessionSync";

export default function PlaylistLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    // Extract playlist ID from path like /playlist/abc123
    const selectedPlaylistId = pathname?.match(/^\/playlist\/([^/]+)$/)?.[1] || undefined;
    const {
        currentSong, isPlaying, togglePlay, nextTrack, prevTrack,
        repeatMode, setRepeatMode, volume, setVolume,
        currentTime, duration, seekTo, currentPlaylist,
        shuffleMode, toggleShuffle, likedSongs, toggleLike,
        recentlyPlayed, extractYoutubeId, playSongByIndex,
        currentSongIndex, playPlaylist
    } = useMusic();

    const tagStatus = useActiveSessionSync();
    const themeColor = tagStatus.color || "#1DB954";

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [rightSidebarVisible, setRightSidebarVisible] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (user) fetchPlaylists();
        // Restore full screen state from local storage
        const savedFS = localStorage.getItem('music_is_fullscreen');
        if (savedFS === 'true') setIsFullScreen(true);
    }, [user]);

    useEffect(() => {
        localStorage.setItem('music_is_fullscreen', isFullScreen.toString());
    }, [isFullScreen]);

    // Sub-component to handle search params to avoid build error
    function URLSync() {
        const searchParams = useSearchParams();
        const pathname = usePathname();
        const router = useRouter();

        useEffect(() => {
            if (!currentSong) return;
            const params = new URLSearchParams(searchParams.toString());
            if (params.get('song') !== currentSong.id) {
                params.set('song', currentSong.id);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, [searchParams, pathname, router]);

        return null;
    }

    const fetchPlaylists = async () => {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*, songs(*)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPlaylists(data || []);
        } catch (err) { console.error(err); }
    };

    const createPlaylist = async () => {
        if (!newPlaylistName.trim() || !user) return;
        try {
            const { data, error } = await supabase
                .from('playlists')
                .insert([{ name: newPlaylistName.trim(), user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            fetchPlaylists();
            setIsCreating(false);
            setNewPlaylistName("");
            if (data) router.push(`/playlist/${data.id}`);
        } catch (err) { console.error(err); }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const currentThumbnail = currentSong ? `https://img.youtube.com/vi/${extractYoutubeId(currentSong.youtube_url)}/0.jpg` : "";

    return (
        <div
            className="flex flex-col h-screen bg-black overflow-hidden select-none"
            style={{ "--theme-color": themeColor } as any}
        >
            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden min-h-0 pb-[90px]">
                {/* Left Sidebar */}
                <PlaylistSidebar
                    playlists={playlists}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelectPlaylist={(p) => router.push(`/playlist/${p.id}`)}
                    onCreatePlaylist={() => setIsCreating(true)}
                    onSearchClick={() => router.push('/playlist/search')}
                    onHomeClick={() => router.push('/playlist')}
                />

                {/* Page content */}
                <Suspense fallback={<div className="flex-1 bg-[#121212] flex items-center justify-center text-white">Loading...</div>}>
                    {children}
                    <URLSync />
                </Suspense>

                {/* Right Sidebar */}
                {rightSidebarVisible && (
                    <div className="w-[300px] flex-shrink-0 h-full">
                        <NowPlayingSidebar
                            song={currentSong}
                            playlist={currentPlaylist}
                            isVisible={rightSidebarVisible}
                            onClose={() => setRightSidebarVisible(false)}
                            isPlaying={isPlaying}
                            onTogglePlay={togglePlay}
                        />
                    </div>
                )}
            </div>

            {/* Fixed Bottom Player Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/5 h-[90px] px-4 py-2 flex items-center justify-between z-50">
                {/* Left: Track Info */}
                <div className="flex items-center gap-4 min-w-[30%]">
                    {currentSong ? (
                        <>
                            <div
                                onClick={() => setIsFullScreen(true)}
                                className="w-14 h-14 bg-[#282828] rounded shadow-lg flex-shrink-0 overflow-hidden group relative cursor-pointer"
                            >
                                <img src={currentThumbnail} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[14px] font-bold text-white hover:underline cursor-pointer truncate">{currentSong.title}</h4>
                                <p className="text-[11px] text-neutral-400 hover:text-white hover:underline cursor-pointer truncate">
                                    {(currentSong as any).channel_title || 'YouTube'}
                                </p>
                            </div>
                            <Heart
                                onClick={() => toggleLike(currentSong)}
                                style={likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? { color: themeColor, fill: themeColor } : {}}
                                className={`w-4 h-4 cursor-pointer ml-2 transition-colors flex-shrink-0 ${likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? "" : "text-neutral-400 hover:text-white"}`}
                            />
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#282828] rounded" />
                            <div className="space-y-1">
                                <div className="w-24 h-4 bg-white/5 rounded" />
                                <div className="w-16 h-3 bg-white/5 rounded" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: Playback Controls */}
                <div className="flex flex-col items-center gap-2 flex-1 max-w-[40%]">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleShuffle}
                            style={shuffleMode ? { color: themeColor } : {}}
                            className={`transition-colors ${shuffleMode ? "" : "text-neutral-400 hover:text-white"}`}
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>
                        <button onClick={prevTrack} className="text-neutral-400 hover:text-white transition-colors"><SkipBack className="w-5 h-5 fill-current" /></button>
                        <button onClick={togglePlay} className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <button onClick={nextTrack} className="text-neutral-400 hover:text-white transition-colors"><SkipForward className="w-5 h-5 fill-current" /></button>
                        <Repeat
                            onClick={() => {
                                const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
                                setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
                            }}
                            style={repeatMode !== 'none' ? { color: themeColor } : {}}
                            className={`w-4 h-4 cursor-pointer transition-colors ${repeatMode !== 'none' ? "" : "text-neutral-400 hover:text-white"}`}
                        />
                    </div>
                    <div className="w-full flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400 min-w-[40px] text-right tabular-nums">{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1 bg-white/10 rounded-full group cursor-pointer relative overflow-hidden">
                            <div
                                className="absolute left-0 h-full bg-white group-hover:bg-white rounded-full"
                                style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%`, backgroundColor: 'var(--theme-color, white)' }}
                            />
                            <div className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 -top-1 shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-opacity" style={{ left: `calc(${Math.min(100, (currentTime / (duration || 1)) * 100)}% - 6px)` }} />
                            <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => seekTo(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <span className="text-[11px] text-neutral-400 min-w-[40px] tabular-nums">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Misc Controls */}
                <div className="flex items-center justify-end gap-3 min-w-[30%]">
                    <button onClick={() => setRightSidebarVisible(!rightSidebarVisible)} className={`transition-colors ${rightSidebarVisible ? "" : "text-neutral-400 hover:text-white"}`} style={rightSidebarVisible ? { color: themeColor } : {}}>
                        <ListMusic className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 group w-32">
                        <Volume2 className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                        <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
                            <div className="absolute left-0 h-full bg-white group-hover:bg-white" style={{ width: `${volume}%`, backgroundColor: 'var(--theme-color, white)' }} />
                            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <button onClick={() => setIsFullScreen(true)} className={`transition-colors ${isFullScreen ? "" : "text-neutral-400 hover:text-white"}`} style={isFullScreen ? { color: themeColor } : {}}>
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Full Screen Player */}
            <FullScreenPlayer
                song={currentSong}
                isVisible={isFullScreen}
                onClose={() => setIsFullScreen(false)}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onNext={nextTrack}
                onPrev={prevTrack}
                currentTime={currentTime}
                duration={duration}
                onSeek={seekTo}
                volume={volume}
                onVolumeChange={setVolume}
                currentPlaylist={currentPlaylist}
                onPlaySong={(idx) => playSongByIndex(idx)}
                recentlyPlayed={recentlyPlayed}
                shuffleMode={shuffleMode}
                onToggleShuffle={toggleShuffle}
                repeatMode={repeatMode}
                onSetRepeatMode={setRepeatMode}
                likedSongs={likedSongs}
                onToggleLike={toggleLike}
                extractYoutubeId={extractYoutubeId}
                currentSongIndex={currentSongIndex}
                themeColor={themeColor}
                tagStatus={tagStatus}
            />

            {/* Create Playlist Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[#282828] border-none text-white max-w-md rounded-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Create Playlist</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-sm">Enter a name for your new playlist.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Input
                            placeholder="My Playlist #1"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                            className="bg-white/10 border-none h-12 text-lg focus-visible:ring-1 text-white"
                            style={{ '--tw-ring-color': themeColor } as any}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-white/5 text-white font-bold h-12 px-6 rounded-full">Cancel</Button>
                        <Button onClick={createPlaylist} className="hover:bg-opacity-90 text-black font-bold h-12 px-8 rounded-full" style={{ backgroundColor: themeColor }}>Create</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
