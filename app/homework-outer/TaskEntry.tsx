"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

interface TaskEntryProps {
    onCommit: (content: string, isAlpha: boolean, tagId: string | null) => void;
    tags: any[];
    onAddTag: (name: string) => Promise<any>;
}

export function TaskEntry({ onCommit, tags, onAddTag }: TaskEntryProps) {
    const [content, setContent] = useState("");
    const [isAlpha, setIsAlpha] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");

    const handleCommit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onCommit(content.trim(), isAlpha, selectedTagId);
            setContent("");
            setIsAlpha(false);
            setSelectedTagId(null);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleCommit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl px-6 h-16 focus-within:border-white/10 transition-all">
                    <Input
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={isAlpha ? "+α Additional Goal..." : "Initiate new objective..."}
                        className="bg-transparent border-0 px-0 text-lg font-suit focus:ring-0 placeholder:text-neutral-800 shadow-none flex-1 font-light"
                    />
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            type="button"
                            onClick={() => setIsAlpha(!isAlpha)}
                            className={cn(
                                "text-[10px] font-black px-2 py-1 rounded-md transition-all border",
                                isAlpha ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "text-neutral-700 border-transparent hover:text-neutral-500"
                            )}
                        >
                            +α
                        </button>
                        <button type="submit" className="text-[10px] font-black text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all uppercase tracking-tighter">
                            Commit
                        </button>
                    </div>
                </div>
            </form>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                 {tags.map(tag => (
                     <button
                         key={tag.id}
                         onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                         className={cn(
                             "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all whitespace-nowrap",
                             selectedTagId === tag.id
                                 ? "bg-white text-black border-white"
                                 : "bg-white/5 border-white/5 text-neutral-500 hover:text-neutral-300 hover:border-white/10"
                         )}
                     >
                         {tag.icon && (Icons as any)[tag.icon] ? (
                             (() => {
                                 const Icon = (Icons as any)[tag.icon];
                                 return <Icon className="w-3 h-3" style={{ color: selectedTagId === tag.id ? undefined : (tag.color || '#22d3ee') }} />;
                             })()
                         ) : (
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedTagId === tag.id ? undefined : (tag.color || '#22d3ee') }} />
                         )}
                         {tag.name}
                     </button>
                 ))}
                 
                 <div className="flex items-center gap-2">
                     {isAddingTag ? (
                         <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                             <input 
                                 autoFocus
                                 value={newTagName}
                                 onChange={e => setNewTagName(e.target.value)}
                                 onKeyDown={async n => {
                                     if (n.key === 'Enter' && newTagName.trim()) {
                                         const tag = await onAddTag(newTagName.trim());
                                         if (tag) {
                                             setSelectedTagId(tag.id);
                                             setNewTagName("");
                                             setIsAddingTag(false);
                                         }
                                     }
                                 }}
                                 placeholder="Subject Name..."
                                 className="bg-transparent border-0 text-[10px] text-white focus:ring-0 p-0 w-24 placeholder:text-neutral-700 font-suit"
                             />
                             <button onClick={() => setIsAddingTag(false)} className="text-neutral-600 hover:text-white">
                                 <Icons.X className="w-2.5 h-2.5" />
                             </button>
                         </div>
                     ) : (
                         <button 
                             onClick={() => setIsAddingTag(true)}
                             className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-white/10 text-[10px] font-bold text-neutral-700 hover:text-neutral-400 hover:border-white/20 transition-all whitespace-nowrap"
                         >
                             + NEW SUBJECT
                         </button>
                     )}
                 </div>
            </div>
        </div>
    );
}
