"use client";
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { TAG_VARIANTS } from "../../lib/tag-variants";

interface AddTagFormProps {
    onAdd: (name: string, icon?: string, color?: string) => Promise<any>;
    onClose: () => void;
    dbGroups?: any[];
}

export function AddTagForm({ onAdd, onClose, dbGroups = [] }: AddTagFormProps) {
    const [newTagName, setNewTagName] = useState("");
    const groupsToUse = dbGroups.length > 0 ? dbGroups : TAG_VARIANTS;
    const [selectedGroup, setSelectedGroup] = useState(groupsToUse[0] || TAG_VARIANTS[0]);

    // Update selected group if groupsToUse changes
    useEffect(() => {
        if (groupsToUse.length > 0) {
            setSelectedGroup(groupsToUse[0]);
        }
    }, [dbGroups]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        const result = await onAdd(newTagName, selectedGroup.icon, selectedGroup.color);
        if (result) {
            setNewTagName("");
            onClose();
        }
    };

    return (
        <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="w-full overflow-hidden"
        >
            <div className="space-y-4 w-full">
                <div className="flex gap-2 w-full">
                    <input
                        autoFocus
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Initialize new tag..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-suit text-white"
                    />
                    <button type="submit" className="px-6 py-3 bg-white text-black text-[10px] font-bold rounded-xl hover:bg-neutral-200 transition-colors uppercase tracking-widest shrink-0">
                        Add
                    </button>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 px-1">Select Tag Group</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                        {groupsToUse.map(variant => {
                            const IconComp = (Icons as any)[variant.icon] || Icons.HelpCircle;
                            const isSelected = selectedGroup.icon === variant.icon;
                            // Predefined uses .label, DB row uses .name
                            const labelText = variant.label || variant.name;
                            return (
                                <button
                                    key={variant.icon}
                                    type="button"
                                    onClick={() => setSelectedGroup(variant)}
                                    className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all group ${
                                        isSelected 
                                            ? 'bg-white/10 border-white/20 scale-105' 
                                            : 'bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'
                                    }`}
                                    title={labelText}
                                >
                                    <IconComp className="w-4 h-4" style={{ color: variant.color }} />
                                    <span className="text-[8px] font-bold text-neutral-400 truncate max-w-full">{labelText}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.form>
    );
}
