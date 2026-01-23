"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    Music, Play, Plus, X, ListPlus, Link as LinkIcon,
    Repeat, SkipBack, SkipForward, Volume2, Pause, GripVertical, Youtube, Loader2, Headphones, Trash2, Search,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function PlaylistPage() {
    const { user } = useAuth();
    const {
        playPlaylist, currentSong, isPlaying,
        togglePlay, nextTrack, prevTrack,
        isLooping, toggleLoop, currentTime, duration, seekTo
    } = useMusic();

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isAddingSong, setIsAddingSong] = useState(false);
    const [newSongTitle, setNewSongTitle] = useState("");
    const [newSongUrl, setNewSongUrl] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

    const YOUTUBE_API_KEY = "AIzaSyDhjIZh1xAGfghUrUZkA8vzX5iYDPxgLm8";

    useEffect(() => {
        if (user) {
            fetchPlaylists();
        }
    }, [user]);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*, songs(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlaylists(data || []);

            // Re-select if currently viewing one
            if (selectedPlaylist) {
                const updated = data?.find(p => p.id === selectedPlaylist.id);
                if (updated) setSelectedPlaylist(updated);
            }
        } catch (error) {
            console.error("Fetch playlists error:", error);
        } finally {
            setLoading(false);
        }
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
            await fetchPlaylists();
            setNewPlaylistName("");
            setIsCreating(false);
        } catch (error) {
            console.error("Create playlist error:", error);
        }
    };

    const addSong = async () => {
        if (!selectedPlaylist || !newSongTitle.trim() || !newSongUrl.trim()) return;
        try {
            const { error } = await supabase
                .from('songs')
                .insert([{
                    playlist_id: selectedPlaylist.id,
                    title: newSongTitle.trim(),
                    youtube_url: newSongUrl.trim(),
                    order_index: (selectedPlaylist.songs?.length || 0)
                }]);

            if (error) throw error;
            await fetchPlaylists();
            setNewSongTitle("");
            setNewSongUrl("");
            setIsAddingSong(false);
        } catch (error) {
            console.error("Add song error:", error);
        }
    };

    const deletePlaylist = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this collection permanently?")) return;
        try {
            const { error } = await supabase.from('playlists').delete().eq('id', id);
            if (error) throw error;
            if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
            await fetchPlaylists();
        } catch (error) {
            console.error("Delete playlist error:", error);
        }
    };

    const deleteSong = async (songId: string) => {
        try {
            const { error } = await supabase.from('songs').delete().eq('id', songId);
            if (error) throw error;
            await fetchPlaylists();
        } catch (error) {
            console.error("Delete song error:", error);
        }
    };

    const reorderSongs = async (newSongs: Song[]) => {
        if (!selectedPlaylist) return;

        // Update local state first for immediate snappy UI
        const updatedPlaylists = playlists.map(pl => {
            if (pl.id === selectedPlaylist.id) {
                return { ...pl, songs: newSongs };
            }
            return pl;
        });
        setPlaylists(updatedPlaylists);
        setSelectedPlaylist({ ...selectedPlaylist, songs: newSongs });

        // Update DB
        try {
            const updates = newSongs.map((song, idx) => ({
                id: song.id,
                playlist_id: selectedPlaylist.id,
                title: song.title,
                youtube_url: song.youtube_url,
                order_index: idx
            }));

            const { error } = await supabase.from('songs').upsert(updates);
            if (error) throw error;
        } catch (error) {
            console.error("Reorder error:", error);
            fetchPlaylists(); // Revert on failure
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}`
            );
            const data = await response.json();
            setSearchResults(data.items || []);
        } catch (error) {
            console.error("YouTube search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const addSearchedSong = async (video: any) => {
        if (!selectedPlaylist) return;
        try {
            const { error } = await supabase
                .from('songs')
                .insert([{
                    playlist_id: selectedPlaylist.id,
                    title: video.snippet.title,
                    youtube_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                    order_index: (selectedPlaylist.songs?.length || 0)
                }]);

            if (error) throw error;
            await fetchPlaylists();
            setIsAddingSong(false);
            setSearchQuery("");
            setSearchResults([]);
        } catch (error) {
            console.error("Add searched song error:", error);
        }
    };

    if (loading && playlists.length === 0) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white">
            <div className="max-w-6xl mx-auto px-6 py-24 space-y-24">
                {/* Header */}
                <header className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
                    >
                        <Headphones className="w-3 h-3 text-pink-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400/80">Auditory Protocol DB</span>
                    </motion.div>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-extralight tracking-tighter"
                        >
                            Sound Library
                        </motion.h1>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full hover:bg-neutral-200 transition-all font-bold text-[10px] uppercase tracking-[0.2em]"
                        >
                            <Plus className="w-3 h-3" />
                            New Collection
                        </button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Left: Playlist Selector */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600 px-4">Cloud Collections</h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {playlists.map(pl => (
                                <div
                                    key={pl.id}
                                    onClick={() => setSelectedPlaylist(pl)}
                                    className={`group flex items-center justify-between p-4 rounded-3xl border transition-all cursor-pointer ${selectedPlaylist?.id === pl.id
                                        ? 'bg-white/10 border-white/20'
                                        : 'bg-white/5 border-transparent hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center border border-white/5">
                                            <Music className={`w-4 h-4 ${selectedPlaylist?.id === pl.id ? 'text-white' : 'text-neutral-600'}`} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-bold tracking-tight block truncate max-w-[120px]">{pl.name}</span>
                                            <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-widest">{pl.songs?.length || 0} Tracks</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deletePlaylist(pl.id, e)}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-full transition-all text-neutral-600 hover:text-red-400"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {playlists.length === 0 && (
                                <div className="p-8 text-center border border-dashed border-white/5 rounded-3xl">
                                    <p className="text-[10px] text-neutral-700 uppercase font-bold tracking-widest">No Collections Found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Songs and Editor */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedPlaylist ? (
                                <motion.div
                                    key={selectedPlaylist.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-2xl font-bold tracking-tight">{selectedPlaylist.name}</h3>
                                                {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 && (
                                                    <button
                                                        onClick={() => playPlaylist(selectedPlaylist)}
                                                        className="p-2.5 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                                    >
                                                        <Play className="w-3 h-3 fill-current" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Protocol Details</p>
                                        </div>
                                        <button
                                            onClick={() => setIsAddingSong(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white"
                                        >
                                            <ListPlus className="w-3 h-3" />
                                            Add Track
                                        </button>
                                    </div>

                                    <Reorder.Group
                                        axis="y"
                                        values={selectedPlaylist.songs || []}
                                        onReorder={reorderSongs}
                                        className="space-y-1"
                                    >
                                        {(selectedPlaylist.songs || []).map((song, i) => (
                                            <Reorder.Item
                                                key={song.id}
                                                value={song}
                                                className="group flex items-center gap-4 p-4 hover:bg-white/[0.03] rounded-2xl transition-colors group cursor-default"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GripVertical className="w-3.5 h-3.5 text-neutral-800 group-hover:text-neutral-600 cursor-grab active:cursor-grabbing transition-colors" />
                                                    <div className="w-5 text-[10px] font-mono text-neutral-700">{i + 1}</div>
                                                </div>
                                                <div className="flex-1 space-y-0.5 min-w-0">
                                                    <span className="text-sm font-medium tracking-tight text-white/90 group-hover:text-white truncate block">{song.title}</span>
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <LinkIcon className="w-2.5 h-2.5 text-neutral-700 flex-shrink-0" />
                                                        <span className="text-[9px] text-neutral-700 truncate">{song.youtube_url}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => playPlaylist(selectedPlaylist, i)}
                                                        className={`p-2 rounded-xl transition-colors ${currentSong?.id === song.id && isPlaying
                                                            ? 'text-cyan-400 bg-cyan-400/10'
                                                            : 'text-neutral-500 hover:text-white hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {currentSong?.id === song.id && isPlaying ? (
                                                            <div className="flex gap-0.5 items-end h-3">
                                                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-current" />
                                                                <motion.div animate={{ height: [8, 4, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-current" />
                                                                <motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-current" />
                                                            </div>
                                                        ) : (
                                                            <Play className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSong(song.id)}
                                                        className="p-2 hover:bg-red-500/10 rounded-xl text-neutral-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                    {!selectedPlaylist.songs?.length && (
                                        <div className="py-20 text-center border border-dashed border-white/5 rounded-[2rem] space-y-4">
                                            <p className="text-xs text-neutral-600">No tracks stored in this collection.</p>
                                            <button onClick={() => setIsAddingSong(true)} className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:underline">Commit First Track</button>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center py-40 border border-dashed border-white/5 rounded-[3rem]">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                            <Music className="w-6 h-6 text-neutral-700" />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Sync with a collection from the library</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Fixed Playback Controller */}
                {currentSong && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50"
                    >
                        <div className="bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4">
                            <div className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5">
                                        <Music className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate">{currentSong.title}</h4>
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">{selectedPlaylist?.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <button onClick={toggleLoop} className={`p-2 transition-colors ${isLooping ? 'text-cyan-400' : 'text-neutral-600 hover:text-neutral-400'}`}>
                                        <Repeat className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <button onClick={prevTrack} className="text-neutral-400 hover:text-white transition-colors">
                                            <SkipBack className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={togglePlay}
                                            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                        >
                                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                        </button>
                                        <button onClick={nextTrack} className="text-neutral-400 hover:text-white transition-colors">
                                            <SkipForward className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="w-24 px-4 border-l border-white/5 hidden sm:block">
                                        <div className="flex items-center gap-2 text-neutral-600">
                                            <Volume2 className="w-3.5 h-3.5" />
                                            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-neutral-700" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative group h-4 flex items-center cursor-pointer">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={(e) => seekTo(Number(e.target.value))}
                                        className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
                                    />
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-cyan-400"
                                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <motion.div
                                        className="absolute w-3 h-3 bg-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                        style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-600 tabular-nums">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Create Playlist Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 space-y-8 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 text-glow">Library Creation</h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-4 h-4 text-neutral-600" /></button>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Collection Identity</label>
                            <input
                                autoFocus
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                placeholder="Name your collection..."
                                className="w-full bg-transparent border-b border-white/10 py-4 text-2xl font-light focus:outline-none focus:border-white transition-colors placeholder:text-neutral-800"
                            />
                        </div>
                        <button
                            onClick={createPlaylist}
                            className="w-full py-4 bg-white text-black rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-2xl"
                        >
                            Sync to Database
                        </button>
                    </div>
                </div>
            )}

            {isAddingSong && selectedPlaylist && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 space-y-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 text-glow">Track Registration</h3>
                            <button onClick={() => { setIsAddingSong(false); setSearchResults([]); setSearchQuery(""); }} className="p-2 hover:bg-white/5 rounded-full"><X className="w-4 h-4 text-neutral-600" /></button>
                        </div>

                        <div className="flex p-1 bg-white/5 rounded-2xl">
                            <button
                                onClick={() => setActiveTab('search')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'search' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                            >
                                Search YouTube
                            </button>
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'manual' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                            >
                                Manual Link
                            </button>
                        </div>

                        {activeTab === 'search' ? (
                            <div className="space-y-6">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                        <input
                                            autoFocus
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search focus music, lofi, ambient..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="px-6 bg-white text-black rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
                                    >
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {searchResults.map((video: any) => (
                                        <div
                                            key={video.id.videoId}
                                            className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                                        >
                                            <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={video.snippet.thumbnails.default.url} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Youtube className="w-6 h-6 text-red-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{video.snippet.title}</p>
                                                <p className="text-[10px] text-neutral-500 truncate">{video.snippet.channelTitle}</p>
                                            </div>
                                            <button
                                                onClick={() => addSearchedSong(video)}
                                                className="p-3 bg-white/10 rounded-xl hover:bg-white text-neutral-400 hover:text-black transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && !isSearching && (
                                        <div className="py-12 text-center text-[10px] text-neutral-600 uppercase tracking-widest bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                                            Enter keyword to explore
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Track Title</label>
                                        <input
                                            value={newSongTitle}
                                            onChange={e => setNewSongTitle(e.target.value)}
                                            placeholder="Song Name..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Audio Source (YouTube URL)</label>
                                        <input
                                            value={newSongUrl}
                                            onChange={e => setNewSongUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={addSong}
                                    className="w-full py-4 bg-white text-black rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-2xl"
                                >
                                    Commit Track
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
