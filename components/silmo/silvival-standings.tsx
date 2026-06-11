'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Coins, Zap } from 'lucide-react';

interface SilvivalStandingsProps {
  players: string[];
  profiles: { [key: string]: string };
  finalRatings: { [id: string]: number };
  totalPayouts: { [id: string]: number };
  playerWins: { [id: string]: number };
  currentUserId: string;
  doubleChallenger: string | null;
  rewardsBank: number;
  seasonIndex: number;
}

export function SilvivalStandings({
  players,
  profiles,
  finalRatings,
  totalPayouts,
  playerWins,
  currentUserId,
  doubleChallenger,
  rewardsBank,
  seasonIndex
}: SilvivalStandingsProps) {
  return (
    <div className="space-y-5">
      <Card className="border-neutral-800 bg-neutral-950 text-neutral-100">
        <CardHeader className="border-b border-neutral-900/60 pb-3">
          <CardTitle className="text-xs font-bold text-indigo-400 font-suit uppercase tracking-wider">
            시즌 {seasonIndex + 1} 순위표
          </CardTitle>
          <CardDescription className="text-[10px] text-neutral-500">
            종료된 라운드 기준 레이팅 산출
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {players
            .map(id => ({
              id,
              name: profiles[id] || id.substring(0, 6),
              rating: finalRatings[id] ?? 1500,
              payout: totalPayouts[id] ?? 0,
              wins: playerWins[id] ?? 0,
            }))
            .sort((a, b) => b.rating - a.rating)
            .map((p, idx) => (
              <div key={p.id} className={`p-3 rounded-lg border flex items-center justify-between ${idx === 0 ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-neutral-900/40 border-neutral-800'}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${idx === 0 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-neutral-800 text-neutral-400'}`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-semibold block truncate ${p.id === currentUserId ? 'text-emerald-400' : 'text-neutral-200'}`}>
                      {p.name} {p.id === currentUserId && '(나)'}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-suit">우승 {p.wins}회</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-neutral-100">{p.rating} pt</span>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 justify-end mt-0.5">
                    <Coins className="w-3 h-3" />
                    {p.payout.toLocaleString()}원
                  </div>
                </div>
              </div>
            ))}
          {players.length === 0 && (
            <p className="text-xs text-neutral-500 text-center py-4 font-suit">실모단이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* Double or Nothing live indicator */}
      {doubleChallenger && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 font-suit space-y-2 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span className="text-xs font-bold text-indigo-200">묻고 더블 진행중!</span>
          </div>
          <p className="text-[11px] text-indigo-300">
            <strong>{profiles[doubleChallenger] || '도전자'}</strong>님 다음 라운드 <strong>+0.3 보너스</strong>
          </p>
          <div className="text-base font-bold font-mono text-emerald-400">
            누적 상금: {(rewardsBank + 2000).toLocaleString()}원
          </div>
        </div>
      )}
    </div>
  );
}
