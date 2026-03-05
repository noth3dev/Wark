"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Repeat, SkipBack, SkipForward, ListMusic, MonitorSpeaker, Maximize2, Heart, Shuffle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import PlaylistSidebar from "../../components/playlist/PlaylistSidebar";
import NowPlayingSidebar from "../../components/playlist/NowPlayingSidebar";
import FullScreenPlayer from "../../components/playlist/FullScreenPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function PlaylistPage() {
    const { user } = useAuth();
    const {
        playPlaylist, currentSong, isPlaying,
        togglePlay, nextTrack, prevTrack,
        repeatMode, setRepeatMode, volume, setVolume,
        currentTime, duration, seekTo, currentPlaylist,
        shuffleMode, toggleShuffle, likedSongs, toggleLike,
        recentlyPlayed, extractYoutubeId
    } = useMusic();

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);

    const mainScrollRef = useRef<HTMLDivElement>(null);

    const YOUTUBE_API_KEY = "AIzaSyDhjIZh1xAGfghUrUZkA8vzX5iYDPxgLm8";

    useEffect(() => {
        if (user) fetchPlaylists();
    }, [user]);

    const fetchPlaylists = async () => {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*, songs(*)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPlaylists(data || []);
            if (data && data.length > 0 && !selectedPlaylist) {
                setSelectedPlaylist(data[0]);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollY = e.currentTarget.scrollTop;
        setHeaderOpacity(Math.min(scrollY / 200, 1));
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}`
            );
            const data = await response.json();
            setSearchResults(data.items || []);
        } catch (error) { console.error(error); }
        finally { setIsSearching(false); }
    };

    const playInstant = (video: any) => {
        const videoId = video.id.videoId;
        const dummyPlaylist: Playlist = {
            id: 'search-results',
            name: 'Search Results',
            user_id: user?.id || '',
            songs: [{
                id: videoId,
                playlist_id: 'search-results',
                title: video.snippet.title,
                youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
                order_index: 0
            }]
        };
        playPlaylist(dummyPlaylist, 0);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const createPlaylist = async () => {
        if (!newPlaylistName.trim() || !user) return;
        try {
            const { error } = await supabase
                .from('playlists')
                .insert([{ name: newPlaylistName.trim(), user_id: user.id }]);
            if (error) throw error;
            fetchPlaylists();
            setIsCreating(false);
            setNewPlaylistName("");
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

    const currentThumbnail = currentSong ? `https://img.youtube.com/vi/${extractYoutubeId(currentSong.youtube_url)}/0.jpg` : "";

    return (
        <div className="flex flex-col h-screen bg-black overflow-hidden select-none">
            <div className="flex flex-1 overflow-hidden">
                <PlaylistSidebar
                    playlists={playlists}
                    selectedPlaylistId={selectedPlaylist?.id || ""}
                    onSelectPlaylist={(p: Playlist) => setSelectedPlaylist(p)}
                    onCreatePlaylist={() => setIsCreating(true)}
                />

                <main
                    ref={mainScrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden bg-[#121212] relative custom-scrollbar scroll-smooth"
                >
                    {/* Header Overlay */}
                    <div
                        className="sticky top-0 w-full h-16 z-20 transition-colors duration-300 rounded-t-lg pointer-events-none"
                        style={{
                            backgroundColor: `rgba(18, 18, 18, ${headerOpacity})`,
                            boxShadow: headerOpacity > 0.8 ? "0 8px 12px rgba(0,0,0,0.3)" : "none"
                        }}
                    >
                        <div className="flex items-center h-full px-6 pointer-events-auto">
                            <div className="flex-1 flex items-center gap-4">
                                <div className="relative w-96 flex">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="What do you want to play?"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-[13px] rounded-full py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-white/10 transition-all text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Hero Area */}
                    <div className="relative pt-24 pb-12 px-8 overflow-hidden group/hero">
                        <div
                            className="absolute inset-0 z-0 bg-gradient-to-b transition-colors duration-1000"
                            style={{
                                backgroundImage: currentSong
                                    ? `linear-gradient(to bottom, rgba(79, 70, 229, 0.4), #121212)`
                                    : `linear-gradient(to bottom, rgba(55, 65, 81, 0.4), #121212)`,
                                filter: 'blur(50px)',
                                opacity: 0.6
                            }}
                        />
                        <div className="absolute inset-0 z-0 bg-black/40" />

                        <div className="relative z-10 flex items-end gap-6">
                            <motion.div
                                layoutId="main-cover"
                                className="w-52 h-52 bg-[#282828] shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex-shrink-0 cursor-pointer hover:scale-[1.02] transition-transform duration-300 rounded-lg overflow-hidden"
                            >
                                {selectedPlaylist?.songs?.[0] ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${extractYoutubeId(selectedPlaylist.songs[0].youtube_url)}/maxresdefault.jpg`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Music className="w-16 h-16 text-neutral-600" />
                                    </div>
                                )}
                            </motion.div>
                            <div className="space-y-4">
                                <p className="text-[12px] font-bold text-white uppercase tracking-tight">Playlist</p>
                                <h1 className="text-[80px] font-black text-white leading-none tracking-tighter">
                                    {selectedPlaylist?.name || "Select a Collection"}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-white font-medium">
                                    <span className="hover:underline cursor-pointer">Antigravity</span>
                                    <span className="before:content-['•'] before:mr-2">{(selectedPlaylist?.songs?.length || 0)} songs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="sticky top-16 z-10 bg-[#121212]/80 backdrop-blur-md px-8 py-6 flex items-center gap-8">
                        <button
                            onClick={() => playPlaylist(selectedPlaylist!, 0)}
                            className="w-14 h-14 bg-[#1DB954] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                        >
                            <Play className="w-6 h-6 fill-current ml-1" />
                        </button>
                        <Heart
                            onClick={() => currentSong && toggleLike(currentSong)}
                            className={`w-8 h-8 cursor-pointer hover:scale-110 transition-transform ${currentSong && likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? "text-[#1DB954] fill-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                        />
                        <PlusCircle className="w-8 h-8 text-neutral-400 hover:text-white cursor-pointer transition-colors" />
                        <MoreHorizontal className="w-8 h-8 text-neutral-400 hover:text-white cursor-pointer transition-colors" />
                    </div>

                    {/* Track Table */}
                    <div className="px-8 pb-32">
                        {searchResults.length > 0 && searchQuery && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {searchResults.map(video => (
                                        <div
                                            key={video.id.videoId}
                                            onClick={() => playInstant(video)}
                                            className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all cursor-pointer group"
                                        >
                                            <div className="relative aspect-square mb-4 shadow-lg overflow-hidden rounded-md">
                                                <img src={video.snippet.thumbnails.medium.url} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-all">
                                                        <Play className="w-6 h-6 fill-black text-black ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-white font-bold text-sm line-clamp-1">{video.snippet.title}</p>
                                            <p className="text-neutral-400 text-xs mt-1">{video.snippet.channelTitle}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <table className="w-full text-left border-collapse">
                            <thead className="text-[12px] font-medium text-neutral-400 border-b border-white/10 uppercase tracking-widest">
                                <tr>
                                    <th className="py-2 px-4 font-medium w-12 text-center">#</th>
                                    <th className="py-2 px-4 font-medium">Title</th>
                                    <th className="py-2 px-4 font-medium hidden md:table-cell">Album</th>
                                    <th className="py-2 px-4 font-medium hidden lg:table-cell">Date added</th>
                                    <th className="py-2 px-4 font-medium text-right pr-12"><Clock3 className="w-4 h-4 ml-auto" /></th>
                                </tr>
                            </thead>
                            <tbody className="before:content-['-'] before:block before:h-4 before:invisible">
                                {(selectedPlaylist?.songs || []).map((song, i) => (
                                    <tr
                                        key={song.id}
                                        className={`group hover:bg-white/10 transition-colors rounded-md cursor-default text-[14px] ${currentSong?.id === song.id ? "bg-white/5" : ""}`}
                                        onDoubleClick={() => playPlaylist(selectedPlaylist!, i)}
                                        onMouseEnter={() => setHoveredTrackIndex(i)}
                                        onMouseLeave={() => setHoveredTrackIndex(null)}
                                    >
                                        <td className="py-2 px-4 text-center rounded-l-md text-neutral-400 group-hover:text-white relative">
                                            {hoveredTrackIndex === i ? (
                                                <Play
                                                    className="w-4 h-4 fill-white text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                                                    onClick={() => playPlaylist(selectedPlaylist!, i)}
                                                />
                                            ) : (
                                                currentSong?.id === song.id && isPlaying ? (
                                                    <div className="flex gap-0.5 items-end h-3 justify-center">
                                                        <div className="w-1 bg-[#1DB954] animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                                                        <div className="w-1 bg-[#1DB954] animate-bounce h-3" style={{ animationDelay: '200ms' }} />
                                                        <div className="w-1 bg-[#1DB954] animate-bounce h-1" style={{ animationDelay: '400ms' }} />
                                                    </div>
                                                ) : (
                                                    <span className={`${currentSong?.id === song.id ? "text-[#1DB954]" : ""}`}>{i + 1}</span>
                                                )
                                            )}
                                        </td>
                                        <td className="py-2 px-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#282828] rounded flex-shrink-0 overflow-hidden">
                                                <img src={`https://img.youtube.com/vi/${extractYoutubeId(song.youtube_url)}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-bold truncate ${currentSong?.id === song.id ? "text-[#1DB954]" : "text-white"}`}>{song.title}</p>
                                                <p className="text-xs text-neutral-400 hover:underline cursor-pointer">YouTube Artist</p>
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 text-neutral-400 hidden md:table-cell hover:text-white cursor-pointer">YouTube Collection</td>
                                        <td className="py-2 px-4 text-neutral-400 hidden lg:table-cell">Dec 12, 2023</td>
                                        <td className="py-2 px-4 text-right pr-12 text-neutral-400 rounded-r-md">3:45</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

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

            {/* Sub-bar Player Controls */}
            <div className="bg-black border-t border-white/5 h-[90px] px-4 py-2 flex items-center justify-between z-50 flex-shrink-0">
                {/* Left: Track Info */}
                <div className="flex items-center gap-4 min-w-[30%]">
                    {currentSong ? (
                        <>
                            <div className="w-14 h-14 bg-[#282828] rounded shadow-lg flex-shrink-0 overflow-hidden group relative">
                                <img src={currentThumbnail} alt="" className="w-full h-full object-cover" />
                                <button className="absolute top-1 right-1 p-1 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-3 h-3 text-white" />
                                </button>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[14px] font-bold text-white hover:underline cursor-pointer truncate">{currentSong.title}</h4>
                                <p className="text-[11px] text-neutral-400 hover:text-white hover:underline cursor-pointer truncate">YouTube Artist</p>
                            </div>
                            <Heart
                                onClick={() => toggleLike(currentSong)}
                                className={`w-4 h-4 cursor-pointer ml-2 transition-colors ${likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? "text-[#1DB954] fill-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
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
                            className={`transition-colors ${shuffleMode ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>
                        <button onClick={prevTrack} className="text-neutral-400 hover:text-white transition-colors"><SkipBack className="w-5 h-5 fill-current" /></button>
                        <button
                            onClick={togglePlay}
                            className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <button onClick={nextTrack} className="text-neutral-400 hover:text-white transition-colors"><SkipForward className="w-5 h-5 fill-current" /></button>
                        <Repeat
                            onClick={() => {
                                const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
                                setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
                            }}
                            className={`w-4 h-4 cursor-pointer transition-colors ${repeatMode !== 'none' ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                        />
                    </div>
                    <div className="w-full flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400 min-w-[40px] text-right">{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1 bg-white/10 rounded-full group cursor-pointer relative">
                            <div
                                className="absolute left-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                            <div
                                className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 -top-1 shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-opacity"
                                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
                            />
                            <input
                                type="range"
                                min="0" max={duration || 100} value={currentTime}
                                onChange={(e) => seekTo(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        <span className="text-[11px] text-neutral-400 min-w-[40px]">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Misc Controls */}
                <div className="flex items-center justify-end gap-3 min-w-[30%]">
                    <ListMusic className="w-4 h-4 text-neutral-400 hover:text-white cursor-pointer" />
                    <MonitorSpeaker className="w-4 h-4 text-neutral-400 hover:text-white cursor-pointer" />
                    <div className="flex items-center gap-2 group w-32">
                        <Volume2 className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                        <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
                            <div className="absolute left-0 h-full bg-white group-hover:bg-[#1DB954]" style={{ width: `${volume}%` }} />
                            <input
                                type="range" min="0" max="100" value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                    <div
                        onClick={() => setIsFullScreen(true)}
                        className={`w-4 h-4 cursor-pointer transition-colors ${isFullScreen ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                    >
                        <Maximize2 className="w-4 h-4" />
                    </div>
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
                onPlaySong={(idx) => playPlaylist(currentPlaylist!, idx)}
                recentlyPlayed={recentlyPlayed}
                shuffleMode={shuffleMode}
                onToggleShuffle={toggleShuffle}
                repeatMode={repeatMode}
                onSetRepeatMode={setRepeatMode}
                likedSongs={likedSongs}
                onToggleLike={toggleLike}
            />

            {/* Create Playlist Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[#282828] border-none text-white max-w-md rounded-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">플레이리스트 만들기</DialogTitle>
                        <DialogDescription className="text-neutral-400 text-sm">
                            새로운 플레이리스트의 이름을 입력하세요.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Input
                            placeholder="내 플레이리스트 #1"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="bg-white/10 border-none h-12 text-lg focus-visible:ring-1 focus-visible:ring-[#1DB954]"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-white/5 text-white font-bold h-12 px-6 rounded-full">취소</Button>
                        <Button onClick={createPlaylist} className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-12 px-8 rounded-full">생성하기</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}



interface PlusCircleProps extends React.SVGProps<SVGSVGElement> { }
function PlusCircle(props: PlusCircleProps) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
    );
}
