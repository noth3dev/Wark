"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Settings, Plus, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TimerDisplay } from "./stopwatch/TimerDisplay";
import { TagItem } from "./stopwatch/TagItem";
import { TagModal } from "./stopwatch/TagModal";
import { BottomClock } from "./stopwatch/BottomClock";
import { AddTagForm } from "./stopwatch/AddTagForm";
import { useStopwatch } from "../hooks/useStopwatch";
import { Tag } from "../lib/types";

interface StopwatchProps {
    onSave?: () => void;
}

export default function Stopwatch({ onSave }: StopwatchProps) {
    const {
        time,
        tags,
        activeTagId,
        activeSession,
        dailyTimes,
        groupedDailyTimes,
        handleTagClick,
        addTag,
        updateTag,
        deleteTag
    } = useStopwatch(onSave);

    const [showAddTag, setShowAddTag] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [focusedTagIndex, setFocusedTagIndex] = useState(-1);

    const handleDeleteTag = async (id: string) => {
        if (!confirm("This will permanently decommission this tag and all associated protocol logs. Proceed?")) return;
        await deleteTag(id);
        setEditingTag(null);
    };

    // Keyboard navigation for tags
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (showAddTag || editingTag) return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedTagIndex(prev => (prev + 1) % tags.length);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedTagIndex(prev => (prev - 1 + tags.length) % tags.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (focusedTagIndex !== -1 && tags[focusedTagIndex]) {
                    if (isEditMode) {
                        setEditingTag(tags[focusedTagIndex]);
                    } else {
                        handleTagClick(tags[focusedTagIndex].id);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tags, focusedTagIndex, showAddTag, editingTag, isEditMode, handleTagClick]);

    return (
        <div className="flex flex-col items-center w-full max-w-2xl space-y-8 sm:space-y-16 landscape:space-y-4">
            <TimerDisplay time={time} />

            <div className="w-full space-y-6 sm:space-y-8 flex flex-col items-center px-4 landscape:space-y-4">
                <div className="flex items-center justify-between w-full border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-3 h-3 text-neutral-600" />
                        <h2 className="text-[10px] font-semibold uppercase text-neutral-500">Tags</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-2 rounded-lg transition-colors group ${isEditMode ? 'bg-secondary text-primary' : 'hover:bg-white/5 text-neutral-600'}`}
                        >
                            <Settings className={`w-4 h-4 group-hover:text-neutral-300 transition-all ${isEditMode ? 'rotate-90' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddTag(!showAddTag)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                        >
                            <Plus className={`w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-transform duration-300 ${showAddTag ? 'rotate-45' : ''}`} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showAddTag && (
                        <AddTagForm
                            onAdd={addTag}
                            onClose={() => setShowAddTag(false)}
                        />
                    )}
                </AnimatePresence>

                <div className="flex flex-wrap justify-center gap-3 w-full">
                    {tags.map((tag, idx) => (
                        <TagItem
                            key={tag.id}
                            tag={tag}
                            isActive={activeTagId === tag.id}
                            isEditMode={isEditMode}
                            isFocused={focusedTagIndex === idx}
                            dailyTime={(activeTagId === tag.id && activeSession) ? time : (dailyTimes[tag.id] || 0)}
                            onClick={() => {
                                setFocusedTagIndex(idx);
                                isEditMode ? setEditingTag(tag) : handleTagClick(tag.id);
                            }}
                            onMouseEnter={() => setFocusedTagIndex(idx)}
                        />
                    ))}
                </div>

                {/* Grouped Totals Summary - More compact and modern */}
                {!isEditMode && !showAddTag && Object.keys(groupedDailyTimes).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap justify-center gap-6 pt-8 border-t border-white/5 w-full max-w-lg"
                    >
                        {Object.entries(groupedDailyTimes).map(([key, total]) => {
                            const [icon, color] = key.split('|');
                            if (total === 0) return null;
                            const IconComponent = icon && (Icons as any)[icon] ? (Icons as any)[icon] : null;

                            return (
                                <div key={key} className="flex items-center gap-2.5 group">
                                    <div
                                        className="w-8 h-8 rounded-xl border flex items-center justify-center bg-black/40 transition-colors"
                                        style={{ borderColor: `${color || '#22d3ee'}22`, color: color || '#22d3ee' }}
                                    >
                                        {IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                    </div>
                                    <div className="flex flex-col -space-y-0.5">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neutral-500 transition-colors">Type Total</span>
                                        <span className="text-[11px] font-mono font-bold text-neutral-400 tabular-nums">
                                            {(() => {
                                                const h = Math.floor(total / 3600000);
                                                const m = Math.floor((total % 3600000) / 60000);
                                                return `${h > 0 ? `${h}h ` : ""}${m}m`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {editingTag && (
                    <TagModal
                        tag={editingTag}
                        onClose={() => setEditingTag(null)}
                        onUpdate={updateTag}
                        onDelete={handleDeleteTag}
                    />
                )}
            </AnimatePresence>

            <BottomClock />
        </div>
    );
}
