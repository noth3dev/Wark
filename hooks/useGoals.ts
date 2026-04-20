"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    type: "duration" | "count";
    target_value: number;
    period: "daily" | "weekly" | "monthly" | "yearly";
    tag_id: string | null;
    created_at: string;
}

export function useGoals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGoals = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("goals")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (err) {
            console.error("Failed to fetch goals:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const addGoal = useCallback(async (goal: Omit<Goal, "id" | "user_id" | "created_at">) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("goals")
                .insert({ ...goal, user_id: user.id })
                .select().single();
            if (error) throw error;
            setGoals(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error("Failed to add goal:", err);
        }
    }, [user]);

    const deleteGoal = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from("goals").delete().eq("id", id);
            if (error) throw error;
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (err) {
            console.error("Failed to delete goal:", err);
        }
    }, []);

    const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
        try {
            const { error } = await supabase.from("goals").update(updates).eq("id", id);
            if (error) throw error;
            setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        } catch (err) {
            console.error("Failed to update goal:", err);
        }
    }, []);

    return { goals, loading, addGoal, deleteGoal, updateGoal, refresh: fetchGoals };
}
