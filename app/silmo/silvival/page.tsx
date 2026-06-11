'use client';

import React, { useState } from 'react';
import { useSilmo } from '../silmo-context';
import { SilvivalLeague } from '@/components/silmo/silvival-league';
import { ExamPool } from '@/components/silmo/exam-pool';
import { useAuth } from '@/lib/auth-context';

export default function SilvivalPage() {
  const { user: authUser } = useAuth();
  const {
    allLeaderboardUsers,
    profiles,
    allRecords,
    allGlobalSchedules,
    examPool,
    handleCreateExamPool,
    handleVoteExamPool,
    handleDeleteExamPool,
    handleLockInExam,
  } = useSilmo();

  const [activeTab, setActiveTab] = useState<'league' | 'pool'>('league');

  if (!authUser) return null;

  return (
    <div className="w-full space-y-4">
      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
        <button
          onClick={() => setActiveTab('league')}
          className={`px-4 py-2 text-sm font-bold font-suit transition-colors border-b-2 ${
            activeTab === 'league'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          리그 상황
        </button>
        <button
          onClick={() => setActiveTab('pool')}
          className={`px-4 py-2 text-sm font-bold font-suit transition-colors border-b-2 ${
            activeTab === 'pool'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          모의고사 추천 풀 (Pool)
        </button>
      </div>

      {activeTab === 'league' && (
        <SilvivalLeague
          users={allLeaderboardUsers}
          profiles={profiles}
          currentUserId={authUser.id}
          allRecords={allRecords}
          allGlobalSchedules={allGlobalSchedules}
        />
      )}

      {activeTab === 'pool' && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-neutral-100 font-suit flex items-center gap-2">
              모의고사 추천 풀 (Pool)
            </h2>
            <p className="text-xs text-neutral-400 font-suit">
              앞으로 같이 풀고 싶은 모의고사를 추천하고 투표하세요. 투표수가 가장 높은 모의고사는 공식 실모(매주 화/목)로 지정됩니다.
            </p>
          </div>
          <ExamPool
            items={examPool}
            currentUserId={authUser.id}
            profiles={profiles}
            onCreate={handleCreateExamPool}
            onVote={handleVoteExamPool}
            onDelete={handleDeleteExamPool}
            onLockIn={handleLockInExam}
            allGlobalSchedules={allGlobalSchedules}
          />
        </div>
      )}
    </div>
  );
}
