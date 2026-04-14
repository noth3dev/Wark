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
import { SolvedProblemsStats } from "@/components/record/SolvedProblemsStats";
import { DailyMemoStats } from "@/components/record/DailyMemoStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodicStats } from "@/components/record/PeriodicStats";

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
        groupedTotals,
        totalToday,
        totalSprintToday,
        hourData,
        fetchData
    } = useRecord();

    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editTagId, setEditTagId] = useState("");
    const [editDuration, setEditDuration] = useState({ h: 0, m: 0, s: 0 });
    const [editCreatedAt, setEditCreatedAt] = useState("");
    const [editEndedAt, setEditEndedAt] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const syncTimes = (start: string, durationMs: number) => {
        const startDate = new Date(start);
        const endDate = new Date(startDate.getTime() + durationMs);
        
        const format = (d: Date) => {
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const hh = d.getHours().toString().padStart(2, '0');
            const mm = d.getMinutes().toString().padStart(2, '0');
            const ss = d.getSeconds().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hh}:${mm}:${ss}`;
        };

        setEditCreatedAt(format(startDate));
        setEditEndedAt(format(endDate));
        
        const h = Math.floor(durationMs / 3600000);
        const m = Math.floor((durationMs % 3600000) / 60000);
        const s = Math.floor((durationMs % 60000) / 1000);
        setEditDuration({ h, m, s });
    };

    const handleCreatedAtChange = (newStart: string) => {
        const durationMs = (editDuration.h * 3600000) + (editDuration.m * 60000) + (editDuration.s * 1000);
        syncTimes(newStart, durationMs);
    };

    const handleEndedAtChange = (newEnd: string) => {
        const startMs = new Date(editCreatedAt).getTime();
        const endMs = new Date(newEnd).getTime();
        const newDuration = Math.max(0, endMs - startMs);
        syncTimes(editCreatedAt, newDuration);
    };

    const handleDurationChange = (newH: number, newM: number, newS: number) => {
        const newDuration = (newH * 3600000) + (newM * 60000) + (newS * 1000);
        syncTimes(editCreatedAt, newDuration);
    };

    const handleEditStart = (session: Session) => {
        setEditingSession(session);
        setEditTagId(session.tag_id);
        syncTimes(session.created_at, session.duration);
    };

    const handleAddStart = () => {
        const defaultTagId = tags.length > 0 ? tags[0].id : "";
        setEditTagId(defaultTagId);

        const date = new Date(selectedDate);
        if (isToday) {
            const now = new Date();
            date.setHours(now.getHours(), now.getMinutes());
        } else {
            date.setHours(12, 0);
        }

        syncTimes(date.toISOString(), 3600000);
        setEditingSession({ id: 'new', tag_id: defaultTagId, duration: 3600000, created_at: date.toISOString() });
    };

    const handleFillGap = (startTime: number, durationMs: number) => {
        const defaultTagId = tags.length > 0 ? tags[0].id : "";
        setEditTagId(defaultTagId);
        syncTimes(new Date(startTime).toISOString(), durationMs);
        setEditingSession({ id: 'new', tag_id: defaultTagId, duration: durationMs, created_at: new Date(startTime).toISOString() });
    };

    const handleSave = async () => {
        if (!editingSession || !user) return;

        const newDuration = (editDuration.h * 3600000) + (editDuration.m * 60000) + (editDuration.s * 1000);
        const newStart = Math.floor(new Date(editCreatedAt).getTime() / 1000) * 1000;
        const newEnd = newStart + newDuration;

        // Overlap defense
        const isOverlap = sessions.some(s => {
            if (editingSession.id !== 'new' && s.id === editingSession.id) return false;
            // Floor everything to seconds to avoid precision issues
            const sStart = Math.floor(new Date(s.created_at).getTime() / 1000) * 1000;
            const sEnd = sStart + Math.floor(s.duration / 1000) * 1000;
            const targetStart = newStart;
            const targetEnd = newStart + Math.floor(newDuration / 1000) * 1000;
            
            return Math.max(sStart, targetStart) < Math.min(sEnd, targetEnd);
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

    const handleFillAll = async () => {
        if (!user || sessions.length < 2) return;

        // Sort sessions by start time
        const sorted = [...sessions].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const gapsToFill = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i+1];

            const currentStart = Math.floor(new Date(current.created_at).getTime() / 1000) * 1000;
            const currentEnd = currentStart + Math.floor(current.duration / 1000) * 1000;
            const nextStart = Math.floor(new Date(next.created_at).getTime() / 1000) * 1000;

            if (nextStart > currentEnd + 1000) { // Gap > 1s
                gapsToFill.push({
                    user_id: user.id,
                    tag_id: next.tag_id, // Fill with B's tag
                    duration: nextStart - currentEnd,
                    created_at: new Date(currentEnd).toISOString()
                });
            }
        }

        if (gapsToFill.length === 0) {
            alert("채울 수 있는 빈 공간이 없습니다.");
            return;
        }

        if (!confirm(`${gapsToFill.length}개의 빈 공간을 뒷 세션의 태그로 채우시겠습니까?`)) return;

        setIsSaving(true);
        try {
            const { error } = await supabase.from('study_sessions').insert(gapsToFill);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to fill all gaps");
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

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteMultiple = async (ids: string[]) => {
        if (!confirm(`${ids.length}개의 기록을 삭제하시겠습니까?`)) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('study_sessions')
                .delete()
                .in('id', ids);

            if (error) throw error;
            setSelectedIds([]);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to delete sessions");
        } finally {
            setIsSaving(false);
        }
    };

    const [activeRecordTab, setActiveRecordTab] = useState("daily");

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <main className="h-full overflow-y-auto bg-black text-white selection:bg-white/10 selection:text-white pb-20 sm:pb-0">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-16">
                <Tabs value={activeRecordTab} onValueChange={setActiveRecordTab} className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 border-b border-white/5 pb-12">
                        <RecordHeader
                            selectedDate={selectedDate}
                            isToday={isToday}
                            totalToday={totalToday}
                            totalSprintToday={totalSprintToday}
                            onDateChange={changeDate}
                        />

                        <TabsList className="bg-neutral-900/50 p-1 border border-white/5 h-12 w-full sm:w-auto">
                            <TabsTrigger value="daily" className="px-8 flex-1 sm:flex-none text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black">Daily</TabsTrigger>
                            <TabsTrigger value="stats" className="px-8 flex-1 sm:flex-none text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black">Analytics</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="daily" className="space-y-16 sm:space-y-24 m-0 border-0 p-0 focus-visible:ring-0">
                        <div className="grid lg:grid-cols-12 gap-8 sm:gap-16 mt-8">
                            <TagDistribution
                                tags={tags}
                                getTagTotal={getTagTotal}
                                groupedTotals={groupedTotals}
                                totalToday={totalToday}
                                sessionsCount={sessions.length}
                            />
                            <DailyTimetable
                                hourData={hourData}
                                tags={tags}
                                onFillGap={handleFillGap}
                                onFillAll={handleFillAll}
                            />
                        </div>

                        <SolvedProblemsStats
                            date={selectedDate}
                            tags={tags}
                        />

                        <DailyMemoStats date={selectedDate} />

                        <SessionLogs
                            sessions={sessions}
                            tags={tags}
                            onAddRecord={handleAddStart}
                            onEditSession={handleEditStart}
                            onDeleteSession={handleDelete}
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            onSelectAll={setSelectedIds}
                            onDeleteMultiple={handleDeleteMultiple}
                        />
                    </TabsContent>

                    <TabsContent value="stats" className="m-0 border-0 p-0 focus-visible:ring-0">
                        <PeriodicStats userId={user?.id} tags={tags} currentDate={selectedDate} />
                    </TabsContent>
                </Tabs>
            </div>

            <SessionModal
                editingSession={editingSession}
                tags={tags}
                editTagId={editTagId}
                setEditTagId={setEditTagId}
                editCreatedAt={editCreatedAt}
                setEditCreatedAt={handleCreatedAtChange}
                editEndedAt={editEndedAt}
                setEditEndedAt={handleEndedAtChange}
                editDuration={editDuration}
                setEditDuration={handleDurationChange}
                isSaving={isSaving}
                onClose={() => setEditingSession(null)}
                onSave={handleSave}
            />
        </main>
    );
}
