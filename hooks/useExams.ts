"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

export interface Exam {
    id: string;
    user_id: string;
    name: string;      // 이름
    round: string | null; // 회차
    subject: string | null; // 과목
    exam_type: '모의고사' | '실모' | '하프모'; // 유형
    tag_id: string | null;
    score: number;
    total_score: number;
    exam_date: string;
    created_at: string;
}

export function useExams(userIdOverride?: string) {
    const { user } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUser = userIdOverride || user?.id;

    const fetchExams = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("user_id", currentUser)
                .order("exam_date", { ascending: false });

            if (error) throw error;
            setExams(data || []);
        } catch (err) {
            console.error("Failed to fetch exams:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    const addExam = useCallback(async (exam: Omit<Exam, "id" | "user_id" | "created_at">) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("exams")
                .insert({ ...exam, user_id: user.id })
                .select().single();
            if (error) throw error;
            setExams(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error("Failed to add exam:", err);
        }
    }, [user]);

    const deleteExam = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from("exams").delete().eq("id", id);
            if (error) throw error;
            setExams(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error("Failed to delete exam:", err);
        }
    }, []);

    const updateExam = useCallback(async (id: string, updates: Partial<Exam>) => {
        try {
            const { error } = await supabase.from("exams").update(updates).eq("id", id);
            if (error) throw error;
            setExams(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        } catch (err) {
            console.error("Failed to update exam:", err);
        }
    }, []);

    return { exams, loading, addExam, deleteExam, updateExam, refresh: fetchExams };
}
