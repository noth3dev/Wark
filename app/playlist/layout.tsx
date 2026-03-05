"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import {
    Play, Pause, Volume2, Repeat, SkipBack, SkipForward,
    ListMusic, Maximize2, Heart, Shuffle, PlusCircle, Music
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
    const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);

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

    const addSongToPlaylist = async (playlistId: string, song: Song) => {
        if (!user) return;
        try {
            const pl = playlists.find(p => p.id === playlistId);
            const { error } = await supabase.from('songs').insert({
                playlist_id: playlistId,
                title: song.title,
                youtube_url: song.youtube_url,
                order_index: pl?.songs?.length || 0,
            });
            if (error) throw error;
            fetchPlaylists();
            setAddToPlaylistSong(null);
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
            <div className="flex flex-1 overflow-hidden min-h-0 pb-[72px] md:pb-[90px]">
                {/* Left Sidebar - Hidden on mobile */}
                <div className="flex h-full">
                    <PlaylistSidebar
                        playlists={playlists}
                        selectedPlaylistId={selectedPlaylistId}
                        onSelectPlaylist={(p) => router.push(`/playlist/${p.id}`)}
                        onCreatePlaylist={() => setIsCreating(true)}
                        onSearchClick={() => router.push('/playlist/search')}
                        onHomeClick={() => router.push('/playlist')}
                        isCollapsed={leftSidebarCollapsed}
                        onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                    />
                </div>

                {/* Page content */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#121212] md:rounded-lg md:m-2 relative overflow-hidden">
                    <Suspense fallback={<div className="flex-1 bg-[#121212] flex items-center justify-center text-white">Loading...</div>}>
                        {children}
                        <URLSync />
                    </Suspense>
                </div>

                {/* Right Sidebar - Hidden on mobile */}
                <NowPlayingSidebar
                    song={currentSong}
                    playlist={currentPlaylist}
                    isVisible={rightSidebarVisible}
                    onClose={() => setRightSidebarVisible(false)}
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    onExpand={() => setIsFullScreen(true)}
                />
            </div>

            {/* Fixed Bottom Player Bar - Simplified for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/5 h-[72px] md:h-[90px] px-2 md:px-4 py-2 flex items-center justify-between z-50">
                {/* Left: Track Info */}
                <div className="flex items-center gap-2 md:gap-4 min-w-0 md:min-w-[30%] flex-1 md:flex-none">
                    {currentSong ? (
                        <>
                            <div
                                onClick={() => setIsFullScreen(true)}
                                className="w-12 h-12 md:w-14 md:h-14 bg-[#282828] rounded shadow-lg flex-shrink-0 overflow-hidden group relative cursor-pointer"
                            >
                                <img src={currentThumbnail} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1 md:flex-none">
                                <h4 className="text-[13px] md:text-[14px] font-bold text-white hover:underline cursor-pointer truncate">{currentSong.title}</h4>
                                <p className="text-[10px] md:text-[11px] text-neutral-400 hover:text-white hover:underline cursor-pointer truncate">
                                    {(currentSong as any).channel_title || 'YouTube'}
                                </p>
                            </div>
                            <Heart
                                onClick={() => toggleLike(currentSong)}
                                style={likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? { color: themeColor, fill: themeColor } : {}}
                                className={`hidden md:block w-4 h-4 cursor-pointer ml-2 transition-colors flex-shrink-0 ${likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? "" : "text-neutral-400 hover:text-white"}`}
                            />
                            <PlusCircle
                                onClick={() => setAddToPlaylistSong(currentSong)}
                                className="hidden md:block w-4 h-4 text-neutral-400 hover:text-white cursor-pointer ml-2 transition-colors flex-shrink-0"
                            />
                        </>
                    ) : (
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#282828] rounded" />
                            <div className="space-y-1">
                                <div className="w-20 md:w-24 h-3 md:h-4 bg-white/5 rounded" />
                                <div className="w-12 md:w-16 h-2 md:h-3 bg-white/5 rounded" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: Playback Controls - Hidden or simplified on Mobile */}
                <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 max-w-[40%] hidden md:flex">
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
                        <div className="relative">
                            <Repeat
                                onClick={() => {
                                    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
                                    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
                                }}
                                style={repeatMode !== 'none' ? { color: themeColor } : {}}
                                className={`w-4 h-4 cursor-pointer transition-colors ${repeatMode !== 'none' ? "" : "text-neutral-400 hover:text-white"}`}
                            />
                            {repeatMode === 'one' && (
                                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black pointer-events-none" style={{ color: themeColor }}>1</span>
                            )}
                        </div>
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

                {/* Right: Misc Controls - Mobile play button and full screen button only */}
                <div className="flex items-center justify-end gap-3 md:min-w-[30%]">
                    {/* Mobile Play Button */}
                    <button onClick={togglePlay} className="md:hidden w-10 h-10 flex items-center justify-center text-white">
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>

                    <button onClick={() => setRightSidebarVisible(!rightSidebarVisible)} className={`hidden md:block transition-colors ${rightSidebarVisible ? "" : "text-neutral-400 hover:text-white"}`} style={rightSidebarVisible ? { color: themeColor } : {}}>
                        <ListMusic className="w-4 h-4" />
                    </button>
                    <div className="hidden md:flex items-center gap-2 group w-32">
                        <Volume2 className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                        <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
                            <div className="absolute left-0 h-full bg-white group-hover:bg-white" style={{ width: `${volume}%`, backgroundColor: 'var(--theme-color, white)' }} />
                            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <button onClick={() => setIsFullScreen(true)} className={`transition-colors ${isFullScreen ? "" : "text-neutral-400 hover:text-white"}`} style={isFullScreen ? { color: themeColor } : {}}>
                        <Maximize2 className="w-5 h-5 md:w-4 md:h-4" />
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
                onAddToPlaylist={() => setAddToPlaylistSong(currentSong)}
            />

            {/* Add to Playlist Dialog */}
            <Dialog open={!!addToPlaylistSong} onOpenChange={(open) => !open && setAddToPlaylistSong(null)}>
                <DialogContent className="bg-[#282828] border-none text-white max-w-sm rounded-2xl p-6 z-[200]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Add to Playlist</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-sm truncate">
                            {addToPlaylistSong?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {playlists.map(pl => (
                            <button
                                key={pl.id}
                                onClick={() => addToPlaylistSong && addSongToPlaylist(pl.id, addToPlaylistSong)}
                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                            >
                                <div className="w-10 h-10 bg-[#181818] rounded flex items-center justify-center flex-shrink-0">
                                    <Music className="w-5 h-5 text-neutral-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[14px] font-medium text-white truncate">{pl.name}</p>
                                    <p className="text-[11px] text-neutral-400">{pl.songs?.length || 0} songs</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

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
