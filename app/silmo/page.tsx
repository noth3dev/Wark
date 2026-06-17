'use client';

import React from 'react';
import { useSilmo } from './silmo-context';
import { DashboardCards } from '@/components/silmo/dashboard-cards';
import { ExamTimer } from '@/components/silmo/exam-timer';
import { Leaderboard } from '@/components/silmo/leaderboard';
import { LiveStatus } from '@/components/silmo/live-status';
import { HistoryTable } from '@/components/silmo/history-table';
import { CalendarIcon, Trophy, Plus, Zap, FileText, Download, Lock, Swords } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SilvivalDashboardWidget } from '@/components/silmo/silvival-dashboard-widget';
// Force rebuild import tag

export default function SilmoDashboardPage() {
  const { user: authUser } = useAuth();
  const {
    globalSchedules,
    personalRecords,
    localPhase,
    profiles,
    isSilmodan,
    setIsGlobalScheduleModalOpen,
    setGlobalScheduleDate,
    handleDeleteGlobalSchedule,
    handleTakeGlobalSchedule,
    allRecords,
    allLeaderboardUsers,
    globalTitles,
    handleExamComplete,
    handleSessionChange,
    autoStartExamType,
    autoStartExamKey,
    prefilledTitle,
    liveStatuses,
    handleTickStatuses,
    currentSilmoUser,
    localRemaining,
    allGlobalSchedules,
  } = useSilmo();

  // 오늘 날짜 (KST 기준 YYYY-MM-DD)
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 오늘 전역 실모 제목 목록
  const todayTitles = globalSchedules
    .filter(s => s.date === todayKST)
    .map(s => s.title);

  // Active round game titles
  const activeRoundTitles = allGlobalSchedules
    .filter(s => s.is_round_game && !s.isClosed)
    .map(s => s.title);

  const filteredPersonalRecords = personalRecords.filter(r => !activeRoundTitles.includes(r.title));
  const filteredAllRecords = allRecords.filter(r => !activeRoundTitles.includes(r.title));
  const filteredGlobalTitles = globalTitles.filter(title => {
    const schedule = allGlobalSchedules.find(s => s.title === title);
    if (schedule?.is_round_game && !schedule.isClosed) return false;
    return true;
  });

  if (!authUser) return null;

  return (
    <div className="space-y-6 w-full">
      {/* Global Schedules Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-200 font-suit flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            실모 일정 (오늘 및 예정된 실모)
          </h3>
          <button
            onClick={() => {
              setGlobalScheduleDate(new Date().toISOString().split('T')[0]);
              setIsGlobalScheduleModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 transition-colors text-xs font-semibold font-suit"
          >
            <Plus className="w-3.5 h-3.5" />
            등록하기
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {globalSchedules.map(schedule => {
            const isCompleted = personalRecords.some(r => r.title === schedule.title);
            const isRunning = localPhase !== 'finished';
            const isSilvival = schedule.is_silvival;
            const isRound = schedule.is_round_game;
            // 해당 날짜가 오늘이거나 지난 경우에만 응시 가능
            const isDateReached = schedule.date <= todayKST;
            // 본인이 만든 일정이면 삭제 가능 (silvival 고정 일정 포함)
            const canDelete = schedule.createdBy === authUser.id || isSilmodan;
            const isClosed = schedule.isClosed;

            return (
              <div
                key={schedule.id}
                className={`p-4 rounded-xl flex flex-col gap-3 hover:border-opacity-80 transition-colors border ${
                  isRound
                    ? 'bg-indigo-950/30 border-indigo-500 border-2 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-indigo-400'
                    : isSilvival
                      ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isRound && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold flex items-center gap-0.5 flex-shrink-0">
                          <Swords className="w-2.5 h-2.5" />대항전
                        </span>
                      )}
                      {isSilvival && !isRound && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold flex items-center gap-0.5 flex-shrink-0">
                          <Zap className="w-2.5 h-2.5" />SILVIVAL
                        </span>
                      )}
                      <span className={`font-semibold text-sm truncate ${isRound || isSilvival ? 'text-indigo-100' : 'text-neutral-100'}`}>
                        {schedule.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-medium font-suit">{schedule.date}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${isRound || isSilvival ? 'bg-indigo-500/10 text-indigo-400' : 'bg-neutral-800 text-neutral-400'}`}>
                      {schedule.type === 'korean' ? '국어' : schedule.type === 'math' ? '수학' : '국어+수학'}
                    </span>
                    {isClosed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-500 border border-neutral-700/50 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />종료
                      </span>
                    )}
                    {canDelete && handleDeleteGlobalSchedule && (
                      <button
                        onClick={() => handleDeleteGlobalSchedule(schedule.id, schedule.title)}
                        className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all font-semibold cursor-pointer"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-neutral-500 font-suit">
                    {isRound ? '학교 대항전 실모' : isSilvival ? '실바이벌 지정 실모' : `등록자: ${profiles[schedule.createdBy] || (schedule.createdBy && schedule.createdBy.substring(0, 6)) || '알수없음'}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* PDF links */}
                    {schedule.questionPdfUrl && (
                      <a href={schedule.questionPdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] px-1.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                        title="문제지 다운로드"
                      >
                        <FileText className="w-3 h-3" />문제 <Download className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {schedule.solutionPdfUrl && (
                      <a href={schedule.solutionPdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] px-1.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                        title="해설지 다운로드"
                      >
                        <FileText className="w-3 h-3" />해설 <Download className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {/* 응시 버튼 or 상태 */}
                    {isClosed ? (
                      <span className="px-3 py-1.5 rounded bg-neutral-800/60 text-neutral-600 border border-neutral-800 text-xs font-semibold select-none">
                        종료됨
                      </span>
                    ) : isCompleted ? (
                      <span className="px-3 py-1.5 rounded bg-neutral-800/60 text-neutral-500 border border-neutral-850/30 text-xs font-semibold select-none">
                        완료됨
                      </span>
                    ) : isRound ? (
                      <a
                        href="/silmo/round"
                        className="px-3 py-1.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-all"
                      >
                        이동
                      </a>
                    ) : !isDateReached ? (
                      <span className="px-3 py-1.5 rounded bg-neutral-900 text-neutral-600 border border-neutral-800 text-xs font-semibold select-none font-suit">
                        {schedule.date} 응시 가능
                      </span>
                    ) : (
                      <button
                        disabled={isRunning}
                        onClick={() => handleTakeGlobalSchedule(schedule)}
                        className={`px-3 py-1.5 rounded border text-xs font-semibold transition-all ${isRunning
                            ? 'bg-neutral-900 text-neutral-600 border-neutral-850 cursor-not-allowed'
                            : isSilvival
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                      >
                        응시
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {globalSchedules.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-500 text-xs font-suit bg-neutral-900/50">
              예정된 전역 실모 일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Top aggregate stats cards */}
      <DashboardCards records={filteredPersonalRecords} />

      {/* 3-Column main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Timer Panel */}
        <div className="lg:col-span-4 min-h-[380px] lg:min-h-0">
          <ExamTimer
            onExamComplete={handleExamComplete}
            onSessionChange={handleSessionChange}
            activeSessionPhase={localPhase}
            autoStartType={autoStartExamType}
            autoStartKey={autoStartExamKey}
            autoStartTitle={prefilledTitle}
          />
        </div>

        {/* Live Status Panel */}
        <div className="lg:col-span-4 min-h-[340px] lg:min-h-0">
          <LiveStatus
            liveStatuses={liveStatuses}
            onTickStatuses={handleTickStatuses}
            localUser={currentSilmoUser}
            localActiveSessionPhase={localPhase}
            localActiveSessionSeconds={localRemaining}
          />
        </div>

        {/* Leaderboard Panel */}
        <div className="lg:col-span-4">
          <div className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-4 h-full space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Trophy className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                경쟁 리더보드
              </h3>
            </div>
            <Leaderboard
              records={filteredAllRecords}
              users={allLeaderboardUsers}
              globalTitles={filteredGlobalTitles}
              todayTitles={todayTitles}
              currentUserId={authUser.id}
            />
          </div>
        </div>
      </div>

      {/* History Table Panel */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <CalendarIcon className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-200 font-suit">
            내 모의고사 히스토리
          </h3>
        </div>
        <HistoryTable records={filteredPersonalRecords} />
      </div>

      {/* SILVIVAL League Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-neutral-200 font-suit">
              SILVIVAL 리그 현황
            </h3>
          </div>
          <a href="/silmo/silvival" className="text-xs text-indigo-400 hover:text-indigo-300 font-suit transition-colors">
            자세히 보기 →
          </a>
        </div>
        <SilvivalDashboardWidget
          users={allLeaderboardUsers}
          profiles={profiles}
          allRecords={allRecords}
          currentUserId={authUser.id}
        />
      </div>
    </div>
  );
}
