"use client";

import * as Icons from "lucide-react";
import { motion } from "framer-motion";

import { Tag } from "../../lib/types";

interface TagItemProps {
    tag: Tag;
    isActive: boolean;
    isEditMode: boolean;
    isFocused?: boolean;
    dailyTime: number;
    onClick: () => void;
    onMouseEnter?: () => void;
}

export function TagItem({ tag, isActive, isEditMode, isFocused, dailyTime, onClick, onMouseEnter }: TagItemProps) {
    const themeColor = tag.color || '#22d3ee';
    const IconComponent = tag.icon && (Icons as any)[tag.icon] ? (Icons as any)[tag.icon] : null;

    const formatTimeShort = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        if (h === 0 && m === 0) return "";
        return `${h > 0 ? `${h}h ` : ""}${m}m`;
    };

    const formattedDailyTime = formatTimeShort(dailyTime);

    // Matte version of the original design: keep shape and colors, remove glows/gradients
    return (
        <button
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={`group flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all duration-200 w-fit h-fit relative ${isActive
                ? 'scale-[1.02]'
                : isFocused
                    ? 'bg-white/5 border-white/20 scale-[1.02]'
                    : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                } ${isEditMode ? 'opacity-70' : ''}`}
            style={{
                borderColor: isActive ? themeColor : undefined,
                backgroundColor: isActive ? `${themeColor}22` : undefined, // Subtle matte background
            }}
        >
            {IconComponent ? (
                <IconComponent
                    className={`w-3.5 h-3.5 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}
                    style={{ color: themeColor }}
                />
            ) : (
                <div
                    className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: isActive ? themeColor : '#404040' }}
                />
            )}
            <div className="flex items-baseline gap-2">
                <span
                    className={`text-[13px] font-semibold transition-colors duration-200 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}
                >
                    {tag.name}
                </span>
                {formattedDailyTime && (
                    <span className={`text-[10px] font-mono tabular-nums opacity-60 ${isActive ? 'text-white' : 'text-neutral-600'}`}>
                        {formattedDailyTime}
                    </span>
                )}
            </div>

            {isEditMode && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full flex items-center justify-center z-10"
                >
                    <Icons.Pencil className="w-2 h-2" />
                </motion.div>
            )}

            {isActive && (
                <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full pointer-events-none border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                />
            )}
        </button>
    );
}
