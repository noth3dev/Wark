import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { RepeatTable } from '../../lib/services/repeatService';

interface RepeatTabsProps {
    tables: RepeatTable[];
    activeTableId: string | null;
    onSelect: (id: string) => void;
    onAdd: (name: string) => void;
    onDelete: (id: string) => void;
}

export function RepeatTabs({ tables, activeTableId, onSelect, onAdd, onDelete }: RepeatTabsProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTableName, setNewTableName] = useState('');

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTableName.trim()) {
            onAdd(newTableName.trim());
            setNewTableName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 no-scrollbar border-b border-white/10">
            {tables.map(table => (
                <div
                    key={table.id}
                    onClick={() => onSelect(table.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 whitespace-nowrap
                        ${activeTableId === table.id
                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                        }
                    `}
                >
                    <span className="font-medium tracking-wide">{table.name}</span>
                    {activeTableId === table.id && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(table.id);
                            }}
                            className="p-1 rounded-full hover:bg-white/10 text-rose-400 opacity-60 hover:opacity-100 transition-all"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            ))}

            {isAdding ? (
                <form onSubmit={handleAddSubmit} className="flex flex-shrink-0 items-center">
                    <input
                        autoFocus
                        type="text"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        onBlur={() => setIsAdding(false)}
                        placeholder="Table Name"
                        className="bg-black/50 border border-white/20 text-white rounded-xl px-4 py-2 w-32 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                    />
                </form>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10 hover:border-white/30 border-dashed"
                >
                    <Plus size={18} />
                </button>
            )}
        </div>
    );
}
