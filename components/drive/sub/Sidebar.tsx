import React, { useState } from "react";
import { DriveChamber, GoogleAccount, DriveFile } from "@/lib/google-drive-context";
import { HardDrive, Database, Plus, X, Cloud, Info, UserPlus } from "lucide-react";
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
    addAccount: () => void;
}

export function Sidebar({
    accounts, chambers, activeChamber, setActiveChamber, 
    setBreadcrumbs, setIsSidebarCreateOpen, removeChamber,
    storageQuota, formatBytes, onMove, addAccount
}: SidebarProps) {
    const [dragOverChamber, setDragOverChamber] = React.useState<string | null>(null);
    const usagePercent = storageQuota ? Math.min((storageQuota.usage / storageQuota.limit) * 100, 100) : 0;
    
    return (
        <div className="w-64 border-r border-white/5 bg-neutral-950/40 flex flex-col backdrop-blur-3xl">
            <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                         <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Workstation</h2>
                     </div>
                </div>

                <div className="space-y-8">
                    {/* Accounts Section */}
                    <div>
                        <div className="flex items-center justify-between px-2 mb-3">
                             <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Connected Hubs</span>
                             <button 
                                onClick={addAccount}
                                className="p-1 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-all"
                                title="Add Account"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {accounts.map(acc => (
                                <div key={acc.id} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all">
                                    <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                                        {acc.avatar ? (
                                            <img src={acc.avatar} alt={acc.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-neutral-600 uppercase">{acc.name[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] font-bold text-neutral-300 truncate leading-tight group-hover:text-white transition-colors">{acc.name}</span>
                                        <span className="text-[9px] text-neutral-700 truncate font-medium">{acc.id}</span>
                                    </div>
                                </div>
                            ))}
                            {accounts.length === 0 && (
                                <button
                                    onClick={addAccount}
                                    className="w-full flex flex-col items-center justify-center py-6 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                                >
                                    <Plus className="w-5 h-5 text-neutral-800 group-hover:text-neutral-500 mb-2 transition-colors" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-700 group-hover:text-neutral-400">Add Account</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <div className="px-2 mb-3">
                             <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Storage Pool</span>
                        </div>
                        <button
                            onClick={() => {
                                setActiveChamber(null);
                                setBreadcrumbs([{ id: "root", name: "내 드라이브" }]);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                !activeChamber 
                                    ? "bg-white/5 border-white/10 text-white shadow-lg" 
                                    : "border-transparent text-neutral-600 hover:text-neutral-300 hover:bg-white/5"
                            }`}
                        >
                            <HardDrive className={`w-4 h-4 ${!activeChamber ? "text-blue-400" : "text-neutral-700"}`} />
                            <span>모든 드라이브</span>
                        </button>
                    </div>

                    {/* Chambers */}
                    <div>
                        <div className="flex items-center justify-between px-2 mb-3">
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
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                            activeChamber?.id === chamber.id 
                                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                                                : dragOverChamber === chamber.id
                                                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/10"
                                                    : "border-transparent text-neutral-600 hover:text-neutral-300 hover:bg-white/5"
                                        }`}
                                    >
                                        <Database className={`w-4 h-4 ${activeChamber?.id === chamber.id ? "text-indigo-400" : "text-neutral-700"}`} />
                                        <span className="truncate flex-1 text-left">{chamber.name}</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeChamber(chamber.id, chamber.name); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-neutral-800 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {chambers.length === 0 && (
                                <div className="px-3 py-4 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
                                    <p className="text-[9px] text-neutral-800 font-bold leading-relaxed uppercase tracking-widest text-center">
                                        No Chambers Active
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Storage Quota */}
            <div className="p-5 border-t border-white/5 bg-black/20">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                             <Cloud className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Total Hub</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                    usagePercent > 90 ? "from-red-500 to-orange-400" : "from-blue-500 to-indigo-500"
                                } shadow-[0_0_8px_rgba(59,130,246,0.3)]`}
                            />
                        </div>
                        
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[12px] font-black text-neutral-300">
                                    {storageQuota ? formatBytes(storageQuota.usage) : "0 B"}
                                </span>
                                <span className="text-[9px] font-bold text-neutral-700">
                                    / {storageQuota ? formatBytes(storageQuota.limit) : "0 B"}
                                </span>
                            </div>
                            <span className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.2em]">
                                {usagePercent.toFixed(1)}% Capacity
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
