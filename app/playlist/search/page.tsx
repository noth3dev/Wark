"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../../lib/music-context";
import { useSearchParams } from "next/navigation";
import { Play, Search, Music, PlusCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";

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

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex-1 bg-[#121212] flex items-center justify-center text-white">Loading...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}

function SearchPageContent() {
    const { user } = useAuth();
    const { playPlaylist, recentlyPlayed, extractYoutubeId } = useMusic();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [addToPlaylistSong, setAddToPlaylistSong] = useState<SearchResult | null>(null);

    useEffect(() => {
        if (user) fetchPlaylists();
    }, [user]);

    const fetchPlaylists = async () => {
        try {
            const { data } = await supabase.from('playlists').select('*, songs(*)').order('created_at', { ascending: false });
            setPlaylists(data || []);
        } catch (err) { console.error(err); }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&maxResults=20`);
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
            } as Song))
        };
        const idx = searchResults.findIndex(r => r.videoId === result.videoId);
        playPlaylist(dummyPlaylist, idx >= 0 ? idx : 0);
    };

    const addSongToPlaylist = async (playlistId: string, result: SearchResult) => {
        if (!user) return;
        try {
            const pl = playlists.find(p => p.id === playlistId);
            const { error } = await supabase.from('songs').insert({
                playlist_id: playlistId,
                title: result.title,
                youtube_url: `https://www.youtube.com/watch?v=${result.videoId}`,
                order_index: pl?.songs?.length || 0,
            });
            if (error) throw error;
            fetchPlaylists();
            setAddToPlaylistSong(null);
        } catch (err) { console.error(err); }
    };

    return (
        <main className="flex-1 overflow-y-auto bg-[#121212] custom-scrollbar">
            {/* Search Header */}
            <div className="sticky top-0 z-20 bg-[#121212] px-8 py-5">
                <div className="relative w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        autoFocus
                        className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-[15px] rounded-full py-3 pl-12 pr-4 outline-none border-2 border-transparent focus:border-white/20 transition-all text-white placeholder:text-neutral-500"
                    />
                </div>
            </div>

            <div className="px-8 pb-32">
                {/* Loading */}
                {isSearching && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-color, #1DB954)', borderTopColor: 'transparent' }} />
                    </div>
                )}

                {/* Results */}
                {!isSearching && searchResults.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Results</h2>

                        {/* Top Result + Songs split */}
                        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mb-8">
                            {/* Top Result Card */}
                            <div>
                                <h3 className="text-[14px] font-bold text-white mb-4">Top result</h3>
                                <div
                                    onClick={() => playInstant(searchResults[0])}
                                    className="bg-[#181818] hover:bg-[#282828] p-5 rounded-xl transition-all cursor-pointer group relative"
                                >
                                    <div className="w-24 h-24 rounded-md overflow-hidden shadow-lg mb-4">
                                        <img src={searchResults[0].thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="text-[28px] font-black text-white truncate">{searchResults[0].title}</h4>
                                    <p className="text-[14px] text-neutral-400 mt-1">{searchResults[0].channelTitle}</p>
                                    <div className="absolute bottom-5 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all" style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}>
                                        <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Songs List */}
                            <div>
                                <h3 className="text-[14px] font-bold text-white mb-4">Songs</h3>
                                <div className="space-y-1">
                                    {searchResults.slice(0, 5).map((result, i) => (
                                        <div
                                            key={result.videoId}
                                            className="flex items-center gap-4 p-2.5 rounded-md hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden flex-shrink-0 relative cursor-pointer" onClick={() => playInstant(result)}>
                                                <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Play className="w-4 h-4 fill-white text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => playInstant(result)}>
                                                <p className="text-[14px] font-medium text-white truncate">{result.title}</p>
                                                <p className="text-[12px] text-neutral-400 truncate">{result.channelTitle}</p>
                                            </div>
                                            <span className="text-[12px] text-neutral-400 tabular-nums flex-shrink-0 w-12 text-right">{result.durationText || '—'}</span>
                                            <button
                                                onClick={() => setAddToPlaylistSong(result)}
                                                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Remaining results as grid */}
                        {searchResults.length > 5 && (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">More results</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {searchResults.slice(5).map((result) => (
                                        <div
                                            key={result.videoId}
                                            className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all cursor-pointer group"
                                        >
                                            <div className="relative aspect-square mb-3 rounded-md overflow-hidden shadow-lg" onClick={() => playInstant(result)}>
                                                <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end justify-end p-2 transition-opacity">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform" style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}>
                                                        <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[13px] font-bold text-white truncate">{result.title}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-[11px] text-neutral-400 truncate flex-1">{result.channelTitle} • {result.viewCount}</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setAddToPlaylistSong(result); }}
                                                    className="p-1 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!isSearching && searchResults.length === 0 && !searchQuery && (
                    <div className="space-y-8 pt-4">
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
                                                    const p: Playlist = { id: 'recently-played', name: 'Recently Played', user_id: '', songs: recentlyPlayed };
                                                    playPlaylist(p, i);
                                                }}
                                                className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all cursor-pointer group"
                                            >
                                                <div className="relative aspect-square mb-3 rounded-md overflow-hidden shadow-lg">
                                                    <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end justify-end p-2 transition-opacity">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform" style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}>
                                                            <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[13px] font-bold text-white truncate">{s.title}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {recentlyPlayed.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                                <Search className="w-12 h-12 mb-4" />
                                <p className="text-lg font-bold">Search for songs</p>
                                <p className="text-sm mt-1">Find songs on YouTube and add them to your playlists</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
        </main>
    );
}
