import { useState, useEffect, useCallback } from "react";
import { repeatService, RepeatTable, RepeatState } from "../lib/services/repeatService";

export function useRepeats(userId: string | undefined) {
    const [tables, setTables] = useState<RepeatTable[]>([]);
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTables = useCallback(async () => {
        if (!userId) return;
        try {
            setIsLoading(true);
            const fetchedTables = await repeatService.getTables(userId);
            setTables(fetchedTables);
            if (fetchedTables.length > 0 && !activeTableId) {
                setActiveTableId(fetchedTables[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch repeat tables:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, activeTableId]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const activeTable = tables.find(t => t.id === activeTableId);

    const handleAddTable = async (name: string) => {
        if (!userId || !name.trim()) return;
        try {
            const newTable = await repeatService.addTable(userId, name);
            setTables(prev => [...prev, newTable]);
            setActiveTableId(newTable.id);
        } catch (error) {
            console.error("Failed to add table:", error);
            throw error;
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm("Are you sure you want to delete this table?")) return;
        try {
            await repeatService.deleteTable(id);
            setTables(prev => prev.filter(t => t.id !== id));
            if (activeTableId === id) {
                const remaining = tables.filter(t => t.id !== id);
                setActiveTableId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch (error) {
            console.error("Failed to delete table:", error);
            throw error;
        }
    };

    const updateActiveTableState = async (newState: RepeatState) => {
        if (!activeTableId) return;

        // Optimistic update
        setTables(prev => prev.map(t =>
            t.id === activeTableId ? { ...t, state: newState } : t
        ));

        try {
            await repeatService.updateTableState(activeTableId, newState);
        } catch (error) {
            console.error("Failed to update table state:", error);
            // Revert changes could be implemented here
            fetchTables();
        }
    };

    const handleAddRow = (names: string) => {
        if (!activeTable || !names.trim()) return;
        const newState = { ...activeTable.state };
        newState.rows = newState.rows || [];
        newState.data = newState.data || {};

        const lines = names.split(/\r?\n/).map(n => n.trim()).filter(Boolean);

        lines.forEach((name, index) => {
            const newId = `row_${Date.now()}_${index}`;
            newState.rows.push({ id: newId, name });
            newState.data[newId] = {};
        });

        updateActiveTableState(newState);
    };

    const handleDeleteRow = (rowId: string) => {
        if (!activeTable) return;
        if (!confirm("Delete this row?")) return;
        const newState = { ...activeTable.state };
        newState.rows = newState.rows.filter(r => r.id !== rowId);
        const newData = { ...newState.data };
        delete newData[rowId];
        newState.data = newData;
        updateActiveTableState(newState);
    };

    const handleAddColumn = (name: string, color?: string) => {
        if (!activeTable || !name.trim()) return;
        const newState = { ...activeTable.state };
        const newId = `col_${Date.now()}`;
        newState.columns = [...(newState.columns || []), { id: newId, name, color: color || '#3b82f6' }];
        updateActiveTableState(newState);
    };

    const handleDeleteColumn = (colId: string) => {
        if (!activeTable) return;
        if (!confirm("Delete this column?")) return;
        const newState = { ...activeTable.state };
        newState.columns = newState.columns.filter(c => c.id !== colId);
        const newData = { ...newState.data };
        Object.keys(newData).forEach(rowId => {
            delete newData[rowId][colId];
        });
        newState.data = newData;
        updateActiveTableState(newState);
    };

    const handleIncrement = (rowId: string, colId: string, delta: number = 1) => {
        if (!activeTable) return;
        const newState = { ...activeTable.state };
        newState.data = { ...newState.data };
        newState.data[rowId] = { ...newState.data[rowId] };

        const currentValue = newState.data[rowId][colId] || 0;
        const nextValue = Math.max(0, currentValue + delta);

        newState.data[rowId][colId] = nextValue;
        updateActiveTableState(newState);
    };

    const handleBulkColumnIncrement = (colId: string, delta: number = 1) => {
        if (!activeTable || !activeTable.state.rows) return;
        const newState = { ...activeTable.state };
        newState.data = { ...newState.data };

        activeTable.state.rows.forEach(row => {
            const rowId = row.id;
            newState.data[rowId] = { ...newState.data[rowId] };
            const currentValue = newState.data[rowId]?.[colId] || 0;
            newState.data[rowId][colId] = Math.max(0, currentValue + delta);
        });

        updateActiveTableState(newState);
    };

    const handleBulkRowIncrement = (rowId: string, delta: number = 1) => {
        if (!activeTable || !activeTable.state.columns) return;
        const newState = { ...activeTable.state };
        newState.data = { ...newState.data };
        newState.data[rowId] = { ...newState.data[rowId] };

        activeTable.state.columns.forEach(col => {
            const colId = col.id;
            const currentValue = newState.data[rowId]?.[colId] || 0;
            newState.data[rowId][colId] = Math.max(0, currentValue + delta);
        });

        updateActiveTableState(newState);
    };

    return {
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
    };
}
