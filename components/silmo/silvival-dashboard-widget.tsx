'use client';

// SILVIVAL Standing & Progress Dashboard Widget
import React, { useState, useEffect, useCallback } from 'react';
import { User, ExamRecord } from '@/types/silmo';
import { fetchSilvivalRounds } from '@/lib/services/silmoService';
import { Trophy, Zap, Lock, Coins } from 'lucide-react';

interface SilvivalDashboardWidgetProps {
  users: User[];
  profiles: { [key: string]: string };
  allRecords: ExamRecord[];
  currentUserId: string;
}

function calcZScores(scoreMap: { [id: string]: number | null }): { [id: string]: number } {
  const entries = Object.entries(scoreMap).filter(([, v]) => v !== null) as [string, number][];
  const n = entries.length;
  if (n < 2) return {};
  const mean = entries.reduce((s, [, v]) => s + v, 0) / n;
  const variance = entries.reduce((s, [, v]) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const result: { [id: string]: number } = {};
  entries.forEach(([id, v]) => { result[id] = std === 0 ? 0 : (v - mean) / std; });
  return result;
}

export function SilvivalDashboardWidget({ users, profiles, allRecords, currentUserId }: SilvivalDashboardWidgetProps) {
  const players = users.map(u => u.id);
  const [rounds, setRounds] = useState<{ exam1Title: string; exam2Title: string; doubleOrNothing: 'claim' | 'double'; isClosed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSilvivalRounds(0); // current season 0
      if (data && data.length > 0) {
        const parsed = Array.from({ length: 4 }, (_, i) => ({
          exam1Title: '',
          exam2Title: '',
          doubleOrNothing: 'claim' as const,
          isClosed: false,
        }));
        data.forEach((r: any) => {
          const idx = r.round_index;
          if (idx >= 0 && idx < 4) {
            parsed[idx] = {
              exam1Title: r.exam1_title || '',
              exam2Title: r.exam2_title || '',
              doubleOrNothing: r.double_or_nothing || 'claim',
              isClosed: r.is_closed || false,
            };
          }
        });
        setRounds(parsed);
      }
    } catch (e) {
      // silently fail on dashboard
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getScore = (title: string): { [id: string]: number | null } => {
    const result: { [id: string]: number | null } = {};
    players.forEach(id => { result[id] = null; });
    allRecords.filter(r => r.title === title).forEach(r => {
      if (players.includes(r.userId) && result[r.userId] === null) {
        result[r.userId] = r.type === 'korean' ? (r.koreanScore ?? r.totalScore)
          : r.type === 'math' ? (r.mathScore ?? r.totalScore) : r.totalScore;
      }
    });
    return result;
  };

  // Quick standings calc
  let ratings: { [id: string]: number } = {};
  players.forEach(id => { ratings[id] = 1500; });
  let wins: { [id: string]: number } = {};
  players.forEach(id => { wins[id] = 0; });
  let challenger: string | null = null;
  let bank = 0;
  let payouts: { [id: string]: number } = {};
  players.forEach(id => { payouts[id] = 0; });

  rounds.forEach(round => {
    if (!round.isClosed) return;
    const s1 = getScore(round.exam1Title);
    const s2 = getScore(round.exam2Title);
    const z1 = calcZScores(s1);
    const z2 = calcZScores(s2);

    let maxScore = -Infinity;
    let winnerId = '';
    players.forEach(id => {
      const score = (z1[id] ?? 0) + (z2[id] ?? 0) + (challenger === id ? 0.3 : 0);
      const change = Math.max(-100, Math.min(100, 50 * score));
      ratings[id] = Math.round(1500 + (ratings[id] + change - 1500) * 0.8);
      if (score > maxScore) { maxScore = score; winnerId = id; }
    });
    if (winnerId) {
      wins[winnerId] = (wins[winnerId] || 0) + 1;
      const base = 2000;
      if (challenger && challenger === winnerId) {
        bank += base;
        if (round.doubleOrNothing === 'claim') { payouts[winnerId] += bank; bank = 0; challenger = null; }
        else challenger = winnerId;
      } else if (challenger && challenger !== winnerId) {
        payouts[winnerId] += bank + base; bank = 0; challenger = null;
        if (round.doubleOrNothing === 'double') { challenger = winnerId; bank = base; }
      } else {
        bank = base;
        if (round.doubleOrNothing === 'claim') { payouts[winnerId] += base; bank = 0; }
        else challenger = winnerId;
      }
    }
  });

  const standings = players
    .map(id => ({ id, name: profiles[id] || id.substring(0, 6), rating: ratings[id] ?? 1500, payout: payouts[id] ?? 0, wins: wins[id] ?? 0 }))
    .sort((a, b) => b.rating - a.rating);

  const activeRound = rounds.findIndex(r => !r.isClosed);
  const closedCount = rounds.filter(r => r.isClosed).length;

  if (loading) return <div className="h-20 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />;
  if (rounds.length === 0) return (
    <div className="p-4 rounded-xl bg-neutral-950 border border-dashed border-neutral-800 text-center text-xs text-neutral-500 font-suit">
      SILVIVAL 데이터가 없습니다. <a href="/silmo/silvival" className="text-indigo-400 underline">리그 탭</a>에서 시작하세요.
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Standings mini */}
      <div className="md:col-span-5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-neutral-200 font-suit">시즌 순위</span>
          <span className="ml-auto text-[10px] text-neutral-500">{closedCount}/4 라운드 완료</span>
        </div>
        {standings.map((p, idx) => (
          <div key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${idx === 0 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-neutral-800 text-neutral-500'}`}>
                {idx + 1}
              </span>
              <span className={`text-xs font-semibold ${p.id === currentUserId ? 'text-emerald-400' : 'text-neutral-300'}`}>
                {p.name} {p.id === currentUserId && '(나)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-neutral-100">{p.rating} pt</span>
              {p.payout > 0 && (
                <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5 justify-end">
                  <Coins className="w-2.5 h-2.5" />{p.payout.toLocaleString()}원
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Round progress */}
      <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(rIdx => {
          const r = rounds[rIdx] || { exam1Title: '', exam2Title: '', isClosed: false, doubleOrNothing: 'claim' };
          const isActiveRound = rIdx === activeRound;
          const s1 = getScore(r.exam1Title);
          const s2 = getScore(r.exam2Title);
          const submitted1 = Object.values(s1).filter(v => v !== null).length;
          const submitted2 = Object.values(s2).filter(v => v !== null).length;

          return (
            <a
              key={rIdx}
              href="/silmo/silvival"
              className={`p-3 rounded-xl border text-center transition-all no-underline ${r.isClosed ? 'bg-neutral-950 border-neutral-700' : isActiveRound ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-neutral-950 border-neutral-800 opacity-40'}`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {r.isClosed && <Lock className="w-2.5 h-2.5 text-neutral-500" />}
                {isActiveRound && <Zap className="w-2.5 h-2.5 text-indigo-400" />}
                <span className="text-[9px] text-neutral-500 font-bold">ROUND {rIdx + 1}</span>
              </div>
              <span className="text-[10px] font-semibold block text-neutral-300">
                {r.isClosed ? '종료' : isActiveRound ? `${submitted1 + submitted2}명 진행중` : '대기'}
              </span>
              {r.doubleOrNothing === 'double' && r.isClosed && (
                <span className="text-[8px] text-amber-400">묻고 더블 🔥</span>
              )}
            </a>
          );
        })}
      </div>

      {/* Double or nothing live indicator */}
      {challenger && (
        <div className="md:col-span-12 flex items-center gap-3 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <Zap className="w-4 h-4 text-indigo-400 animate-bounce flex-shrink-0" />
          <span className="text-xs font-suit text-indigo-300">
            <strong>{profiles[challenger] || '플레이어'}</strong>님 묻고 더블 진행 중! 누적 상금: <strong className="text-emerald-400">{(bank + 2000).toLocaleString()}원</strong>
          </span>
        </div>
      )}
    </div>
  );
}
