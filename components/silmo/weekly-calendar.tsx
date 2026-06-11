import React, { useState } from 'react';
import { ExamRecord, ExamType, GlobalSchedule } from '@/types/silmo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle2, Circle, Zap } from 'lucide-react';

export interface ScheduledExam {
  id: string;
  date: string; // YYYY-MM-DD
  type: ExamType;
  title: string;
  isCompleted: boolean;
}

interface WeeklyCalendarProps {
  records: ExamRecord[];
  profiles: { [key: string]: string };
  currentUserId: string;
  globalTitles?: string[];
  globalSchedules?: GlobalSchedule[];
  scheduledExams: ScheduledExam[];
  onAddSchedule: (date: string, type: ExamType, title: string) => void;
  onDeleteSchedule: (id: string) => void;
  onCompleteSchedule: (schedule: ScheduledExam) => void;
}

export function WeeklyCalendar({
  records,
  profiles,
  currentUserId,
  globalTitles = [],
  globalSchedules = [],
  scheduledExams,
  onAddSchedule,
  onDeleteSchedule,
  onCompleteSchedule
}: WeeklyCalendarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<ExamType>('korean');

  // Generate date objects for the current week (Monday to Sunday)
  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distance = currentDay === 0 ? -6 : 1 - currentDay; // Distance to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + distance);
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Format Date object to YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleOpenAddDialog = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setExamTitle('');
    setExamType('korean');
    setIsDialogOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!examTitle.trim()) return;
    onAddSchedule(selectedDateStr, examType, examTitle);
    setIsDialogOpen(false);
  };

  const getDayLabel = (index: number) => {
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    return labels[index];
  };

  // Compare if date matches a record date
  const getRecordsForDate = (dateStr: string) => {
    return records.filter(r => {
      const recDate = new Date(r.createdAt);
      const recDateStr = formatDateKey(recDate);
      return recDateStr === dateStr;
    });
  };

  // Compare if date matches a scheduled date
  const getSchedulesForDate = (dateStr: string) => {
    return scheduledExams.filter(s => s.date === dateStr);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'korean': return '국어';
      case 'math': return '수학';
      case 'both': return '국+수';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((date, idx) => {
          const dateStr = formatDateKey(date);
          const dayRecords = getRecordsForDate(dateStr);
          const daySchedules = getSchedulesForDate(dateStr);
          const isToday = formatDateKey(new Date()) === dateStr;

          // Group records by title
          const groupedRecords: { [title: string]: ExamRecord[] } = {};
          dayRecords.forEach(rec => {
            const title = rec.title || '실전 모의고사';
            if (!groupedRecords[title]) {
              groupedRecords[title] = [];
            }
            groupedRecords[title].push(rec);
          });

          return (
            <Card 
              key={dateStr}
              className={`matte-panel bg-neutral-950 border-neutral-800 rounded-xl relative hover:border-neutral-700 transition-all duration-300 min-h-[160px] flex flex-col justify-between ${
                isToday ? 'ring-1 ring-neutral-300 border-neutral-600' : ''
              }`}
            >
              <CardContent className="p-3.5 flex flex-col justify-between h-full flex-1 gap-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold font-suit text-neutral-100">
                      {getDayLabel(idx)}
                    </span>
                    <span className="text-[10px] font-semibold font-mono text-neutral-400">
                      {date.getDate()}일
                    </span>
                  </div>
                  
                  {/* Plus trigger */}
                  <button 
                    onClick={() => handleOpenAddDialog(dateStr)}
                    className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Day Tasks Area */}
                <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar min-h-0">
                  {/* Global Scheduled items */}
                  {globalSchedules
                    .filter(gs => gs.date === dateStr)
                    .map(gs => {
                      const isCompleted = dayRecords.some(r => r.title === gs.title && r.userId === currentUserId);
                      if (isCompleted) return null; // already shown in completed records

                      const isSilvival = gs.is_silvival;
                      const mappedSchedule: ScheduledExam = {
                        id: gs.id,
                        date: gs.date,
                        type: gs.type,
                        title: gs.title,
                        isCompleted: false
                      };

                      return (
                        <div
                          key={`global-${gs.id}`}
                          className={`group flex flex-col gap-1 p-2 rounded text-[10px] font-suit font-medium border transition-colors ${
                            isSilvival
                              ? 'bg-indigo-950/20 border-indigo-500/35 hover:border-indigo-500/60'
                              : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-neutral-300">
                            <span className={`font-semibold truncate max-w-[65px] flex items-center gap-0.5 ${isSilvival ? 'text-indigo-200 font-bold' : ''}`}>
                              {isSilvival && <Zap className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0 animate-pulse" />}
                              {gs.title}
                            </span>
                            <span className={`text-[8px] px-1 rounded border ${
                              isSilvival
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-neutral-850 text-neutral-400 border-neutral-800'
                            }`}>
                              {getTypeLabel(gs.type)}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onCompleteSchedule(mappedSchedule)}
                              className={`p-0.5 rounded ${isSilvival ? 'text-indigo-400 hover:bg-indigo-950/40' : 'text-emerald-400 hover:bg-emerald-950/20'}`}
                              title="응시하기 (기록)"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {/* Personal Scheduled items */}
                  {daySchedules.map(schedule => (
                    <div 
                      key={schedule.id}
                      className="group flex flex-col gap-1 p-2 rounded bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 text-[10px] font-suit font-medium"
                    >
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="font-semibold truncate max-w-[65px]">{schedule.title}</span>
                        <span className="text-[8px] px-1 rounded bg-neutral-850 text-neutral-400 border border-neutral-800">{getTypeLabel(schedule.type)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onCompleteSchedule(schedule)}
                          className="p-0.5 rounded text-emerald-400 hover:bg-emerald-950/20"
                          title="기록하기"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteSchedule(schedule.id)}
                          className="p-0.5 rounded text-red-400 hover:bg-red-950/20"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Grouped Completed records */}
                  {Object.entries(groupedRecords).map(([title, recs]) => {
                    const globalSched = (globalSchedules || []).find(s => s.title === title);
                    const isSilvival = globalSched?.is_silvival;
                    const isGlobal = globalTitles.includes(title) || !!globalSched;
                    const hasLocal = recs.some(r => r.userId === currentUserId);

                    let cardClass = 'bg-neutral-900 border-neutral-850';
                    let textClass = 'text-neutral-300';
                    if (isSilvival) {
                      cardClass = 'bg-indigo-950/30 border-indigo-500/50';
                      textClass = 'text-indigo-300';
                    } else if (isGlobal) {
                      cardClass = 'bg-indigo-500/[0.04] border-indigo-500/35';
                      textClass = 'text-indigo-400';
                    } else if (hasLocal) {
                      cardClass = 'bg-emerald-500/5 border-emerald-500/10';
                      textClass = 'text-emerald-400';
                    }

                    return (
                      <div 
                        key={title}
                        className={`flex flex-col gap-1 p-1.5 rounded text-[9px] font-suit font-medium border ${cardClass}`}
                      >
                        <div className="flex justify-between items-center gap-1 border-b border-neutral-900/40 pb-0.5 mb-1">
                          <span className={`font-semibold truncate flex items-center gap-0.5 ${textClass}`} title={title}>
                            {isSilvival && <Zap className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />}
                            {title}
                          </span>
                          {isSilvival ? (
                            <span className="text-[7px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold tracking-wider flex-shrink-0 scale-90 origin-right">
                              실바이벌
                            </span>
                          ) : isGlobal ? (
                            <span className="text-[7px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-semibold tracking-wider flex-shrink-0 scale-90 origin-right">
                              전역
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-0.5">
                          {recs.map(rec => {
                            const isLocal = rec.userId === currentUserId;
                            const userName = isLocal ? '나' : (profiles[rec.userId] || rec.userId.substring(0, 6));

                            return (
                              <div key={rec.id} className="flex items-center justify-between text-[8px] text-neutral-400">
                                <span className={isLocal ? 'text-emerald-400 font-medium' : 'text-neutral-400'}>
                                  {userName} ({getTypeLabel(rec.type)})
                                </span>
                                <span className={isLocal ? 'font-mono text-emerald-300' : 'font-mono text-neutral-300'}>
                                  {rec.type === 'both' ? `평균 ${rec.totalScore / 2}점` : `${rec.totalScore}점`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {dayRecords.length === 0 && daySchedules.length === 0 && globalSchedules.filter(gs => gs.date === dateStr).length === 0 && (
                    <div className="h-full flex items-center justify-center text-[9px] text-neutral-600 italic select-none">
                      기록 없음
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[350px] border-neutral-800 bg-neutral-950 text-neutral-100 rounded-xl p-5 font-suit">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-semibold tracking-tight">모의고사 일정 추가</DialogTitle>
            <DialogDescription className="text-[11px] text-neutral-500">
              {selectedDateStr}에 진행할 모의고사 계획을 기록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">실모 이름</label>
              <Input
                placeholder="예: 시대인재 1회, 한수 모의고사"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-xs py-1.5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">시험 유형</label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {(['korean', 'math', 'both'] as ExamType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setExamType(t)}
                    type="button"
                    className={`py-1.5 rounded border text-[11px] font-medium transition-all ${
                      examType === t
                        ? 'border-neutral-200 bg-neutral-100 text-neutral-950'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-750'
                    }`}
                  >
                    {t === 'korean' ? '국어' : t === 'math' ? '수학' : '국어+수학'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-1.5 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-neutral-800 text-neutral-400 hover:bg-neutral-900 text-[10px] py-1 h-7 px-3"
            >
              취소
            </Button>
            <Button
              onClick={handleSaveSchedule}
              className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 text-[10px] py-1 h-7 px-3 font-semibold"
            >
              추가하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
