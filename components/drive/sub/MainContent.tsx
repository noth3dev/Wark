import React from "react";
import { DriveFile } from "@/lib/google-drive-context";
import { Loader2, Layout } from "lucide-react";
import { ListView } from "./ListView";
import { GridView } from "./GridView";
import { TableView } from "./TableView";

interface MainContentProps {
    loading: boolean;
    displayFiles: DriveFile[];
    viewMode: "list" | "grid" | "table";
    selected: Set<string>;
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    handleNavigate: (file: DriveFile) => void;
    handleSelect: (file: DriveFile) => void;
    setContextMenu: (menu: any) => void;
    formatDate: (date?: string) => string;
    formatBytes: (bytes?: string | number) => string;
    getFileIcon: (mimeType: string, size?: any) => React.ReactNode;
    getFileBg: (mimeType: string) => string;
    getFileColor: (mimeType: string) => string;
    isFolder: (file: DriveFile) => boolean;
    renaming: { id: string, name: string } | null;
    setRenaming: (r: any) => void;
    handleRename: () => void;
    renameInputRef: React.RefObject<HTMLInputElement | null>;
    handleMoveFile: (fileId: string, toFolderId: string) => void;
}

export function MainContent({
    loading, displayFiles, viewMode, selected, toggleSelect,
    handleNavigate, handleSelect, setContextMenu, formatDate, formatBytes,
    getFileIcon, getFileBg, getFileColor, isFolder,
    renaming, setRenaming, handleRename, renameInputRef, handleMoveFile
}: MainContentProps) {
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-800" />
            <p className="text-[10px] text-neutral-800 font-black uppercase tracking-widest">Introspecting Drives...</p>
        </div>
    );

    if (displayFiles.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-800">
            <Layout className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-xs font-bold uppercase tracking-widest italic">구름 위가 텅 비어있습니다.</p>
        </div>
    );

    switch (viewMode) {
        case "list":
            return (
                <ListView
                    files={displayFiles} selected={selected} toggleSelect={toggleSelect}
                    onNavigate={handleNavigate} onSelect={handleSelect} setContextMenu={setContextMenu}
                    formatDate={formatDate} formatBytes={formatBytes} getFileIcon={getFileIcon}
                    getFileBg={getFileBg} getFileColor={getFileColor} isFolder={isFolder}
                    renaming={renaming} setRenaming={setRenaming} handleRename={handleRename}
                    renameInputRef={renameInputRef} onMove={handleMoveFile}
                />
            );
        case "grid":
            return (
                <GridView
                    files={displayFiles} selected={selected} toggleSelect={toggleSelect}
                    onNavigate={handleNavigate} onSelect={handleSelect} setContextMenu={setContextMenu}
                    formatBytes={formatBytes} getFileIcon={getFileIcon}
                    getFileBg={getFileBg} getFileColor={getFileColor} isFolder={isFolder}
                    onMove={handleMoveFile}
                />
            );
        case "table":
            return (
                <TableView
                    files={displayFiles} selected={selected} toggleSelect={toggleSelect}
                    onNavigate={handleNavigate} onSelect={handleSelect} setContextMenu={setContextMenu}
                    formatDate={formatDate} formatBytes={formatBytes} getFileIcon={getFileIcon}
                    getFileBg={getFileBg} getFileColor={getFileColor} isFolder={isFolder}
                    onMove={handleMoveFile}
                />
            );
        default:
            return null;
    }
}
