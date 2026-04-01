"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useGoogleDrive, DriveFile, GoogleAccount } from "@/lib/google-drive-context";
import { 
    X, ExternalLink, Download, Pencil, Star, StarOff, 
    Plus, Copy, Trash2, Database, Loader2, Upload, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sub-components
import { Sidebar } from "./sub/Sidebar";
import { Toolbar } from "./sub/Toolbar";
import { ListView } from "./sub/ListView";
import { GridView } from "./sub/GridView";
import { TableView } from "./sub/TableView";
import { PdfViewer } from "./sub/PdfViewer";
import { Dialogs } from "./sub/Dialogs";
import { RightSidebar } from "./sub/RightSidebar";

// Utils
import { 
    isFolder, getFileIcon, getFileBg, getFileColor, 
    formatDate, formatBytes 
} from "@/lib/drive-utils";

interface BreadcrumbItem {
    id: string;
    name: string;
    accountId?: string;
}

export default function DriveExplorer() {
    const {
        accounts, activeAccount, addAccount, switchAccount, removeAccount,
        isLoading, listFiles, uploadFile, deleteFile, createFolder,
        downloadFile, starFile, renameFile, getFileBlob, getStorageQuota,
        updateMetadata, chambers, activeChamber, setActiveChamber,
        createChamber, removeChamber, moveFile, shareFile, clearCache
    } = useGoogleDrive();

    // Explorer State
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: "root", name: "내 드라이브" }]);
    const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Modal/Dialog State
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [renaming, setRenaming] = useState<{ id: string, name: string } | null>(null);
    const [taggingFile, setTaggingFile] = useState<DriveFile | null>(null);
    const [newTag, setNewTag] = useState("");
    const [notes, setNotes] = useState("");
    const [showChamberDialog, setShowChamberDialog] = useState<DriveFile | null>(null);
    const [isSidebarCreateOpen, setIsSidebarCreateOpen] = useState(false);
    const [topFolders, setTopFolders] = useState<DriveFile[]>([]);
    const [loadingTopFolders, setLoadingTopFolders] = useState(false);
    const [chamberName, setChamberName] = useState("");

    // Preview
    const [pdfViewer, setPdfViewer] = useState<{ url: string; name: string; fileId: string, webViewLink?: string } | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Activity
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [storageQuota, setStorageQuota] = useState<{ usage: number; limit: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ file: DriveFile, x: number, y: number } | null>(null);
    const [peekFile, setPeekFile] = useState<DriveFile | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // ── Data Fetching ──
    const fetchStorage = useCallback(async () => {
        const quota = await getStorageQuota();
        setStorageQuota(quota);
    }, [getStorageQuota]);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const currentFolder = breadcrumbs[breadcrumbs.length - 1];
            const items = await listFiles(currentFolder.id === "root" ? undefined : currentFolder.id, undefined);
            setFiles(items);
        } catch (err) {
            console.error("Failed to fetch files", err);
        } finally {
            setLoading(false);
        }
    }, [breadcrumbs, listFiles]);

    const fetchTopFolders = useCallback(async () => {
        setLoadingTopFolders(true);
        try {
            const items = await listFiles("root");
            setTopFolders(items.filter(isFolder));
        } catch (err) {
            console.error("Failed to fetch top folders", err);
        } finally {
            setLoadingTopFolders(false);
        }
    }, [listFiles]);

    useEffect(() => { fetchFiles(); fetchStorage(); }, [fetchFiles, fetchStorage]);
    useEffect(() => { if (isSidebarCreateOpen) fetchTopFolders(); }, [isSidebarCreateOpen, fetchTopFolders]);

    // ── Search ──
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setSearching(true);
                const results = await listFiles(undefined, searchQuery.trim());
                setSearchResults(results);
                setSearching(false);
            } else {
                setSearchResults(null);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery, listFiles]);

    // ── Internal Actions ──
    const handleNavigate = (file: DriveFile) => {
        if (isFolder(file)) {
            setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name, accountId: file.accountId }]);
            setSearchQuery("");
            setSearchResults(null);
            setPeekFile(null); // Clear peek when moving
        }
    };

    const handleSelect = (file: DriveFile) => {
        setPeekFile(file);
        setSelected(new Set([file.id]));
    };

    const navigateToBreadcrumb = (index: number) => {
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        setSearchQuery("");
        setSearchResults(null);
    };

    const handleStar = async (file: DriveFile) => {
        const success = await starFile(file.id, !file.starred, file.accountId);
        if (success) fetchFiles();
    };

    const handleDelete = async (id: string) => {
        if (confirm("정말 이 파일을 삭제하시겠습니까?")) {
            const file = files.find(f => f.id === id);
            const success = await deleteFile(id, file?.accountId);
            if (success) {
                clearCache();
                fetchFiles();
            }
        }
    };

    const handleBulkDelete = async () => {
        if (confirm(`${selected.size}개 파일을 삭제하시겠습니까?`)) {
            for (const id of Array.from(selected)) {
                const file = files.find(f => f.id === id);
                if (file) await deleteFile(id, file.accountId);
            }
            setSelected(new Set());
            clearCache();
            fetchFiles();
        }
    };

    const handleRename = async () => {
        if (!renaming) return;
        const file = files.find(f => f.id === renaming.id);
        const success = await renameFile(renaming.id, renaming.name, file?.accountId);
        if (success) {
            setRenaming(null);
            clearCache();
            fetchFiles();
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        const currentFolder = breadcrumbs[breadcrumbs.length - 1];
        const success = await createFolder(newFolderName, currentFolder.id === "root" ? undefined : currentFolder.id, currentFolder.accountId);
        if (success) {
            setNewFolderName("");
            setNewFolderOpen(false);
            clearCache();
            fetchFiles();
        }
    };

    const handleUpload = async (filesToUpload: FileList | null | File[]) => {
        if (!filesToUpload) return;
        setUploading(true);
        const currentFolder = breadcrumbs[breadcrumbs.length - 1];
        const fileCount = "length" in filesToUpload ? filesToUpload.length : (filesToUpload as File[]).length;
        const fileArray = "length" in filesToUpload ? Array.from(filesToUpload) : (filesToUpload as File[]);

        for (let i = 0; i < fileArray.length; i++) {
            setUploadProgress(`${i + 1}/${fileCount} 업로드 중...`);
            await uploadFile(fileArray[i], currentFolder.id === "root" ? undefined : currentFolder.id, currentFolder.accountId);
        }
        
        clearCache();
        setUploading(false);
        setUploadProgress(null);
        fetchFiles();
    };

    const handleMoveFile = async (fileId: string, toFolderId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file || !file.parents || file.parents.length === 0) {
             const currentFolder = breadcrumbs[breadcrumbs.length - 1];
             const success = await moveFile(fileId, currentFolder.id, toFolderId, file?.accountId);
             if (success) {
                 clearCache();
                 fetchFiles();
             }
             return;
        }

        const success = await moveFile(fileId, file.parents[0], toFolderId, file.accountId);
        if (success) {
            clearCache();
            fetchFiles();
        } else {
            alert("파일 이동에 실패했습니다. 권한을 확인해주세요.");
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
        
        // Peek logic: if only one file selected, peek it
        if (next.size === 1) {
            const file = files.find(f => f.id === Array.from(next)[0]);
            if (file) setPeekFile(file);
        } else {
            setPeekFile(null);
        }
    };

    // Metadata Handlers
    useEffect(() => {
        if (taggingFile) {
            setNewTag("");
            setNotes(taggingFile.notes || "");
        }
    }, [taggingFile]);

    const handleAddTag = () => {
        if (newTag.trim() && taggingFile) {
            const tags = [...(taggingFile.tags || []), newTag.trim()];
            setTaggingFile({ ...taggingFile, tags: Array.from(new Set(tags)) });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        if (taggingFile) {
            setTaggingFile({ ...taggingFile, tags: taggingFile.tags?.filter(t => t !== tag) });
        }
    };

    const handleSaveMetadata = async () => {
        if (taggingFile) {
            await updateMetadata(taggingFile.id, { tags: taggingFile.tags, notes: notes });
            setTaggingFile(null);
            fetchFiles();
        }
    };

    let displayFiles = searchResults || files;
    if (selectedTag) {
        displayFiles = displayFiles.filter(f => f.tags?.includes(selectedTag));
    }

    if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    const handleDragOver = (e: React.DragEvent) => {
        // Only show upload overlay if it's external files
        if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Check if we are really leaving the explorer area
        const rect = e.currentTarget.getBoundingClientRect();
        if (
            e.clientX <= rect.left ||
            e.clientX >= rect.right ||
            e.clientY <= rect.top ||
            e.clientY >= rect.bottom
        ) {
            setDragOver(false);
        }
    };

    return (
        <div 
            className="h-full flex relative overflow-hidden bg-neutral-950 text-white" 
            onClick={() => setContextMenu(null)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
            }}
        >
            <Sidebar
                accounts={accounts} chambers={chambers} activeChamber={activeChamber}
                setActiveChamber={setActiveChamber} setBreadcrumbs={setBreadcrumbs}
                setIsSidebarCreateOpen={setIsSidebarCreateOpen} removeChamber={removeChamber}
                storageQuota={storageQuota} formatBytes={formatBytes} onMove={handleMoveFile} addAccount={addAccount}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-background/50">
                <Toolbar
                    breadcrumbs={breadcrumbs} navigateToBreadcrumb={navigateToBreadcrumb}
                    fileCount={displayFiles.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    searchFocused={searchFocused} setSearchFocused={setSearchFocused}
                    searching={searching} setSearchResults={setSearchResults}
                    viewMode={viewMode} setViewMode={setViewMode}
                    setNewFolderOpen={setNewFolderOpen} selectedCount={selected.size}
                    handleBulkDelete={handleBulkDelete} handleUpload={handleUpload}
                    fileInputRef={fileInputRef}
                    selectedTag={selectedTag} setSelectedTag={setSelectedTag}
                    allTags={Array.from(new Set(files.flatMap(f => f.tags || [])))}
                />

                <div className="flex-1 overflow-y-auto p-5 relative no-scrollbar">
                     {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-800" /></div>
                    ) : displayFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Upload className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">드라이브에 파일이 없습니다</p>
                        </div>
                    ) : viewMode === "list" ? (
                        <ListView
                            files={displayFiles} selected={selected} toggleSelect={toggleSelect}
                            onNavigate={handleNavigate} onSelect={handleSelect} setContextMenu={setContextMenu}
                            formatDate={formatDate} formatBytes={formatBytes} getFileIcon={getFileIcon}
                            getFileBg={getFileBg} getFileColor={getFileColor} isFolder={isFolder}
                            renaming={renaming} setRenaming={setRenaming} handleRename={handleRename}
                            renameInputRef={renameInputRef} onMove={handleMoveFile}
                        />
                    ) : viewMode === "grid" ? (
                        <GridView
                            files={displayFiles} selected={selected} toggleSelect={toggleSelect}
                            onNavigate={handleNavigate} onSelect={handleSelect} setContextMenu={setContextMenu}
                            formatBytes={formatBytes} getFileIcon={getFileIcon}
                            getFileBg={getFileBg} getFileColor={getFileColor} isFolder={isFolder}
                            onMove={handleMoveFile}
                        />
                    ) : (
                        <TableView
                            files={displayFiles} selected={selected} toggleSelect={toggleSelect}
                            onNavigate={handleNavigate} onSelect={handleSelect} setContextMenu={setContextMenu}
                            formatDate={formatDate} formatBytes={formatBytes} getFileIcon={getFileIcon}
                            getFileBg={getFileBg} getFileColor={getFileColor} isFolder={isFolder}
                            onMove={handleMoveFile}
                        />
                    )}
                </div>

                <AnimatePresence>
                    {dragOver && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onDragLeave={(e) => {
                                e.stopPropagation();
                                setDragOver(false);
                            }}
                            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-3xl border-2 border-dashed border-white/20 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] animate-pulse">
                                <Upload className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">DRIVE SYNC: READY</h2>
                            <p className="text-[10px] text-neutral-500 font-bold mt-2 uppercase tracking-[0.3em]">External assets detected</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {uploading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-6 left-6 z-50 bg-neutral-900 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-2xl shadow-black/80"
                        >
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Uploading Files</span>
                                <span className="text-[10px] text-neutral-500 font-medium">{uploadProgress}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Sidebar - Peek Panel (Always Visible) */}
            <RightSidebar 
                file={peekFile} 
                onClose={() => setPeekFile(null)} 
                setTaggingFile={setTaggingFile}
                handleStar={handleStar}
                downloadFile={downloadFile}
                getFileBlob={getFileBlob}
                shareFile={shareFile}
                listFiles={listFiles}
            />

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-[90] bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[200px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <ContextMenuItem icon={<ExternalLink className="w-3.5 h-3.5" />} label="열기" onClick={() => handleNavigate(contextMenu.file)} />
                        {!isFolder(contextMenu.file) && <ContextMenuItem icon={<Download className="w-3.5 h-3.5" />} label="다운로드" onClick={() => downloadFile(contextMenu.file.id, contextMenu.file.name, contextMenu.file.mimeType, contextMenu.file.accountId)} />}
                        <ContextMenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="이름 변경" onClick={() => setRenaming({ id: contextMenu.file.id, name: contextMenu.file.name })} />
                        <ContextMenuItem icon={contextMenu.file.starred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />} label={contextMenu.file.starred ? "즐겨찾기 해제" : "즐겨찾기"} onClick={() => handleStar(contextMenu.file)} />
                        <ContextMenuItem icon={<Plus className="w-3.5 h-3.5" />} label="메타데이터 관리" onClick={() => setTaggingFile(contextMenu.file)} />
                        <ContextMenuItem icon={<Share2 className="w-3.5 h-3.5" />} label="공유 링크 복사" onClick={async () => {
                            const link = await shareFile(contextMenu.file.id, contextMenu.file.accountId);
                            if (link) {
                                navigator.clipboard.writeText(link);
                                alert("공유 링크가 클립보드에 복사되었습니다!");
                                fetchFiles();
                            }
                        }} />
                        {isFolder(contextMenu.file) && <ContextMenuItem icon={<Database className="w-3.5 h-3.5" />} label="Chamber로 등록" onClick={() => setShowChamberDialog(contextMenu.file)} />}
                        <div className="my-1 border-t border-white/5" />
                        <ContextMenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="삭제" danger onClick={() => handleDelete(contextMenu.file.id)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <PdfViewer
                pdfViewer={pdfViewer} setPdfViewer={setPdfViewer} pdfLoading={pdfLoading}
                downloadFile={downloadFile} accountId={files.find(f => f.id === pdfViewer?.fileId)?.accountId}
            />

            <Dialogs
                showChamberDialog={showChamberDialog} setShowChamberDialog={setShowChamberDialog}
                chamberName={chamberName} setChamberName={setChamberName} createChamber={createChamber}
                isSidebarCreateOpen={isSidebarCreateOpen} setIsSidebarCreateOpen={setIsSidebarCreateOpen}
                loadingTopFolders={loadingTopFolders} topFolders={topFolders}
                newFolderOpen={newFolderOpen} setNewFolderOpen={setNewFolderOpen}
                newFolderName={newFolderName} setNewFolderName={setNewFolderName} handleCreateFolder={handleCreateFolder}
                taggingFile={taggingFile} setTaggingFile={setTaggingFile}
                newTag={newTag} setNewTag={setNewTag} handleAddTag={handleAddTag} handleRemoveTag={handleRemoveTag}
                notes={notes} setNotes={setNotes} handleSaveMetadata={handleSaveMetadata}
                renaming={renaming} setRenaming={setRenaming} handleRename={handleRename}
                renameInputRef={renameInputRef}
            />
        </div>
    );
}

function ContextMenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-xs font-medium ${danger ? "text-red-400" : "text-neutral-300"}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
