import { DriveFile } from "@/lib/google-drive-context";
import { Check, MoreHorizontal, Star } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

interface TableViewProps {
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
    onMove: (fileId: string, toFolderId: string) => void;
}

export function TableView({ 
    files, selected, toggleSelect, onNavigate, onSelect, setContextMenu, 
    formatDate, formatBytes, getFileIcon, getFileBg, getFileColor, isFolder, onMove 
}: TableViewProps) {
    const [dragOverFolder, setDragOverFolder] = React.useState<string | null>(null);

    return (
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/10 backdrop-blur-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-8">
                                <Check className="w-3.5 h-3.5" />
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider min-w-[200px]">Name</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Tags</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-24">Size</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-32">Modified</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-32">MIME</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file, i) => (
                            <tr 
                                key={file.id} 
                                className={`group hover:bg-white/[0.04] border-b border-white/[0.03] transition-all cursor-pointer ${
                                    dragOverFolder === file.id ? "bg-indigo-500/20 shadow-inner" : ""
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
                                <td className="px-4 py-2.5">
                                    <div 
                                        onClick={(e) => toggleSelect(file.id, e)}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.has(file.id) ? "bg-blue-500 border-blue-500" : "border-white/10 opacity-0 group-hover:opacity-100"}`}
                                    >
                                        {selected.has(file.id) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${getFileBg(file.mimeType)} ${getFileColor(file.mimeType)}`}>
                                            {getFileIcon(file.mimeType)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-[12px] font-medium truncate max-w-[250px] transition-colors ${dragOverFolder === file.id ? "text-indigo-400 font-bold" : "text-neutral-300 group-hover:text-white"}`}>
                                                {file.name}
                                            </span>
                                            {file.shared && <span className="text-[8px] text-blue-500 uppercase font-black tracking-widest mt-0.5">Shared</span>}
                                        </div>
                                        {file.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex flex-wrap gap-1">
                                        {file.tags?.map(t => (
                                            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-600 border border-white/5 uppercase tracking-tighter">#{t}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-[11px] text-neutral-700 font-mono">
                                    {isFolder(file) ? "" : formatBytes(file.size)}
                                </td>
                                <td className="px-4 py-2.5 text-[11px] text-neutral-700">
                                    {formatDate(file.modifiedTime)}
                                </td>
                                <td className="px-4 py-2.5 text-[11px] text-neutral-800 uppercase tracking-widest font-black truncate max-w-[120px]">
                                    {file.mimeType.split(".").pop()?.split("/").pop()}
                                </td>
                                <td className="px-4 py-2.5">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setContextMenu({ file, x: rect.right - 180, y: rect.bottom + 4 });
                                        }}
                                        className="p-1 rounded text-neutral-800 opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
                                    >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
