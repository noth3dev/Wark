"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slash, Tag as TagIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { getTagColor } from "../../lib/tag-variants";
import { Tag } from "../../lib/types";

interface HabitAddDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, tagId: string | null) => Promise<any>;
    tags: Tag[];
}

export function HabitAddDialog({ isOpen, onClose, onAdd, tags }: HabitAddDialogProps) {
    const [name, setName] = useState("");
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd(name, selectedTagId);
            setName("");
            setSelectedTagId(null);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className="relative w-full max-w-sm bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden font-suit"
                    >
                        <div className="p-8 pb-4">
                            <h2 className="text-[10px] font-black text-neutral-700 uppercase tracking-widest mb-6">Create Ritual</h2>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-bold text-neutral-600 uppercase">Description</p>
                                    <Input 
                                        autoFocus
                                        placeholder="Ritual Name..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-transparent border-0 border-b border-white/10 rounded-none h-12 text-lg focus:ring-0 focus:border-white px-0 placeholder:text-neutral-800"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[9px] font-bold text-neutral-600 uppercase">Associate Tag</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTagId(null)}
                                            className={cn(
                                                "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                                                selectedTagId === null ? "bg-white/5 border-white/20 text-white" : "border-white/5 text-neutral-600 hover:text-neutral-400"
                                            )}
                                        >
                                            <Slash className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">No Tag</span>
                                        </button>
                                        {tags.map(tag => {
                                            const Icon = (tag.icon ? (Icons as any)[tag.icon] : null) || TagIcon;
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => setSelectedTagId(tag.id)}
                                                    className={cn(
                                                        "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                                                        selectedTagId === tag.id ? "bg-white/5 border-white/20 text-white" : "border-white/5 text-neutral-600 hover:text-neutral-400"
                                                    )}
                                                >
                                                    <Icon className="w-3.5 h-3.5" style={{ color: getTagColor(tag.icon) }} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter truncate">{tag.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        className="flex-1 text-[10px] font-black uppercase text-neutral-600"
                                        onClick={onClose}
                                    >
                                        Dismiss
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="flex-1 bg-white text-black hover:bg-neutral-200 text-[10px] font-black uppercase rounded-xl"
                                        disabled={!name.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? "Establishing..." : "Establish"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
