"use client";

import React, { useState, useRef, useMemo } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger, 
    DialogFooter,
    DialogDescription
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ExportCard } from "./ExportCard";
import { Homework, Subtask } from "../hooks/useHomework";
import { toPng } from "html-to-image";
import { Share2, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";

interface ExportDialogProps {
    homeworks: Homework[];
    tags: any[];
    dailyTimes: Record<string, number>;
    currentTimeMs: number;
    activeTagId: string | null;
    userName?: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ExportDialog({ 
    homeworks, 
    tags, 
    dailyTimes, 
    currentTimeMs, 
    activeTagId,
    userName,
    isOpen,
    onOpenChange 
}: ExportDialogProps) {
    const [comment, setComment] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const completedToday = useMemo(() => {
        const allTasks: any[] = [];
        
        const gather = (rootId: string, rootContent: string, nodes: Subtask[]) => {
            nodes.forEach(n => {
                allTasks.push({ ...n, rootId, rootContent });
                if (n.subtasks && n.subtasks.length > 0) {
                    gather(rootId, rootContent, n.subtasks);
                }
            });
        };

        homeworks.forEach(h => {
             allTasks.push({ ...h, rootId: h.id, rootContent: h.content });
             if (h.subtasks && h.subtasks.length > 0) {
                 gather(h.id, h.content, h.subtasks);
             }
        });
        
        const filtered = allTasks.filter(item => 
            item.is_completed && 
            item.completed_at && 
            item.completed_at.startsWith(todayStr)
        );
        
        // Final deduplication by ID just in case
        const seen = new Set();
        return filtered.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }, [homeworks, todayStr]);

    const timeByTag = useMemo(() => {
        return tags
            .map(tag => {
                const baseTime = dailyTimes[tag.id] || 0;
                const totalMs = activeTagId === tag.id ? currentTimeMs : baseTime;
                return { name: tag.name, color: tag.color, icon: tag.icon, duration: totalMs };
            })
            .filter(t => t.duration > 0)
            .sort((a, b) => b.duration - a.duration);
    }, [tags, dailyTimes, currentTimeMs, activeTagId]);

    const handleExport = async () => {
        if (!exportRef.current) return;
        
        setIsExporting(true);
        try {
            // Wait for fonts to be ready
            if (typeof document !== 'undefined' && 'fonts' in document) {
                await (document as any).fonts.ready;
            }

            // Add a small delay for DOM to settle and styles to apply
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const node = exportRef.current;
            const canvasWidth = 600;
            const canvasHeight = node.offsetHeight;

            // Render the hidden export component and convert to image
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2.5,
                width: canvasWidth,
                height: canvasHeight,
                style: {
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                }
            });
            
            const link = document.createElement('a');
            link.download = `study-summary-${todayStr}.png`;
            link.href = dataUrl;
            link.click();
            
            if (onOpenChange) onOpenChange(false);
        } catch (err) {
            console.error("Failed to export image:", err);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const hasContent = completedToday.length > 0 || timeByTag.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[850px] max-h-[90vh] bg-black border-neutral-900 text-white overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-white" />
                        Generate Achievement Card
                    </DialogTitle>
                    <DialogDescription className="text-neutral-500 text-sm">
                        Export your daily study results in a clean monochrome style.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 border-y border-white/5">
                    {/* Left side: Configuration */}
                    <div className="p-8 space-y-8 bg-white/[0.01]">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-neutral-600 block">Today's Performance</label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-neutral-900">
                                    <span className="text-sm text-neutral-400">Completed Items</span>
                                    <span className={cn("font-mono text-lg", completedToday.length > 0 ? "text-white" : "text-neutral-700")}>
                                        {completedToday.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-neutral-900">
                                    <span className="text-sm text-neutral-400">Focus Duration</span>
                                    <span className={cn("font-mono text-lg", timeByTag.length > 0 ? "text-white" : "text-neutral-700")}>
                                        {Math.floor(timeByTag.reduce((acc, t) => acc + t.duration, 0) / 60000)}m
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-neutral-600 block">Personal Reflection (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write your daily reflection..."
                                className="w-full h-32 bg-white/[0.03] border border-neutral-900 rounded-xl p-4 text-sm font-light focus:outline-none focus:border-neutral-700 transition-all resize-none placeholder:text-neutral-800"
                            />
                        </div>

                        {!hasContent && (
                            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-neutral-600 leading-relaxed">
                                    No completed tasks or study records for today.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right side: Preview */}
                    <div className="relative bg-black flex flex-col border-l border-neutral-900">
                        <div className="p-6 border-b border-neutral-900 bg-white/[0.01]">
                            <label className="text-[10px] font-black uppercase text-neutral-600 block">PREVIEW</label>
                        </div>
                        <div className="flex-1 bg-black relative overflow-hidden">
                           <ScrollArea className="h-full w-full">
                                <div className="p-12 flex justify-center">
                                    <div style={{ zoom: 0.45 }} className="w-[600px] h-fit">
                                        <ExportCard 
                                            date={todayStr}
                                            completedTasks={completedToday}
                                            timeByTag={timeByTag}
                                            comment={comment}
                                            userName={userName}
                                        />
                                    </div>
                                </div>
                           </ScrollArea>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-black flex items-center justify-between sm:justify-between border-t border-neutral-900">
                    <p className="text-[10px] text-neutral-700 font-bold uppercase hidden sm:block">
                        FORMAT: PNG • CHRONICLE v1
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost" 
                            onClick={() => onOpenChange?.(false)}
                            className="text-neutral-500 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-white hover:bg-neutral-200 text-black rounded-none px-8 flex items-center gap-2 h-11 transition-colors uppercase text-[10px] font-black"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? "Exporting..." : "Finalize & Save"}
                        </Button>
                    </div>
                </DialogFooter>

                {/* Hidden Export component for actual image generation (scaled 1:1) */}
                <div 
                    style={{ position: 'fixed', left: '-9999px', top: '0', width: '600px', height: 'auto', zIndex: -100 }} 
                    className="opacity-0 pointer-events-none"
                    aria-hidden="true"
                >
                    <ExportCard 
                        ref={exportRef}
                        date={todayStr}
                        completedTasks={completedToday}
                        timeByTag={timeByTag}
                        comment={comment}
                        userName={userName}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
