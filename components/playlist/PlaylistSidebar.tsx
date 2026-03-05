"use client";

import { motion } from "framer-motion";
import { Home, Search, Library, Plus, ArrowRight, Music } from "lucide-react";
import { Playlist } from "../../lib/music-context";

interface PlaylistSidebarProps {
    playlists: Playlist[];
    selectedPlaylistId?: string;
    onSelectPlaylist: (playlist: Playlist) => void;
    onCreatePlaylist: () => void;
}

export default function PlaylistSidebar({
    playlists,
    selectedPlaylistId,
    onSelectPlaylist,
    onCreatePlaylist,
}: PlaylistSidebarProps) {
    return (
        <div className="flex flex-col h-full bg-black text-neutral-400 p-2 gap-2">
            {/* Top Navigation */}
            <div className="bg-[#121212] rounded-lg p-3 space-y-4">
                <button className="flex items-center gap-5 px-3 py-1 text-sm font-bold hover:text-white transition-colors w-full group">
                    <Home className="w-6 h-6" />
                    <span>Home</span>
                </button>
                <button className="flex items-center gap-5 px-3 py-1 text-sm font-bold hover:text-white transition-colors w-full group">
                    <Search className="w-6 h-6" />
                    <span>Search</span>
                </button>
            </div>

            {/* Library Section */}
            <div className="flex-1 bg-[#121212] rounded-lg flex flex-col overflow-hidden">
                <div className="p-3 flex items-center justify-between">
                    <button className="flex items-center gap-3 px-3 py-1 text-sm font-bold hover:text-white transition-colors group">
                        <Library className="w-6 h-6" />
                        <span>Your Library</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCreatePlaylist}
                            className="p-1.5 hover:bg-white/5 rounded-full hover:text-white transition-all"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button className="p-1.5 hover:bg-white/5 rounded-full hover:text-white transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-2 flex gap-2">
                    <button className="bg-white/10 text-white text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors">
                        Playlists
                    </button>
                    <button className="bg-white/10 text-white text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors">
                        Artists
                    </button>
                </div>

                {/* Playlist List */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                    {playlists.map((pl) => (
                        <motion.button
                            key={pl.id}
                            onClick={() => onSelectPlaylist(pl)}
                            className={`flex items-center gap-3 w-full p-2 rounded-md transition-all group ${selectedPlaylistId === pl.id ? "bg-white/10" : "hover:bg-white/5"
                                }`}
                        >
                            <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center flex-shrink-0 border border-white/5 overflow-hidden">
                                {pl.songs?.[0] ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${extractYoutubeId(pl.songs[0].youtube_url)}/default.jpg`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Music className="w-6 h-6 text-neutral-500" />
                                )}
                            </div>
                            <div className="text-left min-w-0">
                                <p className={`text-[14px] font-bold truncate ${selectedPlaylistId === pl.id ? "text-[#1DB954]" : "text-white"}`}>
                                    {pl.name}
                                </p>
                                <p className="text-[12px] font-medium text-neutral-400">
                                    Playlist • {(pl.songs?.length || 0)} songs
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function extractYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
