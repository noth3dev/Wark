import React, { useState, useEffect } from "react";
import { DriveFile } from "@/lib/google-drive-context";
import { 
    X, FileText, Download, Star, StarOff, 
    Pencil, Tag, Calendar, Database, HardDrive, 
    ExternalLink, Maximize2, Play, Music, Image as ImageIcon,
    Loader2, Share2, Info, Eye, Folder, ChevronRight, MousePointer2,
    QrCode, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatBytes, getFileIcon, getFileBg, getFileColor, isFolder } from "@/lib/drive-utils";

interface RightSidebarProps {
    file: DriveFile | null;
    onClose: () => void;
    setTaggingFile: (f: DriveFile) => void;
    handleStar: (f: DriveFile) => void;
    downloadFile: (id: string, name: string, mime: string, accountId?: string) => void;
    getFileBlob: (id: string, accountId?: string) => Promise<string | null>;
    shareFile: (fileId: string, accountId?: string) => Promise<string | null>;
    listFiles: (folderId?: string, query?: string) => Promise<DriveFile[]>;
}

export function RightSidebar({
    file, onClose, setTaggingFile, handleStar, downloadFile, getFileBlob, shareFile, listFiles
}: RightSidebarProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [sharedLink, setSharedLink] = useState<string | null>(null);
    const [subFiles, setSubFiles] = useState<DriveFile[]>([]);
    const [loadingSub, setLoadingSub] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let active = true;
        let currentUrl: string | null = null;

        const loadPreview = async () => {
            if (!file) return;
            
            if (isFolder(file)) {
                setLoadingSub(true);
                const items = await listFiles(file.id);
                if (active) setSubFiles(items);
                setLoadingSub(false);
                setBlobUrl(null);
                return;
            }

            setSubFiles([]);
            const isMedia = file.mimeType.startsWith("image/") || 
                           file.mimeType.startsWith("video/") || 
                           file.mimeType.startsWith("audio/") || 
                           file.mimeType === "application/pdf";
            
            if (isMedia) {
                setLoading(true);
                const url = await getFileBlob(file.id, file.accountId);
                if (active) {
                    setBlobUrl(url);
                    currentUrl = url;
                } else if (url) {
                    URL.revokeObjectURL(url);
                }
                setLoading(false);
            } else {
                setBlobUrl(null);
            }
        };

        loadPreview();

        return () => {
            active = false;
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, [file, getFileBlob, listFiles]);

    useEffect(() => {
        setSharedLink(null);
        setShowQr(false);
        setCopied(false);
    }, [file]);

    const handleShare = async () => {
        if (!file) return;
        if (sharedLink) {
            navigator.clipboard.writeText(sharedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
        }
        setSharing(true);
        const link = await shareFile(file.id, file.accountId);
        if (link) {
            setSharedLink(link);
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        setSharing(false);
    };

    const renderPreview = () => {
        if (!file) return null;
        
        if (isFolder(file)) {
            return (
                <div className="w-full space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <Folder className="w-5 h-5 text-indigo-400" fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-none mb-1">Folder Contents</p>
                            <p className="text-[12px] text-white font-bold">{subFiles.length} items inside</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1 max-h-[260px] overflow-y-auto no-scrollbar pr-1">
                        {loadingSub ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-10 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                            ))
                        ) : subFiles.length === 0 ? (
                            <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                                <Info className="w-6 h-6 text-neutral-800 mx-auto mb-2" />
                                <p className="text-[10px] text-neutral-700">This folder is empty</p>
                            </div>
                        ) : subFiles.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-transparent hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group">
                                <div className={`w-6 h-6 rounded-lg ${getFileBg(sub.mimeType)} ${getFileColor(sub.mimeType)} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    {getFileIcon(sub.mimeType)}
                                </div>
                                <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200 truncate flex-1">{sub.name}</span>
                                <ChevronRight className="w-3 h-3 text-neutral-800" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (loading) return (
            <div className="w-full aspect-video flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-800" />
            </div>
        );

        if (file.mimeType.startsWith("image/") && blobUrl) {
            return (
                <div className="relative group">
                    <img src={blobUrl} alt={file.name} className="w-full rounded-2xl border border-white/10 shadow-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <button onClick={() => window.open(blobUrl, "_blank")} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            );
        }

        if (file.mimeType.startsWith("video/") && blobUrl) {
            return (
                <video src={blobUrl} controls className="w-full rounded-2xl border border-white/10 shadow-xl bg-black" />
            );
        }

        if (file.mimeType.startsWith("audio/") && blobUrl) {
            return (
                <div className="w-full p-6 bg-white/[0.03] rounded-2xl border border-white/5 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center animate-pulse">
                        <Music className="w-8 h-8 text-indigo-400" />
                    </div>
                    <audio src={blobUrl} controls className="w-full h-8" />
                </div>
            );
        }

        if (file.mimeType === "application/pdf" && blobUrl) {
            return (
                <div className="relative w-full aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-xl border border-white/10">
                    <iframe src={`${blobUrl}#toolbar=0`} className="w-full h-full border-none" />
                </div>
            );
        }

        return (
            <div className="w-full aspect-video flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5 gap-3">
                <div className={`w-12 h-12 rounded-2xl ${getFileBg(file.mimeType)} ${getFileColor(file.mimeType)} flex items-center justify-center`}>
                    {getFileIcon(file.mimeType, "lg")}
                </div>
                <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">No Preview Available</span>
            </div>
        );
    };

    const qrUrl = sharedLink 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(sharedLink)}`
        : null;

    return (
        <div className="w-80 border-l border-white/5 bg-neutral-950/40 backdrop-blur-3xl flex flex-col shadow-[-32px_0_64px_-32px_rgba(0,0,0,0.5)] z-40 transition-all duration-500 ease-in-out">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Peek View</span>
                </div>
                {file && (
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-600 hover:text-white transition-all">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <AnimatePresence mode="wait">
                    {file ? (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6"
                        >
                            {/* Preview Section */}
                            <div className="mb-8">
                                {renderPreview()}
                            </div>

                            {/* Title & Stats */}
                            <div className="mb-8">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-base font-black text-white leading-tight">{file.name}</h3>
                                    <button
                                        onClick={() => handleStar(file)}
                                        className={`p-1.5 rounded-lg transition-all ${file.starred ? "text-amber-400 bg-amber-400/10" : "text-neutral-700 hover:text-neutral-300 hover:bg-white/5"}`}
                                    >
                                        {file.starred ? <Star className="w-4 h-4 fill-amber-400" /> : <StarOff className="w-4 h-4" />}
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] items-center">
                                        <Database className="w-3 h-3 text-neutral-700" />
                                        <span className="text-neutral-500 font-medium">{formatBytes(file.size)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] items-center">
                                        <HardDrive className="w-3 h-3 text-neutral-700" />
                                        <span className="text-neutral-500 font-medium">{file.mimeType.split('/').pop()}</span>
                                    </div>
                                    {(file.shared || sharedLink) && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] items-center animate-pulse">
                                            <Share2 className="w-3 h-3 text-blue-400" />
                                            <span className="text-blue-400 font-bold uppercase tracking-widest">Public Shared</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-col gap-2 mb-8">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => downloadFile(file.id, file.name, file.mimeType, file.accountId)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-lg"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </button>
                                    <button 
                                        onClick={() => setTaggingFile(file)}
                                        className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <Tag className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={handleShare}
                                        disabled={sharing}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                                            sharedLink 
                                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                                                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                                        }`}
                                    >
                                        {sharing ? <Loader2 className="w-3 h-3 animate-spin" /> : copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                                        {sharedLink ? (copied ? "COPIED" : "COPY LINK") : "GET PUBLIC LINK"}
                                    </button>
                                    {sharedLink && (
                                        <button 
                                            onClick={() => setShowQr(!showQr)}
                                            className={`p-2.5 rounded-xl border transition-all ${showQr ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/[0.06] text-neutral-600 hover:text-white"}`}
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {showQr && qrUrl && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 p-4 bg-white rounded-2xl flex flex-col items-center gap-3">
                                                <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
                                                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest text-center">Scan to Access publicly</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Detailed Info */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.2em] px-1">Details</label>
                                    <div className="space-y-4 px-1">
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/5">
                                                    <Calendar className="w-3.5 h-3.5 text-neutral-700" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Created</span>
                                                    <span className="text-[11px] text-neutral-400 font-medium">{formatDate(file.createdTime)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/5">
                                                    <HardDrive className="w-3.5 h-3.5 text-neutral-700" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Account</span>
                                                    <span className="text-[11px] text-blue-400/80 font-bold truncate max-w-[140px]">{file.accountId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mb-6">
                                <MousePointer2 className="w-6 h-6 text-neutral-800" />
                            </div>
                            <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2">Workspace Peek</h3>
                            <p className="text-[10px] text-neutral-800 leading-relaxed max-w-[160px]">
                                파일을 선택하여 상세 정보와 미리보기를 확인하세요.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Info */}
            <div className="px-6 py-5 border-t border-white/5 bg-black/20 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center border border-white/5">
                    <Info className="w-3.5 h-3.5 text-neutral-700" />
                </div>
                <p className="text-[9px] text-neutral-700 font-medium leading-normal uppercase tracking-wider">
                    Always Live Assistant<br/>Unified Drive Explorer.
                </p>
            </div>
        </div>
    );
}
