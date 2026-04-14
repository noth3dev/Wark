"use client";

import React from "react";
import { formatDuration } from "../lib/utils";
import { Check } from "lucide-react";
import * as Icons from "lucide-react";

interface ExportCardProps {
    date: string;
    completedTasks: any[];
    timeByTag: { name: string; color: string; icon?: string; duration: number }[];
    timeByGroup: { name: string; color: string; icon?: string; duration: number }[];
    comment?: string;
    userName?: string;
}

export const ExportCard = React.forwardRef<HTMLDivElement, ExportCardProps>(
    ({ date, completedTasks, timeByTag, timeByGroup = [], comment, userName }, ref) => {
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
                                <span className="text-[10px] font-black uppercase text-neutral-500">리포트</span>
                            </div>
                            <h1 className="text-4xl font-semibold leading-none whitespace-nowrap">
                                {new Date(date).toLocaleDateString("en-US", { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric'
                                })}
                            </h1>
                            <p className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                                {new Date(date).toLocaleDateString("ko-KR", { weekday: 'long' })} 한일
                            </p>
                        </div>
                        <div className="text-right shrink-0 ml-12">
                             <span className="text-[56px] font-mono font-light text-neutral-800 leading-none whitespace-nowrap">
                                {String(new Date(date).getDate()).padStart(2, '0')}
                             </span>
                        </div>
                    </div>
                    
                    <div className="h-px w-full bg-neutral-900" />
                </header>

                <div className="mt-16 space-y-16">
                    {/* Time Summary Metrics */}
                    {(timeByTag.length > 0 || timeByGroup.length > 0) && (
                        <section className="space-y-12">
                            {timeByTag.length > 0 && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[10px] font-black uppercase text-neutral-500">TAG DISTRIBUTION</h2>
                                        <span className="text-[10px] font-mono text-neutral-700">TOTAL: {formatDuration(totalMs)}</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {timeByTag.map((t, idx) => {
                                            const IconComponent = t.icon && (Icons as any)[t.icon] ? (Icons as any)[t.icon] : null;
                                            const color = t.color || '#ffffff';
                                            
                                            return (
                                                <div key={idx} className="group flex items-center justify-between border-b border-neutral-900 pb-5 last:border-0">
                                                    <div className="flex items-center gap-6 min-w-0">
                                                        <div 
                                                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 shrink-0"
                                                            style={{ borderColor: `${color}33` }}
                                                        >
                                                            {IconComponent ? (
                                                                <IconComponent className="w-6 h-6" style={{ color }} />
                                                            ) : (
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                                            )}
                                                        </div>
                                                        <div className="space-y-1 min-w-0">
                                                            <span className="text-[10px] font-bold text-neutral-600 uppercase block leading-tight font-mono whitespace-nowrap">Category</span>
                                                            <span className="text-[15px] font-medium text-neutral-200 uppercase whitespace-nowrap overflow-hidden">
                                                                {t.name.length > 20 ? t.name.slice(0, 20) + '...' : t.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1 shrink-0 ml-12 min-w-[100px]">
                                                        <span className="text-[10px] font-mono text-neutral-700 block leading-tight whitespace-nowrap">DURATION</span>
                                                        <span className="text-2xl font-mono text-white tabular-nums leading-none tracking-tighter">
                                                            {formatDuration(t.duration)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {timeByGroup.length > 0 && (
                                <div className="space-y-8 pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[10px] font-black uppercase text-neutral-500">GROUPED SUMMARY</h2>
                                        <span className="text-[10px] font-black uppercase text-neutral-800">Aggregate View</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        {timeByGroup.map((g, idx) => {
                                             const IconComponent = g.icon && (Icons as any)[g.icon] ? (Icons as any)[g.icon] : null;
                                             return (
                                                <div key={idx} className="p-6 rounded-[24px] bg-white/[0.02] border border-white/[0.03] space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.05]">
                                                            {IconComponent ? (
                                                                <IconComponent className="w-4 h-4" style={{ color: g.color }} />
                                                            ) : (
                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 truncate">{g.name}</span>
                                                    </div>
                                                    <div className="text-2xl font-semibold tracking-tighter tabular-nums leading-none">
                                                        {formatDuration(g.duration)}
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-white/20 rounded-full" style={{ width: `${(g.duration / totalMs) * 100}%` }} />
                                                    </div>
                                                </div>
                                             );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Checklists */}
                    <section className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase text-neutral-500">OBJECTIVES CONCLUDED</h2>
                        
                        <div className="grid grid-cols-1 gap-1">
                            {completedTasks.length > 0 ? (
                                completedTasks.map((task, idx) => (
                                    <div key={idx} className="flex gap-6 py-5 border-t border-neutral-900 first:border-0 items-start">
                                        <div className="w-1 h-1 bg-white rounded-full mt-2.5 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                                        <div className="space-y-1.5 min-w-0">
                                            <p className="text-[15px] text-neutral-200 font-medium leading-relaxed break-words">
                                                {task.content}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {task.is_plus_alpha && (
                                                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white/40 border border-white/5 uppercase">Alpha</span>
                                                )}
                                                {task.path && task.path.length > 1 && (
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        {task.path.slice(0, -1).map((crumb: any, cIdx: number) => (
                                                            <React.Fragment key={cIdx}>
                                                                <span className="text-[10px] text-neutral-600 font-bold uppercase whitespace-nowrap">
                                                                    {crumb}
                                                                </span>
                                                                <Icons.ChevronRight className="w-2.5 h-2.5 text-neutral-800 shrink-0" />
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                )}
                                                {(!task.path || task.path.length <= 1) && task.rootContent && (
                                                    <span className="text-[10px] text-neutral-600 font-bold uppercase block">
                                                        {task.rootContent}
                                                    </span>
                                                )}
                                            </div>
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
