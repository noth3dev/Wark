"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Session } from "@/lib/types";
import { useRecord } from "@/hooks/useRecord";

// Components
import { RecordHeader } from "@/components/record/RecordHeader";
import { TagDistribution } from "@/components/record/TagDistribution";
import { DailyTimetable } from "@/components/record/DailyTimetable";
import { SessionLogs } from "@/components/record/SessionLogs";
import { SessionModal } from "@/components/record/SessionModal";

export default function RecordPage() {
    const {
        user,
        tags,
        sessions,
        loading,
        selectedDate,
        isToday,
        mounted,
        changeDate,
        getTagTotal,
        totalToday,
        hourData,
        fetchData
    } = useRecord();

    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editTagId, setEditTagId] = useState("");
    const [editDuration, setEditDuration] = useState({ h: 0, m: 0, s: 0 });
    const [editCreatedAt, setEditCreatedAt] = useState("");

    const handleEditStart = (session: Session) => {
        setEditingSession(session);
        setEditTagId(session.tag_id);
        const h = Math.floor(session.duration / 3600000);
        const m = Math.floor((session.duration % 3600000) / 60000);
        const s = Math.floor((session.duration % 60000) / 1000);
        setEditDuration({ h, m, s });

        const date = new Date(session.created_at);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setEditCreatedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    };

    const handleAddStart = () => {
        const defaultTagId = tags.length > 0 ? tags[0].id : "";
        setEditTagId(defaultTagId);
        setEditDuration({ h: 1, m: 0, s: 0 });

        const date = new Date(selectedDate);
        if (isToday) {
            const now = new Date();
            date.setHours(now.getHours(), now.getMinutes());
        } else {
            date.setHours(12, 0);
        }

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setEditCreatedAt(`${year}-${month}-${day}T${hours}:${minutes}`);

        setEditingSession({ id: 'new', tag_id: defaultTagId, duration: 3600000, created_at: date.toISOString() });
    };

    const handleFillGap = (startTime: number, durationMs: number) => {
        const defaultTagId = tags.length > 0 ? tags[0].id : "";
        setEditTagId(defaultTagId);

        const h = Math.floor(durationMs / 3600000);
        const m = Math.floor((durationMs % 3600000) / 60000);
        const s = Math.floor((durationMs % 60000) / 1000);
        setEditDuration({ h, m, s });

        const date = new Date(startTime);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setEditCreatedAt(`${year}-${month}-${day}T${hours}:${minutes}`);

        setEditingSession({ id: 'new', tag_id: defaultTagId, duration: durationMs, created_at: date.toISOString() });
    };

    const handleSave = async () => {
        if (!editingSession || !user) return;

        const newDuration = (editDuration.h * 3600000) + (editDuration.m * 60000) + (editDuration.s * 1000);
        const newStart = new Date(editCreatedAt).getTime();
        const newEnd = newStart + newDuration;

        // Overlap defense
        const isOverlap = sessions.some(s => {
            if (editingSession.id !== 'new' && s.id === editingSession.id) return false;
            const sStart = new Date(s.created_at).getTime();
            const sEnd = sStart + s.duration;
            return Math.max(sStart, newStart) < Math.min(sEnd, newEnd);
        });

        if (isOverlap) {
            alert("입력한 시간이 다른 기록과 겹칩니다. 기록을 확인해주세요.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                tag_id: editTagId,
                duration: newDuration,
                created_at: new Date(editCreatedAt).toISOString(),
                user_id: user.id
            };

            if (editingSession.id === 'new') {
                const { error } = await supabase.from('study_sessions').insert([payload]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('study_sessions')
                    .update({
                        tag_id: editTagId,
                        duration: newDuration,
                        created_at: payload.created_at
                    })
                    .eq('id', editingSession.id);
                if (error) throw error;
            }

            setEditingSession(null);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to save session");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('study_sessions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to delete session");
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white/10 selection:text-white">
            <div className="max-w-6xl mx-auto px-6 py-24 space-y-24">
                <RecordHeader
                    selectedDate={selectedDate}
                    isToday={isToday}
                    totalToday={totalToday}
                    onDateChange={changeDate}
                />

                <div className="grid lg:grid-cols-12 gap-16">
                    <TagDistribution
                        tags={tags}
                        getTagTotal={getTagTotal}
                        totalToday={totalToday}
                        sessionsCount={sessions.length}
                    />
                    <DailyTimetable
                        hourData={hourData}
                        tags={tags}
                        onFillGap={handleFillGap}
                    />
                </div>

                <SessionLogs
                    sessions={sessions}
                    tags={tags}
                    onAddRecord={handleAddStart}
                    onEditSession={handleEditStart}
                    onDeleteSession={handleDelete}
                />
            </div>

            <SessionModal
                editingSession={editingSession}
                tags={tags}
                editTagId={editTagId}
                setEditTagId={setEditTagId}
                editCreatedAt={editCreatedAt}
                setEditCreatedAt={setEditCreatedAt}
                editDuration={editDuration}
                setEditDuration={setEditDuration}
                isSaving={isSaving}
                onClose={() => setEditingSession(null)}
                onSave={handleSave}
            />
        </main>
    );
}
