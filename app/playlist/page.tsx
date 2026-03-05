"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { useMusic, Playlist, Song } from "../../lib/music-context";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Play, Music, Clock3, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function PlaylistHome() {
    const { user } = useAuth();
    const router = useRouter();
    const { recentlyPlayed, playPlaylist, extractYoutubeId, likedSongs, currentSong } = useMusic();
    const searchParams = useSearchParams();
    const initialSongId = searchParams.get('song');
    const hasInitialPlayTried = useRef(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const { data } = await supabase
                    .from('playlists')
                    .select('*, songs(*)')
                    .order('created_at', { ascending: false });
                setPlaylists(data || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        })();
    }, [user]);

    // Auto-play song from URL on load
    useEffect(() => {
        if (!loading && playlists.length > 0 && initialSongId && !hasInitialPlayTried.current) {
            // Find playlist containing the song
            for (const pl of playlists) {
                const index = pl.songs?.findIndex(s => s.id === initialSongId);
                if (index !== undefined && index !== -1) {
                    if (currentSong?.id !== initialSongId) {
                        playPlaylist(pl, index);
                    }
                    hasInitialPlayTried.current = true;
                    break;
                }
            }
        }
    }, [loading, playlists, initialSongId, playPlaylist, currentSong]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setHeaderOpacity(Math.min(e.currentTarget.scrollTop / 200, 1));
    };

    if (loading) return <div className="flex-1 bg-[#121212]" />;

    return (
        <main
            ref={mainRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-[#121212] custom-scrollbar relative"
        >
            {/* Sticky Header Background */}
            <div
                className="sticky top-0 w-full h-16 z-20 pointer-events-none transition-colors duration-300"
                style={{ backgroundColor: `rgba(18, 18, 18, ${headerOpacity})` }}
            />

            {/* Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#2e2e2e] to-[#121212] z-0 opacity-40" />

            <div className="relative z-10 px-8 pt-6 pb-32">
                <header className="mb-8 pt-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">{getGreeting()}</h1>
                </header>

                {/* Top Grid - Recent/Favorite Playlists */}
                {playlists.length > 0 && (
                    <section className="mb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {playlists.slice(0, 8).map((pl) => (
                                <div
                                    key={pl.id}
                                    onClick={() => router.push(`/playlist/${pl.id}`)}
                                    className="group flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-all cursor-pointer relative"
                                >
                                    <div className="w-20 h-20 bg-[#282828] flex-shrink-0 shadow-lg relative">
                                        {pl.songs?.[0] ? (
                                            <img
                                                src={`https://img.youtube.com/vi/${extractYoutubeId(pl.songs[0].youtube_url)}/default.jpg`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Music className="w-6 h-6 text-neutral-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 px-4 min-w-0">
                                        <p className="text-[14px] font-bold text-white truncate">{pl.name}</p>
                                    </div>
                                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); playPlaylist(pl, 0); }}
                                            className="w-10 h-10 text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                                            style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}
                                        >
                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recently Played Section */}
                {recentlyPlayed.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">Recently Played</h2>
                            <button className="text-[12px] font-bold text-neutral-400 hover:underline">Show all</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {recentlyPlayed.slice(0, 12).map((s, i) => {
                                const vid = extractYoutubeId(s.youtube_url);
                                return (
                                    <div
                                        key={`recent-${s.id}-${i}`}
                                        className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all cursor-pointer group flex flex-col items-center text-center"
                                        onClick={() => {
                                            const p: Playlist = { id: 'recently-played', name: 'Recently Played', user_id: '', songs: recentlyPlayed };
                                            playPlaylist(p, i);
                                        }}
                                    >
                                        <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-md overflow-hidden">
                                            <img
                                                src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                            <div
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end justify-end p-2 transition-opacity"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform"
                                                    style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}
                                                >
                                                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full text-left">
                                            <p className="text-[14px] font-bold text-white truncate">{s.title}</p>
                                            <p className="text-[12px] text-neutral-400 mt-1 truncate">{(s as any).channel_title || 'YouTube'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* All Playlists Section */}
                {playlists.length > 8 && (
                    <section className="mb-10">
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">Your Playlists</h2>
                            <button className="text-[12px] font-bold text-neutral-400 hover:underline">Show all</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {playlists.slice(8).map((pl) => (
                                <div
                                    key={`all-${pl.id}`}
                                    className="bg-[#181818] hover:bg-[#282828] p-4 rounded-md transition-all cursor-pointer group"
                                    onClick={() => router.push(`/playlist/${pl.id}`)}
                                >
                                    <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-md overflow-hidden">
                                        {pl.songs?.[0] ? (
                                            <img
                                                src={`https://img.youtube.com/vi/${extractYoutubeId(pl.songs[0].youtube_url)}/mqdefault.jpg`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                                                <Music className="w-12 h-12 text-neutral-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-end justify-end p-2 transition-opacity">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform"
                                                style={{ backgroundColor: 'var(--theme-color, #1DB954)' }}
                                            >
                                                <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[14px] font-bold text-white truncate">{pl.name}</p>
                                    <p className="text-[12px] text-neutral-400 mt-1 truncate">By {user?.email?.split('@')[0] || 'You'}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {playlists.length === 0 && recentlyPlayed.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
                        <Music className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-bold mb-2">Build your library</h3>
                        <p className="text-sm max-w-xs text-center mb-6">Create a playlist or search for songs to start your collection.</p>
                        <button
                            onClick={() => router.push('/playlist/search')}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-xl"
                        >
                            Find Songs
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
