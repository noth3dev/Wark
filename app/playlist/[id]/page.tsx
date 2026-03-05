"use client";

import { useState, useEffect, useRef, use } from "react";
import { useAuth } from "../../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../../lib/music-context";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Pause, Search, Music, Clock3, MoreHorizontal, Shuffle, Heart, PlusCircle, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const {
        playPlaylist, currentSong, isPlaying, togglePlay,
        shuffleMode, toggleShuffle, likedSongs, toggleLike,
        extractYoutubeId, playSongByIndex
    } = useMusic();
    const searchParams = useSearchParams();
    const initialSongId = searchParams.get('song');
    const hasInitialPlayTried = useRef(false);

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*, songs(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            setPlaylist(data);
        } catch (err) {
            console.error(err);
            router.push('/playlist');
        }
        finally { setLoading(false); }
    };

    // Auto-play song from URL on load
    useEffect(() => {
        if (!loading && playlist && playlist.songs && initialSongId && !hasInitialPlayTried.current) {
            const index = playlist.songs.findIndex(s => s.id === initialSongId);
            if (index !== -1 && currentSong?.id !== initialSongId) {
                playPlaylist(playlist, index);
            }
            hasInitialPlayTried.current = true;
        }
    }, [loading, playlist, initialSongId, playPlaylist, currentSong]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setHeaderOpacity(Math.min(e.currentTarget.scrollTop / 200, 1));
    };

    const deleteSong = async (songId: string) => {
        try {
            const { error } = await supabase.from('songs').delete().eq('id', songId);
            if (error) throw error;
            fetchPlaylist();
            setDeleteConfirm(null);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="flex-1 bg-[#121212]" />;
    if (!playlist) return <div className="flex-1 bg-[#121212] flex items-center justify-center text-white">Playlist not found</div>;

    return (
        <main
            ref={mainScrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-[#121212] relative custom-scrollbar scroll-smooth"
        >
            {/* Sticky Header */}
            <div
                className="sticky top-0 w-full h-16 z-20 transition-colors duration-300 pointer-events-none"
                style={{
                    backgroundColor: `rgba(18, 18, 18, ${headerOpacity})`,
                    boxShadow: headerOpacity > 0.8 ? "0 8px 12px rgba(0,0,0,0.3)" : "none"
                }}
            >
                <div className="flex items-center h-full px-6 pointer-events-auto">
                    {headerOpacity > 0.5 && (
                        <h2 className="text-lg font-bold text-white truncate">{playlist.name}</h2>
                    )}
                </div>
            </div>

            {/* Hero */}
            <div className="relative pt-24 pb-12 px-8 overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-gradient-to-b transition-colors duration-1000"
                    style={{
                        backgroundImage: playlist.songs?.[0]
                            ? `linear-gradient(to bottom, rgba(79, 70, 229, 0.4), #121212)`
                            : `linear-gradient(to bottom, rgba(55, 65, 81, 0.4), #121212)`,
                        filter: 'blur(50px)', opacity: 0.6
                    }}
                />
                <div className="absolute inset-0 z-0 bg-black/40" />

                <div className="relative z-10 flex items-end gap-6">
                    <motion.div className="w-52 h-52 bg-[#282828] shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex-shrink-0 rounded-lg overflow-hidden">
                        {playlist.songs?.[0] ? (
                            <img src={`https://img.youtube.com/vi/${extractYoutubeId(playlist.songs[0].youtube_url)}/maxresdefault.jpg`} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"><Music className="w-16 h-16 text-neutral-600" /></div>
                        )}
                    </motion.div>
                    <div className="space-y-4">
                        <p className="text-[12px] font-bold text-white uppercase tracking-tight">Playlist</p>
                        <h1 className="text-[72px] font-black text-white leading-none tracking-tighter">{playlist.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-white font-medium">
                            <span>{(playlist.songs?.length || 0)} songs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="sticky top-16 z-10 bg-[#121212]/80 backdrop-blur-md px-8 py-6 flex items-center gap-8">
                <button
                    onClick={() => playlist.songs && playlist.songs.length > 0 && playPlaylist(playlist, 0)}
                    className="w-14 h-14 text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                    style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}
                >
                    <Play className="w-6 h-6 fill-current ml-1" />
                </button>
                <Shuffle
                    onClick={toggleShuffle}
                    style={shuffleMode ? { color: 'var(--theme-color)' } : {}}
                    className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${shuffleMode ? "" : "text-neutral-400 hover:text-white"}`}
                />
                <MoreHorizontal className="w-7 h-7 text-neutral-400 hover:text-white cursor-pointer transition-colors" />
            </div>

            {/* Track Table */}
            <div className="px-8 pb-32">
                {(!playlist.songs || playlist.songs.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <Music className="w-12 h-12 mb-4" />
                        <p className="text-lg font-bold">This playlist is empty</p>
                        <p className="text-sm mt-1">Search for songs and add them here</p>
                        <button
                            onClick={() => router.push('/playlist/search')}
                            className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
                        >
                            Find Songs
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[12px] font-medium text-neutral-400 border-b border-white/10 uppercase tracking-widest">
                            <tr>
                                <th className="py-2 px-4 font-medium w-12 text-center">#</th>
                                <th className="py-2 px-4 font-medium">Title</th>
                                <th className="py-2 px-4 font-medium text-right pr-12"><Clock3 className="w-4 h-4 ml-auto" /></th>
                            </tr>
                        </thead>
                        <tbody className="before:content-['-'] before:block before:h-4 before:invisible">
                            {playlist.songs.map((song, i) => (
                                <tr
                                    key={song.id}
                                    className={`group hover:bg-white/10 transition-colors rounded-md cursor-default text-[14px] ${currentSong?.id === song.id ? "bg-white/5" : ""}`}
                                    onDoubleClick={() => playPlaylist(playlist, i)}
                                    onMouseEnter={() => setHoveredTrackIndex(i)}
                                    onMouseLeave={() => setHoveredTrackIndex(null)}
                                >
                                    <td className="py-2 px-4 text-center rounded-l-md text-neutral-400 group-hover:text-white relative w-12">
                                        {hoveredTrackIndex === i ? (
                                            <Play
                                                className="w-4 h-4 fill-white text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                                                onClick={() => playPlaylist(playlist, i)}
                                            />
                                        ) : (
                                            currentSong?.id === song.id && isPlaying ? (
                                                <div className="flex gap-0.5 items-end h-3 justify-center">
                                                    <div className="w-1 animate-bounce h-2" style={{ animationDelay: '0ms', backgroundColor: 'var(--theme-color)' }} />
                                                    <div className="w-1 animate-bounce h-3" style={{ animationDelay: '200ms', backgroundColor: 'var(--theme-color)' }} />
                                                    <div className="w-1 animate-bounce h-1" style={{ animationDelay: '400ms', backgroundColor: 'var(--theme-color)' }} />
                                                </div>
                                            ) : (
                                                <span style={currentSong?.id === song.id ? { color: 'var(--theme-color)' } : {}}>{i + 1}</span>
                                            )
                                        )}
                                    </td>
                                    <td className="py-2 px-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#282828] rounded flex-shrink-0 overflow-hidden">
                                            <img src={`https://img.youtube.com/vi/${extractYoutubeId(song.youtube_url)}/default.jpg`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold truncate" style={currentSong?.id === song.id ? { color: 'var(--theme-color)' } : { color: 'white' }}>{song.title}</p>
                                            <p className="text-xs text-neutral-400">{(song as any).channel_title || 'YouTube'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Heart
                                                onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                                                style={likedSongs.includes(extractYoutubeId(song.youtube_url) || '') ? { color: 'var(--theme-color)', fill: 'var(--theme-color)' } : {}}
                                                className={`w-4 h-4 cursor-pointer ${likedSongs.includes(extractYoutubeId(song.youtube_url) || '') ? "" : "text-neutral-400 hover:text-white"}`}
                                            />
                                            <Trash2
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(song.id); }}
                                                className="w-4 h-4 text-neutral-400 hover:text-red-400 cursor-pointer"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-right pr-12 text-neutral-400 rounded-r-md tabular-nums text-[13px]">
                                        {(song as any).duration_text || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="bg-[#282828] border-none text-white max-w-sm rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Remove Song</DialogTitle>
                        <DialogDescription className="text-neutral-400">Remove this song from the playlist?</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="hover:bg-white/5 text-white font-bold rounded-full">Cancel</Button>
                        <Button onClick={() => deleteConfirm && deleteSong(deleteConfirm)} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full">Remove</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
