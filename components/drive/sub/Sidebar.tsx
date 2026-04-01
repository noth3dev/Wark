import React, { useState } from "react";
import { DriveChamber, GoogleAccount, DriveFile } from "@/lib/google-drive-context";
import { HardDrive, Database, Plus, X, Cloud, Info } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
    accounts: GoogleAccount[];
    chambers: DriveChamber[];
    activeChamber: DriveChamber | null;
    setActiveChamber: (chamber: DriveChamber | null) => void;
    setBreadcrumbs: (crumbs: any[]) => void;
    setIsSidebarCreateOpen: (open: boolean) => void;
    removeChamber: (id: string, name: string) => void;
    storageQuota: { usage: number; limit: number } | null;
    formatBytes: (bytes: number | string) => string;
    onMove: (fileId: string, toFolderId: string) => void;
}

export function Sidebar({
    accounts, chambers, activeChamber, setActiveChamber, 
    setBreadcrumbs, setIsSidebarCreateOpen, removeChamber,
    storageQuota, formatBytes, onMove
}: SidebarProps) {
    const [dragOverChamber, setDragOverChamber] = React.useState<string | null>(null);
    const usagePercent = storageQuota ? Math.min((storageQuota.usage / storageQuota.limit) * 100, 100) : 0;
    
    return (
        <div className="w-64 border-r border-border bg-black/20 flex flex-col">
            <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Workspace</h2>
                </div>

                <div className="space-y-6">
                    {/* Primary Drive */}
                    <div>
                        <button
                            onClick={() => {
                                setActiveChamber(null);
                                setBreadcrumbs([{ id: "root", name: "내 드라이브" }]);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                !activeChamber ? "bg-white/10 text-white shadow-xl shadow-black/20" : "text-neutral-600 hover:text-neutral-300 hover:bg-white/5"
                            }`}
                        >
                            <HardDrive className={`w-4 h-4 ${!activeChamber ? "text-blue-400" : "text-neutral-700"}`} />
                            <span>통합 드라이브</span>
                        </button>
                    </div>

                    {/* Chambers */}
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2">
                            <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Chambers</span>
                            <button 
                                onClick={() => setIsSidebarCreateOpen(true)}
                                className="p-1 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {chambers.map(chamber => (
                                <div key={chamber.id} className="group relative">
                                    <button
                                        onClick={() => {
                                            setActiveChamber(chamber);
                                            setBreadcrumbs([{ id: chamber.root_folder_id, name: chamber.name, accountId: chamber.account_id }]);
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverChamber(chamber.id);
                                        }}
                                        onDragLeave={() => setDragOverChamber(null)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOverChamber(null);
                                            const fileId = e.dataTransfer.getData("fileId");
                                            if (fileId) onMove(fileId, chamber.root_folder_id);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                            activeChamber?.id === chamber.id 
                                                ? "bg-indigo-500/10 text-indigo-400" 
                                                : dragOverChamber === chamber.id
                                                    ? "bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20"
                                                    : "text-neutral-600 hover:text-neutral-300 hover:bg-white/5"
                                        }`}
                                    >
                                        <Database className={`w-4 h-4 ${activeChamber?.id === chamber.id ? "text-indigo-400" : "text-neutral-700"}`} />
                                        <span className="truncate flex-1 text-left">{chamber.name}</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeChamber(chamber.id, chamber.name); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {chambers.length === 0 && (
                                <div className="px-3 py-4 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
                                    <p className="text-[10px] text-neutral-700 font-medium leading-relaxed italic text-center">
                                        폴더 우클릭 또는 + 버튼으로<br/>Chamber를 추가하세요.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Storage UI */}
            <div className="p-5 border-t border-white/5 bg-white/[0.01]">
                <div className="bg-neutral-900/50 rounded-2xl p-4 border border-white/[0.03]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <span className="text-[11px] font-bold text-white">Storage</span>
                        </div>
                        <Info className="w-3 h-3 text-neutral-700 cursor-help" />
                    </div>
                    
                    <div className="space-y-3">
                        <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                    usagePercent > 90 ? "from-red-500 to-orange-400" : "from-blue-600 to-indigo-400"
                                } shadow-[0_0_12px_rgba(59,130,246,0.3)]`}
                            />
                        </div>
                        
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[13px] font-bold text-neutral-200">
                                    {storageQuota ? formatBytes(storageQuota.usage) : "0 B"}
                                </span>
                                <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-tighter">
                                    / {storageQuota ? formatBytes(storageQuota.limit) : "0 B"}
                                </span>
                            </div>
                            <span className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest">
                                {usagePercent.toFixed(1)}% USED
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
