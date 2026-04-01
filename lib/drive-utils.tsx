import React from "react";
import { 
    Folder, FileText, Image as ImageIcon, Music, Video, 
    File, FileCode, Archive, FileType, CheckCircle2 
} from "lucide-react";

export const isFolder = (file: any) => file.mimeType === "application/vnd.google-apps.folder";

export const getFileIcon = (mimeType: string, size: string = "sm") => {
    const iconSize = size === "lg" ? "w-6 h-6" : "w-3.5 h-3.5";
    if (mimeType === "application/vnd.google-apps.folder") return <Folder className={iconSize} fill="currentColor" />;
    if (mimeType.includes("pdf")) return <FileText className={iconSize} />;
    if (mimeType.includes("image")) return <ImageIcon className={iconSize} />;
    if (mimeType.includes("audio")) return <Music className={iconSize} />;
    if (mimeType.includes("video")) return <Video className={iconSize} />;
    if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("html") || mimeType.includes("css") || mimeType.includes("json")) return <FileCode className={iconSize} />;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return <Archive className={iconSize} />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <FileType className={iconSize} />;
    return <File className={iconSize} />;
};

export const getFileBg = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") return "bg-blue-500/10";
    if (mimeType.includes("pdf")) return "bg-red-500/10";
    if (mimeType.includes("image")) return "bg-amber-500/10";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "bg-emerald-500/10";
    if (mimeType.includes("video")) return "bg-purple-500/10";
    return "bg-white/5";
};

export const getFileColor = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") return "text-blue-400";
    if (mimeType.includes("pdf")) return "text-red-400";
    if (mimeType.includes("image")) return "text-amber-400";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "text-emerald-400";
    if (mimeType.includes("video")) return "text-purple-400";
    return "text-neutral-400";
};

export const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
};

export const formatBytes = (bytes: string | number = 0) => {
    const b = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
    if (b === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
