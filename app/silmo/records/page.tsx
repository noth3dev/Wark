'use client';

import React, { useState } from 'react';
import { useSilmo } from '../silmo-context';
import { HistoryTable } from '@/components/silmo/history-table';
import { Leaderboard } from '@/components/silmo/leaderboard';
import { ScheduleReviewModal } from '@/components/silmo/schedule-review-modal';
import { Trophy, Calendar as CalendarIcon, Star, FileText, Download, Lock, Users, BookOpen, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RecordsPage() {
  const { user: authUser } = useAuth();
  const {
    allRecords,
    personalRecords,
    globalTitles,
    globalSchedules,
    allLeaderboardUsers,
    profiles,
    reviews,
    handleSaveReview,
  } = useSilmo();

  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayTitles = globalSchedules.filter(s => s.date === todayKST).map(s => s.title);

  const [reviewModalTitle, setReviewModalTitle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'global'>('my');
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);

  if (!authUser) return null;

  return (
    <div className="space-y-6 w-full">
      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900/60 border border-neutral-800/80 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-suit transition-all ${activeTab === 'my'
              ? 'bg-neutral-800 text-neutral-100 shadow'
              : 'text-neutral-500 hover:text-neutral-300'
            }`}
        >
          <CalendarIcon className="w-4 h-4" />
          내 모의고사
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-suit transition-all ${activeTab === 'global'
              ? 'bg-indigo-500/10 text-indigo-400 shadow border border-indigo-500/20'
              : 'text-neutral-500 hover:text-indigo-400'
            }`}
        >
          <Trophy className="w-4 h-4" />
          전역 모의고사
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* 중앙 패널 (히스토리 or 전역 모의고사 목록) */}
        <div className="lg:col-span-8 space-y-4">

          {activeTab === 'my' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <CalendarIcon className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                  내 모의고사 히스토리
                </h3>
              </div>
              <HistoryTable records={personalRecords} />
            </div>
          )}

          {activeTab === 'global' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Trophy className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                  전역 모의고사 점수 및 총평
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {globalTitles.map(title => {
                  const titleRecords = allRecords.filter(r => r.title === title);
                  const hasTaken = personalRecords.some(r => r.title === title);
                  const myRecord = personalRecords.find(r => r.title === title);

                  const sortedTitleRecords = [...titleRecords].sort((a, b) => b.totalScore - a.totalScore);
                  const topScorer = sortedTitleRecords[0];
                  const isTopScorer = topScorer?.userId === authUser.id;
                  const review = reviews.find(r => r.scheduleTitle === title);

                  const silmodanCount = allLeaderboardUsers.length;
                  const submittedCount = titleRecords.filter(r =>
                    allLeaderboardUsers.some(u => u.id === r.userId)
                  ).length;

                  const isExpanded = expandedTitle === title;

                  return (
                    <div
                      key={title}
                      className={`rounded-xl border transition-all ${
                        isExpanded ? 'bg-neutral-900/60 border-indigo-500/30' : 'bg-neutral-900/30 border-neutral-800/60 hover:bg-neutral-900/50 hover:border-neutral-700'
                      }`}
                    >
                      {/* 컴팩트 헤더 (클릭 시 토글) */}
                      <div 
                        className="flex items-center justify-between p-3.5 cursor-pointer"
                        onClick={() => setExpandedTitle(isExpanded ? null : title)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm text-indigo-400 max-w-[200px] truncate">{title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-500 font-suit font-medium bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                              <Users className="w-2.5 h-2.5 inline mr-1 text-neutral-600" />
                              {submittedCount}/{silmodanCount}명 응시
                            </span>
                            {submittedCount >= silmodanCount && silmodanCount > 0 && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                                <Lock className="w-2 h-2" />전원 완료
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {hasTaken && myRecord ? (
                            <div className="flex items-center gap-2">
                              {isTopScorer && (
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              )}
                              <span className="text-sm font-bold font-mono text-neutral-200">{myRecord.totalScore}점</span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-500 font-suit flex items-center gap-1">
                              <Lock className="w-3 h-3" /> 미응시
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* 확장 영역 */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-neutral-800/50">
                          {hasTaken && myRecord ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              
                              {/* 좌측: 내 상세 점수 & 총평 */}
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5 bg-neutral-950/30 p-3 rounded-lg border border-neutral-800 h-fit">
                                  <div className="flex items-end gap-2">
                                    <span className="text-[10px] font-medium text-neutral-500">내 점수</span>
                                    <span className="text-lg font-bold font-mono text-neutral-100">{myRecord.totalScore}점</span>
                                    {isTopScorer && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 fill-amber-400" /> 1위
                                      </span>
                                    )}
                                  </div>
                                  {(myRecord.koreanWrongNumbers || myRecord.mathWrongNumbers) && (
                                    <div className="flex flex-col gap-1 mt-1">
                                      {myRecord.koreanWrongNumbers && (
                                        <span className="text-[11px] font-mono text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
                                          <span className="text-blue-500 font-bold mr-1">국어 오답:</span> {myRecord.koreanWrongNumbers}
                                        </span>
                                      )}
                                      {myRecord.mathWrongNumbers && (
                                        <span className="text-[11px] font-mono text-rose-400 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                                          <span className="text-rose-500 font-bold mr-1">수학 오답:</span> {myRecord.mathWrongNumbers}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-auto">
                                  {review ? (
                                    <div className="flex items-center justify-between">
                                      <a
                                        href={review.reviewPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 text-[11px] px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 transition-all font-suit font-semibold w-full"
                                      >
                                        <BookOpen className="w-3 h-3" />
                                        총평 보기
                                        <Download className="w-3 h-3 ml-1" />
                                      </a>
                                      {isTopScorer && (
                                        <button
                                          onClick={() => setReviewModalTitle(title)}
                                          className="text-[10px] px-2 py-2 ml-2 rounded text-neutral-400 hover:text-amber-400 hover:bg-amber-500/5 transition-colors font-suit shrink-0"
                                        >
                                          수정
                                        </button>
                                      )}
                                    </div>
                                  ) : isTopScorer && hasTaken ? (
                                    <button
                                      onClick={() => setReviewModalTitle(title)}
                                      className="w-full flex items-center justify-center gap-1.5 text-[11px] py-2.5 rounded-lg border border-dashed border-amber-500/30 text-amber-500/80 hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-500/5 transition-all font-suit font-semibold"
                                    >
                                      <Star className="w-3 h-3" />
                                      최고점자 총평 등록하기
                                    </button>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-600 font-suit py-2 bg-neutral-950/50 rounded-lg">
                                      <FileText className="w-3 h-3" />
                                      {hasTaken ? '아직 총평이 등록되지 않았습니다.' : '총평은 응시 후 확인 가능합니다.'}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 우측: 모든 사용자 점수 랭킹 */}
                              <div className="bg-neutral-950/50 rounded-lg border border-neutral-800 p-2">
                                <div className="text-[10px] font-semibold text-neutral-500 mb-2 px-1">실모 랭킹보드</div>
                                <div className="space-y-1 max-h-[140px] overflow-y-auto no-scrollbar pr-1">
                                  {sortedTitleRecords.map((r, i) => {
                                    const isLocal = r.userId === authUser.id;
                                    const isFirst = i === 0;
                                    const userName = isLocal ? '나' : (profiles[r.userId] || r.userId.substring(0, 6));
                                    return (
                                      <div key={r.id} className="flex items-center justify-between text-[11px] font-suit font-medium px-2 py-1.5 rounded bg-neutral-900/50">
                                        <span className={`flex items-center gap-1.5 ${isFirst ? 'text-amber-400 font-bold' : isLocal ? 'text-emerald-400 font-bold' : 'text-neutral-400'}`}>
                                          {isFirst && <Star className="w-2.5 h-2.5 fill-amber-400" />}
                                          {i + 1}위. {userName}
                                        </span>
                                        <span className="font-mono text-neutral-300">
                                          {r.type === 'both' ? `평균 ${Math.round(r.totalScore / 2)}점` : `${r.totalScore}점`}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          ) : (
                            <div className="py-6 text-center flex flex-col items-center justify-center gap-1 select-none bg-neutral-950/30 rounded-lg mt-3">
                              <Lock className="w-5 h-5 text-neutral-600 mb-1" />
                              <span className="text-[11px] text-neutral-400 font-semibold font-suit">
                                점수 비공개 (잠김)
                              </span>
                              <span className="text-[10px] text-neutral-500 font-suit leading-normal">
                                응시 후 점수와 다른 사람들의 기록을 확인할 수 있습니다.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {globalTitles.length === 0 && (
                  <div className="col-span-full py-12 text-center text-sm text-neutral-500 font-suit bg-neutral-950/50 border border-dashed border-neutral-800 rounded-xl">
                    아직 진행 및 기록된 전역 실모 일정이 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* 우측 리더보드 패널 */}
        <div className="lg:col-span-4 matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-5 space-y-4 h-fit sticky top-6">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <Trophy className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-200 font-suit">
              경쟁 리더보드
            </h3>
          </div>
          <Leaderboard
            records={allRecords}
            users={allLeaderboardUsers}
            globalTitles={globalTitles}
            todayTitles={todayTitles}
            currentUserId={authUser.id}
          />
        </div>

      </div>

      {/* 총평 등록 모달 */}
      {reviewModalTitle && (
        <ScheduleReviewModal
          scheduleTitle={reviewModalTitle}
          existingReviewUrl={reviews.find(r => r.scheduleTitle === reviewModalTitle)?.reviewPdfUrl}
          onSave={handleSaveReview}
          onClose={() => setReviewModalTitle(null)}
        />
      )}
    </div>
  );
}
