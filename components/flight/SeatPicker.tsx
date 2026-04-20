"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import * as Icons from "lucide-react";
import { Tag } from "../../lib/types";

interface SeatPickerProps {
    tags: Tag[];
    selectedTagId: string | null;
    onSelect: (tagId: string) => void;
}

export function SeatPicker({ tags, selectedTagId, onSelect }: SeatPickerProps) {
    const rows = Math.ceil(tags.length / 4);

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Column headers */}
            <div className="flex items-center justify-between px-4 pb-2">
                <div className="flex gap-2 w-[88px]">
                    <span className="flex-1 text-center text-[9px] font-mono font-bold text-neutral-600">A</span>
                    <span className="flex-1 text-center text-[9px] font-mono font-bold text-neutral-600">C</span>
                </div>
                <div className="w-8" />
                <div className="flex gap-2 w-[88px]">
                    <span className="flex-1 text-center text-[9px] font-mono font-bold text-neutral-600">D</span>
                    <span className="flex-1 text-center text-[9px] font-mono font-bold text-neutral-600">F</span>
                </div>
            </div>

            {/* Seat rows */}
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, rowIdx) => {
                    const rowTags = tags.slice(rowIdx * 4, rowIdx * 4 + 4);
                    const padded: (Tag | null)[] = [
                        rowTags[0] ?? null,
                        rowTags[1] ?? null,
                        rowTags[2] ?? null,
                        rowTags[3] ?? null,
                    ];

                    return (
                        <div key={rowIdx} className="flex items-center justify-between px-4">
                            {/* Left: A, C */}
                            <div className="flex gap-2">
                                {padded.slice(0, 2).map((tag, sIdx) => (
                                    <div key={sIdx}>
                                        {tag ? (
                                            <SeatButton
                                                tag={tag}
                                                isSelected={selectedTagId === tag.id}
                                                onClick={() => onSelect(tag.id)}
                                            />
                                        ) : (
                                            <EmptySeat />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Row number */}
                            <div className="text-[11px] font-mono font-bold text-neutral-700 w-8 text-center">
                                {(rowIdx + 1).toString().padStart(2, "0")}
                            </div>

                            {/* Right: D, F */}
                            <div className="flex gap-2">
                                {padded.slice(2, 4).map((tag, sIdx) => (
                                    <div key={sIdx}>
                                        {tag ? (
                                            <SeatButton
                                                tag={tag}
                                                isSelected={selectedTagId === tag.id}
                                                onClick={() => onSelect(tag.id)}
                                            />
                                        ) : (
                                            <EmptySeat />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptySeat() {
    return (
        <div className="w-10 h-10 rounded-t-[8px] rounded-b-[4px] bg-[#1a1a1a] border border-white/[0.04] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" />
    );
}

function SeatButton({ tag, isSelected, onClick }: {
    tag: Tag; isSelected: boolean; onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const IconComponent = tag.icon && (Icons as any)[tag.icon] ? (Icons as any)[tag.icon] : null;
    const color = tag.color || "#22d3ee";

    return (
        <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClick}
                className="relative w-10 h-10 rounded-t-[8px] rounded-b-[4px] transition-all duration-300 flex items-center justify-center overflow-hidden"
                style={{
                    background: isSelected
                        ? `linear-gradient(to bottom, ${color}, ${color}99)`
                        : "#1e1e1e",
                    border: isSelected ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.05)",
                    boxShadow: isSelected
                        ? `0 0 16px ${color}50`
                        : "inset 0 2px 4px rgba(0,0,0,0.6)",
                }}
            >
                {/* Headrest */}
                <div
                    className="absolute top-0 left-[15%] right-[15%] h-[3px] rounded-b-sm"
                    style={{ background: isSelected ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)" }}
                />
                {IconComponent && (
                    <IconComponent
                        className="w-3.5 h-3.5"
                        style={{ color: isSelected ? "#000" : "rgba(255,255,255,0.2)" }}
                    />
                )}
            </motion.button>

            {/* Tooltip on hover or selected */}
            {(hovered || isSelected) && (
                <motion.div
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
                >
                    <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: isSelected ? color : "#aaa" }}>
                        {tag.name}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
