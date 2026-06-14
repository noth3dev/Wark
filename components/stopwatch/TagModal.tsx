"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { X, Trash2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Tag } from "../../lib/types";

import { TAG_VARIANTS } from "../../lib/tag-variants";

interface TagModalProps {
    tag: Tag;
    dbGroups?: any[];
    onClose: () => void;
    onUpdate: (id: string, name: string, color: string, icon: string) => Promise<boolean>;
    onDelete: (id: string) => void;
}

export function TagModal({ tag, dbGroups = [], onClose, onUpdate, onDelete }: TagModalProps) {
    const groupsToUse = dbGroups.length > 0 ? dbGroups : TAG_VARIANTS;
    const hasValidGroup = groupsToUse.some(g => g.icon === tag.icon);
    const defaultGroup = groupsToUse[0] || { icon: 'Cpu', color: '#22d3ee' };

    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(hasValidGroup ? (tag.color || defaultGroup.color) : defaultGroup.color);
    const [icon, setIcon] = useState(hasValidGroup ? (tag.icon || defaultGroup.icon) : defaultGroup.icon);

    useEffect(() => {
        const groups = dbGroups.length > 0 ? dbGroups : TAG_VARIANTS;
        const valid = groups.some(g => g.icon === tag.icon);
        if (!valid && groups.length > 0) {
            setIcon(groups[0].icon);
            setColor(groups[0].color);
        } else if (valid) {
            // Check if tag.color is different from the group's color, if so, we should probably update it to the group's color
            const group = groups.find(g => g.icon === tag.icon);
            if (group) {
                setIcon(group.icon);
                setColor(group.color);
            }
        }
    }, [dbGroups, tag.icon, tag.color]);

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
                className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
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

                    {/* Group Selection */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 px-1">Assign Tag Group</label>
                        <div className="grid grid-cols-2 gap-2">
                            {groupsToUse.map(variant => {
                                const IconComp = (Icons as any)[variant.icon] || Icons.HelpCircle;
                                const isSelected = icon === variant.icon;
                                const labelText = variant.label || variant.name;
                                return (
                                    <button
                                        key={variant.icon}
                                        type="button"
                                        onClick={() => {
                                            setIcon(variant.icon);
                                            setColor(variant.color);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                                            isSelected 
                                                ? 'bg-white/10 border-white/20 scale-[1.02]' 
                                                : 'bg-white/5 border-transparent opacity-60 hover:opacity-100 hover:bg-white/[0.08]'
                                        }`}
                                    >
                                        <div 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${variant.color}15`, color: variant.color }}
                                        >
                                            <IconComp className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-bold text-neutral-200 truncate">{labelText}</div>
                                            <div className="text-[9px] text-neutral-500 truncate" style={{ color: isSelected ? variant.color : undefined }}>{variant.icon}</div>
                                        </div>
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
