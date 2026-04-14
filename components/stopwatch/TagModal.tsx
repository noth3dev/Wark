"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { X, Trash2, Check } from "lucide-react";
import { useState } from "react";
import { Tag } from "../../lib/types";

// Keep icons for selection
const ICONS = [
    'Cpu', 'Moon', 'Sun', 'Book', 'Code', 'Coffee', 'Gamepad2', 
    'Music', 'Dumbbell', 'Briefcase', 'Heart', 'Star', 'Camera',
    'PenTool', 'GraduationCap', 'Languages', 'Atom'
];

// Modern, vibrant color palette
const COLORS = [
    '#22d3ee', // Cyan
    '#818cf8', // Indigo
    '#c084fc', // Violet
    '#f472b6', // Pink
    '#fb7185', // Rose
    '#ef4444', // Red
    '#fb923c', // Orange
    '#fbbf24', // Amber
    '#a3e635', // Lime
    '#4ade80', // Green
    '#2dd4bf', // Teal
    '#94a3b8', // Gray
    '#ffffff'  // White
];

interface TagModalProps {
    tag: Tag;
    onClose: () => void;
    onUpdate: (id: string, name: string, color: string, icon: string) => Promise<boolean>;
    onDelete: (id: string) => void;
}

export function TagModal({ tag, onClose, onUpdate, onDelete }: TagModalProps) {
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color || '#22d3ee');
    const [icon, setIcon] = useState(tag.icon || 'Cpu');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">Edit Tag Protocol</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-4 h-4 text-neutral-600" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Tag Identity</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-suit"
                        />
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Color Palette</label>
                        <div className="flex flex-wrap gap-2.5">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && <Check className="w-3 h-3 text-black mx-auto" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Symbol Selection</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ICONS.map(i => {
                                const IconComp = (Icons as any)[i];
                                const isSelected = icon === i;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setIcon(i)}
                                        className={`aspect-square flex items-center justify-center rounded-xl border transition-all ${isSelected ? 'bg-white/10 border-white/20 scale-110' : 'bg-white/5 border-transparent opacity-40 hover:opacity-100'}`}
                                    >
                                        <IconComp className="w-4 h-4" style={{ color: isSelected ? color : undefined }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <button
                        onClick={() => onDelete(tag.id)}
                        className="p-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={async () => {
                            const success = await onUpdate(tag.id, name, color, icon);
                            if (success) onClose();
                        }}
                        className="flex-1 py-4 bg-white text-black text-xs font-bold rounded-2xl hover:bg-neutral-200 transition-colors uppercase tracking-widest"
                    >
                        Commit Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
