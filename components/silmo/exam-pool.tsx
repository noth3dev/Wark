'use client';

import React, { useState } from 'react';
import { ExamPoolItem, ExamType, GlobalSchedule } from '@/types/silmo';
import { ThumbsUp, ThumbsDown, FileText, Download, Plus, Check, Trash2, Calendar, Zap, AlertCircle } from 'lucide-react';

interface ExamPoolProps {
  items: ExamPoolItem[];
  currentUserId: string;
  profiles: { [key: string]: string };
  onCreate: (title: string, type: ExamType, questionFile?: File, solutionFile?: File) => Promise<void>;
  onVote: (poolId: string, vote: number) => Promise<void>;
  onDelete: (poolId: string) => Promise<void>;
  onLockIn: (poolId: string, dateStr: string, title: string, type: ExamType) => Promise<void>;
  allGlobalSchedules?: GlobalSchedule[];
}

// Helper: Get the closest upcoming Tuesday or Thursday date
function getNextClosestExamDate(): string {
  const today = new Date();
  const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const currentDay = kstTime.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  // Target days: 2 (Tue) and 4 (Thu)
  // Find which one is closer (or next if current day is Tue/Thu)
  let minDays = 99;
  [2, 4].forEach(targetDay => {
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0) {
      daysToAdd = 7;
    }
    if (daysToAdd < minDays) {
      minDays = daysToAdd;
    }
  });

  const targetDate = new Date(kstTime.getTime() + (minDays * 24 * 60 * 60 * 1000));
  const yyyy = targetDate.getUTCFullYear();
  const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function ExamPool({ items, currentUserId, profiles, onCreate, onVote, onDelete, onLockIn, allGlobalSchedules = [] }: ExamPoolProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ExamType>('korean');
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting: highest votes first
  const sortedItems = [...items].sort((a, b) => {
    const votesA = a.silmo_exam_votes?.reduce((acc, v) => acc + v.vote, 0) || 0;
    const votesB = b.silmo_exam_votes?.reduce((acc, v) => acc + v.vote, 0) || 0;
    return votesB - votesA;
  });

  const nextClosestDate = getNextClosestExamDate();
  const top1Item = sortedItems[0];

  const handleSubmit = async () => {
    if (!newTitle.trim()) {
      alert('모의고사 이름을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    await onCreate(newTitle, newType, questionFile || undefined, solutionFile || undefined);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setNewTitle('');
    setQuestionFile(null);
    setSolutionFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Auto Selection Preview Banner */}
      {sortedItems.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3 font-suit">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
            <Zap className="w-4 h-4 text-indigo-400 animate-pulse flex-shrink-0" />
            이번 주 실바이벌 자동 지정 예정 (투표 기준)
          </div>
          <div className="text-xs">
            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-neutral-500 font-medium">가장 가까운 실모일 ({nextClosestDate})</span>
                <span className="text-neutral-200 font-semibold truncate max-w-[180px]">{top1Item ? top1Item.title : '예정 없음'}</span>
              </div>
              {top1Item && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                  {top1Item.type === 'korean' ? '국어' : top1Item.type === 'math' ? '수학' : '국어+수학'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-400 font-suit">
          추천 목록 (총 {items.length}개)
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-semibold font-suit"
        >
          <Plus className="w-3.5 h-3.5" />
          추천하기 (새 모의고사)
        </button>
      </div>

      {/* List Layout */}
      <div className="space-y-2.5">
        {sortedItems.map((item, idx) => {
          const upvotes = item.silmo_exam_votes?.filter(v => v.vote === 1).length || 0;
          const downvotes = item.silmo_exam_votes?.filter(v => v.vote === -1).length || 0;
          const myVote = item.silmo_exam_votes?.find(v => v.user_id === currentUserId)?.vote || 0;
          const score = upvotes - downvotes;
          const isTop = idx === 0 && sortedItems.length > 0;

          // Rank style
          let rankBadge = (
            <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 font-mono text-xs font-bold">
              #{idx + 1}
            </span>
          );
          if (idx === 0) {
            rankBadge = (
              <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                #1
              </span>
            );
          } else if (idx === 1) {
            rankBadge = (
              <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-300/20 text-slate-300 font-mono text-xs font-bold border border-slate-300/30">
                #2
              </span>
            );
          } else if (idx === 2) {
            rankBadge = (
              <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-700/20 text-amber-600 font-mono text-xs font-bold border border-amber-700/30">
                #3
              </span>
            );
          }

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                isTop ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-800'
              }`}
            >
              {/* Left Section: Rank, Title, Creator, Subject */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 mt-0.5">{rankBadge}</div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-neutral-200 truncate">{item.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/80 font-medium">
                      {item.type === 'korean' ? '국어' : item.type === 'math' ? '수학' : '국어+수학'}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-suit font-medium">
                    추천인: {profiles[item.created_by] || item.created_by.substring(0, 6)}
                  </span>
                </div>
              </div>

              {/* Middle Section: PDFs */}
              <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
                {item.question_pdf_url ? (
                  <a
                    href={item.question_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-indigo-400 hover:border-indigo-500/30 transition-all font-suit font-semibold text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" /> 문제지 <Download className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-suit">
                    <FileText className="w-3.5 h-3.5" /> 문제지 없음
                  </span>
                )}
                {item.solution_pdf_url ? (
                  <a
                    href={item.solution_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:text-indigo-400 hover:border-indigo-500/30 transition-all font-suit font-semibold text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" /> 해설지 <Download className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-suit">
                    <FileText className="w-3.5 h-3.5" /> 해설지 없음
                  </span>
                )}
              </div>

              {/* Right Section: Voting, Delete & Lock-in */}
              <div className="flex items-center gap-3.5 justify-end flex-shrink-0">
                {/* Votes Group */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800/80">
                  <button
                    onClick={() => onVote(item.id, myVote === 1 ? 0 : 1)}
                    className={`p-1.5 rounded hover:bg-neutral-900 transition-colors ${
                      myVote === 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono w-6 text-center text-neutral-200 font-bold">{score}</span>
                  <button
                    onClick={() => onVote(item.id, myVote === -1 ? 0 : -1)}
                    className={`p-1.5 rounded hover:bg-neutral-900 transition-colors ${
                      myVote === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-neutral-500'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Actions: Delete & Lock-in */}
                <div className="flex items-center gap-2">
                  {item.created_by === currentUserId && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 transition-all"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Lock-in button or status indicator */}
                  {(() => {
                    // Check if this item title exists in allGlobalSchedules
                    const matchedGlobal = allGlobalSchedules.find(gs => gs.title === item.title);
                    if (matchedGlobal) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold font-suit">
                            지정 완료 ({matchedGlobal.date})
                          </span>
                        </div>
                      );
                    }
                    if (isTop) {
                      return (
                        <button
                          onClick={() => onLockIn(item.id, nextClosestDate, item.title, item.type)}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded font-semibold font-suit transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" /> 공식 지정 ({nextClosestDate})
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-500 font-suit bg-neutral-900/10 rounded-xl border border-dashed border-neutral-800/80">
            등록된 추천 모의고사가 없습니다. 첫 번째 모의고사를 추천해보세요!
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-neutral-100 font-suit">새 모의고사 추천</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">모의고사 이름</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="예: 이감 6회차"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">과목 타입</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as ExamType)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-indigo-500/50"
                >
                  <option value="korean">국어</option>
                  <option value="math">수학</option>
                  <option value="both">국어+수학</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">문제지 PDF (선택)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setQuestionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">해설지 PDF (선택)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setSolutionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !newTitle.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '추천하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
