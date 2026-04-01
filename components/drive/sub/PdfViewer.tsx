import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, ExternalLink, Loader2 } from "lucide-react";

interface PdfViewerProps {
    pdfViewer: { url: string; name: string; fileId: string, webViewLink?: string } | null;
    setPdfViewer: (v: any) => void;
    pdfLoading: boolean;
    downloadFile: (id: string, name: string, mime: string, accountId?: string) => void;
    accountId?: string;
}

export function PdfViewer({ 
    pdfViewer, setPdfViewer, pdfLoading, downloadFile, accountId 
}: PdfViewerProps) {
    return (
        <>
            {/* ── PDF Loading Indicator ── */}
            <AnimatePresence>
                {pdfLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                            <span className="text-xs text-neutral-400">PDF 로딩 중...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── PDF Viewer ── */}
            <AnimatePresence>
                {pdfViewer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex flex-col"
                    >
                        {/* PDF Toolbar */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-red-400" />
                                </div>
                                <span className="text-sm text-white font-medium truncate">{pdfViewer.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {pdfViewer.webViewLink && (
                                    <button
                                        onClick={() => window.open(pdfViewer.webViewLink!, "_blank")}
                                        className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all"
                                        title="Google Drive에서 열기"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => downloadFile(pdfViewer.fileId, pdfViewer.name, "application/pdf", accountId)}
                                    className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all"
                                    title="다운로드"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <button
                                    onClick={() => setPdfViewer(null)}
                                    className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* PDF Content */}
                        <div className="flex-1 overflow-hidden p-4 md:p-8 flex justify-center bg-neutral-900/40">
                            <iframe
                                src={`${pdfViewer.url}#toolbar=0`}
                                className="w-full max-w-5xl h-full rounded-xl border border-white/10 shadow-2xl bg-white"
                                title="PDF Viewer"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
