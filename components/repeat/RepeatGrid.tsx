import React, { useState } from 'react';
import { Plus, X, Minus, ListPlus } from 'lucide-react';
import { RepeatTable } from '../../lib/services/repeatService';

interface RepeatGridProps {
    table: RepeatTable;
    onAddRow: (name: string) => void;
    onDeleteRow: (id: string) => void;
    onAddColumn: (name: string, color?: string) => void;
    onDeleteColumn: (id: string) => void;
    onIncrement: (rowId: string, colId: string, delta: number) => void;
    onBulkColumnIncrement: (colId: string, delta?: number) => void;
    onBulkRowIncrement: (rowId: string, delta?: number) => void;
}

export function RepeatGrid({
    table,
    onAddRow,
    onDeleteRow,
    onAddColumn,
    onDeleteColumn,
    onIncrement,
    onBulkColumnIncrement,
    onBulkRowIncrement
}: RepeatGridProps) {
    const { rows = [], columns = [], data = {} } = table.state || {};
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [isBulkAddingRow, setIsBulkAddingRow] = useState(false);
    const [newRowName, setNewRowName] = useState('');
    const [isAddingCol, setIsAddingCol] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [newColColor, setNewColColor] = useState('#3b82f6');
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#737373'];

    const handleAddRowSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newRowName.trim()) {
            onAddRow(newRowName.trim());
            setNewRowName('');
            setIsAddingRow(false);
            setIsBulkAddingRow(false);
        }
    };

    const handleAddColSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newColName.trim()) {
            onAddColumn(newColName.trim(), newColColor);
            setNewColName('');
            setIsAddingCol(false);
        }
    };

    return (
        <div className="w-full overflow-x-auto pb-8 relative custom-scrollbar">
            <div className="min-w-fit flex flex-col gap-2">
                {/* Header Row (Columns) */}
                <div className="flex z-10 gap-2 mb-2">
                    {/* Top-left empty block */}
                    <div className="w-40 sm:w-48 flex-shrink-0 bg-transparent flex items-end pb-2">
                        <span className="text-white/30 text-xs font-semibold tracking-wider uppercase">Categories \ Targets</span>
                    </div>

                    {/* Columns */}
                    {columns.map(col => {
                        const colColor = col.color || '#3b82f6';
                        return (
                            <div key={col.id} className="w-24 sm:w-32 flex-shrink-0 flex flex-col items-center justify-end group">
                                <div className="w-full flex justify-between items-center bg-white/5 border-t-2 border-x border-white/10 rounded-t-xl px-3 py-2" style={{ borderTopColor: colColor }}>
                                    <span className="text-white/80 font-medium text-sm truncate" title={col.name}>{col.name}</span>
                                    <button
                                        onClick={() => onDeleteColumn(col.id)}
                                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Column Button */}
                    <div className="w-24 sm:w-32 flex-shrink-0 flex items-end">
                        {isAddingCol ? (
                            <form onSubmit={handleAddColSubmit} className="w-full bg-[#111] border border-white/20 rounded-t-xl p-2 flex flex-col gap-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newColName}
                                    onChange={(e) => setNewColName(e.target.value)}
                                    placeholder="Col Name"
                                    className="w-full bg-black/50 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:bg-white/10"
                                />
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewColColor(c)}
                                            className={`w-3 h-3 rounded-full transition-transform ${newColColor === c ? 'scale-125 ring-1 ring-white' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <button type="submit" className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] py-1 rounded transition-colors">Add</button>
                                    <button type="button" onClick={() => setIsAddingCol(false)} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] py-1 rounded transition-colors">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsAddingCol(true)}
                                className="w-full flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-t-xl px-3 py-2 text-white/40 hover:text-white/80 transition-all text-sm"
                            >
                                <Plus size={14} /> Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Rows Area */}
                {rows.map(row => (
                    <div key={row.id} className="flex gap-2 group/row items-center">
                        {/* Row Header */}
                        <div className="w-40 sm:w-48 flex-shrink-0 flex items-center justify-between group/rowheader bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <span className="text-white/90 font-medium text-sm truncate" title={row.name}>{row.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/rowheader:opacity-100 transition-opacity bg-black/20 rounded p-0.5">
                                <button
                                    onClick={() => onBulkRowIncrement(row.id, 1)}
                                    className="text-white/30 hover:text-blue-400 p-0.5 rounded hover:bg-white/10 transition-colors"
                                    title="+1 All Columns"
                                >
                                    <Plus size={12} />
                                </button>
                                <button
                                    onClick={() => onDeleteRow(row.id)}
                                    className="text-rose-400/60 hover:text-rose-400 p-0.5 rounded hover:bg-white/10 transition-colors"
                                    title="Delete Row"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Row Cells */}
                        {columns.map(col => {
                            const count = data?.[row.id]?.[col.id] || 0;
                            return (
                                <div key={col.id} className="w-24 sm:w-32 flex-shrink-0 flex items-stretch">
                                    <div className="w-full relative flex items-center justify-center rounded-lg overflow-hidden bg-black/40 border border-white/5 hover:border-white/20 transition-all group/cell shadow-inner">
                                        <button
                                            onClick={() => onIncrement(row.id, col.id, -1)}
                                            className="absolute left-0 top-0 bottom-0 px-2 opacity-0 group-hover/cell:opacity-100 hover:bg-white/10 text-white/40 hover:text-white transition-all active:bg-white/20"
                                            disabled={count === 0}
                                        >
                                            <Minus size={14} />
                                        </button>

                                        <div
                                            className="flex-1 h-full py-2 flex items-center justify-center cursor-pointer select-none"
                                            onClick={() => onIncrement(row.id, col.id, 1)}
                                        >
                                            <span className={`text-lg font-semibold font-mono tracking-tight transition-colors duration-200
                                                ${count > 0 ? 'text-blue-400' : 'text-white/20'}
                                            `}>
                                                {count}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => onIncrement(row.id, col.id, 1)}
                                            className="absolute right-0 top-0 bottom-0 px-2 opacity-0 group-hover/cell:opacity-100 hover:bg-white/10 text-white/40 hover:text-white transition-all active:bg-white/20"
                                        >
                                            <Plus size={14} />
                                        </button>

                                        {/* Subtle background highlight when count > 0 */}
                                        {count > 0 && (
                                            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Add Row Buttons */}
                <div className="flex gap-2 mt-2">
                    <div className="w-40 sm:w-48 flex-shrink-0 flex flex-col gap-2">
                        {isAddingRow ? (
                            <form onSubmit={handleAddRowSubmit} className="w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newRowName}
                                    onChange={(e) => setNewRowName(e.target.value)}
                                    placeholder="Add Single Row"
                                    className="w-full bg-[#111] border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/40"
                                />
                                <div className="flex gap-1 mt-1">
                                    <button type="submit" className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[11px] py-1.5 rounded-lg transition-colors">Add</button>
                                    <button type="button" onClick={() => setIsAddingRow(false)} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] py-1.5 rounded-lg transition-colors">Cancel</button>
                                </div>
                            </form>
                        ) : isBulkAddingRow ? (
                            <form onSubmit={handleAddRowSubmit} className="w-full">
                                <textarea
                                    autoFocus
                                    value={newRowName}
                                    onChange={(e) => setNewRowName(e.target.value)}
                                    placeholder="Paste multi-line here..."
                                    className="w-full bg-[#111] border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-white/40 min-h-[80px] resize-y text-sm"
                                />
                                <div className="flex gap-1 mt-1">
                                    <button type="submit" className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium text-[11px] py-1.5 rounded-lg transition-colors">Add All</button>
                                    <button type="button" onClick={() => setIsBulkAddingRow(false)} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] py-1.5 rounded-lg transition-colors">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => { setIsAddingRow(true); setIsBulkAddingRow(false); setNewRowName(''); }}
                                    className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg py-2 text-white/40 hover:text-white/80 transition-all text-xs font-medium uppercase tracking-wider"
                                >
                                    <Plus size={14} /> Add Row
                                </button>
                                <button
                                    onClick={() => { setIsBulkAddingRow(true); setIsAddingRow(false); setNewRowName(''); }}
                                    className="w-10 flex-shrink-0 flex items-center justify-center bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 border-dashed rounded-lg py-2 text-blue-400/60 hover:text-blue-400 transition-all"
                                    title="Bulk Add Rows"
                                >
                                    <ListPlus size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
