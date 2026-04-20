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

    // Glassmorphism version: semi-transparent, blurred background with subtle borders
    return (
        <button
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={`group flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 w-fit h-fit relative isolate overflow-hidden ${isActive
                ? 'scale-[1.03] shadow-lg shadow-black/20'
                : isFocused
                    ? 'scale-[1.02]'
                    : 'scale-100'
                } ${isEditMode ? 'opacity-70' : ''}`}
            style={{
                backgroundColor: isActive 
                    ? `${themeColor}22` 
                    : isFocused ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isActive ? `${themeColor}66` : 'rgba(255, 255, 255, 0.1)'}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            {/* Background Gradient Shine for Active State */}
            {isActive && (
                <div 
                    className="absolute inset-0 -z-10 opacity-30 blur-xl"
                    style={{ background: `radial-gradient(circle at center, ${themeColor}, transparent 70%)` }}
                />
            )}

            {IconComponent ? (
                <IconComponent
                    className={`w-4 h-4 transition-all duration-300 ${isActive ? 'opacity-100 scale-110' : 'opacity-50 group-hover:opacity-80'}`}
                    style={{ 
                        color: themeColor,
                        filter: isActive ? `drop-shadow(0 0 8px ${themeColor}66)` : 'none'
                    }}
                />
            ) : (
                <div
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ 
                        backgroundColor: isActive ? themeColor : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isActive ? `0 0 10px ${themeColor}` : 'none'
                    }}
                />
            )}

            <div className="flex items-baseline gap-2">
                <span
                    className={`text-[14px] font-medium tracking-tight transition-all duration-300 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'}`}
                    style={{
                        textShadow: isActive ? `0 0 12px ${themeColor}44` : 'none'
                    }}
                >
                    {tag.name}
                </span>
                {formattedDailyTime && (
                    <span className={`text-[10px] font-mono tabular-nums tracking-wider opacity-60 ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                        {formattedDailyTime}
                    </span>
                )}
            </div>

            {isEditMode && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center z-10 shadow-md"
                >
                    <Icons.Pencil className="w-2.5 h-2.5" />
                </motion.div>
            )}

            {/* Edge light highlight */}
            <div className={`absolute inset-0 rounded-full border-t border-white/10 pointer-events-none ${isActive ? 'opacity-40' : 'opacity-10'}`} />
        </button>
    );
}
