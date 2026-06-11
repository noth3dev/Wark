'use client';

import React from 'react';
import { useSilmo } from '../silmo-context';
import { LiveStatus } from '@/components/silmo/live-status';

export default function StatusPage() {
  const {
    liveStatuses,
    handleTickStatuses,
    currentSilmoUser,
    localPhase,
    localRemaining
  } = useSilmo();

  return (
    <div className="max-w-xl mx-auto min-h-[340px] py-4 w-full">
      <LiveStatus
        liveStatuses={liveStatuses}
        onTickStatuses={handleTickStatuses}
        localUser={currentSilmoUser}
        localActiveSessionPhase={localPhase}
        localActiveSessionSeconds={localRemaining}
      />
    </div>
  );
}
