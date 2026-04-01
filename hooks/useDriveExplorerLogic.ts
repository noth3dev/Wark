import { useState, useEffect, useCallback, useRef } from "react";
import { useGoogleDrive, DriveFile } from "@/lib/google-drive-context";
import { formatDate, formatBytes, getFileIcon, getFileBg, getFileColor, isFolder } from "@/lib/drive-utils";

export function useDriveExplorerLogic() {
    const drive = useGoogleDrive();
    const { 
        listFiles, uploadFile, deleteFile, createFolder,
        starFile, renameFile, getStorageQuota,
        updateMetadata, moveFile, clearCache
    } = drive;

    // Core Explorer State
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string, accountId?: string }[]>([
        { id: "root", name: "내 드라이브" }
    ]);
    const [viewMode, setViewMode] = useState<"list" | "grid" | "table">("list");
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);

    // Interaction State
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [peekFile, setPeekFile] = useState<DriveFile | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    
    // Dialog/Editor State
    const [contextMenu, setContextMenu] = useState<{ file: DriveFile, x: number, y: number } | null>(null);
    const [renaming, setRenaming] = useState<{ id: string, name: string } | null>(null);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [pdfViewer, setPdfViewer] = useState<{ url: string, name: string, fileId: string, webViewLink?: string } | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [showChamberDialog, setShowChamberDialog] = useState<DriveFile | null>(null);
    const [chamberName, setChamberName] = useState("");
    const [isSidebarCreateOpen, setIsSidebarCreateOpen] = useState(false);
    const [topFolders, setTopFolders] = useState<DriveFile[]>([]);
    const [loadingTopFolders, setLoadingTopFolders] = useState(false);
    const [taggingFile, setTaggingFile] = useState<DriveFile | null>(null);
    const [newTag, setNewTag] = useState("");
    const [notes, setNotes] = useState("");
    const [storageQuota, setStorageQuota] = useState<{ usage: number; limit: number } | null>(null);

    const renameInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        fetchFiles();
        getStorageQuota().then(setStorageQuota);
    }, [fetchFiles, getStorageQuota]);

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (searchQuery.trim()) {
                setLoading(true);
                const results = await listFiles(undefined, searchQuery.trim());
                setSearchResults(results);
                setLoading(false);
            } else {
                setSearchResults(null);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery, listFiles]);

    useEffect(() => {
        if (isSidebarCreateOpen) {
            const fetchTopFolders = async () => {
                setLoadingTopFolders(true);
                const items = await listFiles(); // fetch root folders
                setTopFolders(items.filter(f => isFolder(f)));
                setLoadingTopFolders(false);
            };
            fetchTopFolders();
        }
    }, [isSidebarCreateOpen, listFiles]);

    // Handlers
    const handlers = {
        handleNavigate: (file: DriveFile) => {
            if (isFolder(file)) {
                setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name, accountId: file.accountId }]);
                setSearchQuery("");
                setSearchResults(null);
                setPeekFile(null);
            }
        },
        handleSelect: (file: DriveFile) => {
            setPeekFile(file);
            setSelected(new Set([file.id]));
        },
        navigateToBreadcrumb: (index: number) => {
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
            setSearchQuery("");
            setSearchResults(null);
        },
        handleStar: async (file: DriveFile) => {
            const success = await starFile(file.id, !file.starred, file.accountId);
            if (success) fetchFiles();
        },
        handleDelete: async (id: string) => {
            if (confirm("정말 이 파일을 삭제하시겠습니까?")) {
                const file = files.find(f => f.id === id);
                const success = await deleteFile(id, file?.accountId);
                if (success) {
                    clearCache();
                    fetchFiles();
                }
            }
        },
        handleRename: async () => {
            if (!renaming) return;
            const file = files.find(f => f.id === renaming.id);
            const success = await renameFile(renaming.id, renaming.name, file?.accountId);
            if (success) {
                setRenaming(null);
                clearCache();
                fetchFiles();
            }
        },
        handleCreateFolder: async () => {
            if (!newFolderName) return;
            const currentFolder = breadcrumbs[breadcrumbs.length - 1];
            const success = await createFolder(newFolderName, currentFolder.id === "root" ? undefined : currentFolder.id, currentFolder.accountId);
            if (success) {
                setNewFolderName("");
                setNewFolderOpen(false);
                clearCache();
                fetchFiles();
            }
        },
        handleUpload: async (filesToUpload: FileList | null | File[]) => {
            if (!filesToUpload) return;
            setUploading(true);
            const currentFolder = breadcrumbs[breadcrumbs.length - 1];
            const fileCount = "length" in filesToUpload ? (filesToUpload as FileList).length : (filesToUpload as File[]).length;
            const fileArray = "length" in filesToUpload ? Array.from(filesToUpload as FileList) : (filesToUpload as File[]);
            for (let i = 0; i < fileArray.length; i++) {
                setUploadProgress(`${i + 1}/${fileCount} 업로드 중...`);
                await uploadFile(fileArray[i], currentFolder.id === "root" ? undefined : currentFolder.id, currentFolder.accountId);
            }
            clearCache();
            setUploading(false);
            setUploadProgress(null);
            fetchFiles();
        },
        handleMoveFile: async (fileId: string, toFolderId: string) => {
            const file = files.find(f => f.id === fileId);
            if (!file || !file.parents || file.parents.length === 0) {
                 const currentFolder = breadcrumbs[breadcrumbs.length - 1];
                 const success = await moveFile(fileId, currentFolder.id, toFolderId, file?.accountId);
                 if (success) { clearCache(); fetchFiles(); }
                 return;
            }
            const success = await moveFile(fileId, file.parents[0], toFolderId, file.accountId);
            if (success) { clearCache(); fetchFiles(); }
        },
        toggleSelect: (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const next = new Set(selected);
            if (next.has(id)) next.delete(id); else next.add(id);
            setSelected(next);
            if (next.size === 1) {
                const file = files.find(f => f.id === Array.from(next)[0]);
                if (file) setPeekFile(file);
            } else setPeekFile(null);
        },
        handleAddTag: () => {
            if (newTag.trim() && taggingFile) {
                const tags = [...(taggingFile.tags || []), newTag.trim()];
                setTaggingFile({ ...taggingFile, tags: Array.from(new Set(tags)) });
                setNewTag("");
            }
        },
        handleRemoveTag: (tag: string) => {
            if (taggingFile) setTaggingFile({ ...taggingFile, tags: taggingFile.tags?.filter(t => t !== tag) || [] });
        },
        handleSaveMetadata: async () => {
            if (taggingFile) {
                await updateMetadata(taggingFile.id, { tags: taggingFile.tags, notes });
                setTaggingFile(null);
                fetchFiles();
            }
        },
        handleDragOver: (e: React.DragEvent) => {
            if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragOver(true); }
        },
        handleDragLeave: (e: React.DragEvent) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) setDragOver(false);
        }
    };

    // Metadata Handlers (Side Effects)
    useEffect(() => {
        if (taggingFile) { setNewTag(""); setNotes(taggingFile.notes || ""); }
    }, [taggingFile]);

    const displayFiles = (searchResults || files).filter(f => {
        if (tagFilter.length === 0) return true;
        return tagFilter.every(t => f.tags?.includes(t));
    });

    return {
        drive,
        explorer: {
            files, displayFiles, breadcrumbs, viewMode, loading, searchQuery, storageQuota, tagFilter,
            setBreadcrumbs, setViewMode, setSearchQuery, setTagFilter, fetchFiles
        },
        interaction: {
            selected, peekFile, dragOver, uploading, uploadProgress, contextMenu,
            setSelected, setPeekFile, setDragOver, setContextMenu
        },
        dialogs: {
            newFolderOpen, newFolderName, renaming, showChamberDialog, chamberName, taggingFile,
            newTag, notes, isSidebarCreateOpen, pdfViewer, pdfLoading, topFolders, loadingTopFolders,
            setNewFolderOpen, setNewFolderName, setRenaming, setShowChamberDialog, setChamberName,
            setTaggingFile, setNewTag, setNotes, setIsSidebarCreateOpen, setPdfViewer, setPdfLoading, renameInputRef
        },
        handlers
    };
}
