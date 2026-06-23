'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Zap, AlertCircle, Loader2, Database, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { User, ExamRecord, GlobalSchedule } from '@/types/silmo';
import {
  fetchSilvivalRounds,
  updateSilvivalRound,
  updateSilvivalRoundMeta,
  createSilvivalSeason
} from '@/lib/services/silmoService';
import { SilvivalRulesPanel } from './silvival-rules-panel';
import { SilvivalStandings } from './silvival-standings';
import { SilvivalSeasonFlow } from './silvival-season-flow';
import { SilvivalRoundDetail } from './silvival-round-detail';

interface SilvivalLeagueProps {
  users: User[];
  profiles: { [key: string]: string };
  currentUserId: string;
  allRecords: ExamRecord[]; // All silmo records from DB
  allGlobalSchedules: GlobalSchedule[];
}

interface RoundData {
  exam1Title: string;
  exam2Title: string;
  doubleOrNothing: 'claim' | 'double';
  isClosed: boolean;
  doubleChoiceLocked?: boolean;
  winnerId?: string | null;
  // meta bag — extends without new DB columns
  meta: {
    absent_players1?: string[];
    absent_players2?: string[];
    [key: string]: unknown;
  };
}

// Helper: Check if "Round Close" is unlockable (Exam 2 schedule date is reached/passed)
function checkRoundCloseUnlocked(round: RoundData, allGlobalSchedules: GlobalSchedule[]): boolean {
  // Find schedule for exam2Title, fallback to exam1Title
  const titleToFind = round.exam2Title || round.exam1Title;
  if (!titleToFind) return false;

  const schedule = allGlobalSchedules.find(s => s.title === titleToFind);
  if (!schedule) return false;

  // Compare schedule.date (YYYY-MM-DD) with today in KST
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utcMs + kstOffset * 60000);
  const todayKST = kst.toISOString().split('T')[0];

  return todayKST >= schedule.date;
}

