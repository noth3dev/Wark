'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ExamRecord, ExamType, ExamPhase, LiveUserStatus, User, GlobalSchedule, ScheduleReview } from '@/types/silmo';
import { ScheduledExam } from '@/components/silmo/weekly-calendar';
import {
  fetchSilmoRecords,
  fetchUserProfiles,
  fetchActiveExamSessions,
  saveScoreRecord,
  upsertActiveExamSession,
  deleteActiveExamSession,
  fetchGlobalSchedules,
  createGlobalSchedule,
  fetchAllGlobalSchedules,
  deleteGlobalSchedule,
  closeGlobalSchedule,
  fetchSilmoExamPool,
  createExamPool,
  voteExamPool,
  deleteExamPool,
  lockInExam,
  uploadSilmoPdf,
  fetchScheduleReviews,
  saveScheduleReview
} from '@/lib/services/silmoService';
import { ExamPoolItem } from '@/types/silmo';

interface SilmoContextType {
  isDbConnected: boolean;
  dbErrorMsg: string | null;
  records: ExamRecord[];
  personalRecords: ExamRecord[];
  allRecords: ExamRecord[];
  liveStatuses: LiveUserStatus[];
  globalSchedules: GlobalSchedule[];
  allGlobalSchedules: GlobalSchedule[];
  globalTitles: string[];
  profiles: { [key: string]: string };
  currentSilmoUser: User;
  allLeaderboardUsers: User[];
  isSilmodan: boolean;
  loading: boolean;
  reviews: ScheduleReview[];
  
  // Timer phase state
  localPhase: ExamPhase;
  localRemaining: number;
  localTotal: number;
  autoStartExamType: ExamType | undefined;
  autoStartExamKey: string | undefined;
  
  // Score modal and prefill states
  isScoreModalOpen: boolean;
  setIsScoreModalOpen: (val: boolean) => void;
  finishedExamType: ExamType | null;
  setFinishedExamType: (t: ExamType | null) => void;
  prefilledTitle: string;
  setPrefilledTitle: (t: string) => void;
  completedScheduleId: string | null;
  setCompletedScheduleId: (id: string | null) => void;
  existingTitles: string[];
  
  // Global schedule modal
  isGlobalScheduleModalOpen: boolean;
  setIsGlobalScheduleModalOpen: (val: boolean) => void;
  globalScheduleTitle: string;
  setGlobalScheduleTitle: (t: string) => void;
  globalScheduleType: ExamType;
  setGlobalScheduleType: (t: ExamType) => void;
  globalScheduleDate: string;
  setGlobalScheduleDate: (t: string) => void;
  globalScheduleQuestionFile: File | null;
  setGlobalScheduleQuestionFile: (f: File | null) => void;
  globalScheduleSolutionFile: File | null;
  setGlobalScheduleSolutionFile: (f: File | null) => void;
  
  // Weekly schedules
  scheduledExams: ScheduledExam[];
  
  // Exam Pool
  examPool: ExamPoolItem[];
  fetchExamPoolData: () => Promise<void>;
  handleCreateExamPool: (title: string, type: ExamType, questionFile?: File, solutionFile?: File) => Promise<void>;
  handleVoteExamPool: (poolId: string, vote: number) => Promise<void>;
  handleDeleteExamPool: (poolId: string) => Promise<void>;
  handleLockInExam: (poolId: string, dateStr: string, title: string, type: ExamType) => Promise<void>;
  
  // Actions
  fetchDbData: () => Promise<void>;
  handleTickStatuses: () => Promise<void>;
  handleSessionChange: (phase: ExamPhase, remaining: number, total: number, type: ExamType) => Promise<void>;
  handleExamComplete: (type: ExamType) => void;
  handleTakeGlobalSchedule: (schedule: GlobalSchedule) => void;
  handleCreateGlobalSchedule: () => Promise<void>;
  handleDeleteGlobalSchedule: (id: string, title: string) => Promise<void>;
  handleSaveScore: (title: string, koreanScore: number | null, mathScore: number | null, koreanWrongNumbers?: string | null, mathWrongNumbers?: string | null) => Promise<void>;
  handleAddSchedule: (dateStr: string, type: ExamType, title: string) => void;
  handleDeleteSchedule: (id: string) => void;
  handleCompleteSchedule: (schedule: ScheduledExam) => void;
  handleSaveReview: (scheduleTitle: string, file: File) => Promise<void>;
}

