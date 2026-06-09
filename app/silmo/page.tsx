'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import Auth from '@/components/Auth';

import { DashboardCards } from '@/components/silmo/dashboard-cards';
import { ExamTimer } from '@/components/silmo/exam-timer';
import { Leaderboard } from '@/components/silmo/leaderboard';
import { LiveStatus } from '@/components/silmo/live-status';
import { HistoryTable } from '@/components/silmo/history-table';
import { ScoreModal } from '@/components/silmo/score-modal';
import { WeeklyCalendar, ScheduledExam } from '@/components/silmo/weekly-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { ExamRecord, ExamType, ExamPhase, LiveUserStatus, User, GlobalSchedule } from '@/types/silmo';
import {
  fetchSilmoRecords,
  fetchUserProfiles,
  fetchActiveExamSessions,
  saveScoreRecord,
  upsertActiveExamSession,
  deleteActiveExamSession,
  fetchGlobalSchedules,
  createGlobalSchedule,
  fetchAllGlobalSchedules
} from '@/lib/services/silmoService';
import { Calendar as CalendarIcon, Trophy, Loader2, Database, AlertCircle, Clock, Activity, BarChart2, Plus } from 'lucide-react';

export default function SilmoPage() {
  const { user: authUser, profileName, loading: authLoading } = useAuth();

  // Database vs Local fallback status
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  // Active Tab State (to handle conditional timer mounting safely)
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // States
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<LiveUserStatus[]>([]);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);
  const [finishedExamType, setFinishedExamType] = useState<ExamType | null>(null);

  // Prefilled title and schedule ID states for ScoreModal
  const [prefilledTitle, setPrefilledTitle] = useState<string>('');
  const [completedScheduleId, setCompletedScheduleId] = useState<string | null>(null);

  // Weekly Calendar scheduled exams
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);

  // Global Schedules
  const [globalSchedules, setGlobalSchedules] = useState<GlobalSchedule[]>([]);
  const [globalTitles, setGlobalTitles] = useState<string[]>([]);
  const [autoStartExamType, setAutoStartExamType] = useState<ExamType | undefined>(undefined);
  const [autoStartExamKey, setAutoStartExamKey] = useState<string | undefined>(undefined);
  
  const [isGlobalScheduleModalOpen, setIsGlobalScheduleModalOpen] = useState(false);
  const [globalScheduleTitle, setGlobalScheduleTitle] = useState('');
  const [globalScheduleType, setGlobalScheduleType] = useState<ExamType>('korean');
  const [globalScheduleDate, setGlobalScheduleDate] = useState<string>('');

  // Profile map for mapping UUIDs to display names
  const [profiles, setProfiles] = useState<{ [key: string]: string }>({});

  // Local active exam status (for live status feed integration)
  const [localPhase, setLocalPhase] = useState<ExamPhase>('finished');
  const [localRemaining, setLocalRemaining] = useState<number>(0);
  const [localTotal, setLocalTotal] = useState<number>(0);

  // Refs for throttling DB writes
  const lastDbUpdateRef = useRef<number>(0);
  const prevPhaseRef = useRef<ExamPhase>('finished');

  // Local user profile definition
  const currentSilmoUser: User = {
    id: authUser?.id || 'guest',
    name: profileName || authUser?.email?.split('@')[0] || '나'
  };

  // 1. Fetch DB records, profiles, and active sessions
  const fetchDbData = useCallback(async () => {
    if (!authUser) return;

    try {
      // Fetch records & profiles & sessions in parallel
      const todayStr = new Date().toISOString().split('T')[0];
      const [recordsData, profilesData, sessionsData, globalSchedulesData, allGlobalSchedulesData] = await Promise.all([
        fetchSilmoRecords(),
        fetchUserProfiles(),
        fetchActiveExamSessions(),
        fetchGlobalSchedules(todayStr),
        fetchAllGlobalSchedules()
      ]);

      // Setup profiles lookup map
      const profileMap: { [key: string]: string } = {};
      profilesData?.forEach(p => {
        profileMap[p.id] = p.display_name;
      });
      setProfiles(profileMap);

      const uniqueGlobalTitles = Array.from(new Set((allGlobalSchedulesData || []).map(s => s.title)));
      setGlobalTitles(uniqueGlobalTitles);

      const formattedGlobalSchedules: GlobalSchedule[] = (globalSchedulesData || []).map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        type: s.type as ExamType,
        createdBy: s.created_by,
        createdAt: s.created_at
      }));
      setGlobalSchedules(formattedGlobalSchedules);

      // Format records
      const formattedRecords: ExamRecord[] = (recordsData || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title || '실전 모의고사',
        type: r.type as ExamType,
        koreanScore: r.korean_score,
        mathScore: r.math_score,
        totalScore: r.total_score,
        createdAt: r.created_at
      }));

      setRecords(formattedRecords);
      setIsDbConnected(true);
      setDbErrorMsg(null);

      // Format active DB sessions
      const activeSessions: LiveUserStatus[] = (sessionsData || [])
        .filter(s => s.user_id !== authUser.id) // Exclude current user
        .map(s => ({
          userId: s.user_id,
          name: profileMap[s.user_id] || s.user_id.split('-')[0] || 'User',
          status: s.status as 'active' | 'break' | 'finished',
          currentPhase: s.current_phase as ExamPhase,
          examType: s.exam_type as ExamType,
          remainingSeconds: s.remaining_seconds
        }));

      setLiveStatuses(activeSessions);

    } catch (err: any) {
      console.error('Database query failed. Falling back to local storage:', err);
      // Determine if it is a missing table error
      if (err.message?.includes('relation') || err.code === 'PGRST116') {
        setDbErrorMsg('데이터베이스 테이블이 아직 존재하지 않습니다. SQL 스크립트를 먼저 실행해주세요.');
      } else {
        setDbErrorMsg(err.message || '데이터베이스 연결 실패. 로컬 모드로 동작합니다.');
      }
      setIsDbConnected(false);
      loadFallbackLocalData();
    }
  }, [authUser]);

  // Load fallback data from localStorage
  const loadFallbackLocalData = () => {
    const saved = localStorage.getItem('silmo_user_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        setRecords([]);
      }
    } else {
      setRecords([]);
    }
    setLiveStatuses([]);
  };

  // Initial load
  useEffect(() => {
    if (authUser) {
      fetchDbData();

      // Load weekly schedule from localStorage
      const savedSchedule = localStorage.getItem('silmo_scheduled_exams');
      if (savedSchedule) {
        try {
          setScheduledExams(JSON.parse(savedSchedule));
        } catch (e) {
          console.error('Failed to parse scheduled exams', e);
        }
      }
    }
  }, [authUser, fetchDbData]);

  // Live status ticker
  const handleTickStatuses = useCallback(async () => {
    // 1. Tick existing statuses in memory (smooth animation, approx. 5 seconds elapsed)
    setLiveStatuses(prev =>
      prev.map(s => {
        if (s.status === 'finished' || !s.remainingSeconds || s.remainingSeconds <= 0) {
          return s;
        }
        return {
          ...s,
          remainingSeconds: Math.max(0, s.remainingSeconds - 5)
        };
      })
    );

    // 2. Fetch fresh DB status every 10 seconds to align state
    if (authUser && isDbConnected && Math.random() < 0.2) {
      try {
        const sessionsData = await fetchActiveExamSessions();
        if (sessionsData) {
          const activeSessions: LiveUserStatus[] = sessionsData
            .filter(s => s.user_id !== authUser.id)
            .map(s => ({
              userId: s.user_id,
              name: profiles[s.user_id] || s.user_id.split('-')[0] || 'User',
              status: s.status as 'active' | 'break' | 'finished',
              currentPhase: s.current_phase as ExamPhase,
              examType: s.exam_type as ExamType,
              remainingSeconds: s.remaining_seconds
            }));

          setLiveStatuses(activeSessions);
        }
      } catch (e) {
        console.warn('Real-time sync tick failed:', e);
      }
    }
  }, [authUser, isDbConnected, profiles]);

  // Listen to timer phase changes & sync to Supabase (Throttled)
  const handleSessionChange = useCallback(async (
    phase: ExamPhase,
    remaining: number,
    total: number,
    type: ExamType
  ) => {
    setLocalPhase(phase);
    setLocalRemaining(remaining);
    setLocalTotal(total);

    if (phase !== 'finished') {
      setAutoStartExamType(undefined);
      setAutoStartExamKey(undefined);
    }

    if (!authUser || !isDbConnected) return;

    const now = Date.now();
    const phaseChanged = phase !== prevPhaseRef.current;

    // Throttle: Save DB updates only on phase change, finished status, or every 20 seconds
    const shouldUpdateDb = phaseChanged || phase === 'finished' || (now - lastDbUpdateRef.current > 20000);

    if (shouldUpdateDb) {
      prevPhaseRef.current = phase;
      lastDbUpdateRef.current = now;

      try {
        if (phase !== 'finished') {
          await upsertActiveExamSession(authUser.id, phase, remaining, type);
        } else {
          await deleteActiveExamSession(authUser.id);
        }
      } catch (e) {
        console.error('Failed to sync timer session to database:', e);
      }
    }
  }, [authUser, isDbConnected]);

  // Triggered when exam timer ends
  const handleExamComplete = (type: ExamType) => {
    setFinishedExamType(type);
    setIsScoreModalOpen(true);
    setAutoStartExamType(undefined);
    setAutoStartExamKey(undefined);
  };

  const handleTakeGlobalSchedule = (schedule: GlobalSchedule) => {
    let durationMinutes = 0;
    if (schedule.type === 'korean') {
      durationMinutes = 80;
    } else if (schedule.type === 'math') {
      durationMinutes = 100;
    } else if (schedule.type === 'both') {
      durationMinutes = 80 + 30 + 100; // 210 minutes
    }

    const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);
    const timeString = endTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const confirmMessage = `이 시험은 ${timeString}에 끝납니다. 지금 응시하시겠습니까?`;
    if (!confirm(confirmMessage)) return;

    setPrefilledTitle(schedule.title);
    setAutoStartExamType(schedule.type);
    setAutoStartExamKey(Date.now().toString());
  };

  const handleCreateGlobalSchedule = async () => {
    if (!authUser || !globalScheduleTitle.trim() || !globalScheduleDate || !isDbConnected) return;
    try {
      await createGlobalSchedule(globalScheduleDate, globalScheduleTitle, globalScheduleType, authUser.id);
      setGlobalScheduleTitle('');
      setIsGlobalScheduleModalOpen(false);
      // refetch
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await fetchGlobalSchedules(todayStr);
      const formattedGlobalSchedules: GlobalSchedule[] = (data || []).map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        type: s.type as ExamType,
        createdBy: s.created_by,
        createdAt: s.created_at
      }));
      setGlobalSchedules(formattedGlobalSchedules);
    } catch (e) {
      console.error('Failed to create global schedule', e);
    }
  };

  // Save score to database
  const handleSaveScore = async (title: string, koreanScore: number | null, mathScore: number | null) => {
    if (!authUser || !finishedExamType) return;

    const totalScore = (koreanScore || 0) + (mathScore || 0);

    if (isDbConnected) {
      try {
        await saveScoreRecord(
          authUser.id,
          title,
          finishedExamType,
          koreanScore,
          mathScore,
          totalScore
        );
        // Re-fetch database records
        await fetchDbData();
      } catch (e) {
        console.error('Failed to save score in DB. Saving to local fallback...', e);
        saveToLocalFallback(title, koreanScore, mathScore, totalScore);
      }
    } else {
      saveToLocalFallback(title, koreanScore, mathScore, totalScore);
    }

    // Clean up timer phase states
    setLocalPhase('finished');
    setLocalRemaining(0);
    setLocalTotal(0);

    // If completing a planned exam, delete from schedule list
    if (completedScheduleId) {
      const updatedSchedules = scheduledExams.filter(s => s.id !== completedScheduleId);
      setScheduledExams(updatedSchedules);
      localStorage.setItem('silmo_scheduled_exams', JSON.stringify(updatedSchedules));
    }

    // Clean up prefilled states after save completes
    setPrefilledTitle('');
    setCompletedScheduleId(null);
  };

  // Local fallback save
  const saveToLocalFallback = (title: string, koreanScore: number | null, mathScore: number | null, totalScore: number) => {
    if (!authUser) return;

    const newRecord: ExamRecord = {
      id: `rec-${Date.now()}`,
      userId: authUser.id,
      title,
      type: finishedExamType!,
      koreanScore,
      mathScore,
      totalScore,
      createdAt: new Date().toISOString()
    };

    const updatedRecords = [newRecord, ...records.filter(r => r.userId === authUser.id)];
    setRecords(updatedRecords);
    localStorage.setItem('silmo_user_records', JSON.stringify(updatedRecords));
  };

  // Weekly Calendar callbacks
  const handleAddSchedule = (dateStr: string, type: ExamType, title: string) => {
    const newSchedule: ScheduledExam = {
      id: `sch-${Date.now()}`,
      date: dateStr,
      type,
      title,
      isCompleted: false
    };

    const updatedSchedules = [...scheduledExams, newSchedule];
    setScheduledExams(updatedSchedules);
    localStorage.setItem('silmo_scheduled_exams', JSON.stringify(updatedSchedules));
  };

  const handleDeleteSchedule = (id: string) => {
    const updatedSchedules = scheduledExams.filter(s => s.id !== id);
    setScheduledExams(updatedSchedules);
    localStorage.setItem('silmo_scheduled_exams', JSON.stringify(updatedSchedules));
  };

  const handleCompleteSchedule = (schedule: ScheduledExam) => {
    setFinishedExamType(schedule.type);
    setPrefilledTitle(schedule.title);
    setCompletedScheduleId(schedule.id);
    setIsScoreModalOpen(true);
  };

  // Auth Loading state
  if (authLoading) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center text-neutral-400">
        <div className="flex flex-col items-center gap-3 font-suit">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
          <span className="text-xs font-medium">인증 정보를 확인하는 중...</span>
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!authUser) {
    return (
      <main className="h-full bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />
        <div className="z-10 text-center max-w-md px-6 space-y-4">
          <h2 className="text-xl font-bold text-neutral-100 font-suit">로그인이 필요한 서비스입니다</h2>
          <p className="text-xs text-neutral-500 font-suit leading-relaxed">
            실전 모의고사 타이머 기록 및 친구들과의 경쟁 리더보드 서비스를 이용하시려면 로그인이 필요합니다.
          </p>
        </div>
        <div className="w-full max-w-md px-6 mt-6">
          <Auth />
        </div>
      </main>
    );
  }

  // Separate personal records for history & stats cards
  const personalRecords = records.filter(r => r.userId === authUser.id);
  const existingTitles = Array.from(new Set(records.map(r => r.title))).filter(Boolean);

  // Set up leaderboard users (real profiles with records)
  const realLeaderboardUsers: User[] = Object.keys(profiles).map(id => ({
    id,
    name: profiles[id] || 'User'
  }));

  // Ensure current user is in leaderboard even if profiles is not yet updated
  if (!realLeaderboardUsers.some(u => u.id === authUser.id)) {
    realLeaderboardUsers.push(currentSilmoUser);
  }

  const allLeaderboardUsers = realLeaderboardUsers;
  const allRecords = records;

  return (
    <main className="h-full bg-background text-foreground flex flex-col items-center px-4 sm:px-6 overflow-y-auto no-scrollbar relative w-full selection:bg-white selection:text-black">
      {/* Background elegant gradient */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto space-y-6 z-10 py-6 pb-16">

        {/* SaaS Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-900 pb-5 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-100 font-suit tracking-tight flex items-center gap-2">
              실모단
            </h1>
            <p className="text-xs text-neutral-500 font-suit font-medium">
              "한밑자" -김세준-
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-suit font-medium">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded border ${isDbConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{isDbConnected ? 'DB 연동 완료' : '로컬 모드'}</span>
            </div>
            <span className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              {currentSilmoUser.name} 님
            </span>
          </div>
        </div>

        {/* Database Warning Banner */}
        {!isDbConnected && dbErrorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs font-suit leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold block mb-0.5">데이터베이스 연동이 필요합니다:</span>
              <p className="text-neutral-400">{dbErrorMsg}</p>
              <p className="text-neutral-500 mt-1">제공된 `script/008_add_silmo_tables.sql` 마이그레이션 SQL을 실행하시면 완벽한 멀티플레이어 데이터 동기화가 활성화됩니다.</p>
            </div>
          </div>
        )}

        {/* Primary Tabs System */}
        <Tabs defaultValue="dashboard" onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-neutral-900/60 border border-neutral-800/80 mb-6 flex items-center justify-start gap-1 p-1 max-w-full overflow-x-auto no-scrollbar rounded-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-neutral-800 text-xs px-4 py-2 font-suit flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="timer" className="data-[state=active]:bg-neutral-800 text-xs px-4 py-2 font-suit flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              타이머
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-neutral-800 text-xs px-4 py-2 font-suit flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              일정(달력)
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-neutral-800 text-xs px-4 py-2 font-suit flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              현황
            </TabsTrigger>
            <TabsTrigger value="records" className="data-[state=active]:bg-neutral-800 text-xs px-4 py-2 font-suit flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              기록
            </TabsTrigger>
          </TabsList>

          {/* 1. Dashboard Tab - Unified overview containing ALL features */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Global Schedules Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-200 font-suit flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" />
                  실모 일정 (오늘 및 예정된 실모)
                </h3>
                <button 
                  onClick={() => {
                    setGlobalScheduleDate(new Date().toISOString().split('T')[0]);
                    setIsGlobalScheduleModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 transition-colors text-xs font-semibold font-suit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  등록하기
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {globalSchedules.map(schedule => {
                  const isCompleted = personalRecords.some(r => r.title === schedule.title);
                  const isRunning = localPhase !== 'finished';

                  return (
                    <div key={schedule.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col gap-3 hover:border-neutral-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-sm text-neutral-100">{schedule.title}</span>
                          <span className="text-[10px] text-neutral-500 font-medium font-suit">{schedule.date}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                          {schedule.type === 'korean' ? '국어' : schedule.type === 'math' ? '수학' : '국어+수학'}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs text-neutral-500 font-suit">등록자: {profiles[schedule.createdBy] || (schedule.createdBy && schedule.createdBy.substring(0, 6)) || '알수없음'}</span>
                        {isCompleted ? (
                          <span className="px-3 py-1.5 rounded bg-neutral-800/60 text-neutral-500 border border-neutral-850/30 text-xs font-semibold select-none">
                            완료됨
                          </span>
                        ) : (
                          <button 
                            disabled={isRunning}
                            onClick={() => handleTakeGlobalSchedule(schedule)} 
                            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-all ${
                              isRunning
                                ? 'bg-neutral-900 text-neutral-600 border-neutral-850 cursor-not-allowed'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                          >
                            응시
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {globalSchedules.length === 0 && (
                  <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-500 text-xs font-suit bg-neutral-900/50">
                    예정된 전역 실모 일정이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Top aggregate stats cards */}
            <DashboardCards records={personalRecords} />

            {/* 3-Column main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Timer Panel */}
              <div className="lg:col-span-4 min-h-[380px] lg:min-h-0">
                {activeTab === 'dashboard' && (
                  <ExamTimer
                    onExamComplete={handleExamComplete}
                    onSessionChange={handleSessionChange}
                    activeSessionPhase={localPhase}
                    autoStartType={autoStartExamType}
                    autoStartKey={autoStartExamKey}
                    autoStartTitle={prefilledTitle}
                  />
                )}
              </div>

              {/* Live Status Panel */}
              <div className="lg:col-span-4 min-h-[340px] lg:min-h-0">
                <LiveStatus
                  liveStatuses={liveStatuses}
                  onTickStatuses={handleTickStatuses}
                  localUser={currentSilmoUser}
                  localActiveSessionPhase={localPhase}
                  localActiveSessionSeconds={localRemaining}
                />
              </div>

              {/* Leaderboard Panel */}
              <div className="lg:col-span-4">
                <div className="matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-6 h-full space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                    <Trophy className="w-4 h-4 text-neutral-400" />
                    <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                      경쟁 리더보드
                    </h3>
                  </div>
                  <Leaderboard records={allRecords} users={allLeaderboardUsers} globalTitles={globalTitles} />
                </div>
              </div>
            </div>

            {/* History Table Panel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <CalendarIcon className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                  내 모의고사 히스토리
                </h3>
              </div>
              <HistoryTable records={personalRecords} />
            </div>
          </TabsContent>

          {/* 2. Focused Timer Tab */}
          <TabsContent value="timer">
            <div className="max-w-xl mx-auto min-h-[380px] py-4">
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
          </TabsContent>

          {/* 3. Focused Schedule Tab */}
          <TabsContent value="calendar" className="space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 mb-2">
              <CalendarIcon className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                주간 모의고사 일정표
              </h3>
            </div>
            <WeeklyCalendar
              records={allRecords}
              profiles={profiles}
              currentUserId={authUser.id}
              globalTitles={globalTitles}
              scheduledExams={scheduledExams}
              onAddSchedule={handleAddSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onCompleteSchedule={handleCompleteSchedule}
            />
          </TabsContent>

          {/* 4. Focused Live Status Tab */}
          <TabsContent value="status">
            <div className="max-w-xl mx-auto min-h-[340px] py-4">
              <LiveStatus
                liveStatuses={liveStatuses}
                onTickStatuses={handleTickStatuses}
                localUser={currentSilmoUser}
                localActiveSessionPhase={localPhase}
                localActiveSessionSeconds={localRemaining}
              />
            </div>
          </TabsContent>

          {/* 5. Focused Records Tab */}
          <TabsContent value="records" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 오늘의 실모 (전역 실모) 점수 현황 */}
            <div className="lg:col-span-12 space-y-3 mb-2">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Trophy className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                  실모 일정별 점수 현황 (전역 실모)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalTitles.map(title => {
                  const titleRecords = allRecords.filter(r => r.title === title);
                  const hasTaken = personalRecords.some(r => r.title === title);
                  
                  // Sort records by totalScore descending to make a mini-leaderboard
                  const sortedTitleRecords = [...titleRecords].sort((a, b) => b.totalScore - a.totalScore);
                  
                  return (
                    <div key={title} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 space-y-3 hover:border-neutral-700 transition-colors">
                      <div className="flex justify-between items-start border-b border-neutral-800 pb-2">
                        <span className="font-semibold text-xs text-indigo-400 truncate max-w-[150px]">{title}</span>
                        {hasTaken ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                            {titleRecords.length}명 응시
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-850 text-neutral-500 font-mono flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-neutral-500 animate-pulse" />
                            미응시
                          </span>
                        )}
                      </div>
                      
                      {hasTaken ? (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
                          {sortedTitleRecords.map((r, i) => {
                            const isLocal = r.userId === authUser.id;
                            const userName = isLocal ? '나' : (profiles[r.userId] || r.userId.substring(0, 6));
                            return (
                              <div key={r.id} className="flex items-center justify-between text-[11px] font-suit font-medium">
                                <span className={isLocal ? 'text-emerald-400' : 'text-neutral-300'}>
                                  {i + 1}위. {userName}
                                </span>
                                <span className="font-mono text-neutral-400">
                                  {r.type === 'both' ? `평균 ${r.totalScore / 2}점` : `${r.totalScore}점`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-2.5 text-center flex flex-col items-center justify-center gap-1 select-none">
                          <span className="text-[11px] text-neutral-400 font-semibold font-suit">
                            점수 비공개 (잠김)
                          </span>
                          <span className="text-[9px] text-neutral-500 font-suit leading-normal">
                            본인이 이 시험을 응시한 후에<br />다른 사람들의 점수를 볼 수 있습니다.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Fallback if no global schedule has been registered yet */}
                {globalTitles.length === 0 && (
                  <div className="col-span-full py-6 text-center text-xs text-neutral-600 font-suit bg-neutral-950 border border-dashed border-neutral-900 rounded-xl">
                    아직 진행 및 기록된 전역 실모 일정이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard (5 spans) */}
            <div className="lg:col-span-5 matte-panel bg-neutral-950 border-neutral-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Trophy className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                  경쟁 리더보드
                </h3>
              </div>
              <Leaderboard records={allRecords} users={allLeaderboardUsers} globalTitles={globalTitles} />
            </div>

            {/* History Table (7 spans) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                <CalendarIcon className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-200 font-suit">
                  내 모의고사 히스토리
                </h3>
              </div>
              <HistoryTable records={personalRecords} />
            </div>
          </TabsContent>
        </Tabs>

      </div>

      {/* Score input Modal */}
      <ScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => {
          setIsScoreModalOpen(false);
          setPrefilledTitle('');
          setCompletedScheduleId(null);
        }}
        examType={finishedExamType}
        prefilledTitle={prefilledTitle}
        suggestions={existingTitles}
        onSave={handleSaveScore}
      />

      {/* Add Global Schedule Dialog */}
      <Dialog open={isGlobalScheduleModalOpen} onOpenChange={setIsGlobalScheduleModalOpen}>
        <DialogContent className="max-w-[350px] border-neutral-800 bg-neutral-950 text-neutral-100 rounded-xl p-5 font-suit">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-semibold tracking-tight">실모 일정 등록</DialogTitle>
            <DialogDescription className="text-[11px] text-neutral-500">
              다른 사람들과 함께 볼 모의고사 일정을 전역에 등록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">시험 날짜</label>
              <Input
                type="date"
                value={globalScheduleDate}
                onChange={(e) => setGlobalScheduleDate(e.target.value)}
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-xs py-1.5 text-neutral-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">실모 이름</label>
              <Input
                placeholder="예: 더프리미엄 1회, 시대인재 3회"
                value={globalScheduleTitle}
                onChange={(e) => setGlobalScheduleTitle(e.target.value)}
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-xs py-1.5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">시험 유형</label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {(['korean', 'math', 'both'] as ExamType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setGlobalScheduleType(t)}
                    type="button"
                    className={`py-1.5 rounded border text-[11px] font-medium transition-all ${
                      globalScheduleType === t
                        ? 'border-neutral-200 bg-neutral-100 text-neutral-950'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-750'
                    }`}
                  >
                    {t === 'korean' ? '국어' : t === 'math' ? '수학' : '국어+수학'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-1.5 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsGlobalScheduleModalOpen(false)}
              className="border-neutral-800 text-neutral-400 hover:bg-neutral-900 text-[10px] py-1 h-7 px-3"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateGlobalSchedule}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 text-[10px] py-1 h-7 px-3 font-semibold"
            >
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
