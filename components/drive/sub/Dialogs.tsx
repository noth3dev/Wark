import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Folder, ChevronRight, FolderPlus, Plus, Pencil, Tag, MessageSquare } from "lucide-react";
import { DriveFile } from "@/lib/google-drive-context";

interface DialogsProps {
    showChamberDialog: DriveFile | null;
    setShowChamberDialog: (f: DriveFile | null) => void;
    chamberName: string;
    setChamberName: (n: string) => void;
    createChamber: (name: string, id: string) => Promise<void>;
    
    isSidebarCreateOpen: boolean;
    setIsSidebarCreateOpen: (o: boolean) => void;
    loadingTopFolders: boolean;
    topFolders: DriveFile[];
    
    newFolderOpen: boolean;
    setNewFolderOpen: (o: boolean) => void;
    newFolderName: string;
    setNewFolderName: (n: string) => void;
    handleCreateFolder: () => void;

    taggingFile: DriveFile | null;
    setTaggingFile: (f: DriveFile | null) => void;
    newTag: string;
    setNewTag: (t: string) => void;
    handleAddTag: () => void;
    handleRemoveTag: (t: string) => void;
    notes: string;
    setNotes: (n: string) => void;
    handleSaveMetadata: () => void;

    renaming: { id: string, name: string } | null;
    setRenaming: (r: any) => void;
    handleRename: () => void;
    renameInputRef: React.RefObject<HTMLInputElement | null>;
}

export function Dialogs({
    showChamberDialog, setShowChamberDialog, chamberName, setChamberName, createChamber,
    isSidebarCreateOpen, setIsSidebarCreateOpen, loadingTopFolders, topFolders,
    newFolderOpen, setNewFolderOpen, newFolderName, setNewFolderName, handleCreateFolder,
    taggingFile, setTaggingFile, newTag, setNewTag, handleAddTag, handleRemoveTag, notes, setNotes, handleSaveMetadata,
    renaming, setRenaming, handleRename, renameInputRef
}: DialogsProps) {
    return (
        <AnimatePresence>
            {/* Chamber Registration Modal */}
            {showChamberDialog && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowChamberDialog(null)}
                >
                     <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Database className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white">Chamber 등록</h3>
                        </div>
                        <p className="text-[11px] text-neutral-500 mb-4">"{showChamberDialog.name}" 폴더를 독립적인 가상 워크스페이스로 관리합니다.</p>
                        <input
                            type="text"
                            value={chamberName}
                            onChange={(e) => setChamberName(e.target.value)}
                            placeholder="Chamber 이름 (예: 프로젝트 A)"
                            autoFocus
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-all mb-5"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowChamberDialog(null)} className="px-4 py-2 text-xs text-neutral-500 hover:text-white transition-colors">취소</button>
                            <button
                                onClick={async () => {
                                    if (chamberName.trim()) {
                                        await createChamber(chamberName.trim(), showChamberDialog.id);
                                        setShowChamberDialog(null);
                                        setChamberName("");
                                        setIsSidebarCreateOpen(false);
                                    }
                                }}
                                className="px-5 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-400 transition-all"
                            >
                                등록하기
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Sidebar Create Chamber Modal */}
            {isSidebarCreateOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsSidebarCreateOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <Database className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Chamber 생성</h3>
                            </div>
                            <button onClick={() => setIsSidebarCreateOpen(false)} className="p-1 rounded-lg text-neutral-600 hover:text-white hover:bg-white/5 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[11px] text-neutral-500 mb-4 font-medium uppercase tracking-wider">기본 루트 폴더 선택</p>
                        
                        <div className="flex-1 overflow-y-auto space-y-1.5 mb-5 pr-2 no-scrollbar">
                            {loadingTopFolders ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-10 w-full rounded-xl bg-white/[0.02] animate-pulse" />
                                ))
                            ) : topFolders.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Folder className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
                                    <p className="text-[11px] text-neutral-700">연결할 폴더가 없습니다</p>
                                </div>
                            ) : (
                                topFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => setShowChamberDialog(folder)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left group"
                                    >
                                        <Folder className="w-4 h-4 text-neutral-600 group-hover:text-blue-400" />
                                        <span className="truncate flex-1">{folder.name}</span>
                                        <ChevronRight className="w-3 h-3 text-neutral-800" />
                                    </button>
                                ))
                            )}
                        </div>
                        
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-[10px] text-neutral-600 leading-relaxed">
                                기존 폴더를 Chamber로 연결하여 독립 워크스페이스를 만들 수 있습니다. 
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* New Folder Modal */}
            {newFolderOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setNewFolderOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <FolderPlus className="w-4 h-4 text-blue-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white">새 폴더 만들기</h3>
                        </div>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                            placeholder="폴더 이름 입력"
                            autoFocus
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:border-white/15 transition-all mb-5"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setNewFolderOpen(false)} className="px-4 py-2 text-xs text-neutral-500 hover:text-white transition-colors">취소</button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                className="px-5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 disabled:opacity-30 transition-all font-bold"
                            >
                                만들기
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Tagging & Metadata Modal */}
             {taggingFile && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setTaggingFile(null)}
                >
                    <motion.div
                        initial={{ y: 20, scale: 0.95, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 20, scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-white/10 rounded-3xl p-7 w-full max-w-sm shadow-[0_32px_128px_-32px_rgba(0,0,0,1)] flex flex-col gap-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <Tag className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-black text-white">Metadata Manager</h3>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest truncate max-w-[180px]">{taggingFile.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setTaggingFile(null)} className="p-2 rounded-xl text-neutral-600 hover:text-white hover:bg-white/5 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-neutral-700 uppercase tracking-widest block mb-2 px-1">Tags</label>
                                <div className="flex flex-wrap gap-1.5 mb-2.5">
                                    {taggingFile.tags?.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleRemoveTag(tag)}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-1.5 group"
                                        >
                                            {tag}
                                            <X className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                    {(!taggingFile.tags || taggingFile.tags.length === 0) && (
                                        <span className="text-[10px] text-neutral-700 py-1 px-1">No tags yet</span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        placeholder="Add a tag..."
                                        className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-[11px] text-white focus:outline-none focus:border-indigo-500/40 transition-all"
                                    />
                                    <button onClick={handleAddTag} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-neutral-700 uppercase tracking-widest block mb-2 px-1">Notes</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-3.5">
                                        <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
                                    </div>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add notes about this file..."
                                        className="w-full pl-9 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-2xl text-[11px] text-white min-h-[100px] focus:outline-none focus:border-indigo-500/40 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveMetadata}
                            className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-black/20"
                        >
                            Save Changes
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
