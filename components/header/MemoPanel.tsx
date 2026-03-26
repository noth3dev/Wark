"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    StickyNote, X, GripVertical, Maximize2, Minimize2,
    Plus, Trash2, ChevronLeft, FileText
} from "lucide-react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { Block } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useMemos, Memo } from "../../hooks/useMemos";

interface MemoPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

function MemoEditor({
    memo,
    onContentChange,
    onTitleChange,
}: {
    memo: Memo;
    onContentChange: (content: unknown[]) => void;
    onTitleChange: (title: string) => void;
}) {
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [title, setTitle] = useState(memo.title);
    const initializedRef = useRef(false);

    const editor = useCreateBlockNote({
        domAttributes: {
            editor: { class: "memo-blocknote-editor" },
        },
    });

    // Load content when memo changes
    useEffect(() => {
        if (editor && memo.content && Array.isArray(memo.content) && memo.content.length > 0) {
            try {
                editor.replaceBlocks(editor.document, memo.content as Block[]);
            } catch {
                // ignore
            }
        } else if (editor && (!memo.content || (Array.isArray(memo.content) && memo.content.length === 0))) {
            if (!initializedRef.current) {
                initializedRef.current = true;
            }
        }
        setTitle(memo.title);
    }, [memo.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced auto-save
    const handleEditorChange = useCallback(() => {
        if (!editor) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            onContentChange(editor.document as unknown[]);
        }, 800);
    }, [editor, onContentChange]);

    const handleTitleChange = useCallback((newTitle: string) => {
        setTitle(newTitle);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            onTitleChange(newTitle);
        }, 800);
    }, [onTitleChange]);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Title input */}
            <div className="px-4 pt-3 pb-1 shrink-0">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="제목 없음"
                    className="w-full bg-transparent text-[15px] font-semibold text-neutral-200 placeholder:text-neutral-600 outline-none border-none"
                />
            </div>
            {/* Editor */}
            <div className="flex-1 min-h-0 overflow-y-auto memo-editor-wrapper">
                <BlockNoteView
                    editor={editor}
                    onChange={handleEditorChange}
                    theme="dark"
                />
            </div>
        </div>
    );
}

function MemoList({
    memos,
    activeMemoId,
    onSelect,
    onCreate,
    onDelete,
}: {
    memos: Memo[];
    activeMemoId: string | null;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onDelete: (id: string) => void;
}) {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "방금";
        if (mins < 60) return `${mins}분 전`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}일 전`;
        return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    };

    return (
        <div className="flex flex-col h-full">
            {/* List header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    노트 ({memos.length})
                </span>
                <button
                    onClick={onCreate}
                    className="p-1 rounded-md text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                    title="새 노트"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* List items */}
            <div className="flex-1 min-h-0 overflow-y-auto memo-editor-wrapper">
                {memos.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-neutral-600">
                        <FileText className="w-8 h-8 opacity-40" />
                        <p className="text-[11px]">노트가 없습니다</p>
                        <button
                            onClick={onCreate}
                            className="text-[11px] text-amber-500 hover:text-amber-400 transition-colors"
                        >
                            + 새 노트 만들기
                        </button>
                    </div>
                )}
                {memos.map((memo) => (
                    <div
                        key={memo.id}
                        onClick={() => onSelect(memo.id)}
                        className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-white/[0.03] transition-all ${
                            memo.id === activeMemoId
                                ? "bg-amber-500/[0.06] border-l-2 border-l-amber-500/40"
                                : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                        }`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-medium truncate ${
                                memo.id === activeMemoId ? "text-amber-300" : "text-neutral-300"
                            }`}>
                                {memo.title || "제목 없음"}
                            </p>
                            <p className="text-[10px] text-neutral-600 mt-0.5">
                                {formatDate(memo.updated_at)}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(memo.id);
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MemoPanel({ isOpen, onClose }: MemoPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showList, setShowList] = useState(false);
    const {
        memos,
        activeMemo,
        activeMemoId,
        setActiveMemoId,
        loading,
        createMemo,
        updateMemoContent,
        updateMemoTitle,
        deleteMemo,
    } = useMemos();

    const handleContentChange = useCallback(
        (content: unknown[]) => {
            if (activeMemoId) updateMemoContent(activeMemoId, content);
        },
        [activeMemoId, updateMemoContent]
    );

    const handleTitleChange = useCallback(
        (title: string) => {
            if (activeMemoId) updateMemoTitle(activeMemoId, title);
        },
        [activeMemoId, updateMemoTitle]
    );

    const handleCreate = useCallback(async () => {
        await createMemo();
        setShowList(false);
    }, [createMemo]);

    const handleDelete = useCallback(
        async (id: string) => {
            await deleteMemo(id);
        },
        [deleteMemo]
    );

    const handleSelectMemo = useCallback(
        (id: string) => {
            setActiveMemoId(id);
            setShowList(false);
        },
        [setActiveMemoId]
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 12 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    className={`fixed z-[200] ${
                        isExpanded
                            ? "top-16 right-4 w-[600px] h-[70vh]"
                            : "top-16 right-4 w-[380px] h-[420px]"
                    }`}
                    style={{ touchAction: "none" }}
                >
                    <div
                        className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1a1a1a]/95 shadow-2xl"
                        style={{
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            boxShadow:
                                "0 32px 64px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
                        }}
                    >
                        {/* Title bar */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] cursor-move select-none shrink-0">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-600" />

                                {/* Toggle list / back */}
                                <button
                                    onClick={() => setShowList(!showList)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-[11px] font-medium ${
                                        showList
                                            ? "bg-amber-500/10 text-amber-400"
                                            : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06]"
                                    }`}
                                >
                                    {showList ? (
                                        <ChevronLeft className="w-3 h-3" />
                                    ) : (
                                        <StickyNote className="w-3 h-3 text-amber-400/80" />
                                    )}
                                    <span className="uppercase tracking-widest">
                                        {showList ? "돌아가기" : "메모"}
                                    </span>
                                </button>

                                {!showList && (
                                    <span className="text-[10px] text-neutral-600 font-mono">
                                        {memos.length}개
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {!showList && (
                                    <button
                                        onClick={handleCreate}
                                        className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                        title="새 노트"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06] transition-all"
                                >
                                    {isExpanded ? (
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-h-0 flex">
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-neutral-700 border-t-amber-500 rounded-full animate-spin" />
                                </div>
                            ) : showList ? (
                                <MemoList
                                    memos={memos}
                                    activeMemoId={activeMemoId}
                                    onSelect={handleSelectMemo}
                                    onCreate={handleCreate}
                                    onDelete={handleDelete}
                                />
                            ) : activeMemo ? (
                                <MemoEditor
                                    key={activeMemo.id}
                                    memo={activeMemo}
                                    onContentChange={handleContentChange}
                                    onTitleChange={handleTitleChange}
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-600">
                                    <FileText className="w-10 h-10 opacity-30" />
                                    <p className="text-[12px]">노트가 없습니다</p>
                                    <button
                                        onClick={handleCreate}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-medium hover:bg-amber-500/15 transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                        새 노트
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
