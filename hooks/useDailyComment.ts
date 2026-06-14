"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

export function useDailyComment(userId: string | undefined, dateStr: string) {
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const canEdit = !!user && user.id === userId;

    useEffect(() => {
        if (!userId || !dateStr) return;
        let isMounted = true;

        async function fetchComment() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("daily_comments")
                    .select("comment")
                    .eq("user_id", userId)
                    .eq("date", dateStr)
                    .maybeSingle();

                if (error) throw error;
                if (isMounted) {
                    setComment(data?.comment || "");
                }
            } catch (err) {
                console.error("Failed to fetch daily comment:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchComment();
        return () => {
            isMounted = false;
        };
    }, [userId, dateStr]);

    const saveComment = useCallback(async (newComment: string) => {
        if (!canEdit || !userId || !dateStr) return;
        try {
            const { error } = await supabase
                .from("daily_comments")
                .upsert({
                    user_id: userId,
                    date: dateStr,
                    comment: newComment,
                    updated_at: new Date().toISOString()
                }, { onConflict: "user_id,date" });

            if (error) throw error;
            setComment(newComment);
        } catch (err) {
            console.error("Failed to save daily comment:", err);
        }
    }, [userId, dateStr, canEdit]);

    return { comment, saveComment, loading };
}
