"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StickyNote, Clock, ChevronRight, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface Memo {
    id: string;
    title: string;
    updated_at: string;
}

interface DailyMemoStatsProps {
    date: Date;
}

export function DailyMemoStats({ date }: DailyMemoStatsProps) {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDailyMemos = async () => {
            setLoading(true);
            try {
                // Get the start and end of the selected day
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                const { data, error } = await supabase
                    .from("memos")
                    .select("id, title, updated_at")
                    .gte("updated_at", startOfDay.toISOString())
                    .lte("updated_at", endOfDay.toISOString())
                    .order("updated_at", { ascending: false });

                if (error) throw error;
                setMemos(data || []);
            } catch (err) {
                console.error("Failed to fetch daily memos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyMemos();
    }, [date]);

    if (loading) return (
        <div className="h-20 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin" />
        </div>
    );

    if (memos.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500/80" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">Daily Memos</h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {memos.map((memo) => (
                    <motion.div
                        key={memo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-default"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[13px] font-semibold text-neutral-200 line-clamp-1">
                                    {memo.title || "제목 없음"}
                                </span>
                                <FileText className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(memo.updated_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                        </div>

                        {/* Decoration line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-amber-500/20 rounded-full" />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
