"use client";

import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface TagItemProps {
    tag: { id: string; name: string; color?: string; icon?: string };
    isActive: boolean;
    isEditMode: boolean;
    onClick: () => void;
}

export function TagItem({ tag, isActive, isEditMode, onClick }: TagItemProps) {
    const themeColor = tag.color || '#22d3ee';
    const IconComponent = tag.icon && (Icons as any)[tag.icon] ? (Icons as any)[tag.icon] : null;

    return (
        <button
            onClick={onClick}
            className={`group flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all duration-300 w-fit h-fit relative ${isActive
                ? 'shadow-xl scale-105'
                : 'bg-transparent border-white/5 hover:border-white/20 hover:bg-white/[0.03] hover:scale-105 active:scale-95'
                } ${isEditMode ? 'opacity-80' : ''}`}
            style={{
                borderColor: isActive ? themeColor : undefined,
                backgroundColor: isActive ? `${themeColor}1a` : undefined,
            }}
        >
            {IconComponent ? (
                <IconComponent
                    className={`w-3.5 h-3.5 transition-all duration-300 ${isActive ? 'text-white' : 'text-neutral-500'}`}
                    style={{
                        filter: isActive ? `drop-shadow(0 0 8px ${themeColor}80)` : 'none'
                    }}
                />
            ) : (
                <div
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-white' : 'bg-neutral-600'}`}
                    style={{
                        boxShadow: isActive ? `0 0 10px ${themeColor}` : 'none'
                    }}
                />
            )}
            <span className={`text-[13px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
                {tag.name}
            </span>

            {isEditMode && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center shadow-lg z-10"
                >
                    <Icons.Pencil className="w-2.5 h-2.5" />
                </motion.div>
            )}

            {isActive && (
                <motion.div
                    layoutId="active-glow"
                    className="absolute -inset-[2px] rounded-full border-2 border-white/20 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </button>
    );
}
