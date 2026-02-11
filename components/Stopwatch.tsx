"use client";

import { useState } from "react";
import { Settings, Plus, LayoutGrid } from "lucide-react";
import { AnimatePresence } from "framer-motion";
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
                <div className="flex items-center justify-between w-full border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-3 h-3 text-neutral-600" />
                        <h2 className="text-[10px] font-bold uppercase text-neutral-600">하는 짓거리</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-2 rounded-lg transition-colors group ${isEditMode ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-600'}`}
                        >
                            <Settings className={`w-4 h-4 group-hover:text-white transition-all ${isEditMode ? 'rotate-90' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowAddTag(!showAddTag)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                        >
                            <Plus className={`w-4 h-4 text-neutral-600 group-hover:text-white transition-transform duration-300 ${showAddTag ? 'rotate-45' : ''}`} />
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
