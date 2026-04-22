"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useExams, Exam } from "../../hooks/useExams";
import { Tag } from "../../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { cn } from "../../lib/utils";

interface ExamsViewProps {
    canEdit: boolean;
    tags: Tag[];
    userId?: string;
}

export function ExamsView({ canEdit, tags, userId }: ExamsViewProps) {
    const { exams, loading, addExam, deleteExam, updateExam } = useExams(userId);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "charts">("list");
    const [groupBy, setGroupBy] = useState<"none" | "subject" | "name">("none");
    const [chartScope, setChartScope] = useState<"subject" | "name">("subject");
    
    // Form States
    const [name, setName] = useState("");
    const [round, setRound] = useState("");
    const [subject, setSubject] = useState("");
    const [examType, setExamType] = useState<Exam['exam_type']>('모의고사');
    const [score, setScore] = useState("");
    const [totalScore, setTotalScore] = useState("100");
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

    // Suggestion logic
    const [showSuggestions, setShowSuggestions] = useState(false);
    const uniqueNames = useMemo(() => {
        const names = Array.from(new Set(exams.map(e => e.name))).filter(Boolean);
        return names;
    }, [exams]);

    const suggestions = useMemo(() => {
        if (!name) return [];
        return uniqueNames.filter(un => un.toLowerCase().includes(name.toLowerCase()) && un !== name);
    }, [name, uniqueNames]);

    const handleCommit = async () => {
        if (!name || !score) return;
        const payload = {
            name,
            round: round || null,
            subject: subject || null,
            exam_type: examType,
            score: parseFloat(score),
            total_score: parseFloat(totalScore),
            exam_date: examDate,
            tag_id: selectedTagId
        };

        if (editingId) {
            await updateExam(editingId, payload);
            setEditingId(null);
        } else {
            await addExam(payload);
        }
        
        resetForm();
    };

    const resetForm = () => {
        setName("");
        setRound("");
        setSubject("");
        setScore("");
        setSelectedTagId(null);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (exam: Exam) => {
        setName(exam.name);
        setRound(exam.round || "");
        setSubject(exam.subject || "");
        setExamType(exam.exam_type);
        setScore(exam.score.toString());
        setTotalScore(exam.total_score.toString());
        setExamDate(exam.exam_date);
        setSelectedTagId(exam.tag_id);
        setEditingId(exam.id);
        setIsAdding(true);
    };

    // Grouping Logic for List
    const groupedExamsList = useMemo(() => {
        if (groupBy === "none") {
            return { "최근 기록": [...exams].sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()) };
        }
        const groups: Record<string, Exam[]> = {};
        exams.forEach(e => {
            const key = groupBy === "subject" ? (e.subject || "기타") : e.name;
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        Object.keys(groups).forEach(key => groups[key].sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()));
        return groups;
    }, [exams, groupBy]);

    // Chart Data Processing
    const chartGroups = useMemo(() => {
        if (!exams.length) return {};
        const sorted = [...exams].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
        const groups: Record<string, Exam[]> = {};
        sorted.forEach(e => {
            let key = chartScope === "subject" ? (e.subject || "기타") : `${e.name}${e.subject ? ` - ${e.subject}` : ""}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        const filtered: Record<string, Exam[]> = {};
        Object.entries(groups).forEach(([k, v]) => { if (v.length >= 2) filtered[k] = v; });
        return filtered;
    }, [exams, chartScope]);

    const examTypeConfig = {
        '모의고사': { icon: Icons.ClipboardList, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
        '실모': { icon: Icons.Zap, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        '하프모': { icon: Icons.Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    };

    if (loading) {
        return <div className="py-32 flex justify-center opacity-40"><Icons.Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {canEdit && (
                <div className="space-y-4">
                    {!isAdding ? (
                        <div className="flex gap-4">
                            <button onClick={() => setIsAdding(true)} className="flex-1 py-4 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-3 text-neutral-500 hover:text-white hover:border-white/20 transition-all group">
                                <Icons.Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /><span className="text-[11px] font-bold uppercase tracking-wider">Record New Exam</span>
                            </button>
                            <button onClick={() => setViewMode(viewMode === "list" ? "charts" : "list")} className={cn("px-6 py-4 border rounded-xl flex items-center justify-center gap-3 transition-all", viewMode === "charts" ? "bg-white text-black border-white" : "border-white/10 text-neutral-500 hover:text-white")}>
                                {viewMode === "list" ? <Icons.BarChart3 className="w-4 h-4" /> : <Icons.List className="w-4 h-4" />}<span className="text-[11px] font-bold uppercase tracking-wider">{viewMode === "list" ? "Analytics" : "List"}</span>
                            </button>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl space-y-6">
                            <div className="flex justify-center p-1 bg-white/5 rounded-xl border border-white/5 max-w-[320px] mx-auto">
                                {(Object.keys(examTypeConfig) as Exam['exam_type'][]).map(type => {
                                    const Config = examTypeConfig[type];
                                    return (
                                        <button key={type} onClick={() => setExamType(type)} className={cn("flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", examType === type ? "bg-white text-black shadow-lg" : "text-neutral-600 hover:text-neutral-400")}>
                                            <Config.icon className="w-3 h-3" /> {type}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase">이름 (Exam Name)</label>
                                    <div className="relative">
                                        <input type="text" value={name} onChange={(e) => {setName(e.target.value); setShowSuggestions(true);}} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="예: 서바이벌, 학력평가" className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                        <AnimatePresence>{showSuggestions && suggestions.length > 0 && ( <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">{suggestions.map((s, i) => ( <button key={i} onClick={() => {setName(s); setShowSuggestions(false);}} className="w-full px-4 py-2 text-left text-[11px] font-bold text-neutral-400 hover:bg-white/5 hover:text-white transition-colors">{s}</button>))}</motion.div>)}</AnimatePresence>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase">회차 (Round)</label>
                                    <input type="text" value={round} onChange={(e) => setRound(e.target.value)} placeholder="예: 1회차" className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase">과목 (Subject)</label>
                                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="예: 수학" className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase">점수 / 만점</label>
                                    <div className="flex items-center gap-3">
                                        <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="점수" className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                        <span className="text-neutral-600 font-bold">/</span>
                                        <input type="number" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="만점" className="w-32 bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-blue-400 font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase">시험 날짜</label>
                                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase">태그 연동 (선택)</label>
                                    <div className="flex flex-wrap gap-2">{tags.map(tag => (<button key={tag.id} onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all", selectedTagId === tag.id ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/10")}>{tag.name}</button>))}</div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                <button onClick={resetForm} className="px-6 py-2 text-[10px] font-black uppercase text-neutral-600 hover:text-neutral-400 transition-colors">취소</button>
                                <button onClick={handleCommit} disabled={!name || !score} className="px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all">{editingId ? "변경사항 저장" : "시험 기록 저장"}</button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            <div className="space-y-20 pt-10 border-t border-white/5">
                {viewMode === "list" ? (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="space-y-1"><h2 className="text-[10px] font-bold text-neutral-700 uppercase leading-none">시험 기록 리스트</h2><p className="text-[9px] font-medium text-neutral-800 uppercase tabular-nums">{exams.length} Records Total</p></div>
                            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/5">{( [{ id: "none", label: "시간순", icon: Icons.Clock }, { id: "subject", label: "과목별", icon: Icons.BookOpen }, { id: "name", label: "시험명별", icon: Icons.Hash }] as const).map(option => (<button key={option.id} onClick={() => setGroupBy(option.id)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", groupBy === option.id ? "bg-white text-black" : "text-neutral-600 hover:text-neutral-400")}><option.icon className="w-3 h-3" />{option.label}</button>))}</div>
                        </div>
                        {exams.length === 0 ? (<div className="py-40 text-center space-y-4 opacity-20"><div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center"><Icons.Award className="w-5 h-5 text-neutral-400" /></div><p className="text-[11px] font-bold uppercase text-neutral-400">아직 기록된 시험이 없습니다.</p></div>) : (
                            <div className="space-y-20"><AnimatePresence mode='popLayout'>{Object.entries(groupedExamsList).map(([groupName, groupExams]) => (
                                <motion.div key={groupName} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    {groupBy !== "none" && (<div className="flex items-center gap-4 px-2"><span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{groupName}</span><div className="h-px flex-1 bg-white/[0.03]" /><span className="text-[9px] font-bold text-neutral-800 uppercase tabular-nums">{groupExams.length}</span></div>)}
                                    <div className="space-y-4">{groupExams.map((exam) => {
                                        const config = examTypeConfig[exam.exam_type] || examTypeConfig['모의고사'];
                                        return (
                                            <motion.div key={exam.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl p-5 flex items-center justify-between transition-all">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5"><span className="text-[8px] font-black text-neutral-600 uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span><span className="text-sm font-bold leading-none">{new Date(exam.exam_date).getDate()}</span></div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("p-1 rounded flex items-center justify-center", config.bg, config.border, "border")}>
                                                                <config.icon className={cn("w-2.5 h-2.5", config.color)} />
                                                            </div>
                                                            <span className={cn("text-[8px] font-black uppercase tracking-tighter", config.color)}>{exam.exam_type}</span>
                                                            <h3 className="text-sm font-bold text-white/90">{exam.name}</h3>
                                                            {exam.round && (<span className="text-[9px] font-bold text-neutral-600 uppercase tracking-tight bg-white/5 px-2 py-0.5 rounded-sm">{exam.round}</span>)}
                                                        </div>
                                                        <div className="flex items-center gap-3"><span className="text-[10px] font-bold text-blue-400/80 uppercase">{exam.subject || "과목 없음"}</span><span className="text-[10px] font-medium text-neutral-500 uppercase">{exam.exam_date}</span>{exam.tag_id && (<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-neutral-500 text-[8px] font-black border border-white/5"><Icons.Hash className="w-2 h-2" />{tags.find(t => t.id === exam.tag_id)?.name || "태그"}</div>)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right space-y-0.5"><div className="flex items-baseline justify-end gap-1"><span className={cn("text-2xl font-black tabular-nums tracking-tighter", (exam.score / exam.total_score) >= 0.9 ? "text-green-400" : (exam.score / exam.total_score) >= 0.7 ? "text-blue-400" : "text-neutral-400")}>{exam.score}</span><span className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">/ {exam.total_score}</span></div><div className="text-[9px] font-bold text-neutral-600 uppercase tracking-tighter">{Math.round((exam.score / exam.total_score) * 100)}% 성취도</div></div>
                                                    {canEdit && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => startEdit(exam)} className="p-2 text-neutral-800 hover:text-blue-500/50 opacity-0 group-hover:opacity-100 transition-all"><Icons.Pencil className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteExam(exam.id)} className="p-2 text-neutral-800 hover:text-red-500/50 opacity-0 group-hover:opacity-100 transition-all"><Icons.Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}</div>
                                </motion.div>
                            ))}</AnimatePresence></div>
                        )}
                    </>
                ) : (
                    <div className="space-y-24">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"><h2 className="text-[10px] font-bold text-neutral-700 uppercase leading-none">성취도 분석 (Performance Analytics)</h2><div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">{(['subject', 'name'] as const).map(scope => (<button key={scope} onClick={() => setChartScope(scope)} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", chartScope === scope ? "bg-white text-black" : "text-neutral-600 hover:text-neutral-400")}>{scope === 'subject' ? '과목별 추이' : '시험별 과목 분석'}</button>))}</div></div>
                        {exams.length < 2 ? (<div className="py-40 text-center space-y-4 opacity-20"><div className="w-12 h-12 border border-white/20 rounded-full mx-auto flex items-center justify-center"><Icons.TrendingUp className="w-5 h-5 text-neutral-400" /></div><p className="text-[11px] font-bold uppercase text-neutral-400">데이터가 충분하지 않습니다. (최소 2개 이상의 기록 필요)</p></div>) : (
                            <div className="space-y-12">
                                <div className="space-y-12"><div className="flex items-center gap-4"><span className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">{chartScope === 'subject' ? '주요 과목 분석' : '시험별 세부 과목 추이'}</span><div className="h-px flex-1 bg-white/5" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-12">{Object.entries(chartGroups).length === 0 ? (<div className="md:col-span-2 py-20 text-center text-[10px] font-bold text-neutral-700 uppercase">2회 이상 기록된 {chartScope === 'subject' ? '과목' : '시험'}이 없습니다.</div>) : (Object.entries(chartGroups).map(([groupKey, groupExams]) => (<div key={groupKey} className="space-y-6"><div className="flex items-center justify-between px-2"><h3 className="text-xs font-black text-white/80 uppercase">{groupKey}</h3><span className="text-[10px] font-bold text-neutral-600 uppercase tabular-nums">Average: {Math.round(groupExams.reduce((acc, e) => acc + (e.score/e.total_score)*100, 0) / groupExams.length)}%</span></div><ScoreChart data={groupExams} color={chartScope === 'subject' ? "#3b82f6" : "#8b5cf6"} /></div>)))}</div></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScoreChart({ data, color, showLabels = false }: { data: Exam[], color: string, showLabels?: boolean }) {
    if (data.length < 1) return null;
    const padding = 20; const height = 150; const width = 400;
    const points = data.map((e, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * (width - padding * 2) + padding : width / 2;
        const scoreRatio = e.score / e.total_score;
        const y = (1 - scoreRatio) * (height - padding * 2) + padding;
        return { x, y, score: Math.round(scoreRatio * 100), name: e.name, date: e.exam_date, round: e.round };
    });
    const pathData = points.length > 1 ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` : "";
    return (
        <div className="relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {[0, 0.25, 0.5, 0.75, 1].map((p) => { const y = (1 - p) * (height - padding * 2) + padding; return ( <line key={p} x1={padding} y1={y} x2={width - padding} y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" strokeDasharray="4 4" /> ); })}
                {points.length > 1 && (<motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} d={pathData} fill="transparent" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />)}
                {points.map((p, i) => (
                    <g key={i} className="group/dot">
                        <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} cx={p.x} cy={p.y} r="3" fill={color} className="transition-all" />
                        <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer" />
                        <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">
                            <rect x={p.x - 20} y={p.y - 35} width="40" height="20" rx="4" fill="black" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
                            <text x={p.x} y={p.y - 22} textAnchor="middle" className="text-[10px] font-bold" fill="white">{p.score}%</text>
                            {showLabels && (<text x={p.x} y={height + 15} textAnchor="middle" className="text-[8px] font-medium uppercase" fill="#555">{p.round ? `${p.round}` : p.name.slice(0, 6)}</text>)}
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    );
}
