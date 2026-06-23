'use client';

import React from 'react';
import { Trophy, Coins, Settings, Lock, LockOpen, CheckCircle2, Clock, UserX } from 'lucide-react';

interface RoundData {
  exam1Title: string;
  exam2Title: string;
  doubleOrNothing: 'claim' | 'double';
  isClosed: boolean;
  doubleChoiceLocked?: boolean;
  winnerId?: string | null;
  meta: {
    absent_players1?: string[];
    absent_players2?: string[];
    [key: string]: unknown;
  };
}

interface RoundDetailProps {
  activeRoundIndex: number;
  activeRound: RoundData;
  activeResult: any;
  players: string[];
  profiles: { [key: string]: string };
  currentUserId: string;
  editingRoundIdx: number | null;
  setEditingRoundIdx: (idx: number | null) => void;
  editTitle1: string;
  setEditTitle1: (s: string) => void;
  editTitle2: string;
  setEditTitle2: (s: string) => void;
  handleSaveTitles: (rIdx: number) => Promise<void>;
  handleDoubleChange: (rIdx: number, val: 'claim' | 'double') => void;
  handleCloseRound: (rIdx: number) => Promise<void>;
  handleReopenRound: (rIdx: number) => Promise<void>;
  saveRoundField: (rIdx: number, fields: any) => Promise<void>;
  rounds: RoundData[];
  setRounds: (r: RoundData[]) => void;
  isRoundCloseUnlocked: () => boolean;
  /** 미참여 토글: examSlot 1=exam1, 2=exam2 */
  onToggleAbsent: (rIdx: number, examSlot: 1 | 2, userId: string) => Promise<void>;
}

