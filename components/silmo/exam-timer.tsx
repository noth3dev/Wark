import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExamType, ExamPhase } from '@/types/silmo';
import { Play, Pause, Square, FastForward, Check, Maximize } from 'lucide-react';

interface ExamTimerProps {
  onExamComplete: (type: ExamType) => void;
  onSessionChange: (phase: ExamPhase, remaining: number, total: number, type: ExamType) => void;
  activeSessionPhase: ExamPhase;
  autoStartType?: ExamType;
  autoStartKey?: string;
  autoStartTitle?: string;
}

const KOREAN_DURATION = 80 * 60; // 80 minutes
const MATH_DURATION = 100 * 60;  // 100 minutes
const EXPLORE_DURATION = 30 * 60; // 30 minutes
const BREAK_DURATION = 30 * 60;  // 30 minutes

export function ExamTimer({ onExamComplete, onSessionChange, activeSessionPhase, autoStartType, autoStartKey, autoStartTitle }: ExamTimerProps) {
  const [selectedType, setSelectedType] = useState<ExamType>('korean');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<ExamPhase>('finished');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [isSpeedUp, setIsSpeedUp] = useState<boolean>(false);
  const [examTitle, setExamTitle] = useState<string>('실전 모의고사');
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-start logic
  useEffect(() => {
    if (autoStartType && autoStartKey && !isActive) {
      startExam(autoStartType, autoStartTitle);
    }
  }, [autoStartType, autoStartKey, isActive, autoStartTitle]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('silmo_active_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setIsActive(data.isActive);
        setIsPaused(data.isPaused);
        setSelectedType(data.type);
        setCurrentPhase(data.currentPhase);
        setTotalDuration(data.totalDuration);
        setExamTitle(data.examTitle || '실전 모의고사');
        
        if (data.isActive && !data.isPaused && data.targetEndTime) {
          const now = Date.now();
          const calculatedRemaining = (data.targetEndTime - now) / 1000;
          if (calculatedRemaining <= 0) {
            setRemainingSeconds(0);
            setTargetEndTime(null);
          } else {
            setRemainingSeconds(calculatedRemaining);
            setTargetEndTime(data.targetEndTime);
          }
        } else {
          setRemainingSeconds(data.remainingSeconds);
          setTargetEndTime(null);
        }
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }, []);

  // Save session state to localStorage and notify parent
  useEffect(() => {
    if (isActive && currentPhase !== 'finished') {
      localStorage.setItem('silmo_active_session', JSON.stringify({
        isActive,
        isPaused,
        type: selectedType,
        currentPhase,
        remainingSeconds,
        totalDuration,
        examTitle,
        targetEndTime
      }));
      onSessionChange(currentPhase, remainingSeconds, totalDuration, selectedType);
    } else {
      localStorage.removeItem('silmo_active_session');
      onSessionChange('finished', 0, 0, selectedType);
    }
  }, [isActive, isPaused, selectedType, currentPhase, remainingSeconds, totalDuration, examTitle, targetEndTime, onSessionChange]);

  // Main timer ticking effect
  useEffect(() => {
    if (isActive && !isPaused) {
      // Calculate target end time if not set yet (e.g. just unpaused or started)
      let currentTarget = targetEndTime;
      if (!currentTarget) {
        currentTarget = Date.now() + remainingSeconds * 1000 / (isSpeedUp ? 60 : 1);
        setTargetEndTime(currentTarget);
      }

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const msLeft = currentTarget! - now;
        
        if (msLeft <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRemainingSeconds(0);
          setTargetEndTime(null);
          handlePhaseTransition();
        } else {
          // Convert back to normal seconds for state
          setRemainingSeconds(msLeft / 1000 * (isSpeedUp ? 60 : 1));
        }
      }, 250); // Tick more frequently for smooth UI and accuracy
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (isPaused && targetEndTime !== null) {
        setTargetEndTime(null);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, currentPhase, isSpeedUp, targetEndTime]);

  const startExam = (type: ExamType, title?: string) => {
    let duration = 0;
    let startPhase: ExamPhase = 'finished';

    if (type === 'korean') {
      duration = KOREAN_DURATION;
      startPhase = 'korean';
    } else if (type === 'math') {
      duration = MATH_DURATION;
      startPhase = 'math';
    } else if (type === 'explore') {
      duration = EXPLORE_DURATION;
      startPhase = 'explore';
    } else if (type === 'both') {
      duration = KOREAN_DURATION;
      startPhase = 'korean';
    }

    setSelectedType(type);
    setCurrentPhase(startPhase);
    setRemainingSeconds(duration);
    setTotalDuration(duration);
    setTargetEndTime(null); // Will be calculated in the ticking effect
    setIsActive(true);
    setIsPaused(false);
    setExamTitle(title || '실전 모의고사');
  };

  const handlePhaseTransition = () => {
    if (selectedType === 'both') {
      if (currentPhase === 'korean') {
        // Transition to break
        setCurrentPhase('break');
        setRemainingSeconds(BREAK_DURATION);
        setTotalDuration(BREAK_DURATION);
        setTargetEndTime(null);
      } else if (currentPhase === 'break') {
        // Transition to math
        setCurrentPhase('math');
        setRemainingSeconds(MATH_DURATION);
        setTotalDuration(MATH_DURATION);
        setTargetEndTime(null);
      } else {
        // Both completed
        completeExam();
      }
    } else {
      // Single subject completed
      completeExam();
    }
  };

  const completeExam = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentPhase('finished');
    setRemainingSeconds(0);
    setTargetEndTime(null);
    setIsSpeedUp(false);
    onExamComplete(selectedType);
  };

  const terminateEarly = () => {
    if (confirm('시험을 여기서 중단하고 기록하시겠습니까? (현재 교시까지의 점수가 기록됩니다)')) {
      completeExam();
    }
  };

  const cancelExam = () => {
    if (confirm('정말로 응시를 취소하시겠습니까? 진행 중인 기록은 저장되지 않고 완전히 삭제됩니다.')) {
      setIsActive(false);
      setIsPaused(false);
      setCurrentPhase('finished');
      setRemainingSeconds(0);
      setTargetEndTime(null);
      setIsSpeedUp(false);
      localStorage.removeItem('silmo_active_session');
      onSessionChange('finished', 0, 0, selectedType);
    }
  };

  const skipPhase = () => {
    if (selectedType === 'both') {
      if (currentPhase === 'korean') {
        setCurrentPhase('break');
        setRemainingSeconds(BREAK_DURATION);
        setTotalDuration(BREAK_DURATION);
        setTargetEndTime(null);
      } else if (currentPhase === 'break') {
        setCurrentPhase('math');
        setRemainingSeconds(MATH_DURATION);
        setTotalDuration(MATH_DURATION);
        setTargetEndTime(null);
      } else {
        completeExam();
      }
    } else {
      completeExam();
    }
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const willPause = !prev;
      if (!willPause) {
        // If unpausing, clear target end time so it recalculates
        setTargetEndTime(null);
      }
      return willPause;
    });
  };

  const handleSpeedUpToggle = () => {
    setIsSpeedUp(!isSpeedUp);
    setTargetEndTime(null); // Recalculate target end time with new speed factor
  };

  // Time formatter (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const sInt = Math.max(0, Math.ceil(seconds));
    const h = Math.floor(sInt / 3600);
    const m = Math.floor((sInt % 3600) / 60);
    const s = sInt % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const progressPercent = totalDuration > 0
    ? ((totalDuration - remainingSeconds) / totalDuration) * 100
    : 0;

  const getPhaseName = () => {
    switch (currentPhase) {
      case 'korean': return '1교시 국어 실모';
      case 'math': return selectedType === 'both' ? '2교시 수학 실모' : '수학 실모';
      case 'explore': return '탐구 실모';
      case 'break': return '쉬는 시간';
      default: return '대기 중';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'korean': return 'bg-neutral-100 text-neutral-900 border-neutral-200';
      case 'math': return 'bg-neutral-100 text-neutral-900 border-neutral-200';
      case 'explore': return 'bg-neutral-100 text-neutral-900 border-neutral-200';
      case 'break': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-neutral-900 text-neutral-400 border-neutral-800';
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <Card ref={containerRef} className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl relative overflow-hidden h-full flex flex-col justify-between">
      <CardContent className="p-6 flex flex-col flex-1 justify-between gap-6">
        {/* Phase Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-suit">
              {isActive ? examTitle : 'Exam Timer'}
            </span>
            <h3 className="text-lg font-semibold text-neutral-100 font-suit">
              {isActive ? getPhaseName() : '새로운 모의고사'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border font-suit ${getPhaseColor()}`}>
                {currentPhase === 'break' ? '🟡 쉬는시간' : '🟢 시험 진행중'}
              </div>
            )}
            <button onClick={toggleFullscreen} className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors" title="전체화면">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer UI / Type Selector */}
        {!isActive ? (
          <div className="flex-1 flex flex-col justify-center gap-4 py-4">
            <label className="text-xs text-neutral-400 font-suit font-medium">시험 유형 선택</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['korean', 'math', 'explore', 'both'] as ExamType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`py-3 px-2 rounded-lg border text-xs font-medium font-suit transition-all duration-200 flex flex-col items-center justify-center gap-1 ${selectedType === t
                    ? 'border-neutral-200 bg-neutral-100 text-neutral-950'
                    : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                >
                  <span className="text-sm font-semibold">
                    {t === 'korean' ? '국어' : t === 'math' ? '수학' : t === 'explore' ? '탐구' : '국어 + 수학'}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {t === 'korean' ? '80분' : t === 'math' ? '100분' : t === 'explore' ? '30분' : '210분'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center py-6 gap-3">
            <span className="text-5xl md:text-6xl font-semibold font-mono tracking-tight text-neutral-100 tabular-nums select-none">
              {formatTime(remainingSeconds)}
            </span>
            
            {/* Progress Bar */}
            <div className="w-full max-w-xs h-1 bg-neutral-900 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-neutral-200 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col gap-3">
          {!isActive ? (
            <Button
              onClick={() => startExam(selectedType)}
              className="w-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-semibold font-suit text-xs py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              시험 시작하기
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={togglePause}
                  variant="outline"
                  className="flex-1 border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900 text-xs py-2 flex items-center justify-center gap-1.5 font-suit"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  {isPaused ? '다시 시작' : '일시 정지'}
                </Button>
                <Button
                  onClick={terminateEarly}
                  variant="destructive"
                  className="flex-1 bg-neutral-900 hover:bg-red-950/30 text-red-500 hover:text-red-400 border border-neutral-800 hover:border-red-900/30 text-xs py-2 flex items-center justify-center gap-1.5 font-suit transition-colors duration-200"
                >
                  <Square className="w-3 h-3 fill-current" />
                  기록하고 종료
                </Button>
              </div>
              <Button
                onClick={cancelExam}
                variant="ghost"
                className="w-full text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50 text-[10px] py-1 h-7 font-suit transition-colors"
              >
                응시 취소 (기록 안 함)
              </Button>
            </div>
          )}

          {/* Dev Debug Toolbar (Only shown when timer is running) */}
          {isActive && (
            <div className="border-t border-neutral-900 pt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] text-neutral-500 font-suit font-medium uppercase tracking-wider">Test Control:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleSpeedUpToggle}
                  className={`px-2 py-1 rounded text-[10px] font-mono border font-medium transition-all ${isSpeedUp 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-300 hover:border-neutral-700'}`}
                >
                  {isSpeedUp ? '60배속 ON' : '60배속'}
                </button>
                <button
                  onClick={skipPhase}
                  className="px-2 py-1 rounded text-[10px] font-suit border bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 font-medium transition-all flex items-center gap-1"
                >
                  <FastForward className="w-2.5 h-2.5" />
                  단계 건너뛰기
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