const SilmoContext = createContext<SilmoContextType | undefined>(undefined);

export function SilmoProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, profileName, loading: authLoading, isSilmodan } = useAuth();

  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<LiveUserStatus[]>([]);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);
  const [finishedExamType, setFinishedExamType] = useState<ExamType | null>(null);

  const [prefilledTitle, setPrefilledTitle] = useState<string>('');
  const [completedScheduleId, setCompletedScheduleId] = useState<string | null>(null);

  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [globalSchedules, setGlobalSchedules] = useState<GlobalSchedule[]>([]);
  const [allGlobalSchedules, setAllGlobalSchedules] = useState<GlobalSchedule[]>([]);
  const [globalTitles, setGlobalTitles] = useState<string[]>([]);
  const [examPool, setExamPool] = useState<ExamPoolItem[]>([]);
  
  const [autoStartExamType, setAutoStartExamType] = useState<ExamType | undefined>(undefined);
  const [autoStartExamKey, setAutoStartExamKey] = useState<string | undefined>(undefined);
  
  const [isGlobalScheduleModalOpen, setIsGlobalScheduleModalOpen] = useState(false);
  const [globalScheduleTitle, setGlobalScheduleTitle] = useState('');
  const [globalScheduleType, setGlobalScheduleType] = useState<ExamType>('korean');
  const [globalScheduleDate, setGlobalScheduleDate] = useState<string>('');
  const [globalScheduleQuestionFile, setGlobalScheduleQuestionFile] = useState<File | null>(null);
  const [globalScheduleSolutionFile, setGlobalScheduleSolutionFile] = useState<File | null>(null);

  const [reviews, setReviews] = useState<ScheduleReview[]>([]);

  const [profiles, setProfiles] = useState<{ [key: string]: string }>({});

  const [localPhase, setLocalPhase] = useState<ExamPhase>('finished');
  const [localRemaining, setLocalRemaining] = useState<number>(0);
  const [localTotal, setLocalTotal] = useState<number>(0);

  const lastDbUpdateRef = useRef<number>(0);
  const prevPhaseRef = useRef<ExamPhase>('finished');

  const currentSilmoUser: User = {
    id: authUser?.id || 'guest',
    name: profileName || authUser?.email?.split('@')[0] || '나'
  };

  const loadFallbackLocalData = useCallback(() => {
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
  }, []);

  const fetchDbData = useCallback(async () => {
    if (!authUser) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [recordsData, profilesData, sessionsData, globalSchedulesData, allGlobalSchedulesData, reviewsData] = await Promise.all([
        fetchSilmoRecords(),
        fetchUserProfiles(),
        fetchActiveExamSessions(),
        fetchGlobalSchedules(todayStr),
        fetchAllGlobalSchedules(),
        fetchScheduleReviews().catch(() => [])
      ]);

      const profileMap: { [key: string]: string } = {};
      profilesData?.forEach(p => {
        profileMap[p.id] = p.display_name;
      });
      setProfiles(profileMap);

      const uniqueGlobalTitles = Array.from(new Set((allGlobalSchedulesData || []).map(s => s.title)));
      setGlobalTitles(uniqueGlobalTitles);

      const formattedAllGlobalSchedules: GlobalSchedule[] = (allGlobalSchedulesData || []).map(s => ({
        id: s.id || `all-${s.title}`,
        date: s.date || '',
        title: s.title,
        type: (s.type as ExamType) || 'korean',
        createdBy: s.created_by || '',
        createdAt: s.created_at || '',
        is_silvival: s.is_silvival,
        questionPdfUrl: s.question_pdf_url || null,
        solutionPdfUrl: s.solution_pdf_url || null,
        isClosed: s.is_closed || false,
      }));
      setAllGlobalSchedules(formattedAllGlobalSchedules);

      const formattedGlobalSchedules: GlobalSchedule[] = (globalSchedulesData || []).map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        type: s.type as ExamType,
        createdBy: s.created_by,
        createdAt: s.created_at,
        is_silvival: s.is_silvival,
        questionPdfUrl: s.question_pdf_url || null,
        solutionPdfUrl: s.solution_pdf_url || null,
        isClosed: s.is_closed || false,
      }));
      setGlobalSchedules(formattedGlobalSchedules);

      const formattedRecords: ExamRecord[] = (recordsData || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title || '실전 모의고사',
        type: r.type as ExamType,
        koreanScore: r.korean_score,
        mathScore: r.math_score,
        koreanWrongNumbers: r.korean_wrong_numbers,
        mathWrongNumbers: r.math_wrong_numbers,
        totalScore: r.total_score,
        createdAt: r.created_at
      }));

      setRecords(formattedRecords);
      setIsDbConnected(true);
      setDbErrorMsg(null);

      // 총평 목록 업데이트
      const formattedReviews: ScheduleReview[] = (reviewsData || []).map((r: any) => ({
        id: r.id,
        scheduleTitle: r.schedule_title,
        uploaderId: r.uploader_id,
        reviewPdfUrl: r.review_pdf_url,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
      setReviews(formattedReviews);

      const activeSessions: LiveUserStatus[] = (sessionsData || [])
        .filter(s => s.user_id !== authUser.id)
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
      if (err.message?.includes('relation') || err.code === 'PGRST116') {
        setDbErrorMsg('데이터베이스 테이블이 아직 존재하지 않습니다. SQL 스크립트를 먼저 실행해주세요.');
      } else {
        setDbErrorMsg(err.message || '데이터베이스 연결 실패. 로컬 모드로 동작합니다.');
      }
      setIsDbConnected(false);
      loadFallbackLocalData();
    }
  }, [authUser, loadFallbackLocalData]);

  const fetchExamPoolData = useCallback(async () => {
    if (!authUser || !isDbConnected) return;
    try {
      const poolData = await fetchSilmoExamPool();
      setExamPool(poolData || []);
    } catch (e) {
      console.error('Failed to fetch exam pool:', e);
    }
  }, [authUser, isDbConnected]);

  // Initial load
  useEffect(() => {
    if (authUser) {
      fetchDbData();
      fetchExamPoolData();

      const savedSchedule = localStorage.getItem('silmo_scheduled_exams');
      if (savedSchedule) {
        try {
          setScheduledExams(JSON.parse(savedSchedule));
        } catch (e) {
          console.error('Failed to parse scheduled exams', e);
        }
      }
    }
  }, [authUser, fetchDbData, fetchExamPoolData]);

  const handleTickStatuses = useCallback(async () => {
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
      let questionPdfUrl: string | undefined;
      let solutionPdfUrl: string | undefined;
      if (globalScheduleQuestionFile) questionPdfUrl = await uploadSilmoPdf(globalScheduleQuestionFile, 'question');
      if (globalScheduleSolutionFile) solutionPdfUrl = await uploadSilmoPdf(globalScheduleSolutionFile, 'solution');

      await createGlobalSchedule(globalScheduleDate, globalScheduleTitle, globalScheduleType, authUser.id, questionPdfUrl, solutionPdfUrl);
      setGlobalScheduleTitle('');
      setGlobalScheduleQuestionFile(null);
      setGlobalScheduleSolutionFile(null);
      setIsGlobalScheduleModalOpen(false);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const [data, allData] = await Promise.all([
        fetchGlobalSchedules(todayStr),
        fetchAllGlobalSchedules()
      ]);

      const formattedGlobalSchedules: GlobalSchedule[] = (data || []).map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        type: s.type as ExamType,
        createdBy: s.created_by,
        createdAt: s.created_at,
        is_silvival: s.is_silvival,
        questionPdfUrl: s.question_pdf_url || null,
        solutionPdfUrl: s.solution_pdf_url || null,
        isClosed: s.is_closed || false,
      }));
      setGlobalSchedules(formattedGlobalSchedules);

      const formattedAllGlobalSchedules: GlobalSchedule[] = (allData || []).map(s => ({
        id: s.id || `all-${s.title}`,
        date: s.date || '',
        title: s.title,
        type: (s.type as ExamType) || 'korean',
        createdBy: s.created_by || '',
        createdAt: s.created_at || '',
        is_silvival: s.is_silvival,
        questionPdfUrl: s.question_pdf_url || null,
        solutionPdfUrl: s.solution_pdf_url || null,
        isClosed: s.is_closed || false,
      }));
      setAllGlobalSchedules(formattedAllGlobalSchedules);
    } catch (e) {
      console.error('Failed to create global schedule', e);
    }
  };

  const handleDeleteGlobalSchedule = async (id: string, title: string) => {
    if (!confirm(`'${title}' 일정을 삭제하시겠습니까?`)) return;
    try {
      await deleteGlobalSchedule(id);
      const todayStr = new Date().toISOString().split('T')[0];
      const [data, allData] = await Promise.all([
        fetchGlobalSchedules(todayStr),
        fetchAllGlobalSchedules()
      ]);

      const formattedGlobalSchedules: GlobalSchedule[] = (data || []).map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        type: s.type as ExamType,
        createdBy: s.created_by,
        createdAt: s.created_at,
        is_silvival: s.is_silvival,
        questionPdfUrl: s.question_pdf_url || null,
        solutionPdfUrl: s.solution_pdf_url || null,
        isClosed: s.is_closed || false,
      }));
      setGlobalSchedules(formattedGlobalSchedules);

      const formattedAllGlobalSchedules: GlobalSchedule[] = (allData || []).map(s => ({
        id: s.id || `all-${s.title}`,
        date: s.date || '',
        title: s.title,
        type: (s.type as ExamType) || 'korean',
        createdBy: s.created_by || '',
        createdAt: s.created_at || '',
        is_silvival: s.is_silvival,
        questionPdfUrl: s.question_pdf_url || null,
        solutionPdfUrl: s.solution_pdf_url || null,
        isClosed: s.is_closed || false,
      }));
      setAllGlobalSchedules(formattedAllGlobalSchedules);
    } catch (e) {
      console.error('Failed to delete global schedule', e);
      alert('일정 삭제에 실패했습니다.');
    }
  };

  // ── 자동 종료 폴링 (30초마다): 실모단 전원 제출 OR KST 23:00 이후 ──
  useEffect(() => {
    if (!authUser || !isDbConnected) return;

    const checkAutoClose = async () => {
      const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const kstHour = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours();
      const isPast23 = kstHour >= 23;

      const openTodaySchedules = globalSchedules.filter(
        s => s.date === todayKST && !s.isClosed
      );
      if (openTodaySchedules.length === 0) return;

      const silmodanUserIds = Object.keys(profiles);
      if (silmodanUserIds.length === 0) return;

      for (const schedule of openTodaySchedules) {
        const submitters = records
          .filter(r => r.title === schedule.title)
          .map(r => r.userId);
        const allSubmitted = silmodanUserIds.every(uid => submitters.includes(uid));

        if (allSubmitted || isPast23) {
          try {
            await closeGlobalSchedule(schedule.id);
            setGlobalSchedules(prev =>
              prev.map(s => s.id === schedule.id ? { ...s, isClosed: true } : s)
            );
          } catch (e) {
            console.warn('Auto-close failed for schedule:', schedule.title, e);
          }
        }
      }
    };

    checkAutoClose();
    const interval = setInterval(checkAutoClose, 30000);
    return () => clearInterval(interval);
  }, [authUser, isDbConnected, globalSchedules, records, profiles]);

  const handleCreateExamPool = async (title: string, type: ExamType, questionFile?: File, solutionFile?: File) => {
    if (!authUser) return;
    try {
      let questionUrl, solutionUrl;
      if (questionFile) questionUrl = await uploadSilmoPdf(questionFile, 'question');
      if (solutionFile) solutionUrl = await uploadSilmoPdf(solutionFile, 'solution');
      
      await createExamPool(title, type, authUser.id, questionUrl, solutionUrl);
      await fetchExamPoolData();
    } catch (e) {
      console.error('Failed to create exam pool item:', e);
      alert('모의고사 등록에 실패했습니다.');
    }
  };

  const handleVoteExamPool = async (poolId: string, vote: number) => {
    if (!authUser) return;
    try {
      await voteExamPool(poolId, authUser.id, vote);
      await fetchExamPoolData();
    } catch (e) {
      console.error('Failed to vote:', e);
    }
  };

  const handleDeleteExamPool = async (poolId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteExamPool(poolId);
      await fetchExamPoolData();
    } catch (e) {
      console.error('Failed to delete exam pool item:', e);
    }
  };

  const handleLockInExam = async (poolId: string, dateStr: string, title: string, type: ExamType) => {
    if (!authUser) return;
    
    try {
      // Find the active (unclosed) silvival round
      let seasonIdx: number | undefined;
      let roundIdx: number | undefined;
      let examSlot: 'exam1' | 'exam2' | undefined;

      try {
        const { fetchSilvivalRounds: fetchRounds } = await import('@/lib/services/silmoService');
        // Get current season based on KST month
        const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
        const currentSeason = kstNow.getUTCMonth(); // 0=Jan, 5=Jun
        
        const rounds = await fetchRounds(currentSeason);
        const activeRound = rounds?.find((r: any) => !r.is_closed);
        if (activeRound) {
          seasonIdx = currentSeason;
          roundIdx = activeRound.round_index;
          
          // Check which slot is empty or default
          // Default format: "시즌X YR 실모 A", "시즌X YR 모의고사 A" or similar default string
          const isDefault1 = !activeRound.exam1_title || activeRound.exam1_title.includes('시즌') || activeRound.exam1_title.includes('모의고사');
          const isDefault2 = !activeRound.exam2_title || activeRound.exam2_title.includes('시즌') || activeRound.exam2_title.includes('모의고사');

          if (isDefault1) {
            examSlot = 'exam1';
          } else if (isDefault2) {
            examSlot = 'exam2';
          } else {
            // Both are filled in active round, try the next round
            const nextRound = rounds?.find((r: any) => r.round_index > activeRound.round_index && !r.is_closed);
            if (nextRound) {
              roundIdx = nextRound.round_index;
              examSlot = 'exam1'; // Default to exam1 of next round
            } else {
              // Fallback to exam1 of active round
              examSlot = 'exam1';
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch silvival rounds for auto-link:', e);
      }

      await lockInExam(poolId, dateStr, title, type, authUser.id, seasonIdx, roundIdx, examSlot);
      await fetchExamPoolData();
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await fetchGlobalSchedules(todayStr);
      const formattedGlobalSchedules: GlobalSchedule[] = (data || []).map(s => ({
        id: s.id,
        date: s.date,
        title: s.title,
        type: s.type as ExamType,
        createdBy: s.created_by,
        createdAt: s.created_at,
        is_silvival: s.is_silvival
      }));
      setGlobalSchedules(formattedGlobalSchedules);
    } catch (e) {
      console.error('Failed to lock in exam:', e);
      alert('공식 실모 고정에 실패했습니다.');
    }
  };

  const saveToLocalFallback = useCallback((title: string, koreanScore: number | null, mathScore: number | null, totalScore: number, koreanWrongNumbers?: string | null, mathWrongNumbers?: string | null) => {
    if (!authUser) return;

    const newRecord: ExamRecord = {
      id: `rec-${Date.now()}`,
      userId: authUser.id,
      title,
      type: finishedExamType!,
      koreanScore,
      mathScore,
      koreanWrongNumbers,
      mathWrongNumbers,
      totalScore,
      createdAt: new Date().toISOString()
    };

    const updatedRecords = [newRecord, ...records.filter(r => r.userId === authUser.id)];
    setRecords(updatedRecords);
    localStorage.setItem('silmo_user_records', JSON.stringify(updatedRecords));
  }, [authUser, finishedExamType, records]);

  const handleSaveScore = async (title: string, koreanScore: number | null, mathScore: number | null, koreanWrongNumbers?: string | null, mathWrongNumbers?: string | null) => {
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
          totalScore,
          koreanWrongNumbers,
          mathWrongNumbers
        );
        await fetchDbData();
      } catch (e) {
        console.error('Failed to save score in DB. Saving to local fallback...', e);
        saveToLocalFallback(title, koreanScore, mathScore, totalScore, koreanWrongNumbers, mathWrongNumbers);
      }
    } else {
      saveToLocalFallback(title, koreanScore, mathScore, totalScore, koreanWrongNumbers, mathWrongNumbers);
    }

    setLocalPhase('finished');
    setLocalRemaining(0);
    setLocalTotal(0);

    if (completedScheduleId) {
      const updatedSchedules = scheduledExams.filter(s => s.id !== completedScheduleId);
      setScheduledExams(updatedSchedules);
      localStorage.setItem('silmo_scheduled_exams', JSON.stringify(updatedSchedules));
    }

    setPrefilledTitle('');
    setCompletedScheduleId(null);
  };

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

  const handleSaveReview = async (scheduleTitle: string, file: File) => {
    if (!authUser) return;
    try {
      const url = await uploadSilmoPdf(file, 'review');
      await saveScheduleReview(scheduleTitle, authUser.id, url);
      // 로컬 state 즉시 업데이트
      setReviews(prev => {
        const existing = prev.find(r => r.scheduleTitle === scheduleTitle);
        if (existing) {
          return prev.map(r => r.scheduleTitle === scheduleTitle
            ? { ...r, reviewPdfUrl: url, updatedAt: new Date().toISOString() }
            : r
          );
        }
        return [...prev, {
          id: `temp-${Date.now()}`,
          scheduleTitle,
          uploaderId: authUser.id,
          reviewPdfUrl: url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }];
      });
    } catch (e) {
      console.error('Failed to save review:', e);
      alert('총평 저장에 실패했습니다.');
    }
  };

  const personalRecords = records.filter(r => r.userId === authUser?.id);
  const existingTitles = Array.from(new Set(records.map(r => r.title))).filter(Boolean);

  const realLeaderboardUsers: User[] = Object.keys(profiles).map(id => ({
    id,
    name: profiles[id] || 'User'
  }));

  if (authUser && !realLeaderboardUsers.some(u => u.id === authUser.id)) {
    realLeaderboardUsers.push(currentSilmoUser);
  }

  const allLeaderboardUsers = realLeaderboardUsers;
  const allRecords = records;

  return (
    <SilmoContext.Provider
      value={{
        isDbConnected,
        dbErrorMsg,
        records,
        personalRecords,
        allRecords,
        liveStatuses,
        globalSchedules,
        allGlobalSchedules,
        globalTitles,
        profiles,
        currentSilmoUser,
        allLeaderboardUsers,
        isSilmodan,
        loading: authLoading,
        
        localPhase,
        localRemaining,
        localTotal,
        autoStartExamType,
        autoStartExamKey,
        
        isScoreModalOpen,
        setIsScoreModalOpen,
        finishedExamType,
        setFinishedExamType,
        prefilledTitle,
        setPrefilledTitle,
        completedScheduleId,
        setCompletedScheduleId,
        existingTitles,
        
        isGlobalScheduleModalOpen,
        setIsGlobalScheduleModalOpen,
        globalScheduleTitle,
        setGlobalScheduleTitle,
        globalScheduleType,
        setGlobalScheduleType,
        globalScheduleDate,
        setGlobalScheduleDate,
        globalScheduleQuestionFile,
        setGlobalScheduleQuestionFile,
        globalScheduleSolutionFile,
        setGlobalScheduleSolutionFile,
        
        scheduledExams,
        examPool,
        reviews,
        
        fetchDbData,
        fetchExamPoolData,
        handleTickStatuses,
        handleSessionChange,
        handleExamComplete,
        handleTakeGlobalSchedule,
        handleCreateGlobalSchedule,
        handleDeleteGlobalSchedule,
        handleCreateExamPool,
        handleVoteExamPool,
        handleDeleteExamPool,
        handleLockInExam,
        handleSaveScore,
        handleAddSchedule,
        handleDeleteSchedule,
        handleCompleteSchedule,
        handleSaveReview
      }}
    >
      {children}
    </SilmoContext.Provider>
  );
}

export function useSilmo() {
  const context = useContext(SilmoContext);
  if (context === undefined) {
    throw new Error('useSilmo must be used within a SilmoProvider');
  }
  return context;
}