// Calculate Z-scores for a given set of scores
function calcZScores(scoreMap: { [userId: string]: number | null }): { [userId: string]: number } {
  const entries = Object.entries(scoreMap).filter(([, v]) => v !== null) as [string, number][];
  const n = entries.length;
  if (n === 0) return {};
  if (n === 1) return { [entries[0][0]]: 0 };

  const mean = entries.reduce((s, [, v]) => s + v, 0) / n;
  const variance = entries.reduce((s, [, v]) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  const result: { [userId: string]: number } = {};
  entries.forEach(([id, v]) => {
    result[id] = std === 0 ? 0 : (v - mean) / std;
  });
  return result;
}

export function SilvivalLeague({ users, profiles, currentUserId, allRecords, allGlobalSchedules }: SilvivalLeagueProps) {
  const players = users.map(u => u.id);

  const [currentSeasonIndex, setCurrentSeasonIndex] = useState<number>(0);
  const [rounds, setRounds] = useState<RoundData[]>([
    { exam1Title: '', exam2Title: '', doubleOrNothing: 'claim', isClosed: false, doubleChoiceLocked: false, winnerId: null, meta: {} },
    { exam1Title: '', exam2Title: '', doubleOrNothing: 'claim', isClosed: false, doubleChoiceLocked: false, winnerId: null, meta: {} },
    { exam1Title: '', exam2Title: '', doubleOrNothing: 'claim', isClosed: false, doubleChoiceLocked: false, winnerId: null, meta: {} },
    { exam1Title: '', exam2Title: '', doubleOrNothing: 'claim', isClosed: false, doubleChoiceLocked: false, winnerId: null, meta: {} },
  ]);

  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(0);
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);
  const [editTitle1, setEditTitle1] = useState('');
  const [editTitle2, setEditTitle2] = useState('');

  const loadLeagueData = useCallback(async (seasonIndex: number) => {
    setLoading(true);
    try {
      const roundsData = await fetchSilvivalRounds(seasonIndex);

      const parsed: RoundData[] = Array.from({ length: 4 }, (_, i) => ({
        exam1Title: `시즌${seasonIndex + 1} ${i + 1}R 실모 A`,
        exam2Title: `시즌${seasonIndex + 1} ${i + 1}R 실모 B`,
        doubleOrNothing: 'claim' as const,
        isClosed: false,
        doubleChoiceLocked: false,
        winnerId: null,
        meta: {},
      }));

      if (roundsData && roundsData.length > 0) {
        roundsData.forEach((r: any) => {
          const idx = r.round_index;
          if (idx >= 0 && idx < 4) {
            parsed[idx] = {
              exam1Title: r.exam1_title || parsed[idx].exam1Title,
              exam2Title: r.exam2_title || parsed[idx].exam2Title,
              doubleOrNothing: (r.double_or_nothing as 'claim' | 'double') || 'claim',
              isClosed: r.is_closed || false,
              doubleChoiceLocked: r.double_choice_locked || false,
              winnerId: r.winner_id || null,
              meta: r.meta || {},
            };
          }
        });
      }
      setRounds(parsed);
      setDbError(null);

      // 로드 후 첫 번째 미종료 라운드로 자동 이동
      const firstOpenIdx = parsed.findIndex(r => !r.isClosed);
      if (firstOpenIdx !== -1) {
        setActiveRoundIndex(firstOpenIdx);
      } else {
        // 전부 종료된 경우 마지막 라운드 표시
        setActiveRoundIndex(3);
      }
    } catch (e: any) {
      setDbError(e.message || 'DB 연동 실패.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 마운트 시 현재 월(KST) 기준으로 시즌 자동 설정
  // 1월 = 시즌 1 (index 0), 6월 = 시즌 6 (index 5), ...
  useEffect(() => {
    (async () => {
      const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const monthBasedIdx = kstNow.getUTCMonth(); // 0=Jan, 5=Jun, ...
      setCurrentSeasonIndex(monthBasedIdx);

      // 해당 시즌 DB 데이터가 없으면 자동 생성
      try {
        const data = await fetchSilvivalRounds(monthBasedIdx);
        if (!data || data.length === 0) {
          await createSilvivalSeason(monthBasedIdx);
        }
      } catch {
        // 생성 실패 시 조용히 무시 (loadLeagueData에서 처리)
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLeagueData(currentSeasonIndex);
  }, [currentSeasonIndex, loadLeagueData]);

  // 가장 가까운 실모 날짜가 도래하면 라운드 자동 종료 + 정산 자동 확정 (30초마다 체크)
  useEffect(() => {
    const checkDeadline = () => {
      const activeIdx = rounds.findIndex(r => !r.isClosed);
      if (activeIdx !== -1) {
        const activeRound = rounds[activeIdx];
        if (checkRoundCloseUnlocked(activeRound, allGlobalSchedules)) {
          console.log(`[SILVIVAL] Round ${activeIdx + 1} 자동 종료 — 실모 일정 완료`);
          handleCloseRound(activeIdx);
        }
      }
    };

    checkDeadline();
    const interval = setInterval(checkDeadline, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds, allGlobalSchedules]);

  // Auto-collect scores from silmo_records for a given exam title
  // absent: user_id list excluded from scoring
  const getScoresForTitle = useCallback((title: string, absent: string[] = []): { [userId: string]: number | null } => {
    const result: { [userId: string]: number | null } = {};
    players.forEach(id => { result[id] = absent.includes(id) ? undefined as any : null; });

    const matching = allRecords.filter(r => r.title === title);
    matching.forEach(r => {
      if (players.includes(r.userId) && !absent.includes(r.userId)) {
        const rec = r as any;
        const score = r.type === 'korean' ? (rec.koreanScore ?? rec.totalScore)
          : r.type === 'math' ? (rec.mathScore ?? rec.totalScore)
            : rec.totalScore;
        if (result[r.userId] === null) {
          result[r.userId] = score;
        }
      }
    });
    return result;
  }, [allRecords, players]);

  /** meta 패치 저장 후 로컈 스테이트도 업데이트 */
  const handleUpdateMeta = useCallback(async (
    rIdx: number,
    patch: Record<string, unknown>
  ) => {
    const updated = [...rounds];
    updated[rIdx] = { ...updated[rIdx], meta: { ...updated[rIdx].meta, ...patch } };
    setRounds(updated);
    if (!dbError) {
      await updateSilvivalRoundMeta(currentSeasonIndex, rIdx, patch);
    }
  }, [rounds, dbError, currentSeasonIndex]);

  /** 라운드의 특정 시험에서 유저의 미참여 상태를 토글 */
  const handleToggleAbsent = useCallback(async (
    rIdx: number,
    examSlot: 1 | 2,
    userId: string
  ) => {
    const key = examSlot === 1 ? 'absent_players1' : 'absent_players2';
    const current: string[] = (rounds[rIdx].meta[key] as string[]) || [];
    const next = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    await handleUpdateMeta(rIdx, { [key]: next });
  }, [rounds, handleUpdateMeta]);

  const saveRoundField = async (
    rIdx: number,
    fields: {
      exam1_title?: string;
      exam2_title?: string;
      double_or_nothing?: string;
      is_closed?: boolean;
      double_choice_locked?: boolean;
      winner_id?: string | null;
    }
  ) => {
    setSyncing(true);
    try {
      await updateSilvivalRound(currentSeasonIndex, rIdx, fields);
    } catch (e) {
      console.error('Failed to sync round update:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleDoubleChange = (rIdx: number, val: 'claim' | 'double') => {
    const updated = [...rounds];
    updated[rIdx] = { ...updated[rIdx], doubleOrNothing: val };
    setRounds(updated);
    if (!dbError) saveRoundField(rIdx, { double_or_nothing: val });
  };

  const handleSaveTitles = async (rIdx: number) => {
    const updated = [...rounds];
    updated[rIdx] = { ...updated[rIdx], exam1Title: editTitle1, exam2Title: editTitle2 };
    setRounds(updated);
    setEditingRoundIdx(null);
    if (!dbError) await saveRoundField(rIdx, { exam1_title: editTitle1, exam2_title: editTitle2 });
  };

  const handleCloseRound = async (rIdx: number) => {
    const res = roundResults[rIdx];
    const computedWinnerId = res?.winnerId || null;
    // 현재 설정값 유지 (설정 안 됐으면 'claim' 기본값으로 자동 정산)
    const choiceToLock = rounds[rIdx]?.doubleOrNothing || 'claim';

    const updated = [...rounds];
    updated[rIdx] = {
      ...updated[rIdx],
      isClosed: true,
      winnerId: computedWinnerId,
      doubleOrNothing: choiceToLock,
      doubleChoiceLocked: true // 자동으로 정산 확정
    };
    setRounds(updated);
    if (!dbError) {
      await saveRoundField(rIdx, {
        is_closed: true,
        winner_id: computedWinnerId,
        double_or_nothing: choiceToLock,
        double_choice_locked: true
      });
    }
  };

  const handleReopenRound = async (rIdx: number) => {
    const updated = [...rounds];
    updated[rIdx] = {
      ...updated[rIdx],
      isClosed: false,
      winnerId: null,
      doubleChoiceLocked: false
    };
    setRounds(updated);
    if (!dbError) {
      await saveRoundField(rIdx, {
        is_closed: false,
        winner_id: null,
        double_choice_locked: false
      });
    }
  };

  const handleNewSeason = async () => {
    if (!confirm(`새로운 시즌(시즌 ${currentSeasonIndex + 2})을 시작하시겠습니까?`)) return;
    try {
      setLoading(true);
      const newIdx = currentSeasonIndex + 1;
      await createSilvivalSeason(newIdx);
      setCurrentSeasonIndex(newIdx);
      setActiveRoundIndex(0);
    } catch (e) {
      alert('새 시즌 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ── Compute league standings from records ──────────────────────────────────

  let currentRatings: { [id: string]: number } = {};
  players.forEach(id => { currentRatings[id] = 1500; });

  let rewardsBank = 0;
  let doubleChallenger: string | null = null;
  const playerWins: { [id: string]: number } = {};
  players.forEach(id => { playerWins[id] = 0; });

  const roundResults = rounds.map((round, rIdx) => {
    const absent1: string[] = (round.meta.absent_players1 as string[]) || [];
    const absent2: string[] = (round.meta.absent_players2 as string[]) || [];

    const scores1Raw = { ...getScoresForTitle(round.exam1Title, absent1) };
    const scores2Raw = { ...getScoresForTitle(round.exam2Title, absent2) };

    if (round.isClosed) {
      players.forEach(id => {
        // absent 유저(undefined)는 제외, 미입력(null)만 0점으로 처리
        if (scores1Raw[id] === null) scores1Raw[id] = 0;
        if (scores2Raw[id] === null) scores2Raw[id] = 0;
      });
    }

    const participated1 = Object.entries(scores1Raw).filter(([, v]) => v !== null && v !== undefined) as [string, number][];
    const participated2 = Object.entries(scores2Raw).filter(([, v]) => v !== null && v !== undefined) as [string, number][];

    const hasEnoughData = participated1.length >= 2 || participated2.length >= 2;
    const readyToCalc = round.isClosed || hasEnoughData;

    const z1 = calcZScores(scores1Raw);
    const z2 = calcZScores(scores2Raw);

    const baseRoundScores: { [id: string]: number } = {};
    const finalRoundScores: { [id: string]: number } = {};
    const bonuses: { [id: string]: number } = {};

    players.forEach(id => {
      const zs1 = z1[id] ?? 0;
      const zs2 = z2[id] ?? 0;
      baseRoundScores[id] = zs1 + zs2;
      const bonus = doubleChallenger === id ? 0.3 : 0;
      bonuses[id] = bonus;
      finalRoundScores[id] = zs1 + zs2 + bonus;
    });

    let winnerId = '';
    let maxScore = -Infinity;
    players.forEach(id => {
      if (finalRoundScores[id] > maxScore) {
        maxScore = finalRoundScores[id];
        winnerId = id;
      }
    });

    const ratingChanges: { [id: string]: number } = {};
    players.forEach(id => {
      const change = Math.max(-100, Math.min(100, 50 * finalRoundScores[id]));
      ratingChanges[id] = change;
      if (readyToCalc) {
        currentRatings[id] = Math.round((currentRatings[id] || 1500) + change);
        currentRatings[id] = Math.round(1500 + (currentRatings[id] - 1500) * 0.8);
      }
    });

    let rewardMsg = '';
    const rewardPayout: { [id: string]: number } = {};
    players.forEach(id => { rewardPayout[id] = 0; });

    const base = 2000;
    if (readyToCalc && winnerId) {
      playerWins[winnerId] = (playerWins[winnerId] || 0) + 1;

      if (doubleChallenger !== null) {
        if (winnerId === doubleChallenger) {
          rewardsBank += base;
          if (round.doubleOrNothing === 'claim') {
            rewardPayout[winnerId] = rewardsBank;
            rewardMsg = `${profiles[winnerId] || '우승자'}님 묻고 더블 정산! ${rewardsBank.toLocaleString()}원 획득 🎉`;
            rewardsBank = 0;
            doubleChallenger = null;
          } else {
            rewardMsg = `${profiles[winnerId] || '우승자'}님 또 묻고 더블! 누적: ${(rewardsBank).toLocaleString()}원 🚀`;
            doubleChallenger = winnerId;
          }
        } else {
          const stolen = rewardsBank + base;
          rewardPayout[winnerId] = stolen;
          rewardMsg = `${profiles[doubleChallenger] || '도전자'}님 실패! ${profiles[winnerId] || '우승자'}님이 ${stolen.toLocaleString()}원 꿀꺽 😈`;
          rewardsBank = 0;
          doubleChallenger = null;
          if (round.doubleOrNothing === 'double') {
            doubleChallenger = winnerId;
            rewardsBank = base;
          }
        }
      } else {
        rewardsBank = base;
        if (round.doubleOrNothing === 'claim') {
          rewardPayout[winnerId] = base;
          rewardMsg = `${profiles[winnerId] || '우승자'}님 정산 완료: ${base.toLocaleString()}원 획득 💰`;
          rewardsBank = 0;
          doubleChallenger = null;
        } else {
          doubleChallenger = winnerId;
          rewardMsg = `${profiles[winnerId] || '우승자'}님 묻고 더블 신청! 다음 라운드 +0.3 보너스 🔥`;
        }
      }
    }

    return {
      roundIndex: rIdx,
      scores1: scores1Raw,
      scores2: scores2Raw,
      participated1: participated1.map(([id]) => id),
      participated2: participated2.map(([id]) => id),
      absent1: (round.meta.absent_players1 as string[]) || [],
      absent2: (round.meta.absent_players2 as string[]) || [],
      z1, z2,
      baseRoundScores,
      finalRoundScores,
      bonuses,
      winnerId,
      ratingChanges,
      ratingsAfterRound: { ...currentRatings },
      rewardMsg,
      rewardPayout,
      hasEnoughData,
      readyToCalc,
    };
  });

  const finalRatings = roundResults[roundResults.length - 1]?.ratingsAfterRound || currentRatings;
  const totalPayouts: { [id: string]: number } = {};
  players.forEach(id => {
    totalPayouts[id] = roundResults.reduce((s, r) => s + (r.rewardPayout[id] || 0), 0);
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 p-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
        <span className="text-xs font-suit">리그 정보를 불러오는 중...</span>
      </div>
    );
  }

  const activeResult = roundResults[activeRoundIndex];
  const activeRound = rounds[activeRoundIndex];

  return (
    <div className="space-y-6">
      {/* DB status bar */}
      {dbError ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs font-suit">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold block">실바이벌 테이블 오류:</span>
            <p className="text-neutral-400">{dbError}</p>
            <p className="text-neutral-500 mt-1 text-[10px]">
              `script/014_silvival_enhancements.sql`을 Supabase에서 실행해주세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 text-xs font-suit">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>DB 정상</span>
          </div>
          {syncing && <div className="flex items-center gap-1 text-[10px]"><Loader2 className="w-3 h-3 animate-spin" />동기화중...</div>}
        </div>
      )}

      {/* Header */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold tracking-wider uppercase animate-pulse">SILMO LEAGUE</span>
              <h2 className="text-lg font-bold text-neutral-100 font-suit flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-400" />
                SILVIVAL (실바이벌)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 font-suit">
              각자 실모 점수를 입력하면 자동으로 Z-score와 레이팅이 산출됩니다. ({players.length}명 참여)
            </p>
          </div>
          <button
            onClick={() => setIsRulesExpanded(x => !x)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 transition-colors text-xs font-semibold font-suit"
          >
            {isRulesExpanded ? '규칙 접기' : '규칙 보기'}
          </button>
        </div>

        {/* Season nav */}
        <div className="mt-4 pt-4 border-t border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSeasonIndex(Math.max(0, currentSeasonIndex - 1))}
              disabled={currentSeasonIndex === 0}
              className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-indigo-300 font-suit">시즌 {currentSeasonIndex + 1}</span>
            <button
              onClick={() => setCurrentSeasonIndex(currentSeasonIndex + 1)}
              className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleNewSeason}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs font-bold font-suit transition-colors"
          >
            + 새 시즌 시작
          </button>
        </div>

        {/* Extracted Rules Panel */}
        <SilvivalRulesPanel isRulesExpanded={isRulesExpanded} playersCount={players.length} />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Standings */}
        <div className="lg:col-span-4">
          <SilvivalStandings
            players={players}
            profiles={profiles}
            finalRatings={finalRatings}
            totalPayouts={totalPayouts}
            playerWins={playerWins}
            currentUserId={currentUserId}
            doubleChallenger={doubleChallenger}
            rewardsBank={rewardsBank}
            seasonIndex={currentSeasonIndex}
          />
        </div>

        {/* Right: Round details & Season Flow */}
        <div className="lg:col-span-8 space-y-5">
          {/* Round Selector Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <h3 className="text-sm font-semibold text-neutral-200 font-suit flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-400" />
              라운드 현황
            </h3>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(rIdx => {
                const r = rounds[rIdx];
                return (
                  <button
                    key={rIdx}
                    onClick={() => setActiveRoundIndex(rIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-suit transition-all flex items-center gap-1 ${activeRoundIndex === rIdx
                      ? 'bg-indigo-500 text-white'
                      : r.isClosed
                        ? 'bg-neutral-900 border border-neutral-700 text-neutral-400'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-200'
                      }`}
                  >
                    {r.isClosed && <Lock className="w-2.5 h-2.5" />}
                    R{rIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Round Detail Panel */}
          <SilvivalRoundDetail
            activeRoundIndex={activeRoundIndex}
            activeRound={activeRound}
            activeResult={activeResult}
            players={players}
            profiles={profiles}
            currentUserId={currentUserId}
            editingRoundIdx={editingRoundIdx}
            setEditingRoundIdx={setEditingRoundIdx}
            editTitle1={editTitle1}
            setEditTitle1={setEditTitle1}
            editTitle2={editTitle2}
            setEditTitle2={setEditTitle2}
            handleSaveTitles={handleSaveTitles}
            handleDoubleChange={handleDoubleChange}
            handleCloseRound={handleCloseRound}
            handleReopenRound={handleReopenRound}
            saveRoundField={saveRoundField}
            rounds={rounds}
            setRounds={setRounds}
            isRoundCloseUnlocked={() => checkRoundCloseUnlocked(activeRound, allGlobalSchedules)}
            onToggleAbsent={handleToggleAbsent}
          />

          {/* Season Flow Progression Summary */}
          <SilvivalSeasonFlow
            rounds={rounds}
            roundResults={roundResults}
            activeRoundIndex={activeRoundIndex}
            setActiveRoundIndex={setActiveRoundIndex}
            profiles={profiles}
            seasonIndex={currentSeasonIndex}
          />
        </div>
      </div>
    </div>
  );
}
