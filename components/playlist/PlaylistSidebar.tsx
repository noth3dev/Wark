"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Library, Plus, ArrowRight, Music, LayoutGrid, List, ChevronRight, X } from "lucide-react";
import { Playlist } from "../../lib/music-context";
import { useState } from "react";

interface PlaylistSidebarProps {
    playlists: Playlist[];
    selectedPlaylistId?: string;
    onSelectPlaylist: (playlist: Playlist) => void;
    onCreatePlaylist: () => void;
    onSearchClick?: () => void;
    onHomeClick?: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export default function PlaylistSidebar({
    playlists,
    selectedPlaylistId,
    onSelectPlaylist,
    onCreatePlaylist,
    onSearchClick,
    onHomeClick,
    isCollapsed,
    onToggleCollapse,
    isExpanded,
    onToggleExpand,
}: PlaylistSidebarProps) {
    const [libSearchQuery, setLibSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const extractYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const filteredPlaylists = playlists.filter(pl =>
        pl.name.toLowerCase().includes(libSearchQuery.toLowerCase())
    );

    return (
        <motion.div
            animate={{
                width: isExpanded ? "100%" : (isCollapsed ? 72 : 300),
                padding: isExpanded ? 24 : 8
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col h-full bg-black text-neutral-400 gap-2 flex-shrink-0 overflow-hidden relative"
        >
            {/* Top Navigation - Only show if not expanded */}
            {!isExpanded && (
                <div className={`bg-[#121212] rounded-lg p-3 space-y-4 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                    <button
                        onClick={onHomeClick}
                        className={`flex items-center gap-5 px-3 py-1 text-sm font-bold transition-colors w-full group ${!onSearchClick ? 'text-white' : 'hover:text-white'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                        title={isCollapsed ? "Home" : ""}
                    >
                        <Home className="w-6 h-6" />
                        {!isCollapsed && <span>Home</span>}
                    </button>
                    <button
                        onClick={onSearchClick}
                        className={`flex items-center gap-5 px-3 py-1 text-sm font-bold hover:text-white transition-colors w-full group ${isCollapsed ? 'justify-center px-0' : ''}`}
                        title={isCollapsed ? "Search" : ""}
                    >
                        <Search className="w-6 h-6" />
                        {!isCollapsed && <span>Search</span>}
                    </button>
                </div>
            )}

            {/* Library Section */}
            <div className={`flex-1 bg-[#121212] rounded-lg flex flex-col overflow-hidden transition-all ${isExpanded ? 'p-6' : ''}`}>
                <div className={`p-3 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleCollapse}
                            className={`flex items-center gap-3 px-3 py-1 text-sm font-bold hover:text-white transition-colors group ${isCollapsed ? 'px-0' : ''}`}
                            title={isCollapsed ? "Expand Your Library" : "Collapse Your Library"}
                        >
                            <Library className="w-6 h-6" />
                            {!isCollapsed && <span className={isExpanded ? "text-2xl font-black" : ""}>{isExpanded ? "내 라이브러리" : "Your Library"}</span>}
                        </button>
                    </div>

                    <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
                        <button
                            onClick={onCreatePlaylist}
                            className="p-1.5 hover:bg-white/5 rounded-full hover:text-white transition-all text-neutral-400 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {isExpanded && <span className="text-sm font-bold pr-2">만들기</span>}
                        </button>
                        {!isCollapsed && (
                            <button
                                onClick={onToggleExpand}
                                className="p-1.5 hover:bg-white/5 rounded-full hover:text-white transition-all"
                                title={isExpanded ? "Restore" : "Expand to Grid"}
                            >
                                {isExpanded ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters & Search - Only if not collapsed */}
                {!isCollapsed && (
                    <div className={`px-4 py-2 flex items-center justify-between gap-4 flex-wrap ${isExpanded ? 'mb-8' : ''}`}>
                        <div className="flex gap-2">
                            {["플레이리스트", "내가 만든", "Spotify 제공"].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors ${activeFilter === filter ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/15'}`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {isExpanded && (
                            <div className="flex items-center gap-6 ml-auto">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="플레이리스트에서 검색"
                                        value={libSearchQuery}
                                        onChange={(e) => setLibSearchQuery(e.target.value)}
                                        className="bg-[#242424] text-[13px] rounded-full py-2 pl-10 pr-4 outline-none border-transparent border-2 focus:border-white/20 w-64 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-400 hover:text-white cursor-pointer group">
                                    <span>최근</span>
                                    <LayoutGrid className="w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Playlist List/Grid */}
                <div className={`flex-1 overflow-y-auto px-2 py-2 custom-scrollbar ${isCollapsed ? 'flex flex-col items-center space-y-1' : (isExpanded ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 p-4' : 'space-y-1')}`}>
                    <AnimatePresence mode="popLayout">
                        {filteredPlaylists.map((pl) => (
                            <motion.button
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={pl.id}
                                onClick={() => onSelectPlaylist(pl)}
                                className={`flex transition-all group ${isExpanded ? 'flex-col items-start p-4 bg-[#181818] hover:bg-[#282828] rounded-xl' : (isCollapsed ? 'justify-center p-2 rounded-md hover:bg-white/5' : 'items-center gap-3 w-full p-2 rounded-md hover:bg-white/5')} ${selectedPlaylistId === pl.id && !isExpanded ? "bg-white/10" : ""}`}
                                title={isCollapsed ? pl.name : ""}
                            >
                                <div className={`${isExpanded ? 'w-full aspect-square mb-4 shadow-2xl' : 'w-12 h-12 flex-shrink-0'} rounded-md bg-[#282828] flex items-center justify-center border border-white/5 overflow-hidden transition-all`}>
                                    {pl.songs?.[0] ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${extractYoutubeId(pl.songs[0].youtube_url)}/${isExpanded ? 'maxresdefault' : 'default'}.jpg`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Music className={`${isExpanded ? 'w-16 h-16' : 'w-6 h-6'} text-neutral-500`} />
                                    )}
                                </div>

                                <div className={`text-left min-w-0 ${isExpanded ? 'w-full' : ''}`}>
                                    <p className={`${isExpanded ? 'text-base font-black' : 'text-[14px] font-bold'} truncate ${selectedPlaylistId === pl.id && !isExpanded ? "text-[#1DB954]" : "text-white"}`}>
                                        {pl.name}
                                    </p>
                                    <p className={`${isExpanded ? 'text-sm mt-1' : 'text-[12px]'} font-medium text-neutral-400 flex items-center gap-1`}>
                                        {isExpanded && <span className="text-white/60">플레이리스트 •</span>}
                                        {pl.songs?.length || 0} songs
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
