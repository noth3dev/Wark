'use client';

import React from 'react';
import { useSilmo } from '../silmo-context';
import { HistoryTable } from '@/components/silmo/history-table';
import { Leaderboard } from '@/components/silmo/leaderboard';
import { Trophy, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RecordsPage() {
  const { user: authUser } = useAuth();
  const {
    allRecords,
    personalRecords,
    globalTitles,
    allLeaderboardUsers,
    profiles
  } = useSilmo();

  if (!authUser) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* 오늘의 실모 (전역 실모) 점수 현황 */}
      <div className="lg:col-span-12 space-y-3 mb-2">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <Trophy className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-neutral-200 font-suit">
            실모 일정별 점수 현황 (전역 실모)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globalTitles.map(title => {
            const titleRecords = allRecords.filter(r => r.title === title);
            const hasTaken = personalRecords.some(r => r.title === title);

            // Sort records by totalScore descending to make a mini-leaderboard
            const sortedTitleRecords = [...titleRecords].sort((a, b) => b.totalScore - a.totalScore);

            return (
              <div key={title} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 space-y-3 hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-start border-b border-neutral-800 pb-2">
                  <span className="font-semibold text-xs text-indigo-400 truncate max-w-[150px]">{title}</span>
                  {hasTaken ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                      {titleRecords.length}명 응시
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-850 text-neutral-500 font-mono flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-neutral-500 animate-pulse" />
                      미응시
                    </span>
                  )}
                </div>

                {hasTaken ? (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
                    {sortedTitleRecords.map((r, i) => {
                      const isLocal = r.userId === authUser.id;
                      const userName = isLocal ? '나' : (profiles[r.userId] || r.userId.substring(0, 6));
                      return (
                        <div key={r.id} className="flex items-center justify-between text-[11px] font-suit font-medium">
                          <span className={isLocal ? 'text-emerald-400' : 'text-neutral-300'}>
                            {i + 1}위. {userName}
                          </span>
                          <span className="font-mono text-neutral-400">
                            {r.type === 'both' ? `평균 ${r.totalScore / 2}점` : `${r.totalScore}점`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2.5 text-center flex flex-col items-center justify-center gap-1 select-none">
                    <span className="text-[11px] text-neutral-400 font-semibold font-suit">
                      점수 비공개 (잠김)
                    </span>
                    <span className="text-[9px] text-neutral-500 font-suit leading-normal">
                      본인이 이 시험을 응시한 후에<br />다른 사람들의 점수를 볼 수 있습니다.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {/* Fallback if no global schedule has been registered yet */}
          {globalTitles.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-neutral-600 font-suit bg-neutral-950 border border-dashed border-neutral-900 rounded-xl">
              아직 진행 및 기록된 전역 실모 일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard (5 spans) */}
      <div className="lg:col-span-5 matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <Trophy className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-200 font-suit">
            경쟁 리더보드
          </h3>
        </div>
        <Leaderboard records={allRecords} users={allLeaderboardUsers} globalTitles={globalTitles} />
      </div>

      {/* History Table (7 spans) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
          <CalendarIcon className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-200 font-suit">
            내 모의고사 히스토리
          </h3>
        </div>
        <HistoryTable records={personalRecords} />
      </div>
    </div>
  );
}
