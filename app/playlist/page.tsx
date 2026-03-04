"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    Music, Play, Plus, X, ListPlus, Link as LinkIcon,
    Repeat, SkipBack, SkipForward, Volume2, Pause, GripVertical, Youtube, Loader2, Headphones, Trash2, Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Card } from "../../components/ui/card";
import { supabase } from "../../lib/supabase";

export default function PlaylistPage() {
    const { user } = useAuth();
    const {
        playPlaylist, currentSong, isPlaying,
        togglePlay, nextTrack, prevTrack,
        repeatMode, setRepeatMode, volume, setVolume,
        currentTime, duration, seekTo
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

    // Keyboard Navigation State
    const [focusedPlaylistIndex, setFocusedPlaylistIndex] = useState(0);
    const [focusedSongIndex, setFocusedSongIndex] = useState(-1);
    const [activeSection, setActiveSection] = useState<'playlists' | 'songs'>('playlists');

    const playlistRef = useRef<HTMLDivElement>(null);
    const songContainerRef = useRef<HTMLDivElement>(null);

    const YOUTUBE_API_KEY = "AIzaSyDhjIZh1xAGfghUrUZkA8vzX5iYDPxgLm8";

    // Scroll effect
    useEffect(() => {
        if (activeSection === 'playlists' && playlistRef.current) {
            const focusedEl = playlistRef.current.children[focusedPlaylistIndex] as HTMLElement;
            if (focusedEl) focusedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [focusedPlaylistIndex, activeSection]);

    useEffect(() => {
        if (activeSection === 'songs' && songContainerRef.current) {
            // Find the active song item within the Reorder.Group
            const group = songContainerRef.current.querySelector('.space-y-1');
            if (group) {
                const focusedEl = group.children[focusedSongIndex] as HTMLElement;
                if (focusedEl) focusedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [focusedSongIndex, activeSection]);

    useEffect(() => {
        if (user) {
            fetchPlaylists();
        }
    }, [user]);

    // Keyboard Navigation Effect
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept if user is typing in an input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            if (activeSection === 'playlists') {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedPlaylistIndex(prev => Math.min(prev + 1, playlists.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedPlaylistIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (playlists[focusedPlaylistIndex]) {
                        setSelectedPlaylist(playlists[focusedPlaylistIndex]);
                        setActiveSection('songs');
                        setFocusedSongIndex(0);
                    }
                } else if (e.key === 'ArrowRight' && selectedPlaylist) {
                    e.preventDefault();
                    setActiveSection('songs');
                    setFocusedSongIndex(0);
                }
            } else if (activeSection === 'songs' && selectedPlaylist) {
                const songs = selectedPlaylist.songs || [];
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedSongIndex(prev => Math.min(prev + 1, songs.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedSongIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (songs[focusedSongIndex]) {
                        playPlaylist(selectedPlaylist, focusedSongIndex);
                    }
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setActiveSection('playlists');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSection, focusedPlaylistIndex, focusedSongIndex, playlists, selectedPlaylist, playPlaylist]);

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
        <main className="min-h-screen bg-black text-white selection:bg-cyan-500/20 selection:text-cyan-400">
            <div className="max-w-6xl mx-auto px-6 py-24 space-y-24">
                {/* Header - More compact */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center space-x-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
                        >
                            <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-pink-400/80">Protocol DB v4</span>
                        </motion.div>
                        <h1 className="text-4xl font-extralight tracking-tighter leading-none">
                            Sound <span className="text-neutral-700">Library</span>
                        </h1>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full hover:bg-neutral-200 transition-all font-black text-[9px] uppercase tracking-[0.1em] shadow-xl active:scale-95"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Collection
                    </motion.button>
                </header>

                <div className="grid lg:grid-cols-12 gap-8 mt-8">
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600">Collections</h2>
                        </div>
                        <div ref={playlistRef} className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {playlists.map((pl, idx) => (
                                <motion.div
                                    key={pl.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => {
                                        setSelectedPlaylist(pl);
                                        setFocusedPlaylistIndex(idx);
                                        setActiveSection('playlists');
                                    }}
                                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${selectedPlaylist?.id === pl.id
                                        ? 'bg-white/10 border-white/20 shadow-lg'
                                        : (activeSection === 'playlists' && focusedPlaylistIndex === idx)
                                            ? 'bg-white/5 border-white/10'
                                            : 'bg-neutral-900/20 border-transparent hover:border-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all flex-shrink-0 ${selectedPlaylist?.id === pl.id
                                            ? 'bg-neutral-900 border-white/20'
                                            : 'bg-black/40 border-white/5'
                                            }`}>
                                            <Music className={`w-4 h-4 ${selectedPlaylist?.id === pl.id ? 'text-white' : 'text-neutral-700'}`} />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <span className="text-xs font-bold tracking-tight block truncate">{pl.name}</span>
                                            <span className="text-[8px] text-neutral-600 uppercase font-black tracking-widest">{pl.songs?.length || 0} TRACKS</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deletePlaylist(pl.id, e)}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all text-neutral-600 hover:text-red-400"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            {selectedPlaylist ? (
                                <motion.div
                                    key={selectedPlaylist.id}
                                    ref={songContainerRef}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between pb-4">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-2xl font-light tracking-tight">{selectedPlaylist.name}</h3>
                                            {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 && (
                                                <button
                                                    onClick={() => playPlaylist(selectedPlaylist)}
                                                    className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setIsAddingSong(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest text-neutral-400"
                                        >
                                            <ListPlus className="w-3.5 h-3.5" />
                                            Add Track
                                        </button>
                                    </div>

                                    <Reorder.Group
                                        axis="y"
                                        values={selectedPlaylist.songs || []}
                                        onReorder={reorderSongs}
                                        className="space-y-1.5"
                                    >
                                        {(selectedPlaylist.songs || []).map((song, i) => (
                                            <Reorder.Item
                                                key={song.id}
                                                value={song}
                                                className={`group flex items-center gap-4 p-3 rounded-xl transition-all cursor-default ${activeSection === 'songs' && focusedSongIndex === i
                                                    ? 'bg-white/10 border border-white/10 shadow-lg'
                                                    : 'bg-neutral-900/40 border border-transparent hover:border-white/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GripVertical className="w-3.5 h-3.5 text-neutral-800 group-hover:text-neutral-600 cursor-grab" />
                                                    <div className="w-4 text-[8px] font-black font-mono text-neutral-800">{String(i + 1).padStart(2, '0')}</div>
                                                </div>
                                                <div className="flex-1 space-y-0.5 min-w-0">
                                                    <span className="text-xs font-bold tracking-tight text-white/90 group-hover:text-white truncate block">{song.title}</span>
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <Youtube className="w-2.5 h-2.5 text-neutral-700" />
                                                        <span className="text-[9px] text-neutral-700 truncate font-mono">{song.youtube_url}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => playPlaylist(selectedPlaylist, i)}
                                                        className={`p-2 rounded-lg transition-all ${currentSong?.id === song.id && isPlaying
                                                            ? 'text-cyan-400 bg-cyan-400/10'
                                                            : 'text-neutral-500 hover:text-white bg-white/5'
                                                            }`}
                                                    >
                                                        {currentSong?.id === song.id && isPlaying ? (
                                                            <div className="flex gap-0.5 items-end h-3">
                                                                <motion.div animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-current" />
                                                                <motion.div animate={{ height: [8, 3, 10] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-current" />
                                                                <motion.div animate={{ height: [5, 10, 5] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-current" />
                                                            </div>
                                                        ) : (
                                                            <Play className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSong(song.id)}
                                                        className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-neutral-500 hover:text-red-400 transition-all"
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
                                    <button
                                        onClick={() => {
                                            const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
                                            const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
                                            setRepeatMode(next);
                                        }}
                                        className={`transition-colors relative ${repeatMode !== 'none' ? 'text-cyan-400' : 'text-neutral-600 hover:text-neutral-400'}`}
                                    >
                                        <Repeat className="w-4 h-4" />
                                        {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[7px] font-black">1</span>}
                                        {repeatMode === 'none' && <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neutral-600 rotate-45 pointer-events-none" />}
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
                                    <div className="w-32 px-4 border-l border-white/5 hidden sm:flex items-center gap-3">
                                        <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={volume}
                                            onChange={(e) => setVolume(Number(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                                        />
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

            {/* Create Playlist Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-white/10 rounded-[2.5rem] p-8">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Node Initialization</DialogTitle>
                        <DialogDescription className="text-white/60 text-xs">
                            Define a new collection identity in the centralized library.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-700 px-1">Entry Name</label>
                            <Input
                                autoFocus
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                placeholder="Designate collection name..."
                                className="bg-white/5 border-white/5 h-12 rounded-2xl focus:ring-1 focus:ring-white/20 transition-all text-base px-5"
                            />
                        </div>
                        <Button
                            onClick={createPlaylist}
                            className="w-full h-14 bg-white text-black hover:bg-neutral-200 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all"
                        >
                            Sync to Database
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Track Registration Dialog */}
            <Dialog open={isAddingSong} onOpenChange={(open) => {
                if (!open) {
                    setIsAddingSong(false);
                    setSearchResults([]);
                    setSearchQuery("");
                }
            }}>
                <DialogContent className="sm:max-w-[600px] bg-neutral-900 border-white/10 rounded-[3rem] p-8 max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="space-y-4 mb-4">
                        <DialogTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Track Protocol Registration</DialogTitle>
                        <DialogDescription className="text-white/60 text-xs">
                            Append new auditory stimulus to {selectedPlaylist?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="search" className="w-full flex-1 flex flex-col overflow-hidden">
                        <TabsList className="bg-white/5 p-1 rounded-2xl w-full mb-8">
                            <TabsTrigger value="search" className="flex-1 rounded-xl text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                Neural Search
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="flex-1 rounded-xl text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                Manual Injection
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <TabsContent value="search" className="space-y-6 mt-0">
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                        <Input
                                            autoFocus
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                            placeholder="Explore focus nodes, ambient, lofi..."
                                            className="bg-white/5 border-white/5 h-12 pl-12 rounded-2xl focus:ring-1 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="h-12 px-8 bg-white text-black hover:bg-neutral-200 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "QUERY"}
                                    </Button>
                                </div>

                                <div className="space-y-3 pb-4">
                                    {searchResults.map((video: any, idx: number) => (
                                        <motion.div
                                            key={video.id.videoId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex items-center gap-5 p-4 bg-neutral-900 border border-white/5 hover:border-white/10 rounded-[2rem] transition-all group"
                                        >
                                            <div className="relative w-28 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
                                                <img src={video.snippet.thumbnails.default.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Youtube className="w-6 h-6 text-red-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">{video.snippet.title}</p>
                                                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mt-1">{video.snippet.channelTitle}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => addSearchedSong(video)}
                                                className="w-12 h-12 bg-white/5 hover:bg-white hover:text-black rounded-2xl transition-all active:scale-90"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                    {searchResults.length === 0 && !isSearching && (
                                        <div className="py-24 text-center text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em] bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-white/5">
                                            Awaiting Input Stream
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-8 mt-0 pb-4">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-700 px-1">Track Identity</label>
                                        <Input
                                            value={newSongTitle}
                                            onChange={e => setNewSongTitle(e.target.value)}
                                            placeholder="Specify Track Name..."
                                            className="bg-white/5 border-white/5 h-12 rounded-2xl focus:ring-1 focus:ring-white/20 transition-all px-5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-700 px-1">Source Protocol (YouTube URL)</label>
                                        <Input
                                            value={newSongUrl}
                                            onChange={e => setNewSongUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="bg-white/5 border-white/5 h-12 rounded-2xl focus:ring-1 focus:ring-white/20 transition-all px-5"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={addSong}
                                    className="w-full h-14 bg-white text-black hover:bg-neutral-200 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all"
                                >
                                    Commit Fragment
                                </Button>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </main>
    );
}
