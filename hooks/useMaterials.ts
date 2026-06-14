"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

export interface StudyMaterial {
    id: string;
    user_id: string;
    subject_tag_id: string;
    name: string;
    last_amount_text: string | null;
    created_at: string;
    updated_at: string;
}

export function useMaterials() {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMaterials = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("study_materials")
                .select("*")
                .order("updated_at", { ascending: false });

            if (error) throw error;
            setMaterials(data || []);
        } catch (err) {
            console.error("Failed to fetch materials:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const addOrUpdateMaterial = async (subject_tag_id: string, name: string, last_amount_text: string | null = null) => {
        if (!user) return null;
        try {
            // First try to find existing
            const existing = materials.find(m => m.subject_tag_id === subject_tag_id && m.name === name);
            if (existing) {
                if (last_amount_text && existing.last_amount_text !== last_amount_text) {
                    const { data, error } = await supabase
                        .from("study_materials")
                        .update({ last_amount_text })
                        .eq("id", existing.id)
                        .select()
                        .single();
                    if (error) throw error;
                    setMaterials(prev => prev.map(m => m.id === existing.id ? data : m));
                    return data;
                }
                return existing;
            }

            // Insert new
            const { data, error } = await supabase
                .from("study_materials")
                .insert({
                    user_id: user.id,
                    subject_tag_id,
                    name,
                    last_amount_text
                })
                .select()
                .single();

            if (error) throw error;
            setMaterials(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error("Failed to add/update material:", err);
            return null;
        }
    };

    return {
        materials,
        loading,
        addOrUpdateMaterial,
        refresh: fetchMaterials
    };
}
