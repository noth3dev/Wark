'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, Trophy, Coins, Settings, Plus, Trash2, ArrowRight } from 'lucide-react';

interface SimulatorUser {
  id: string;
  name: string;
  score1: string;
  score2: string;
  hasBonus: boolean;
}

export default function RulesPage() {
  // Simulator State
  const [simUsers, setSimUsers] = useState<SimulatorUser[]>([
    { id: '1', name: '참가자 A', score1: '92', score2: '88', hasBonus: false },
    { id: '2', name: '참가자 B', score1: '84', score2: '96', hasBonus: false },
    { id: '3', name: '참가자 C', score1: '78', score2: '80', hasBonus: true },
  ]);

  const addSimUser = () => {
    const nextId = String(simUsers.length + 1);
    setSimUsers([
      ...simUsers,
      { id: nextId, name: `참가자 ${String.fromCharCode(65 + simUsers.length)}`, score1: '80', score2: '80', hasBonus: false }
    ]);
  };

  const removeSimUser = (id: string) => {
    if (simUsers.length <= 2) {
      alert('최소 2명의 참가자가 필요합니다.');
      return;
    }
    setSimUsers(simUsers.filter(u => u.id !== id));
  };

  const updateSimUserField = (id: string, field: keyof SimulatorUser, value: any) => {
    setSimUsers(simUsers.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  // Z-Score calculation logic
  const calculateResults = () => {
    const validUsers = simUsers.map(u => ({
      ...u,
      val1: parseFloat(u.score1) || 0,
      val2: parseFloat(u.score2) || 0,
    }));

    const n = validUsers.length;
    
    // Exam 1 Stats
    const mean1 = validUsers.reduce((s, u) => s + u.val1, 0) / n;
    const var1 = validUsers.reduce((s, u) => s + (u.val1 - mean1) ** 2, 0) / n;
    const std1 = Math.sqrt(var1);

    // Exam 2 Stats
    const mean2 = validUsers.reduce((s, u) => s + u.val2, 0) / n;
    const var2 = validUsers.reduce((s, u) => s + (u.val2 - mean2) ** 2, 0) / n;
    const std2 = Math.sqrt(var2);

    const calculated = validUsers.map(u => {
      const z1 = std1 === 0 ? 0 : (u.val1 - mean1) / std1;
      const z2 = std2 === 0 ? 0 : (u.val2 - mean2) / std2;
      const baseTotal = z1 + z2;
      const bonus = u.hasBonus ? 0.3 : 0;
      const finalTotal = baseTotal + bonus;
      const ratingChange = Math.max(-100, Math.min(100, 50 * finalTotal));

      return {
        ...u,
        z1,
        z2,
        baseTotal,
        bonus,
        finalTotal,
        ratingChange,
      };
    });

    // Determine Winner
    let winnerId = '';
    let maxScore = -Infinity;
    calculated.forEach(u => {
      if (u.finalTotal > maxScore) {
        maxScore = u.finalTotal;
        winnerId = u.id;
      }
    });

    return {
      users: calculated,
      winnerId,
      mean1, std1,
      mean2, std2
    };
  };

  const results = calculateResults();

  return (
    <div className="w-full space-y-8 font-suit">
      {/* Intro Header */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold tracking-wider">SILVIVAL SYSTEM</span>
            <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              실바이벌 리그 규칙 및 Z-Score 시뮬레이터
            </h2>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            SILVIVAL(실바이벌)은 표준편차(Z-Score) 보정과 보너스 제도를 이용해 난이도가 다른 회차별 시험 점수를 공정하게 변환하여 점수를 겨루는 경쟁 리그 시스템입니다.
          </p>
        </div>
      </div>

      {/* Rules section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Rules List */}
        <Card className="border-neutral-800 bg-neutral-950/60 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              실바이벌 핵심 규칙 (Rules)
            </CardTitle>
            <CardDescription className="text-[10px] text-neutral-500">
              리그진행 방식 및 정산 시스템 설명
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-neutral-300 leading-relaxed font-suit">
            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">📅 시즌제 운영</span>
              <p className="text-neutral-400 text-[11px]">
                1 시즌은 총 <strong>4라운드 (모의고사 8회)</strong>로 진행됩니다. 화요일 1회, 목요일 1회의 시험을 합산하여 라운드를 정산합니다.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">📊 Z-Score 보정 및 평가</span>
              <p className="text-neutral-400 text-[11px]">
                단순 100점 만점 기준이 아니라, 해당 회차 응시자들의 <strong>평균</strong>과 <strong>표준편차</strong>를 이용해 난이도가 보정된 Z-score를 산출합니다.<br/>
                <code>Z = (내 점수 - 평균) / 표준편차</code><br/>
                두 회차의 Z-Score 합산 점수가 가장 높은 사람이 해당 라운드의 우승자가 됩니다.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">⏰ 제출 기한 및 자동 정산 (0점 처리)</span>
              <p className="text-neutral-400 text-[11px] text-amber-400/90 font-medium">
                매주 <strong>목요일 밤 11시 30분(23:30 KST)</strong>까지 점수를 제출하지 않은 인원은 <strong>자동으로 0점 처리</strong>되며 라운드가 종료 및 정산됩니다.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">💰 묻고 더블 (Double or Nothing)</span>
              <p className="text-neutral-400 text-[11px]">
                라운드 우승자는 2,000원을 즉시 정산받거나, 다음 라운드로 상금을 이월시킬 수 있습니다. 이월 선택 시 다음 라운드에서 <strong>+0.3 Z-Score 보너스</strong>를 받습니다.<br/>
                연속 우승에 성공하면 상금이 2배가 되지만, 타인에게 우승을 빼앗기면 누적 상금은 해당 라운드 우승자가 모두 획득하게 됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rating Logic */}
        <Card className="border-neutral-800 bg-neutral-950/60 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              레이팅 변동 시스템 (Rating)
            </CardTitle>
            <CardDescription className="text-[10px] text-neutral-500">
              안정적인 순위 변동을 위한 레이팅 공식
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-neutral-300 leading-relaxed font-suit">
            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">📈 레이팅 시작점</span>
              <p className="text-neutral-400 text-[11px]">
                모든 참가자는 <strong>1500 pt</strong>에서 레이팅을 시작합니다.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">🔄 라운드 변동식</span>
              <p className="text-neutral-400 text-[11px]">
                라운드 획득 Z-score 합산의 50배만큼 레이팅이 변동합니다 (최대 ±100 pt 제한).<br/>
                <code>레이팅 변동 = Max(-100, Min(100, 50 × 최종 Z-score))</code>
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-900/60 space-y-1.5">
              <span className="font-bold text-neutral-200 text-xs block">📉 레이팅 복원력 (Compression)</span>
              <p className="text-neutral-400 text-[11px]">
                특정 참가자의 레이팅 독점을 방지하고 흥미진진한 경쟁을 위해 매 라운드 종료 시 기준값인 1500점을 향해 20% 압축(보정)됩니다.<br/>
                <code>새 레이팅 = 1500 + (현재 레이팅 - 1500) × 0.8</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulator Section */}
      <Card className="border-neutral-800 bg-neutral-950 text-neutral-100">
        <CardHeader className="border-b border-neutral-900 pb-4">
          <CardTitle className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            Z-Score 시뮬레이터 (Simulator)
          </CardTitle>
          <CardDescription className="text-[10px] text-neutral-500">
            시험 점수와 묻고 더블 여부를 설정하고 결과를 확인해 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input fields */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-neutral-300">참가자 점수 설정</span>
                <button
                  onClick={addSimUser}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  참가자 추가
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {simUsers.map(u => (
                  <div key={u.id} className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-xs">
                    <input
                      type="text"
                      value={u.name}
                      onChange={e => updateSimUserField(u.id, 'name', e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 font-semibold w-24 outline-none focus:border-indigo-500/50"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] text-neutral-500">모의 1</label>
                        <input
                          type="number"
                          value={u.score1}
                          onChange={e => updateSimUserField(u.id, 'score1', e.target.value)}
                          className="w-12 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-1 text-center font-mono text-neutral-200 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] text-neutral-500">모의 2</label>
                        <input
                          type="number"
                          value={u.score2}
                          onChange={e => updateSimUserField(u.id, 'score2', e.target.value)}
                          className="w-12 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-1 text-center font-mono text-neutral-200 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => updateSimUserField(u.id, 'hasBonus', !u.hasBonus)}
                      className={`px-2 py-1.5 rounded-lg border text-[9px] font-bold font-suit transition-all ${
                        u.hasBonus
                          ? 'bg-indigo-500/20 border-indigo-500/35 text-indigo-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      더블 (+0.3)
                    </button>

                    <button
                      onClick={() => removeSimUser(u.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations and Output */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-neutral-300 block">계산 결과</span>

              {/* Group stats */}
              <div className="grid grid-cols-2 gap-3 text-[10px] text-neutral-400 font-suit">
                <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-850">
                  <span className="block font-semibold text-neutral-300 mb-0.5">모의 1 통계</span>
                  평균: {results.mean1.toFixed(1)}점 | 표준편차: {results.std1.toFixed(2)}
                </div>
                <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-850">
                  <span className="block font-semibold text-neutral-300 mb-0.5">모의 2 통계</span>
                  평균: {results.mean2.toFixed(1)}점 | 표준편차: {results.std2.toFixed(2)}
                </div>
              </div>

              {/* Leaderboard output */}
              <div className="space-y-2">
                {results.users
                  .sort((a, b) => b.finalTotal - a.finalTotal)
                  .map((u, idx) => {
                    const isWinner = results.winnerId === u.id;
                    return (
                      <div
                        key={u.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isWinner
                            ? 'bg-indigo-500/[0.03] border-indigo-500/45'
                            : 'bg-neutral-900/40 border-neutral-850'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                            isWinner ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs block text-neutral-200 truncate">{u.name}</span>
                            <span className="text-[8px] text-neutral-500 font-mono block">
                              Z1: {u.z1.toFixed(2)} | Z2: {u.z2.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 text-right">
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-neutral-200 block">
                              {u.finalTotal.toFixed(2)}
                            </span>
                            <span className={`text-[9px] font-mono ${u.ratingChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {u.ratingChange >= 0 ? '+' : ''}{u.ratingChange.toFixed(0)} pt
                            </span>
                          </div>
                          {isWinner && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0 animate-bounce">
                              <Trophy className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
