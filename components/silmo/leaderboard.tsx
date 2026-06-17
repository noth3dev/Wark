'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExamRecord, User, LeaderboardEntry } from '@/types/silmo';
import { Trophy, Medal, Zap, Lock } from 'lucide-react';

interface LeaderboardProps {
  records: ExamRecord[];
  users: User[];
  globalTitles?: string[];
  // STAGE 모드용
  todayTitles?: string[];      // 오늘 전역 실모 제목 목록
  currentUserId?: string;      // 본인 확인 (STAGE 공개 여부)
}

type LeaderboardMode = 'overall' | 'stage';

export function Leaderboard({
  records,
  users,
  globalTitles = [],
  todayTitles = [],
  currentUserId,
}: LeaderboardProps) {
  const [mode, setMode] = useState<LeaderboardMode>('overall');

  const getNormalizedScore = (rec: any) => {
    if (rec.type === 'both') return ((rec.koreanScore || 0) + (rec.mathScore || 0)) / 2;
    if (rec.type === 'korean') return rec.koreanScore || 0;
    return rec.mathScore || 0;
  };

  // ── OVERALL 모드 ──────────────────────────────────────────
  const overallEntries: LeaderboardEntry[] = users.map(user => {
    const userRecords = records.filter(r => r.userId === user.id);
    const examCount = userRecords.length;

    if (examCount === 0) {
      return { userId: user.id, name: user.name, examCount: 0, avgScore: 0, highestScore: 0, recentScore: 0 };
    }

    const normalizedScores = userRecords.map(getNormalizedScore);
    const avgScore = Math.round(normalizedScores.reduce((a, s) => a + s, 0) / examCount);

    const globalScheduleRecords = globalTitles.length > 0
      ? userRecords.filter(r => globalTitles.includes(r.title))
      : userRecords;

    const highestScore = globalScheduleRecords.length > 0
      ? Math.max(...globalScheduleRecords.map(getNormalizedScore))
      : 0;

    const sortedRecords = [...userRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const recentScore = getNormalizedScore(sortedRecords[0]);

    return { userId: user.id, name: user.name, examCount, avgScore, highestScore, recentScore };
  });

  const sortedOverall = [...overallEntries].sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    if (b.highestScore !== a.highestScore) return b.highestScore - a.highestScore;
    return b.examCount - a.examCount;
  });

  // ── STAGE 모드 ────────────────────────────────────────────
  // 본인이 오늘 전역 실모를 응시했는지 확인
  const myTodayTitles = todayTitles.filter(title =>
    records.some(r => r.userId === currentUserId && r.title === title)
  );
  const hasParticipatedToday = myTodayTitles.length > 0;

  // 오늘 전역 실모 기록들 (제목 기준)
  const todayRecords = records.filter(r => todayTitles.includes(r.title));

  // STAGE: 유저별 오늘 전역 실모 합산 점수 (여러 개면 평균)
  interface StageEntry {
    userId: string;
    name: string;
    score: number;       // 표시 점수 (정규화)
    examCount: number;   // 오늘 응시 건수
  }

  const stageEntries: StageEntry[] = users.map(user => {
    const userTodayRecords = todayRecords.filter(r => r.userId === user.id);
    if (userTodayRecords.length === 0) {
      return { userId: user.id, name: user.name, score: 0, examCount: 0 };
    }
    const scores = userTodayRecords.map(getNormalizedScore);
    const avg = Math.round(scores.reduce((a, s) => a + s, 0) / scores.length);
    return { userId: user.id, name: user.name, score: avg, examCount: userTodayRecords.length };
  });

  // 응시한 사람 먼저, 그 다음 점수 내림차순
  const sortedStage = [...stageEntries].sort((a, b) => {
    if (b.examCount !== a.examCount) return b.examCount - a.examCount;
    return b.score - a.score;
  });

  // ── 공통 렌더 헬퍼 ────────────────────────────────────────
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-neutral-300 fill-neutral-300/20" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-700 fill-amber-700/20" />;
    return <span className="text-xs text-neutral-500 font-semibold font-mono tabular-nums">{rank}</span>;
  };

  const getPodiumBadgeColor = (index: number) => {
    if (index === 0) return 'border-amber-400/30 bg-amber-400/[0.02]';
    if (index === 1) return 'border-neutral-300/30 bg-neutral-300/[0.02]';
    return 'border-amber-700/30 bg-amber-700/[0.02]';
  };

  const getPodiumIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] animate-pulse" />;
    if (index === 1) return <Medal className="w-7 h-7 text-neutral-300" />;
    return <Medal className="w-6 h-6 text-amber-700" />;
  };

  // ── STAGE: 잠금 상태일 때 렌더 ───────────────────────────
  if (mode === 'stage' && !hasParticipatedToday) {
    return (
      <div className="space-y-6">
        {/* Tab */}
        <TabBar mode={mode} setMode={setMode} hasTodaySchedule={todayTitles.length > 0} />
        {todayTitles.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-600 font-suit">
            오늘 등록된 전역 실모 일정이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3 select-none">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Lock className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-sm font-semibold text-neutral-400 font-suit">점수 잠김</p>
            <p className="text-[11px] text-neutral-600 font-suit text-center leading-relaxed max-w-[180px]">
              오늘 전역 실모를 응시하고<br />점수를 입력하면 공개됩니다
            </p>
            <div className="mt-1 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-400 font-suit">
              {todayTitles.join(', ')}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── STAGE: 공개 렌더 ─────────────────────────────────────
  if (mode === 'stage') {
    const topThreeStage = sortedStage.slice(0, 3);
    const remainingStage = sortedStage.slice(3);

    return (
      <div className="space-y-4">
        <TabBar mode={mode} setMode={setMode} hasTodaySchedule={todayTitles.length > 0} />

        {/* 오늘 실모 제목 */}
        <div className="flex flex-wrap gap-1">
          {todayTitles.map(t => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-suit font-medium">
              {t}
            </span>
          ))}
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 0, 2].map(podiumIdx => {
            const entry = topThreeStage[podiumIdx];
            if (!entry) return <div key={podiumIdx} className="hidden sm:block border border-dashed border-neutral-900 rounded-xl" />;
            const rank = podiumIdx + 1;
            const isMe = entry.userId === currentUserId;
            const participated = entry.examCount > 0;

            return (
              <Card key={entry.userId} className={`border rounded-xl transition-all duration-300 hover:scale-[1.01] ${getPodiumBadgeColor(podiumIdx)}`}>
                <CardContent className="p-3 flex flex-col items-center justify-between text-center min-h-[120px] gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative">
                      {getPodiumIcon(podiumIdx)}
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-[9px] font-bold font-mono">
                        {rank}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold font-suit truncate max-w-[70px] ${isMe ? 'text-emerald-400' : 'text-neutral-100'}`}>
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {participated ? (
                      <>
                        <span className="text-lg font-bold font-mono text-neutral-100 tabular-nums leading-none">{entry.score}점</span>
                        <span className="text-[9px] text-neutral-500 font-suit mt-0.5">STAGE 점수</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-suit">미응시</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 전체 리스트 */}
        <div className="border border-neutral-800 bg-neutral-950/50 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/30 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-suit">
                <th className="py-3 px-4 text-center w-10">순위</th>
                <th className="py-3 px-4">닉네임</th>
                <th className="py-3 px-4 text-right pr-6">STAGE 점수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-xs font-suit font-medium text-neutral-300">
              {sortedStage.map((entry, index) => {
                const rank = index + 1;
                const isMe = entry.userId === currentUserId;
                const participated = entry.examCount > 0;
                return (
                  <tr key={entry.userId} className={`hover:bg-neutral-900/30 transition-colors duration-150 ${isMe ? 'bg-emerald-950/10' : ''}`}>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center">{getRankBadge(rank)}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={isMe ? 'text-emerald-400 font-semibold' : 'text-neutral-200'}>
                        {entry.name}{isMe && ' (나)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold pr-6">
                      {participated ? (
                        <span className="text-neutral-100">{entry.score}점</span>
                      ) : (
                        <span className="text-neutral-700">미응시</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── OVERALL 모드 렌더 ─────────────────────────────────────
  const topThree = sortedOverall.slice(0, 3);

  return (
    <div className="space-y-4">
      <TabBar mode={mode} setMode={setMode} hasTodaySchedule={todayTitles.length > 0} />

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 0, 2].map(podiumIdx => {
          const entry = topThree[podiumIdx];
          if (!entry) return <div key={podiumIdx} className="hidden sm:block border border-dashed border-neutral-900 rounded-xl" />;
          const rank = podiumIdx + 1;
          return (
            <Card key={entry.userId} className={`border rounded-xl transition-all duration-300 hover:scale-[1.01] ${getPodiumBadgeColor(podiumIdx)}`}>
              <CardContent className="p-4 flex flex-col items-center justify-between text-center min-h-[140px] sm:min-h-[160px] gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    {getPodiumIcon(podiumIdx)}
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-[9px] font-bold font-mono">
                      {rank}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold font-suit text-neutral-100 truncate max-w-[80px] sm:max-w-full">
                    {entry.name}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums leading-none">
                    {entry.avgScore}점
                  </span>
                  <span className="text-[10px] text-neutral-500 font-suit font-medium mt-1">평균 점수</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="border border-neutral-800 bg-neutral-950/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/30 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-suit">
                <th className="py-3 px-4 text-center w-12">순위</th>
                <th className="py-3 px-4">닉네임</th>
                <th className="py-3 px-4 text-center w-20">응시</th>
                <th className="py-3 px-4 text-right">평균</th>
                <th className="py-3 px-4 text-right">최고</th>
                <th className="py-3 px-4 text-right pr-6">최근</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-xs font-suit font-medium text-neutral-300">
              {sortedOverall.map((entry, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                return (
                  <tr key={entry.userId} className={`hover:bg-neutral-900/30 transition-colors duration-150 group ${isTopThree ? 'bg-neutral-900/10' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">{getRankBadge(rank)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-neutral-200 group-hover:text-neutral-100 ${isTopThree ? 'font-semibold' : ''}`}>
                        {entry.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-400">{entry.examCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-100 tabular-nums">{entry.avgScore}점</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-400">{entry.highestScore}점</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-400 pr-6">{entry.recentScore}점</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab Bar 서브 컴포넌트 ──────────────────────────────────
function TabBar({
  mode,
  setMode,
  hasTodaySchedule,
}: {
  mode: LeaderboardMode;
  setMode: (m: LeaderboardMode) => void;
  hasTodaySchedule: boolean;
}) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-neutral-900/60 border border-neutral-800/80 rounded-lg">
      <button
        onClick={() => setMode('overall')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-suit transition-all ${
          mode === 'overall'
            ? 'bg-neutral-800 text-neutral-100 shadow'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Trophy className="w-3 h-3" />
        전체 순위
      </button>
      <button
        onClick={() => setMode('stage')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-suit transition-all relative ${
          mode === 'stage'
            ? 'bg-indigo-500/20 text-indigo-300 shadow border border-indigo-500/20'
            : 'text-neutral-500 hover:text-indigo-400'
        }`}
      >
        <Zap className="w-3 h-3" />
        STAGE
        {hasTodaySchedule && (
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        )}
      </button>
    </div>
  );
}
