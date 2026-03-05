"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Plus, Search, Music, Clock3, MoreHorizontal, Pause, Volume2,
    Repeat, SkipBack, SkipForward, ListMusic, MonitorSpeaker, Maximize2,
    Heart, Shuffle, PlusCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import PlaylistSidebar from "../../components/playlist/PlaylistSidebar";
import NowPlayingSidebar from "../../components/playlist/NowPlayingSidebar";
import FullScreenPlayer from "../../components/playlist/FullScreenPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";

interface SearchResult {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    thumbnailHigh: string;
    durationText: string;
    duration: number;
    viewCount: string;
    publishedAt: string;
}

export default function PlaylistPageWrapper() {
    return (
        <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
            <PlaylistPage />
        </Suspense>
    );
}

function PlaylistPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParamsHook = useSearchParams();
    const {
        playPlaylist, currentSong, isPlaying,
        togglePlay, nextTrack, prevTrack,
        repeatMode, setRepeatMode, volume, setVolume,
        currentTime, duration, seekTo, currentPlaylist,
        shuffleMode, toggleShuffle, likedSongs, toggleLike,
        recentlyPlayed, extractYoutubeId, playSongByIndex,
        currentSongIndex
    } = useMusic();

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    // Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMode, setSearchMode] = useState(false);

    // UI States
    const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);
    const [addToPlaylistSong, setAddToPlaylistSong] = useState<SearchResult | null>(null);

    const mainScrollRef = useRef<HTMLDivElement>(null);

    // Sync URL params
    useEffect(() => {
        const playlistId = searchParamsHook?.get('playlist');
        const q = searchParamsHook?.get('q');
        if (q) {
            setSearchQuery(q);
            setSearchMode(true);
        }
        if (playlistId && playlists.length > 0) {
            const found = playlists.find(p => p.id === playlistId);
            if (found) setSelectedPlaylist(found);
        }
    }, [searchParamsHook, playlists]);

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

    const handleSearch = async (query?: string) => {
        const q = query || searchQuery;
        if (!q.trim()) return;
        setIsSearching(true);
        setSearchMode(true);
        try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}&maxResults=15`);
            const data = await response.json();
            setSearchResults(data.items || []);
        } catch (error) { console.error(error); }
        finally { setIsSearching(false); }
    };

    const playInstant = (result: SearchResult) => {
        const dummyPlaylist: Playlist = {
            id: 'search-results',
            name: 'Search Results',
            user_id: user?.id || '',
            songs: searchResults.map((r, i) => ({
                id: r.videoId,
                playlist_id: 'search-results',
                title: r.title,
                youtube_url: `https://www.youtube.com/watch?v=${r.videoId}`,
                order_index: i,
                channel_title: r.channelTitle,
                duration_text: r.durationText,
            } as Song))
        };
        const idx = searchResults.findIndex(r => r.videoId === result.videoId);
        playPlaylist(dummyPlaylist, idx >= 0 ? idx : 0);
    };

    const addSongToPlaylist = async (playlistId: string, result: SearchResult) => {
        if (!user) return;
        try {
            const existingPlaylist = playlists.find(p => p.id === playlistId);
            const orderIndex = (existingPlaylist?.songs?.length || 0);

            const { error } = await supabase.from('songs').insert({
                playlist_id: playlistId,
                title: result.title,
                youtube_url: `https://www.youtube.com/watch?v=${result.videoId}`,
                order_index: orderIndex,
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

    const selectPlaylist = (p: Playlist) => {
        setSelectedPlaylist(p);
        setSearchMode(false);
        setSearchResults([]);
        setSearchQuery("");
    };

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

    const currentThumbnail = currentSong ? `https://img.youtube.com/vi/${extractYoutubeId(currentSong.youtube_url)}/0.jpg` : "";

    return (
        <div className="flex flex-col h-screen bg-black overflow-hidden select-none">
            <div className="flex flex-1 overflow-hidden">
                <PlaylistSidebar
                    playlists={playlists}
                    selectedPlaylistId={selectedPlaylist?.id}
                    onSelectPlaylist={selectPlaylist}
                    onCreatePlaylist={() => setIsCreating(true)}
                    onSearchClick={() => { setSearchMode(true); }}
                />

                <main
                    ref={mainScrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden bg-[#121212] relative custom-scrollbar scroll-smooth"
                >
                    {/* Sticky Header with Search */}
                    <div
                        className="sticky top-0 w-full h-16 z-20 transition-colors duration-300 pointer-events-none"
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
                                        onFocus={() => setSearchMode(true)}
                                        className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-[13px] rounded-full py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-white/10 transition-all text-white placeholder:text-neutral-500"
                                    />
                                </div>
                                {searchMode && (
                                    <button
                                        onClick={() => { setSearchMode(false); setSearchResults([]); setSearchQuery(""); }}
                                        className="text-[13px] text-neutral-400 hover:text-white font-medium"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {searchMode ? (
                        /* ========== SEARCH MODE ========== */
                        <div className="px-8 pb-32 pt-8">
                            {isSearching && (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {!isSearching && searchResults.length > 0 && (
                                <>
                                    <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
                                    <div className="space-y-1">
                                        {searchResults.map((result, i) => (
                                            <div
                                                key={result.videoId}
                                                className="flex items-center gap-4 p-2.5 rounded-md hover:bg-white/5 transition-colors group cursor-pointer"
                                                onMouseEnter={() => setHoveredTrackIndex(i)}
                                                onMouseLeave={() => setHoveredTrackIndex(null)}
                                            >
                                                {/* Thumbnail with Play overlay */}
                                                <div className="w-12 h-12 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative">
                                                    <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    <div
                                                        onClick={() => playInstant(result)}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <Play className="w-5 h-5 fill-white text-white" />
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0 flex-1" onClick={() => playInstant(result)}>
                                                    <p className="text-[14px] font-medium text-white truncate">{result.title}</p>
                                                    <p className="text-[12px] text-neutral-400 truncate">{result.channelTitle} • {result.viewCount} views</p>
                                                </div>

                                                {/* Duration */}
                                                <span className="text-[12px] text-neutral-400 tabular-nums flex-shrink-0 w-12 text-right">
                                                    {result.durationText || '—'}
                                                </span>

                                                {/* Add to playlist button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setAddToPlaylistSong(result); }}
                                                    className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Add to playlist"
                                                >
                                                    <PlusCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {!isSearching && searchResults.length === 0 && searchQuery && (
                                <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                                    <Search className="w-12 h-12 mb-4" />
                                    <p className="text-lg font-bold">Search for songs</p>
                                    <p className="text-sm mt-1">Find songs on YouTube and add them to your playlists</p>
                                </div>
                            )}

                            {!isSearching && !searchQuery && (
                                <div className="space-y-8">
                                    {/* Recently Played section in search mode */}
                                    {recentlyPlayed.length > 0 && (
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-4">Recently Played</h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {recentlyPlayed.slice(0, 10).map((s, i) => {
                                                    const vid = extractYoutubeId(s.youtube_url);
                                                    return (
                                                        <div
                                                            key={`recent-${s.id}-${i}`}
                                                            onClick={() => {
                                                                const historyPlaylist: Playlist = {
                                                                    id: 'recently-played',
                                                                    name: 'Recently Played',
                                                                    user_id: '',
                                                                    songs: recentlyPlayed
                                                                };
                                                                playPlaylist(historyPlaylist, i);
                                                            }}
                                                            className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all cursor-pointer group"
                                                        >
                                                            <div className="relative aspect-square mb-3 rounded-md overflow-hidden shadow-lg">
                                                                <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-end p-2 transition-opacity">
                                                                    <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
                                                                        <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-[13px] font-bold text-white truncate">{s.title}</p>
                                                            <p className="text-[11px] text-neutral-400 mt-1 truncate">{(s as any).channel_title || 'YouTube'}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ========== PLAYLIST MODE ========== */
                        <>
                            {/* Dynamic Hero Area */}
                            <div className="relative pt-24 pb-12 px-8 overflow-hidden">
                                <div
                                    className="absolute inset-0 z-0 bg-gradient-to-b transition-colors duration-1000"
                                    style={{
                                        backgroundImage: selectedPlaylist?.songs?.[0]
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
                                        className="w-52 h-52 bg-[#282828] shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex-shrink-0 rounded-lg overflow-hidden"
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
                                            <span className="hover:underline cursor-pointer">{user?.email?.split('@')[0] || 'User'}</span>
                                            <span className="before:content-['•'] before:mr-2">{(selectedPlaylist?.songs?.length || 0)} songs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Controls Bar */}
                            <div className="sticky top-16 z-10 bg-[#121212]/80 backdrop-blur-md px-8 py-6 flex items-center gap-8">
                                <button
                                    onClick={() => selectedPlaylist && playPlaylist(selectedPlaylist, 0)}
                                    className="w-14 h-14 bg-[#1DB954] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                                >
                                    <Play className="w-6 h-6 fill-current ml-1" />
                                </button>
                                <Shuffle
                                    onClick={toggleShuffle}
                                    className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${shuffleMode ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                                />
                                <MoreHorizontal className="w-7 h-7 text-neutral-400 hover:text-white cursor-pointer transition-colors" />
                            </div>

                            {/* Track Table */}
                            <div className="px-8 pb-32">
                                <table className="w-full text-left border-collapse">
                                    <thead className="text-[12px] font-medium text-neutral-400 border-b border-white/10 uppercase tracking-widest">
                                        <tr>
                                            <th className="py-2 px-4 font-medium w-12 text-center">#</th>
                                            <th className="py-2 px-4 font-medium">Title</th>
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
                                                <td className="py-2 px-4 text-center rounded-l-md text-neutral-400 group-hover:text-white relative w-12">
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
                                                            <span className={currentSong?.id === song.id ? "text-[#1DB954]" : ""}>{i + 1}</span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#282828] rounded flex-shrink-0 overflow-hidden">
                                                        <img src={`https://img.youtube.com/vi/${extractYoutubeId(song.youtube_url)}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`font-bold truncate ${currentSong?.id === song.id ? "text-[#1DB954]" : "text-white"}`}>{song.title}</p>
                                                        <p className="text-xs text-neutral-400">{(song as any).channel_title || 'YouTube'}</p>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-neutral-400 hidden lg:table-cell text-[13px]">—</td>
                                                <td className="py-2 px-4 text-right pr-12 text-neutral-400 rounded-r-md tabular-nums text-[13px]">
                                                    {(song as any).duration_text || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
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

            {/* Bottom Player Bar */}
            <div className="bg-black border-t border-white/5 h-[90px] px-4 py-2 flex items-center justify-between z-50 flex-shrink-0">
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
                                className={`w-4 h-4 cursor-pointer ml-2 transition-colors flex-shrink-0 ${likedSongs.includes(extractYoutubeId(currentSong.youtube_url) || '') ? "text-[#1DB954] fill-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
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
                        <span className="text-[11px] text-neutral-400 min-w-[40px] text-right tabular-nums">{formatTime(currentTime)}</span>
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
                        <span className="text-[11px] text-neutral-400 min-w-[40px] tabular-nums">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Right: Misc Controls */}
                <div className="flex items-center justify-end gap-3 min-w-[30%]">
                    <button
                        onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
                        className={`transition-colors ${rightSidebarVisible ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                    >
                        <ListMusic className="w-4 h-4" />
                    </button>
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
                    <button
                        onClick={() => setIsFullScreen(true)}
                        className={`transition-colors ${isFullScreen ? "text-[#1DB954]" : "text-neutral-400 hover:text-white"}`}
                    >
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
            />

            {/* Add to Playlist Dialog */}
            <Dialog open={!!addToPlaylistSong} onOpenChange={(open) => !open && setAddToPlaylistSong(null)}>
                <DialogContent className="bg-[#282828] border-none text-white max-w-sm rounded-2xl p-6">
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
                        <DialogDescription className="text-neutral-400 text-sm">
                            Enter a name for your new playlist.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Input
                            placeholder="My Playlist #1"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                            className="bg-white/10 border-none h-12 text-lg focus-visible:ring-1 focus-visible:ring-[#1DB954] text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-white/5 text-white font-bold h-12 px-6 rounded-full">Cancel</Button>
                        <Button onClick={createPlaylist} className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-12 px-8 rounded-full">Create</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
