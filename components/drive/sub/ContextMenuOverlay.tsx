import React from "react";
import { DriveFile } from "@/lib/google-drive-context";
import { motion } from "framer-motion";

export function ContextMenuItem({ 
    icon, label, onClick, danger 
}: { 
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void, 
    danger?: boolean 
}) {
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

interface ContextMenuOverlayProps {
    contextMenu: { file: DriveFile, x: number, y: number } | null;
    setContextMenu: (menu: any) => void;
    handleNavigate: (file: DriveFile) => void;
    downloadFile: (id: string, name: string, mime: string, accountId?: string) => void;
    setRenaming: (r: any) => void;
    handleStar: (file: DriveFile) => void;
    setTaggingFile: (file: DriveFile) => void;
    shareFile: (fileId: string, accountId?: string) => Promise<string | null>;
    setShowChamberDialog: (file: DriveFile) => void;
    handleDelete: (id: string) => void;
    isFolder: (file: DriveFile) => boolean;
    onShared: () => void;
}

import { 
    ExternalLink, Download, Pencil, Star, StarOff, 
    Plus, Share2, Database, Trash2 
} from "lucide-react";

export function ContextMenuOverlay({
    contextMenu, setContextMenu, handleNavigate, downloadFile,
    setRenaming, handleStar, setTaggingFile, shareFile,
    setShowChamberDialog, handleDelete, isFolder, onShared
}: ContextMenuOverlayProps) {
    if (!contextMenu) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[90] bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
        >
            <ContextMenuItem icon={<ExternalLink className="w-3.5 h-3.5" />} label="열기" onClick={() => handleNavigate(contextMenu.file)} />
            {!isFolder(contextMenu.file) && (
                <ContextMenuItem 
                    icon={<Download className="w-3.5 h-3.5" />} 
                    label="다운로드" 
                    onClick={() => downloadFile(contextMenu.file.id, contextMenu.file.name, contextMenu.file.mimeType, contextMenu.file.accountId)} 
                />
            )}
            <ContextMenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="이름 변경" onClick={() => setRenaming({ id: contextMenu.file.id, name: contextMenu.file.name })} />
            <ContextMenuItem 
                icon={contextMenu.file.starred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />} 
                label={contextMenu.file.starred ? "즐겨찾기 해제" : "즐겨찾기"} 
                onClick={() => handleStar(contextMenu.file)} 
            />
            <ContextMenuItem icon={<Plus className="w-3.5 h-3.5" />} label="메타데이터 관리" onClick={() => setTaggingFile(contextMenu.file)} />
            <ContextMenuItem 
                icon={<Share2 className="w-3.5 h-3.5" />} 
                label="공유 링크 복사" 
                onClick={async () => {
                    const link = await shareFile(contextMenu.file.id, contextMenu.file.accountId);
                    if (link) {
                        navigator.clipboard.writeText(link);
                        alert("공유 링크가 클립보드에 복사되었습니다!");
                        onShared();
                    }
                }} 
            />
            {isFolder(contextMenu.file) && <ContextMenuItem icon={<Database className="w-3.5 h-3.5" />} label="Chamber로 등록" onClick={() => setShowChamberDialog(contextMenu.file)} />}
            <div className="my-1 border-t border-white/5" />
            <ContextMenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="삭제" danger onClick={() => handleDelete(contextMenu.file.id)} />
        </motion.div>
    );
}
