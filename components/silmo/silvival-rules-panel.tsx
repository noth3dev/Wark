'use client';

import React from 'react';

interface SilvivalRulesPanelProps {
  isRulesExpanded: boolean;
  playersCount: number;
}

export function SilvivalRulesPanel({ isRulesExpanded, playersCount }: SilvivalRulesPanelProps) {
  if (!isRulesExpanded) return null;

  return (
    <div className="mt-4 pt-4 border-t border-neutral-900 text-neutral-400 space-y-2 font-suit text-xs leading-relaxed max-w-3xl">
      <p>🏁 <strong>1 Season</strong> = 4 Round = 모의고사 8회. 시즌 종료 후 레이팅 초기화.</p>
      <p>📊 <strong>Z-score 자동 산출</strong>: 각자 실모 점수를 입력하면 참가자 전원 평균/표준편차 기준으로 자동 보정됩니다. {playersCount}명 참여 중.</p>
      <p>📈 <strong>레이팅</strong>: 1500 시작. 라운드 점수 × 50만큼 변동 (±100 제한). 매 라운드 압축: <code>1500 + (레이팅-1500) × 0.8</code>.</p>
      <p>💰 <strong>묻고 더블</strong>: 라운드 우승 시 2,000원 정산 또는 이월 선택. 이월 시 다음 라운드 +0.3 보너스. 실패하면 누적금 전액 다음 우승자에게!</p>
      <p>🔒 <strong>라운드 종료 및 자동 정산</strong>: 목요일 23:30까지 미제출 시 0점 처리 및 자동 정산됩니다.</p>
    </div>
  );
}
