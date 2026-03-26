"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

export interface Memo {
    id: string;
    title: string;
    content: unknown[];
    updated_at: string;
    created_at: string;
}

export function useMemos() {
    const { user } = useAuth();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [activeMemoId, setActiveMemoId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch all memos for the user, sorted by most recently updated
    const fetchMemos = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("memos")
                .select("*")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false });

            if (error) throw error;
            setMemos(data || []);

            // Auto-select the most recent memo if none is active
            if (data && data.length > 0 && !activeMemoId) {
                setActiveMemoId(data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch memos:", err);
        } finally {
            setLoading(false);
        }
    }, [user, activeMemoId]);

    useEffect(() => {
        fetchMemos();
    }, [fetchMemos]);

    // Create a new memo
    const createMemo = useCallback(async (title?: string) => {
        if (!user) return null;
        try {
            const { data, error } = await supabase
                .from("memos")
                .insert({
                    user_id: user.id,
                    title: title || "",
                    content: [],
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setMemos((prev) => [data, ...prev]);
                setActiveMemoId(data.id);
                return data;
            }
        } catch (err) {
            console.error("Failed to create memo:", err);
        }
        return null;
    }, [user]);

    // Update memo content
    const updateMemoContent = useCallback(async (memoId: string, content: unknown[]) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("memos")
                .update({
                    content,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", memoId)
                .eq("user_id", user.id);

            if (error) throw error;

            setMemos((prev) =>
                prev.map((m) =>
                    m.id === memoId
                        ? { ...m, content, updated_at: new Date().toISOString() }
                        : m
                )
            );
        } catch (err) {
            console.error("Failed to update memo content:", err);
        }
    }, [user]);

    // Update memo title
    const updateMemoTitle = useCallback(async (memoId: string, title: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("memos")
                .update({
                    title,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", memoId)
                .eq("user_id", user.id);

            if (error) throw error;

            setMemos((prev) =>
                prev.map((m) =>
                    m.id === memoId
                        ? { ...m, title, updated_at: new Date().toISOString() }
                        : m
                )
            );
        } catch (err) {
            console.error("Failed to update memo title:", err);
        }
    }, [user]);

    // Delete a memo
    const deleteMemo = useCallback(async (memoId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("memos")
                .delete()
                .eq("id", memoId)
                .eq("user_id", user.id);

            if (error) throw error;

            setMemos((prev) => {
                const filtered = prev.filter((m) => m.id !== memoId);
                // If we deleted the active memo, switch to the next one
                if (activeMemoId === memoId) {
                    setActiveMemoId(filtered.length > 0 ? filtered[0].id : null);
                }
                return filtered;
            });
        } catch (err) {
            console.error("Failed to delete memo:", err);
        }
    }, [user, activeMemoId]);

    const activeMemo = memos.find((m) => m.id === activeMemoId) || null;

    return {
        memos,
        activeMemo,
        activeMemoId,
        setActiveMemoId,
        loading,
        createMemo,
        updateMemoContent,
        updateMemoTitle,
        deleteMemo,
        fetchMemos,
    };
}
