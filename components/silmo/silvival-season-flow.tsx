'use client';

import React from 'react';
import { Lock } from 'lucide-react';

interface SeasonFlowProps {
  rounds: { doubleOrNothing: 'claim' | 'double'; isClosed: boolean }[];
  roundResults: {
    winnerId: string;
    hasEnoughData: boolean;
    participated1: string[];
    participated2: string[];
  }[];
  activeRoundIndex: number;
  setActiveRoundIndex: (idx: number) => void;
  profiles: { [key: string]: string };
  seasonIndex: number;
}

export function SilvivalSeasonFlow({
  rounds,
  roundResults,
  activeRoundIndex,
  setActiveRoundIndex,
  profiles,
  seasonIndex
}: SeasonFlowProps) {
  return (
    <div className="space-y-3">
      <h5 className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">시즌 {seasonIndex + 1} 흐름</h5>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-800 -translate-y-1/2 -z-10" />
        {[0, 1, 2, 3].map(rIdx => {
          const res = roundResults[rIdx];
          const r = rounds[rIdx];
          const isActive = activeRoundIndex === rIdx;
          const isDouble = r.doubleOrNothing === 'double' && r.isClosed;

          return (
            <div
              key={rIdx}
              onClick={() => setActiveRoundIndex(rIdx)}
              className={`p-3 rounded-xl border text-center bg-neutral-950 cursor-pointer transition-all ${
                isActive
                  ? 'border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                  : isDouble
                    ? 'border-amber-500/50'
                    : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {r.isClosed && <Lock className="w-2.5 h-2.5 text-neutral-500" />}
                <span className="text-[10px] text-neutral-500 font-bold">ROUND {rIdx + 1}</span>
              </div>
              <span className="text-xs font-semibold text-neutral-200 block truncate">
                {r.isClosed ? (profiles[res?.winnerId] || '미정') : res?.hasEnoughData ? `${res.participated1.length + res.participated2.length}명 진행중` : '대기중'}
              </span>
              <span className={`text-[9px] block mt-0.5 font-suit ${isDouble ? 'text-amber-400' : r.isClosed ? 'text-neutral-500' : 'text-neutral-600'}`}>
                {r.isClosed ? (isDouble ? '묻고 더블 🚀' : '정산 완료') : res?.hasEnoughData ? '잠정 계산중' : '미정'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
