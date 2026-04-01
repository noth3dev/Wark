import React from "react";
import { DriveFile } from "@/lib/google-drive-context";
import { Check, Star } from "lucide-react";
import { motion } from "framer-motion";

interface GridViewProps {
    files: DriveFile[];
    selected: Set<string>;
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    onNavigate: (file: DriveFile) => void;
    onSelect: (file: DriveFile) => void;
    setContextMenu: (menu: any) => void;
    formatBytes: (bytes?: string | number) => string;
    getFileIcon: (mimeType: string, size?: any) => React.ReactNode;
    getFileBg: (mimeType: string) => string;
    getFileColor: (mimeType: string) => string;
    isFolder: (file: DriveFile) => boolean;
    onMove: (fileId: string, toFolderId: string) => void;
}

export function GridView({
    files, selected, toggleSelect, onNavigate, onSelect, setContextMenu,
    formatBytes, getFileIcon, getFileBg, getFileColor, isFolder, onMove
}: GridViewProps) {
    const [dragOverFolder, setDragOverFolder] = React.useState<string | null>(null);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
            {files.map((file, i) => (
                <div
                    key={file.id}
                    className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        selected.has(file.id) ? "bg-blue-500/10 border-blue-500/20" : 
                        dragOverFolder === file.id ? "bg-indigo-500/20 border border-indigo-500/40 shadow-xl" :
                        "bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="contents"
                    >
                        <div
                            onClick={(e) => toggleSelect(file.id, e)}
                            className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                selected.has(file.id) ? "bg-blue-500 border-blue-500" : "border-white/10 opacity-0 group-hover:opacity-100"
                            }`}
                        >
                            {selected.has(file.id) && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {file.starred && (
                            <Star className="absolute top-2.5 right-2.5 w-3 h-3 text-amber-400 fill-amber-400" />
                        )}

                        <div className={`w-12 h-12 rounded-xl ${getFileBg(file.mimeType)} ${getFileColor(file.mimeType)} flex items-center justify-center mt-1 transition-transform group-hover:scale-110`}>
                            {getFileIcon(file.mimeType, "lg")}
                        </div>
                        
                        <div className="text-center w-full">
                            <p className={`text-xs p-1 line-clamp-2 leading-snug transition-colors ${dragOverFolder === file.id ? "text-indigo-400 font-bold" : "text-neutral-400 group-hover:text-neutral-200"}`}>
                                {file.name}
                            </p>
                            {file.tags && file.tags.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-1 mt-1">
                                    {file.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[8px] px-1 rounded bg-white/5 text-neutral-600 border border-white/5">#{tag}</span>
                                    ))}
                                    {file.tags.length > 2 && <span className="text-[8px] text-neutral-700">+{file.tags.length - 2}</span>}
                                </div>
                            )}
                            <p className="text-[10px] text-neutral-700 mt-1 font-mono">
                                {isFolder(file) ? "폴더" : formatBytes(file.size)}
                            </p>
                        </div>
                    </motion.div>
                </div>
            ))}
        </div>
    );
}
