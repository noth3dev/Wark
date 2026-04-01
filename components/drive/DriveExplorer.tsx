"use client";

import Script from "next/script";
import React from "react";
import { useDriveExplorerLogic } from "@/hooks/useDriveExplorerLogic";
import { Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatBytes, getFileIcon, getFileBg, getFileColor, isFolder } from "@/lib/drive-utils";

// Sub-components
import { Sidebar } from "./sub/Sidebar";
import { Toolbar } from "./sub/Toolbar";
import { RightSidebar } from "./sub/RightSidebar";
import { ContextMenuOverlay } from "./sub/ContextMenuOverlay";
import { MainContent } from "./sub/MainContent";
import { PdfViewer } from "./sub/PdfViewer";
import { Dialogs } from "./sub/Dialogs";

export default function DriveExplorer() {
    const { drive, explorer, interaction, dialogs, handlers } = useDriveExplorerLogic();
    const { accounts, chambers, activeChamber, setActiveChamber, removeChamber, addAccount, switchAccount, isLoading } = drive;

    if (isLoading) return (
        <div className="h-full flex items-center justify-center bg-neutral-950">
            <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            <div 
                className="h-full flex relative overflow-hidden bg-neutral-950 text-white" 
                onClick={() => interaction.setContextMenu(null)}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={(e) => {
                    e.preventDefault();
                    interaction.setDragOver(false);
                    if (e.dataTransfer.files.length > 0) handlers.handleUpload(e.dataTransfer.files);
                }}
            >
                <Sidebar
                    accounts={accounts} chambers={chambers} activeChamber={activeChamber}
                    setActiveChamber={setActiveChamber} setBreadcrumbs={explorer.setBreadcrumbs}
                    setIsSidebarCreateOpen={dialogs.setIsSidebarCreateOpen} removeChamber={removeChamber}
                    storageQuota={explorer.storageQuota} formatBytes={formatBytes} onMove={handlers.handleMoveFile}
                    addAccount={addAccount}
                />

                <div className="flex-1 flex flex-col min-w-0 bg-background/50">
                    <Toolbar
                        breadcrumbs={explorer.breadcrumbs} navigateToBreadcrumb={handlers.navigateToBreadcrumb}
                        searchQuery={explorer.searchQuery} setSearchQuery={explorer.setSearchQuery}
                        viewMode={explorer.viewMode} setViewMode={explorer.setViewMode}
                        setNewFolderOpen={dialogs.setNewFolderOpen}
                        handleUpload={handlers.handleUpload} uploading={interaction.uploading} uploadProgress={interaction.uploadProgress}
                        tagFilter={explorer.tagFilter} setTagFilter={explorer.setTagFilter} 
                        allTags={Array.from(new Set(explorer.files.flatMap(f => f.tags || [])))}
                    />

                    <div className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar">
                        <MainContent
                            loading={explorer.loading} displayFiles={explorer.displayFiles} viewMode={explorer.viewMode}
                            selected={interaction.selected} toggleSelect={handlers.toggleSelect}
                            handleNavigate={handlers.handleNavigate} handleSelect={handlers.handleSelect}
                            setContextMenu={interaction.setContextMenu} formatDate={formatDate} formatBytes={formatBytes}
                            getFileIcon={getFileIcon} getFileBg={getFileBg} getFileColor={getFileColor}
                            isFolder={isFolder} renaming={dialogs.renaming} setRenaming={dialogs.setRenaming}
                            handleRename={handlers.handleRename} renameInputRef={dialogs.renameInputRef}
                            handleMoveFile={handlers.handleMoveFile}
                        />
                    </div>
                </div>

                <RightSidebar 
                    file={interaction.peekFile} 
                    onClose={() => { interaction.setPeekFile(null); interaction.setSelected(new Set()); }}
                    setTaggingFile={dialogs.setTaggingFile} handleStar={handlers.handleStar}
                    downloadFile={drive.downloadFile} getFileBlob={drive.getFileBlob}
                    shareFile={drive.shareFile} listFiles={drive.listFiles}
                />

                <AnimatePresence>
                    {interaction.dragOver && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onDragLeave={(e) => { e.stopPropagation(); interaction.setDragOver(false); }}
                            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-3xl border-2 border-dashed border-white/20 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-lg animate-pulse">
                                <Upload className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">DRIVE SYNC: READY</h2>
                            <p className="text-[10px] text-neutral-500 font-bold mt-2 uppercase tracking-[0.3em]">External assets detected</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    <ContextMenuOverlay
                        contextMenu={interaction.contextMenu} setContextMenu={interaction.setContextMenu}
                        handleNavigate={handlers.handleNavigate} downloadFile={drive.downloadFile}
                        setRenaming={dialogs.setRenaming} handleStar={handlers.handleStar} setTaggingFile={dialogs.setTaggingFile}
                        shareFile={drive.shareFile} setShowChamberDialog={dialogs.setShowChamberDialog}
                        handleDelete={handlers.handleDelete} isFolder={isFolder} onShared={explorer.fetchFiles}
                    />
                </AnimatePresence>

                <PdfViewer
                    pdfViewer={dialogs.pdfViewer} setPdfViewer={dialogs.setPdfViewer} pdfLoading={dialogs.pdfLoading}
                    downloadFile={drive.downloadFile} accountId={explorer.files.find(f => f.id === dialogs.pdfViewer?.fileId)?.accountId}
                />

                <Dialogs
                    showChamberDialog={dialogs.showChamberDialog} setShowChamberDialog={dialogs.setShowChamberDialog}
                    chamberName={dialogs.chamberName} setChamberName={dialogs.setChamberName} createChamber={drive.createChamber}
                    isSidebarCreateOpen={dialogs.isSidebarCreateOpen} setIsSidebarCreateOpen={dialogs.setIsSidebarCreateOpen}
                    loadingTopFolders={dialogs.loadingTopFolders} topFolders={dialogs.topFolders}
                    newFolderOpen={dialogs.newFolderOpen} setNewFolderOpen={dialogs.setNewFolderOpen}
                    newFolderName={dialogs.newFolderName} setNewFolderName={dialogs.setNewFolderName} handleCreateFolder={handlers.handleCreateFolder}
                    taggingFile={dialogs.taggingFile} setTaggingFile={dialogs.setTaggingFile}
                    newTag={dialogs.newTag} setNewTag={dialogs.setNewTag} handleAddTag={handlers.handleAddTag} handleRemoveTag={handlers.handleRemoveTag}
                    notes={dialogs.notes} setNotes={dialogs.setNotes} handleSaveMetadata={handlers.handleSaveMetadata}
                    renaming={dialogs.renaming} setRenaming={dialogs.setRenaming} handleRename={handlers.handleRename}
                    renameInputRef={dialogs.renameInputRef}
                />
            </div>
        </>
    );
}