export function SilvivalRoundDetail({
  activeRoundIndex,
  activeRound,
  activeResult,
  players,
  profiles,
  currentUserId,
  editingRoundIdx,
  setEditingRoundIdx,
  editTitle1,
  setEditTitle1,
  editTitle2,
  setEditTitle2,
  handleSaveTitles,
  handleDoubleChange,
  handleCloseRound,
  handleReopenRound,
  saveRoundField,
  rounds,
  setRounds,
  isRoundCloseUnlocked,
  onToggleAbsent,
}: RoundDetailProps) {
  const canForceClose = isRoundCloseUnlocked();

  const absent1: string[] = (activeRound.meta.absent_players1 as string[]) || [];
  const absent2: string[] = (activeRound.meta.absent_players2 as string[]) || [];

  return (
    <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800/80 space-y-5">
      {/* Round header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-900 pb-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-100 font-suit">
            Round {activeRoundIndex + 1}
            {activeRound.isClosed && (
              <span className="ml-2 text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-medium">종료됨</span>
            )}
          </h4>
          <div className="text-[11px] text-neutral-400 mt-1 space-y-0.5">
            <p>모의 1: <span className="text-neutral-200 font-medium">{activeRound.exam1Title}</span></p>
            <p>모의 2: <span className="text-neutral-200 font-medium">{activeRound.exam2Title}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit titles button */}
          {!activeRound.isClosed && editingRoundIdx !== activeRoundIndex && (
            <button
              onClick={() => {
                setEditingRoundIdx(activeRoundIndex);
                setEditTitle1(activeRound.exam1Title);
                setEditTitle2(activeRound.exam2Title);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-suit transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              실모 제목 설정
            </button>
          )}

          {/* Double or Nothing selector */}
          {!activeRound.isClosed && (
            <select
              value={activeRound.doubleOrNothing}
              onChange={e => handleDoubleChange(activeRoundIndex, e.target.value as 'claim' | 'double')}
              className="bg-neutral-950 border border-neutral-800 rounded-lg text-xs py-1.5 px-2 text-neutral-300 font-suit"
            >
              <option value="claim">💰 정산하기</option>
              <option value="double">🔥 묻고 더블</option>
            </select>
          )}

          {/* Close round button */}
          {!activeRound.isClosed && (
            <button
              onClick={() => handleCloseRound(activeRoundIndex)}
              disabled={!canForceClose}
              title={!canForceClose ? "해당 라운드의 실모 일정이 완료되어야 종료할 수 있습니다." : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-suit transition-colors ${
                canForceClose
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
              }`}
            >
              <Lock className="w-3 h-3" />
              라운드 종료
            </button>
          )}

          {activeRound.isClosed && (
            <button
              onClick={() => handleReopenRound(activeRoundIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-suit transition-colors"
            >
              <LockOpen className="w-3 h-3" />
              재개
            </button>
          )}
        </div>
      </div>

      {/* Settlement confirmed badge — shown when round is closed */}
      {activeRound.isClosed && activeResult?.winnerId && (
        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center gap-3 font-suit">
          <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-neutral-300">
              <strong>{profiles[activeResult.winnerId] || activeResult.winnerId.substring(0, 6)}</strong>님 우승　·　
              {activeRound.doubleOrNothing === 'double'
                ? <span className="text-amber-400 font-bold">묻고 더블 확정 — 다음 라운드 진행</span>
                : <span className="text-emerald-400 font-bold">정산 확정</span>
              }
            </span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
      )}

      {/* Title editing form */}
      {editingRoundIdx === activeRoundIndex && (
        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3">
          <p className="text-[11px] text-neutral-400 font-suit">
            실모 기록의 제목과 정확히 일치해야 자동으로 점수가 연동됩니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 mb-1">모의고사 1 제목</label>
              <input
                value={editTitle1}
                onChange={e => setEditTitle1(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 mb-1">모의고사 2 제목</label>
              <input
                value={editTitle2}
                onChange={e => setEditTitle2(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditingRoundIdx(null)} className="text-xs px-3 py-1.5 text-neutral-500 hover:text-neutral-300 font-suit">취소</button>
            <button
              onClick={() => handleSaveTitles(activeRoundIndex)}
              className="text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-lg font-bold"
            >저장</button>
          </div>
        </div>
      )}

      {/* Auto score display — two exam columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['exam1Title', 'exam2Title'] as const).map((key, ei) => {
          const examSlot = (ei + 1) as 1 | 2;
          const scoresRaw = activeResult ? (ei === 0 ? activeResult.scores1 : activeResult.scores2) : {};
          const zMap = activeResult ? (ei === 0 ? activeResult.z1 : activeResult.z2) : {};
          const participated = activeResult ? (ei === 0 ? activeResult.participated1 : activeResult.participated2) : [];
          const absentList = ei === 0 ? absent1 : absent2;

          return (
            <div key={ei} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">모의고사 {ei + 1}</span>
                <span className="text-[10px] text-neutral-600">{participated.length}/{players.length - absentList.length}명 제출</span>
              </div>
              <div className="space-y-1.5">
                {players.map(id => {
                  const isAbsent = absentList.includes(id);
                  const score = scoresRaw[id];
                  const z = zMap[id];
                  const submitted = score !== null && score !== undefined && !isAbsent;

                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                        isAbsent
                          ? 'bg-neutral-950/20 border-neutral-900/50 opacity-40'
                          : submitted
                            ? 'bg-neutral-950/60 border-neutral-800'
                            : 'bg-neutral-950/30 border-neutral-900 opacity-50'
                      }`}
                    >
                      <span className={`text-xs font-medium truncate max-w-[110px] ${id === currentUserId ? 'text-emerald-400' : 'text-neutral-300'}`}>
                        {profiles[id] || id.substring(0, 6)}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {isAbsent ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-suit font-medium border border-amber-500/20">미참여</span>
                            {!activeRound.isClosed && (
                              <button
                                onClick={() => onToggleAbsent(activeRoundIndex, examSlot, id)}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold font-suit transition-colors"
                              >
                                참여로 변경
                              </button>
                            )}
                          </div>
                        ) : submitted ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-200 font-bold">{score}점</span>
                            {z !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${z >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                                Z: {z.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500 text-[10px] font-suit bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-900">미입력</span>
                            {!activeRound.isClosed && (
                              <button
                                onClick={() => onToggleAbsent(activeRoundIndex, examSlot, id)}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold font-suit transition-colors border border-amber-500/20"
                              >
                                미참여 등록
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Round Result Summary */}
      {activeResult?.readyToCalc && activeResult?.winnerId && (
        <div className="pt-4 border-t border-neutral-900 space-y-3">
          <h5 className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            라운드 결과 {activeRound.isClosed ? '(확정)' : '(잠정)'}
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {players.map(id => {
              const isAbsentBoth = absent1.includes(id) && absent2.includes(id);
              const base = activeResult.baseRoundScores[id] ?? 0;
              const bonus = activeResult.bonuses[id] ?? 0;
              const final = activeResult.finalRoundScores[id] ?? 0;
              const change = activeResult.ratingChanges[id] ?? 0;
              const isWinner = activeResult.winnerId === id;
              return (
                <div key={id} className={`p-3 rounded-xl border space-y-1.5 ${isAbsentBoth ? 'opacity-40 bg-neutral-950/30 border-neutral-900' : isWinner ? 'bg-indigo-500/[0.03] border-indigo-500/25' : 'bg-neutral-950/50 border-neutral-850'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-neutral-200 truncate max-w-[80px]">{profiles[id] || id.substring(0, 6)}</span>
                    {isAbsentBoth
                      ? <span className="text-[9px] text-amber-600 font-bold">미참여</span>
                      : isWinner && <span className="text-[9px] text-indigo-400 font-bold flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5" />우승</span>
                    }
                  </div>
                  {!isAbsentBoth && (
                    <div className="text-[10px] text-neutral-400 space-y-0.5 font-suit">
                      <div className="flex justify-between"><span>Z합:</span><span className="font-mono">{base.toFixed(2)}</span></div>
                      {bonus > 0 && <div className="flex justify-between text-indigo-400"><span>더블:</span><span className="font-mono">+{bonus.toFixed(1)}</span></div>}
                      <div className="flex justify-between text-neutral-300 border-t border-neutral-900 pt-0.5"><span>합산:</span><span className="font-mono font-bold">{final.toFixed(2)}</span></div>
                      <div className={`flex justify-between ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span>레이팅:</span>
                        <span className="font-mono">{change >= 0 ? '+' : ''}{change.toFixed(0)} pt</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeResult.rewardMsg && (
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-850 text-neutral-300 text-[11px] font-suit flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {activeResult.rewardMsg}
            </div>
          )}
        </div>
      )}

      {!activeResult?.readyToCalc && (
        <div className="pt-4 border-t border-neutral-900 flex items-center gap-2 text-neutral-500 text-xs font-suit">
          <Clock className="w-4 h-4" />
          실모 점수가 2명 이상 입력되거나 라운드가 종료되면 자동으로 결과가 산출됩니다.
        </div>
      )}
    </div>
  );
}
