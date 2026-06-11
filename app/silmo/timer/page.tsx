'use client';

import React from 'react';
import { useSilmo } from '../silmo-context';
import { ExamTimer } from '@/components/silmo/exam-timer';

export default function TimerPage() {
  const {
    handleExamComplete,
    handleSessionChange,
    localPhase,
    autoStartExamType,
    autoStartExamKey,
    prefilledTitle
  } = useSilmo();

  return (
    <div className="max-w-xl mx-auto min-h-[380px] py-4 w-full">
      <div className="w-full max-w-2xl mx-auto h-[600px]">
        <ExamTimer
          onExamComplete={handleExamComplete}
          onSessionChange={handleSessionChange}
          activeSessionPhase={localPhase}
          autoStartType={autoStartExamType}
          autoStartKey={autoStartExamKey}
          autoStartTitle={prefilledTitle}
        />
      </div>
    </div>
  );
}
