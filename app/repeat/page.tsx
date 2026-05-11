"use client";

import React from "react";
import { useAuth } from "../../lib/auth-context";
import { useRepeats } from "../../hooks/useRepeats";
import { RepeatTabs } from "../../components/repeat/RepeatTabs";
import { RepeatGrid } from "../../components/repeat/RepeatGrid";
import { Activity } from "lucide-react";

export default function RepeatPage() {
    const { user } = useAuth();
    const {
        tables,
        activeTable,
        activeTableId,
        setActiveTableId,
        isLoading,
        handleAddTable,
        handleDeleteTable,
        handleAddRow,
        handleDeleteRow,
        handleAddColumn,
        handleDeleteColumn,
        handleIncrement,
        handleBulkColumnIncrement,
        handleBulkRowIncrement
    } = useRepeats(user?.id);

    if (!user) return null;

    return (
        <main className="h-full bg-[#0a0a0a] text-white overflow-y-auto relative font-suit layout-content-padding">
            <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10 pt-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center space-x-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            <Activity size={14} className="text-blue-400" />
                            <span className="text-xs font-medium text-blue-400 tracking-wide uppercase">Repetitions</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white/90">
                            Repeat
                        </h1>
                        <p className="text-white/40 text-sm sm:text-base font-medium font-mono max-w-xl">
                            Track repetitive tasks across multiple dimensions. Click a cell to increment, use minus to decrement.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="w-full relative">
                        <RepeatTabs
                            tables={tables}
                            activeTableId={activeTableId}
                            onSelect={setActiveTableId}
                            onAdd={handleAddTable}
                            onDelete={handleDeleteTable}
                        />
                        {/* Gradient fade for right edge of scrolling tabs */}
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
                    </div>

                    {/* Content area */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                    ) : activeTable ? (
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl">
                            <RepeatGrid
                                table={activeTable}
                                onAddRow={handleAddRow}
                                onDeleteRow={handleDeleteRow}
                                onAddColumn={handleAddColumn}
                                onDeleteColumn={handleDeleteColumn}
                                onIncrement={handleIncrement}
                                onBulkColumnIncrement={handleBulkColumnIncrement}
                                onBulkRowIncrement={handleBulkRowIncrement}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-[#111] border border-white/5 rounded-2xl text-white/30 space-y-4">
                            <Activity size={48} className="opacity-20" />
                            <p className="font-medium tracking-wide">Add a table to start tracking repeats.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
