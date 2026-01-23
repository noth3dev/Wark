import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { X, Trash2 } from "lucide-react";

import { useState } from "react";

interface TagModalProps {
    tag: { id: string; name: string; color?: string; icon?: string };
    onClose: () => void;
    onUpdate: (id: string, name: string, color: string, icon: string) => void;
    onDelete: (id: string) => void;
}

const COLORS = [
    '#22d3ee', '#818cf8', '#c084fc', '#f472b6',
    '#fb7185', '#fb923c', '#fbbf24', '#a3e635',
    '#4ade80', '#2dd4bf', '#94a3b8', '#ffffff'
];

const ICONS = [
    'Cpu', 'Moon', 'Sun', 'Book', 'Code', 'Coffee', 'Gamepad2',
    'Music', 'Dumbbell', 'Briefcase', 'Heart', 'Star', 'Camera'
];

export function TagModal({ tag, onClose, onUpdate, onDelete }: TagModalProps) {
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color || '#22d3ee');
    const [icon, setIcon] = useState(tag.icon || 'Moon');

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
                className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">Edit Tag Protocol</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-4 h-4 text-neutral-600" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Tag Identity</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-suit"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Visual Signature</label>
                        <div className="grid grid-cols-6 gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`aspect-square rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Protocol Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ICONS.map(i => {
                                const IconComp = (Icons as any)[i];
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setIcon(i)}
                                        className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all ${icon === i ? 'bg-white/10 border-white/40 scale-110' : 'bg-white/5 border-transparent opacity-40 hover:opacity-100'}`}
                                    >
                                        <IconComp className="w-4 h-4" style={{ color: icon === i ? color : undefined }} />
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
                        onClick={() => onUpdate(tag.id, name, color, icon)}
                        className="flex-1 py-4 bg-white text-black text-xs font-bold rounded-2xl hover:bg-neutral-200 transition-colors uppercase tracking-widest"
                    >
                        Commit Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
