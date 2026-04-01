import React, { useRef } from "react";
import { 
    ChevronRight, Search, X, Loader2, List, Grid3X3, Table2, 
    FolderPlus, Upload, Filter, MousePointer2, LayoutGrid, LayoutList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ToolbarProps {
    breadcrumbs: any[];
    navigateToBreadcrumb: (index: number) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    viewMode: "grid" | "list" | "table";
    setViewMode: (v: "grid" | "list" | "table") => void;
    setNewFolderOpen: (open: boolean) => void;
    handleUpload: (files: FileList | null) => void;
    uploading: boolean;
    uploadProgress: string | null;
    tagFilter: string[];
    setTagFilter: (tags: string[]) => void;
    allTags: string[];
}

export function Toolbar({
    breadcrumbs, navigateToBreadcrumb, searchQuery, setSearchQuery,
    viewMode, setViewMode, setNewFolderOpen, handleUpload,
    uploading, uploadProgress, tagFilter, setTagFilter, allTags
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="px-8 py-3 border-b border-white/5 bg-black/20 backdrop-blur-3xl flex flex-col gap-4">
            {/* Top Row: Path & Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={crumb.id}>
                            <button
                                onClick={() => navigateToBreadcrumb(i)}
                                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap px-1 rounded-md ${
                                    i === breadcrumbs.length - 1 ? "text-white" : "text-neutral-700 hover:text-neutral-400"
                                }`}
                            >
                                {crumb.name}
                            </button>
                            {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-neutral-800 flex-shrink-0" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setNewFolderOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                    >
                        <FolderPlus className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
                        <span className="text-[10px] font-black text-neutral-500 group-hover:text-neutral-300 uppercase tracking-widest">New Folder</span>
                    </button>
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all group"
                    >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Upload className="w-3.5 h-3.5 text-blue-400" />}
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">
                            {uploading ? uploadProgress : "Upload"}
                        </span>
                        <input
                            type="file" multiple className="hidden"
                            ref={fileInputRef} onChange={(e) => handleUpload(e.target.files)}
                        />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Search & Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <Search className="w-3.5 h-3.5 text-neutral-800 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="SEARCH WORKSPACE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-blue-500/50 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white focus:outline-none transition-all placeholder:text-neutral-800"
                    />
                </div>

                <div className="flex items-center gap-2 h-9 px-1.5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <button 
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-white shadow-lg shadow-black/20" : "text-neutral-700 hover:text-neutral-400 hover:bg-white/5"}`}
                    >
                        <LayoutList className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white/10 text-white shadow-lg shadow-black/20" : "text-neutral-700 hover:text-neutral-400 hover:bg-white/5"}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode("table")}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white/10 text-white shadow-lg shadow-black/20" : "text-neutral-700 hover:text-neutral-400 hover:bg-white/5"}`}
                    >
                        <Table2 className="w-4 h-4" />
                    </button>
                </div>

                {allTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                        <Filter className="w-3.5 h-3.5 text-neutral-800 flex-shrink-0" />
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    if (tagFilter.includes(tag)) {
                                        setTagFilter(tagFilter.filter(t => t !== tag));
                                    } else {
                                        setTagFilter([...tagFilter, tag]);
                                    }
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                                    tagFilter.includes(tag)
                                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                        : "bg-white/[0.02] border-white/5 text-neutral-700 hover:text-neutral-400"
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
