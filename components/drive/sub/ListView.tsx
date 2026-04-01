import React from "react";
import { DriveFile } from "@/lib/google-drive-context";
import { Check, Star, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface ListViewProps {
    files: DriveFile[];
    selected: Set<string>;
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    onNavigate: (file: DriveFile) => void;
    onSelect: (file: DriveFile) => void;
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
    onMove: (fileId: string, toFolderId: string) => void;
}

export function ListView({
    files, selected, toggleSelect, onNavigate, onSelect, setContextMenu,
    formatDate, formatBytes, getFileIcon, getFileBg, getFileColor, isFolder,
    renaming, setRenaming, handleRename, renameInputRef, onMove
}: ListViewProps) {
    const [dragOverFolder, setDragOverFolder] = React.useState<string | null>(null);

    return (
        <div className="space-y-px">
            <div className="grid grid-cols-[28px_1fr_100px_80px_36px] gap-3 px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-700 font-bold">
                <span />
                <span>이름</span>
                <span>수정일</span>
                <span className="text-right">크기</span>
                <span />
            </div>
            {files.map((file, i) => (
                <div
                    key={file.id}
                    className={`group grid grid-cols-[28px_1fr_100px_80px_36px] gap-3 items-center px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        selected.has(file.id) ? "bg-blue-500/10 border border-blue-500/20" : 
                        dragOverFolder === file.id ? "bg-indigo-500/20 border border-indigo-500/40 shadow-lg shadow-indigo-500/10" :
                        "hover:bg-white/[0.03] border border-transparent"
                    }`}
                    draggable={!isFolder(file)}
                    onDragStart={(e) => {
                        e.dataTransfer.setData("fileId", file.id);
                        e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                        if (isFolder(file)) {
                            e.preventDefault();
                            setDragOverFolder(file.id);
                            e.dataTransfer.dropEffect = "move";
                        }
                    }}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={(e) => {
                        if (isFolder(file)) {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverFolder(null);
                            const fileId = e.dataTransfer.getData("fileId");
                            if (fileId && fileId !== file.id) onMove(fileId, file.id);
                        }
                    }}
                    onClick={() => onSelect(file)}
                    onDoubleClick={() => isFolder(file) && onNavigate(file)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onSelect(file);
                        setContextMenu({ file, x: e.clientX, y: e.clientY });
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.01 }}
                        className="contents"
                    >
                        <div
                            onClick={(e) => toggleSelect(file.id, e)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                selected.has(file.id) ? "bg-blue-500 border-blue-500" : "border-white/10 opacity-0 group-hover:opacity-100 hover:border-white/20"
                            }`}
                        >
                            {selected.has(file.id) && <Check className="w-3 h-3 text-white" />}
                        </div>

                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg ${getFileBg(file.mimeType)} ${getFileColor(file.mimeType)} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                                {getFileIcon(file.mimeType)}
                            </div>
                            {renaming?.id === file.id ? (
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={renaming.name}
                                    onChange={(e) => setRenaming({ id: renaming!.id, name: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(null); }}
                                    onBlur={handleRename}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="flex-1 min-w-0 px-2 py-0.5 bg-white/[0.06] border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-blue-500/40"
                                />
                            ) : (
                                <span className={`text-[13px] truncate transition-colors ${dragOverFolder === file.id ? "text-indigo-400 font-bold" : "text-neutral-300 group-hover:text-white"}`}>
                                    {file.name}
                                </span>
                            )}
                            {file.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                            <div className="flex items-center gap-1 overflow-x-hidden">
                                {file.tags?.map(tag => (
                                    <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-500 border border-white/5 whitespace-nowrap">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <span className="text-[11px] text-neutral-700">{formatDate(file.modifiedTime)}</span>
                        <span className="text-[11px] text-neutral-700 text-right font-mono">
                            {isFolder(file) ? "" : formatBytes(file.size)}
                        </span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setContextMenu({ file, x: rect.right - 180, y: rect.bottom + 4 });
                            }}
                            className="p-1 rounded-md text-neutral-700 opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-neutral-300 transition-all"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            ))}
        </div>
    );
}
