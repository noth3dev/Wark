"use client";

import React from "react";
import { formatDuration } from "../lib/utils";
import { Check } from "lucide-react";
import * as Icons from "lucide-react";

interface ExportCardProps {
    date: string;
    completedTasks: any[];
    timeByTag: { name: string; color: string; icon?: string; duration: number }[];
    comment?: string;
    userName?: string;
}

export const ExportCard = React.forwardRef<HTMLDivElement, ExportCardProps>(
    ({ date, completedTasks, timeByTag, comment, userName }, ref) => {
        const totalMs = timeByTag.reduce((acc, t) => acc + t.duration, 0);
        
        return (
            <div
                ref={ref}
                className="w-[600px] bg-black text-white p-12 border border-neutral-900 relative font-suit selection:bg-white selection:text-black overflow-hidden"
            >
                {/* Header Section */}
                <header className="space-y-10">
                    <div className="flex justify-between items-start">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-white" />
                                <span className="text-[10px] font-black uppercase text-neutral-500">CHRONICLE</span>
                            </div>
                            <h1 className="text-4xl font-semibold leading-none">
                                {new Date(date).toLocaleDateString("en-US", { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric'
                                })}
                            </h1>
                            <p className="text-xs text-neutral-500 font-medium">
                                {new Date(date).toLocaleDateString("ko-KR", { weekday: 'long' })} achievement report summary.
                            </p>
                        </div>
                        <div className="text-right">
                             <span className="text-[56px] font-mono font-light text-neutral-800 leading-none">
                                {String(new Date(date).getDate()).padStart(2, '0')}
                             </span>
                        </div>
                    </div>
                    
                    <div className="h-px w-full bg-neutral-900" />
                </header>

                <div className="mt-16 space-y-16">
                    {/* Time Summary Metrics */}
                    {timeByTag.length > 0 && (
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase text-neutral-500">FOCUS DISTRIBUTION</h2>
                                <span className="text-[10px] font-mono text-neutral-700">TOTAL: {formatDuration(totalMs)}</span>
                            </div>
                            
                            <div className="space-y-4">
                                {timeByTag.map((t, idx) => {
                                    const IconComponent = t.icon && (Icons as any)[t.icon] ? (Icons as any)[t.icon] : null;
                                    const color = t.color || '#ffffff';
                                    
                                    return (
                                        <div key={idx} className="group flex items-center justify-between border-b border-neutral-900 pb-4 last:border-0">
                                            <div className="flex items-center gap-5">
                                                <div 
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5"
                                                    style={{ borderColor: `${color}33` }}
                                                >
                                                    {IconComponent ? (
                                                        <IconComponent className="w-5 h-5" style={{ color }} />
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-xs font-bold text-neutral-600 uppercase block leading-none">Category</span>
                                                    <span className="text-sm font-medium text-neutral-200 uppercase">{t.name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-0.5">
                                                <span className="text-[10px] font-mono text-neutral-700 block leading-none">DURATION</span>
                                                <span className="text-xl font-mono text-white tabular-nums">
                                                    {formatDuration(t.duration)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Checklists */}
                    <section className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase text-neutral-500">OBJECTIVES CONCLUDED</h2>
                        
                        <div className="grid grid-cols-1 gap-1">
                            {completedTasks.length > 0 ? (
                                completedTasks.map((task, idx) => (
                                    <div key={idx} className="flex gap-6 py-4 border-t border-neutral-900 first:border-0 items-start">
                                        <Check className="w-3.5 h-3.5 text-white mt-1 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm text-neutral-200 font-medium leading-snug">
                                                {task.content}
                                            </p>
                                            {task.rootContent && (
                                                <span className="text-[9px] text-neutral-600 font-bold uppercase block">
                                                    {task.rootContent}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 border-t border-neutral-900 text-center">
                                    <p className="text-[11px] text-neutral-800 font-bold uppercase">OPERATIONAL VOID</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Reflection */}
                    {comment && (
                        <section className="space-y-6 pt-10 border-t border-neutral-900">
                             <h2 className="text-[10px] font-black uppercase text-neutral-500">NOTES & REFLECTIONS</h2>
                             <div className="text-lg font-light text-neutral-400 leading-relaxed border-l border-neutral-700 pl-8">
                                {comment}
                             </div>
                        </section>
                    )}
                </div>
            </div>
        );
    }
);

ExportCard.displayName = "ExportCard";
