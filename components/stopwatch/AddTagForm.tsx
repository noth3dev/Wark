"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface AddTagFormProps {
    onAdd: (name: string) => Promise<any>;
    onClose: () => void;
}

export function AddTagForm({ onAdd, onClose }: AddTagFormProps) {
    const [newTagName, setNewTagName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        const result = await onAdd(newTagName);
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
            className="flex gap-2 w-full overflow-hidden"
        >
            <input
                autoFocus
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Initialize new tag..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-suit"
            />
            <button type="submit" className="px-6 py-3 bg-white text-black text-[10px] font-bold rounded-xl hover:bg-neutral-200 transition-colors uppercase tracking-widest">
                Add
            </button>
        </motion.form>
    );
}
