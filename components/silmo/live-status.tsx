import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LiveUserStatus, ExamPhase, ExamType } from '@/types/silmo';
import { Activity, Circle, Clock } from 'lucide-react';

interface LiveStatusProps {
  liveStatuses: LiveUserStatus[];
  onTickStatuses: () => void;
  localUser: { name: string; id: string } | null;
  localActiveSessionPhase: ExamPhase;
  localActiveSessionSeconds: number;
}

export function LiveStatus({
  liveStatuses,
  onTickStatuses,
  localUser,
  localActiveSessionPhase,
  localActiveSessionSeconds
}: LiveStatusProps) {
  
  // Set up interval to tick mock statuses and trigger updates
  useEffect(() => {
    const interval = setInterval(() => {
      onTickStatuses();
    }, 5000); // Progress every 5 seconds to simulate real activity

    return () => clearInterval(interval);
  }, [onTickStatuses]);

  // Format remaining seconds into MM:SS or HH:MM
  const formatRemaining = (sec: number | undefined) => {
    if (sec === undefined || sec <= 0) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remainingM = m % 60;
      return `${h}시간 ${remainingM}분 남음`;
    }
    return `${m}분 남음`;
  };

  const getStatusText = (status: 'active' | 'break' | 'finished', phase?: string, type?: string) => {
    if (status === 'finished') return '시험 종료';
    if (status === 'break') return '쉬는 시간';
    
    const subject = phase === 'korean' ? '국어' : phase === 'math' ? '수학' : '';
    return `${subject} 실모 응시 중`;
  };

  const getDotColor = (status: 'active' | 'break' | 'finished') => {
    if (status === 'active') return 'text-emerald-500 fill-emerald-500/20';
    if (status === 'break') return 'text-amber-500 fill-amber-500/20';
    return 'text-neutral-600 fill-neutral-800';
  };

  // Compile final statuses: prepend local user if they are taking an exam
  const displayStatuses = [...liveStatuses];
  
  if (localUser && localActiveSessionPhase !== 'finished') {
    const isBreak = localActiveSessionPhase === 'break';
    const localEntry: LiveUserStatus = {
      userId: localUser.id,
      name: `${localUser.name} (나)`,
      status: isBreak ? 'break' : 'active',
      currentPhase: localActiveSessionPhase,
      remainingSeconds: localActiveSessionSeconds
    };
    
    // Remove duplication if local user ID is in mock data
    const idx = displayStatuses.findIndex(u => u.userId === localUser.id);
    if (idx !== -1) {
      displayStatuses.splice(idx, 1);
    }
    
    // Add local user at the very top
    displayStatuses.unshift(localEntry);
  }

  return (
    <Card className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl overflow-hidden h-full flex flex-col justify-between">
      <CardContent className="p-6 flex flex-col flex-1 gap-4">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-200 font-suit">
              실시간 응시 상태
            </h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono tracking-wider animate-pulse">
            LIVE
          </span>
        </div>

        {/* Status list */}
        <div className="flex-1 overflow-y-auto no-scrollbar max-h-[260px] sm:max-h-none space-y-3 pr-1">
          {displayStatuses.map((user) => {
            const isLocal = user.name.endsWith('(나)');
            return (
              <div
                key={user.userId}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 ${
                  isLocal 
                    ? 'border-neutral-700 bg-neutral-900/50' 
                    : 'border-transparent bg-neutral-900/10 hover:bg-neutral-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Circle className={`w-2.5 h-2.5 ${getDotColor(user.status)}`} />
                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold font-suit truncate max-w-[120px] ${
                      isLocal ? 'text-neutral-100' : 'text-neutral-300'
                    }`}>
                      {user.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-suit font-medium mt-0.5">
                      {getStatusText(user.status, user.currentPhase, user.examType)}
                    </span>
                  </div>
                </div>

                {user.status !== 'finished' && user.remainingSeconds !== undefined && user.remainingSeconds > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono bg-neutral-900/80 px-2 py-0.5 border border-neutral-800 rounded">
                    <Clock className="w-2.5 h-2.5 text-neutral-500" />
                    <span>{formatRemaining(user.remainingSeconds)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {displayStatuses.length === 0 && (
            <div className="text-center py-6 text-xs text-neutral-600 font-suit font-medium">
              현재 활동 중인 사용자가 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
