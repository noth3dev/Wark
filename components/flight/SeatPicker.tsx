"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Tag } from "../../lib/types";

interface SeatPickerProps {
    tags: Tag[];
    selectedTagId: string | null;
    onSelect: (tagId: string) => void;
}

export function SeatPicker({ tags, selectedTagId, onSelect }: SeatPickerProps) {
    const rows = Math.ceil(tags.length / 3);

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden">
                {/* Cockpit header */}
                <div className="flex items-center justify-center gap-3 py-3 border-b border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-500">
                        좌석 배치도 — WArk Air
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>

                {/* Column headers */}
                <div className="flex items-center px-5 pt-3 pb-1">
                    <div className="w-5" />
                    <div className="flex gap-1.5 flex-1">
                        <span className="flex-1 text-center text-[8px] font-bold text-neutral-600">A</span>
                        <span className="flex-1 text-center text-[8px] font-bold text-neutral-600">B</span>
                    </div>
                    <div className="w-5" />
                    <div className="flex gap-1.5 flex-1">
                        <span className="flex-1 text-center text-[8px] font-bold text-neutral-600">C</span>
                    </div>
                </div>

                {/* Seat rows */}
                <div className="px-5 pb-4 space-y-1.5">
                    {Array.from({ length: rows }).map((_, rowIdx) => {
                        const seatLetters = ["A", "B", "C"];
                        const rowTags = tags.slice(rowIdx * 3, rowIdx * 3 + 3);
                        // Pad to 3 with nulls for uniform layout
                        const padded: (Tag | null)[] = [
                            rowTags[0] ?? null,
                            rowTags[1] ?? null,
                            rowTags[2] ?? null,
                        ];

                        return (
                            <div key={rowIdx} className="flex items-center gap-0">
                                {/* Row number */}
                                <span className="w-5 text-[9px] font-mono font-bold text-neutral-600 text-right pr-1.5 flex-shrink-0">
                                    {rowIdx + 1}
                                </span>

                                {/* Left pair: A, B */}
                                <div className="flex gap-1.5 flex-1">
                                    {padded.slice(0, 2).map((tag, seatIdx) => (
                                        <div key={seatIdx} className="flex-1">
                                            {tag ? (
                                                <SeatButton
                                                    tag={tag}
                                                    seatLabel={`${rowIdx + 1}${seatLetters[seatIdx]}`}
                                                    isSelected={selectedTagId === tag.id}
                                                    onClick={() => onSelect(tag.id)}
                                                />
                                            ) : (
                                                <div className="h-14 rounded-lg border border-dashed border-white/5" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Aisle */}
                                <div className="w-5 flex items-center justify-center flex-shrink-0">
                                    <div className="w-px h-10 bg-white/5" />
                                </div>

                                {/* Right: C */}
                                <div className="flex gap-1.5 flex-1">
                                    <div className="flex-1">
                                        {padded[2] ? (
                                            <SeatButton
                                                tag={padded[2]}
                                                seatLabel={`${rowIdx + 1}${seatLetters[2]}`}
                                                isSelected={selectedTagId === padded[2].id}
                                                onClick={() => onSelect(padded[2]!.id)}
                                            />
                                        ) : (
                                            <div className="h-14 rounded-lg border border-dashed border-white/5" />
                                        )}
                                    </div>
                                    {/* Ghost seat to match left pair width */}
                                    <div className="flex-1" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tail */}
                <div className="flex items-center justify-center py-2.5 border-t border-white/5">
                    <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-neutral-700">
                        Emergency Exit ↓
                    </span>
                </div>
            </div>
        </div>
    );
}

function SeatButton({ tag, seatLabel, isSelected, onClick }: {
    tag: Tag; seatLabel: string; isSelected: boolean; onClick: () => void;
}) {
    const IconComponent = tag.icon && (Icons as any)[tag.icon] ? (Icons as any)[tag.icon] : null;
    const color = tag.color || "#22d3ee";

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`w-full h-14 flex flex-col items-center justify-center gap-0.5 rounded-lg border transition-all duration-200 relative overflow-hidden
                ${isSelected ? "border-white/25" : "border-white/5 hover:border-white/15 hover:bg-white/[0.03]"}`}
            style={{
                background: isSelected ? `${color}18` : "rgba(255,255,255,0.02)",
                borderColor: isSelected ? `${color}66` : undefined,
            }}
        >
            {isSelected && (
                <div className="absolute inset-0 opacity-10"
                    style={{ background: `radial-gradient(ellipse at bottom, ${color}, transparent 70%)` }} />
            )}
            {IconComponent ? (
                <IconComponent className="w-3.5 h-3.5" style={{ color: isSelected ? color : "rgba(255,255,255,0.25)" }} />
            ) : (
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: isSelected ? color : "rgba(255,255,255,0.12)" }} />
            )}
            <span className={`text-[9px] font-bold truncate max-w-[90%] leading-none ${isSelected ? "text-white" : "text-neutral-500"}`}>
                {tag.name}
            </span>
            <span className="text-[7px] font-mono text-neutral-600 leading-none">{seatLabel}</span>
        </motion.button>
    );
}
