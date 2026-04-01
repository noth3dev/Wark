import React from "react";
import { 
    ChevronRight, Home, Search, X, Loader2, List, Grid3X3, Table2, 
    FolderPlus, Trash2, Upload, Database, Star, StarOff, Copy, MoreHorizontal 
} from "lucide-react";

interface ToolbarProps {
    breadcrumbs: any[];
    navigateToBreadcrumb: (index: number) => void;
    fileCount: number | null;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    searchFocused: boolean;
    setSearchFocused: (f: boolean) => void;
    searching: boolean;
    setSearchResults: (res: any) => void;
    viewMode: "grid" | "list" | "table";
    setViewMode: (v: "grid" | "list" | "table") => void;
    setNewFolderOpen: (open: boolean) => void;
    selectedCount: number;
    handleBulkDelete: () => void;
    handleUpload: (files: FileList | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    allTags: string[];
}

export function Toolbar({
    breadcrumbs, navigateToBreadcrumb, fileCount,
    searchQuery, setSearchQuery, searchFocused, setSearchFocused,
    searching, setSearchResults, viewMode, setViewMode,
    setNewFolderOpen, selectedCount, handleBulkDelete,
    handleUpload, fileInputRef,
    selectedTag, setSelectedTag, allTags
}: ToolbarProps) {
    return (
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-background/80 backdrop-blur-xl">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
                {breadcrumbs.map((bc, i) => (
                    <React.Fragment key={bc.id}>
                        {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-700 flex-shrink-0 mx-0.5" />}
                        <button
                            onClick={() => navigateToBreadcrumb(i)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                i === breadcrumbs.length - 1
                                    ? "text-white bg-white/[0.06]"
                                    : "text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.04]"
                            }`}
                        >
                            {i === 0 && <Home className="w-3 h-3" />}
                            <span className="max-w-[120px] truncate">{bc.name}</span>
                        </button>
                    </React.Fragment>
                ))}
                {fileCount && (
                    <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[10px] text-neutral-600 font-medium whitespace-nowrap">{fileCount}</span>
                    </div>
                )}
            </div>

            {/* Selection Actions */}
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <span className="text-[10px] font-bold text-red-400 tracking-wider ml-1">{selectedCount} Selected</span>
                    <button onClick={handleBulkDelete} className="p-1.5 rounded-md hover:bg-red-400/20 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-red-400/20 mx-1" />
                </div>
            )}

            {/* Search */}
            <div className={`relative transition-all duration-300 ${searchFocused ? "w-64" : "w-52"} hidden sm:block`}>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    {searching ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    ) : (
                        <Search className={`w-3.5 h-3.5 transition-colors ${searchFocused ? "text-blue-400" : "text-neutral-700"}`} />
                    )}
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="검색..."
                    className={`w-full pl-9 pr-7 py-1.5 bg-white/[0.03] border rounded-lg text-xs text-white placeholder:text-neutral-700 focus:outline-none transition-all ${
                        searchFocused ? "border-blue-500/30 bg-white/5" : "border-white/[0.04]"
                    }`}
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSearchResults(null);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10"
                    >
                        <X className="w-3 h-3 text-neutral-700 hover:text-neutral-400" />
                    </button>
                )}
            </div>

            {/* View Switching */}
            <div className="flex items-center bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.04]">
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-neutral-700 hover:text-neutral-400"}`}>
                    <List className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-neutral-700 hover:text-neutral-400"}`}>
                    <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white/10 text-white" : "text-neutral-700 hover:text-neutral-400"}`}>
                    <Table2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="w-[1px] h-5 bg-white/[0.06]" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 ml-auto">
                {/* Tags Filter */}
                <div className="flex items-center gap-1 mr-2 border-r border-white/5 pr-2 overflow-x-auto no-scrollbar max-w-[200px]">
                    <Database className="w-3.5 h-3.5 text-neutral-700 mr-1" />
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                                selectedTag === tag 
                                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" 
                                    : "bg-white/[0.03] border-white/5 text-neutral-600 hover:text-neutral-300"
                            }`}
                        >
                            #{tag}
                        </button>
                    ))}
                    {allTags.length === 0 && <span className="text-[9px] text-neutral-800 uppercase tracking-widest font-bold">No Tags</span>}
                </div>

                <button
                    onClick={() => setNewFolderOpen(true)}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-white/[0.06] transition-all"
                    title="새 폴더"
                >
                    <FolderPlus className="w-4 h-4" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                    <Upload className="w-3.5 h-3.5" />
                    <span>업로드</span>
                </button>
            </div>
        </div>
    );
}
