'use client';

import React, { useState, useEffect } from 'react';
import { useSilmo } from '../silmo-context';
import { useAuth } from '@/lib/auth-context';
import { Swords, Plus, Shield, Trophy, CheckCircle2, AlertCircle, Play, Users, Coins, HelpCircle, Lock, Calendar, History, FileText, BookOpen, X, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRoundDistributions, saveRoundDistribution, closeGlobalSchedule, fetchRoundScores, saveRoundScore } from '@/lib/services/silmoService';

// 수학 점수 차감 로직 (수능 배점표 기준)
const getMathQuestionScore = (num: number): number => {
  if (num >= 1 && num <= 2) return 2;
  if (num >= 3 && num <= 8) return 3;
  if (num >= 9 && num <= 15) return 4;
  if (num >= 16 && num <= 19) return 3;
  if (num >= 20 && num <= 22) return 4;
  if (num === 23) return 2;
  if (num >= 24 && num <= 27) return 3;
  if (num === 28) return 4;
  if (num >= 29 && num <= 30) return 4;
  return 0;
};

export default function RoundPage() {
  const { user: authUser } = useAuth();
  const {
    allLeaderboardUsers,
    profiles,
    schools,
    allRecords,
    allGlobalSchedules,
    isSilmodan,
    fetchDbData,
    handleCreateGlobalSchedule,
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
    handleSaveScore,
    setFinishedExamType,
  } = useSilmo();

  // Local tabs: 'ongoing' or 'records'
  const [activeTab, setActiveTab] = useState<'ongoing' | 'records'>('ongoing');

  // Create form local states
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Active round schedule
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  // Stepper state: 1, 2, or 3
  const [activeStep, setActiveStep] = useState<number>(1);

  // Distribution states (using string for smoother input handling)
  const [d1, setD1] = useState<string>('');
  const [d2, setD2] = useState<string>('');
  const [d3, setD3] = useState<string>('');
  const [d4, setD4] = useState<string>('');
  const [d5, setD5] = useState<string>('');
  const [isSavingDist, setIsSavingDist] = useState(false);
  const isEditingDist = React.useRef(false);

  // Fetched distributions
  const [distributions, setDistributions] = useState<any[]>([]);

  // Animation battle state
  const [battleStep, setBattleStep] = useState<number>(-1); // -1: not started, 0-4: rounds, 5: final result
  const [isSimulating, setIsSimulating] = useState(false);

  // Score submission inline states
  const [myKoreanInput, setMyKoreanInput] = useState<string>('');
  const [myMathWrongInput, setMyMathWrongInput] = useState<string>(''); // 수학: 틀린 문항 번호
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [roundScores, setRoundScores] = useState<any[]>([]);

  // Filter round schedules by active tab status
  const roundSchedules = allGlobalSchedules.filter(s => s.is_round_game);
  const filteredSchedules = roundSchedules.filter(s =>
    activeTab === 'ongoing' ? !s.isClosed : s.isClosed
  );

  // Selected schedule selection
  const activeSchedule = filteredSchedules.find(s => s.id === selectedScheduleId) || filteredSchedules[0] || null;

  // Auto reset selection on tab change
  useEffect(() => {
    if (activeSchedule) {
      setSelectedScheduleId(activeSchedule.id);
    } else {
      setSelectedScheduleId(null);
    }
  }, [activeTab, filteredSchedules.length]);

  // Load distributions when selected schedule changes
  useEffect(() => {
    if (activeSchedule) {
      // Fetch distributions and round scores
      const loadData = async () => {
        try {
          const [distData, scoresData] = await Promise.all([
            fetchRoundDistributions(activeSchedule.id),
            fetchRoundScores(activeSchedule.id)
          ]);
          setDistributions(distData || []);
          setRoundScores(scoresData || []);
          const mySchool = schools[authUser?.id || ''] || '';
          if (mySchool) {
            const myDist = distData?.find((d: any) => d.school === mySchool);
            if (myDist && !isEditingDist.current) {
              setD1(myDist.r1.toString());
              setD2(myDist.r2.toString());
              setD3(myDist.r3.toString());
              setD4(myDist.r4.toString());
              setD5(myDist.r5.toString());
            } else if (!myDist && !isEditingDist.current) {
              setD1('');
              setD2('');
              setD3('');
              setD4('');
              setD5('');
            }
          }
        } catch (e) {
          console.error(e);
        }
      };

      loadData();

      // Setup periodic sync (every 5 seconds) to act as a real-time updater
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    } else {
      setDistributions([]);
      setRoundScores([]);
    }
    setBattleStep(-1);
    setIsSimulating(false);
  }, [selectedScheduleId, activeSchedule, authUser, schools]);

  if (!authUser) return null;

  const mySchool = schools[authUser.id] || '';

  // Get participants and their score status
  const getParticipantStatus = () => {
    if (!activeSchedule) return { participants: [], schoolsList: [], schoolScores: {}, totalSubmitted: 0, participatingSchools: [] };

    const recordsForExam = activeSchedule.isClosed
      ? allRecords.filter(r => r.title === activeSchedule.title)
      : Object.entries(
          roundScores.reduce((acc: { [userId: string]: { totalScore: number; subCount: number; koreanScore?: number; mathScore?: number; isAbsent?: boolean } }, cur) => {
            if (!acc[cur.user_id]) {
              acc[cur.user_id] = { totalScore: 0, subCount: 0 };
            }
            if (cur.subject === 'absent') {
              acc[cur.user_id].isAbsent = true;
            } else {
              if (cur.subject === 'korean' || cur.subject === 'explore') {
                acc[cur.user_id].koreanScore = cur.score;
              } else if (cur.subject === 'math') {
                acc[cur.user_id].mathScore = cur.score;
              }
              acc[cur.user_id].totalScore += cur.score;
            }
            acc[cur.user_id].subCount += 1;
            return acc;
          }, {})
        ).map(([userId, val]: any) => {
          const needsBoth = activeSchedule.type === 'both';
          const submitted = val.isAbsent ? true : (needsBoth ? val.subCount >= 2 : val.subCount >= 1);
          return {
            userId,
            submitted,
            totalScore: val.isAbsent ? 0 : val.totalScore,
            koreanScore: val.koreanScore,
            mathScore: val.mathScore,
            isAbsent: val.isAbsent
          };
        });

    // Group participants by school
    const list = allLeaderboardUsers.map(u => {
      const uSchool = schools[u.id] || '소속 없음';
      const record: any = recordsForExam.find(r => r.userId === u.id);
      const isAbsent = activeSchedule.isClosed ? false : !!record?.isAbsent;
      const submitted = activeSchedule.isClosed ? !!record : !!record?.submitted;
      const score = record ? (record.totalScore || 0) : 0;

      return {
        id: u.id,
        name: u.name,
        school: uSchool,
        submitted,
        score,
        isAbsent
      };
    });

    const schoolsList = Array.from(new Set(list.map(p => p.school))).filter(s => s !== '소속 없음');

    const schoolScores: { [school: string]: { total: number; count: number; submittedCount: number; members: any[] } } = {};
    schoolsList.forEach(sch => {
      const members = list.filter(p => p.school === sch);
      const submittedMembers = members.filter(m => m.submitted);
      const totalScore = submittedMembers.reduce((sum, m) => sum + m.score, 0);
      schoolScores[sch] = {
        total: totalScore,
        count: members.length,
        submittedCount: submittedMembers.length,
        members
      };
    });

    const totalSubmitted = list.filter(p => p.submitted).length;

    // A school is participating if it has at least 1 member who submitted score
    const participatingSchools = schoolsList.filter(sch => schoolScores[sch].submittedCount > 0);

    return {
      participants: list,
      schoolsList,
      schoolScores,
      totalSubmitted,
      participatingSchools
    };
  };

  const { participants, schoolsList, schoolScores, totalSubmitted, participatingSchools } = getParticipantStatus();

  // Determine Team Leader: Highest scorer in my school who submitted
  const getTeamLeaderInfo = () => {
    if (!mySchool || !schoolScores[mySchool]) return { isLeader: false, leaderName: '', leaderId: '' };
    const myMembers = schoolScores[mySchool].members;
    const submittedMembers = myMembers.filter(m => m.submitted);
    if (submittedMembers.length === 0) return { isLeader: false, leaderName: '점수 제출자 없음', leaderId: '' };

    // Sort descending by score
    const sorted = [...submittedMembers].sort((a, b) => b.score - a.score);
    const leader = sorted[0];
    return {
      isLeader: authUser.id === leader.id,
      leaderName: profiles[leader.id] || leader.name,
      leaderId: leader.id
    };
  };

  const { isLeader, leaderName } = getTeamLeaderInfo();

  // Check if my school members all submitted
  const isMySchoolFullySubmitted = () => {
    if (!mySchool || !schoolScores[mySchool]) return false;
    const stats = schoolScores[mySchool];
    return stats.submittedCount === stats.count && stats.count > 0;
  };

  const allTeammatesSubmitted = isMySchoolFullySubmitted();

  // Check if my school's distribution is saved
  const isMyDistributionSaved = () => {
    if (!mySchool) return false;
    return distributions.some(d => d.school === mySchool);
  };

  // Determine default active step based on progress
  useEffect(() => {
    if (activeSchedule) {
      if (!allTeammatesSubmitted) {
        setActiveStep(1);
      } else if (!isMyDistributionSaved()) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }
    }
  }, [allTeammatesSubmitted, distributions.length, selectedScheduleId]);

  // Check if all participating schools submitted distributions
  const areAllDistributionsSaved = () => {
    if (participatingSchools.length === 0) return false;
    return participatingSchools.every(sch =>
      distributions.some(d => d.school === sch)
    );
  };

  const allDistributionsSubmitted = areAllDistributionsSaved();

  // Create round schedule handler
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalScheduleTitle.trim() || !globalScheduleDate) return;
    setIsCreating(true);
    try {
      await handleCreateGlobalSchedule(true); // Create with isRoundGame = true
      setShowAddForm(false);
      await fetchDbData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  // Close Round Handler
  const handleCloseActiveRound = async () => {
    if (!activeSchedule) return;
    if (!confirm('정말 이 대항전을 종료하시겠습니까? 종료 후에는 점수가 전체 공개되며 대항전 기록 탭으로 이동합니다.')) return;
    try {
      await closeGlobalSchedule(activeSchedule.id);
      await fetchDbData();
      setActiveTab('records');
    } catch (e) {
      console.error(e);
      alert('대항전 종료에 실패했습니다.');
    }
  };

  // 수학 틀린 문항 파싱 & 점수 계산
  const mathWrongNumbers = Array.from(new Set(
    myMathWrongInput.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 30)
  ));
  const mathDeduction = mathWrongNumbers.reduce((sum, n) => sum + getMathQuestionScore(n), 0);
  const mathCalculatedScore = Math.max(0, 100 - mathDeduction);

  // Save score handler
  const handleSaveMyScore = async () => {
    if (!activeSchedule) return;
    const kor = (activeSchedule.type === 'korean' || activeSchedule.type === 'both' || activeSchedule.type === 'explore') ? (myKoreanInput === '' ? null : parseInt(myKoreanInput)) : null;

    if ((activeSchedule.type === 'korean' || activeSchedule.type === 'both') && (kor === null || isNaN(kor) || kor < 0 || kor > 100)) {
      alert('올바른 국어 점수(0~100)를 입력해주세요.');
      return;
    }

    // For explore type
    if (activeSchedule.type === 'explore' && (kor === null || isNaN(kor) || kor < 0 || kor > 50)) {
      alert('올바른 탐구 점수(0~50)를 입력해주세요.');
      return;
    }

    // 수학 오답 번호 유효성 검사
    if (activeSchedule.type === 'math' || activeSchedule.type === 'both') {
      const invalidNums = myMathWrongInput.split(',').map(n => n.trim()).filter(n => {
        if (n === '') return false;
        const num = parseInt(n, 10);
        return isNaN(num) || num < 1 || num > 30;
      });
      if (invalidNums.length > 0) {
        alert(`유효하지 않은 수학 문항 번호: ${invalidNums.join(', ')} (1~30 범위)`);
        return;
      }
      const rawNums = myMathWrongInput.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      const uniqueNums = new Set(rawNums);
      if (rawNums.length !== uniqueNums.size) {
        alert('수학 틀린 문항 번호에 중복이 있습니다.');
        return;
      }
    }

    const mat = (activeSchedule.type === 'math' || activeSchedule.type === 'both') ? mathCalculatedScore : null;
    const mathWrongStr = myMathWrongInput.trim() === '' ? null : mathWrongNumbers.sort((a, b) => a - b).join(', ');

    setIsSavingScore(true);
    try {
      if (kor !== null) {
        const sub = activeSchedule.type === 'explore' ? 'explore' : 'korean';
        await saveRoundScore(activeSchedule.id, authUser.id, sub, kor, null, false);
      }
      if (mat !== null) {
        await saveRoundScore(activeSchedule.id, authUser.id, 'math', mat, mathWrongStr, false);
      }
      setMyKoreanInput('');
      setMyMathWrongInput('');
      alert('점수가 성공적으로 제출되었습니다!');
      // Reload round scores
      const scoresData = await fetchRoundScores(activeSchedule.id);
      setRoundScores(scoresData || []);
    } catch (e) {
      console.error(e);
      alert('점수 제출에 실패했습니다.');
    } finally {
      setIsSavingScore(false);
    }
  };

  // Save distribution handler
  const handleSaveMyDistribution = async () => {
    if (!activeSchedule || !mySchool) return;
    const mySchoolStats = schoolScores[mySchool];
    if (!mySchoolStats) return;

    const sum = (parseInt(d1)||0) + (parseInt(d2)||0) + (parseInt(d3)||0) + (parseInt(d4)||0) + (parseInt(d5)||0);
    if (sum !== mySchoolStats.total) {
      alert(`분배한 점수의 합(${sum}점)이 팀 총합 점수(${mySchoolStats.total}점)와 일치해야 합니다.`);
      return;
    }

    setIsSavingDist(true);
    try {
      await saveRoundDistribution(activeSchedule.id, mySchool, parseInt(d1)||0, parseInt(d2)||0, parseInt(d3)||0, parseInt(d4)||0, parseInt(d5)||0);
      // reload
      const data = await fetchRoundDistributions(activeSchedule.id);
      setDistributions(data || []);
      alert('우리 팀의 라운드 점수 분배가 저장되었습니다!');
      setActiveStep(3);
    } catch (e) {
      console.error(e);
      alert('점수 분배 저장에 실패했습니다.');
    } finally {
      setIsSavingDist(false);
    }
  };

  // Simulation handler
  const startBattleSimulation = () => {
    if (!allDistributionsSubmitted) {
      alert('대결을 진행하려면 참여하는 모든 학교의 점수 분배가 완료되어야 합니다.');
      return;
    }
    setBattleStep(0);
    setIsSimulating(true);
  };

  // Tick simulation steps
  useEffect(() => {
    if (isSimulating && battleStep >= 0 && battleStep < 5) {
      const timer = setTimeout(() => {
        setBattleStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (battleStep === 5) {
      setIsSimulating(false);
    }
  }, [isSimulating, battleStep]);

  // Compute round winners
  const getBattleResults = () => {
    if (!activeSchedule || distributions.length < 2) return null;

    const results = [];
    const schoolA = distributions[0]?.school || '';
    const schoolB = distributions[1]?.school || '';

    const distA = distributions[0] || { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
    const distB = distributions[1] || { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };

    const rounds = [
      { num: 1, scoreA: distA.r1, scoreB: distB.r1 },
      { num: 2, scoreA: distA.r2, scoreB: distB.r2 },
      { num: 3, scoreA: distA.r3, scoreB: distB.r3 },
      { num: 4, scoreA: distA.r4, scoreB: distB.r4 },
      { num: 5, scoreA: distA.r5, scoreB: distB.r5 },
    ];

    let winsA = 0;
    let winsB = 0;

    for (const r of rounds) {
      let winner = '무승부';
      if (r.scoreA > r.scoreB) {
        winner = schoolA;
        winsA++;
      } else if (r.scoreB > r.scoreA) {
        winner = schoolB;
        winsB++;
      }
      results.push({
        roundNum: r.num,
        scoreA: r.scoreA,
        scoreB: r.scoreB,
        winner
      });
    }

    const overallWinner = winsA > winsB ? schoolA : winsB > winsA ? schoolB : '무승부';

    return {
      schoolA,
      schoolB,
      rounds: results,
      winsA,
      winsB,
      overallWinner
    };
  };

  const battleData = getBattleResults();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-neutral-100 font-suit flex items-center gap-2">
            <Swords className="w-5 h-5 text-indigo-400" />
            학교 대항전 (ROUND)
          </h2>
          <p className="text-xs text-neutral-400 font-suit">
            야르
          </p>
        </div>
        <div className="flex gap-2">
          {mySchool ? (
            <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold font-suit flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              내 소속: {mySchool}
            </span>
          ) : (
            <a href="/profile" className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold font-suit flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              프로필에서 학교를 등록하세요
            </a>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-750 transition-colors text-xs font-semibold font-suit"
          >
            <Plus className="w-3.5 h-3.5" />
            대항전 등록
          </button>
        </div>
      </div>

      {/* Internal Page Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`px-4 py-2 text-sm font-bold font-suit transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'ongoing'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
        >
          <Calendar className="w-4 h-4" />
          진행 중인 대항전
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 text-sm font-bold font-suit transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'records'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
        >
          <History className="w-4 h-4" />
          대항전 기록
        </button>
      </div>

      {/* Add round game schedule form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateRound} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4 text-xs font-suit">
              <h3 className="font-semibold text-neutral-200">새로운 학교 대항전 실모 등록</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-neutral-400">시험 날짜</label>
                  <Input
                    type="date"
                    required
                    value={globalScheduleDate}
                    onChange={e => setGlobalScheduleDate(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 text-xs"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-neutral-400">실모 이름</label>
                  <Input
                    placeholder="예: 평가원 대비 학교 대항전 1회"
                    required
                    value={globalScheduleTitle}
                    onChange={e => setGlobalScheduleTitle(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-neutral-400">시험 유형</label>
                <div className="flex gap-2">
                  {(['korean', 'math', 'both'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGlobalScheduleType(t)}
                      className={`px-3 py-1.5 rounded border text-[11px] font-medium transition-all ${globalScheduleType === t
                          ? 'border-neutral-250 bg-neutral-100 text-neutral-950 font-bold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                        }`}
                    >
                      {t === 'korean' ? '국어' : t === 'math' ? '수학' : '국어+수학'}
                    </button>
                  ))}
                </div>
              </div>
              {/* File uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    문제지 PDF (선택)
                  </label>
                  {globalScheduleQuestionFile ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-900 border border-neutral-800">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="text-[11px] text-neutral-300 truncate flex-1">{globalScheduleQuestionFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setGlobalScheduleQuestionFile(null)}
                        className="text-neutral-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-900 border border-dashed border-neutral-700 hover:border-indigo-500/50 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={e => setGlobalScheduleQuestionFile(e.target.files?.[0] || null)}
                      />
                      <Plus className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-[11px] text-neutral-500">파일 선택</span>
                    </label>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    해설지 PDF (선택)
                  </label>
                  {globalScheduleSolutionFile ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-900 border border-neutral-800">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-[11px] text-neutral-300 truncate flex-1">{globalScheduleSolutionFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setGlobalScheduleSolutionFile(null)}
                        className="text-neutral-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-900 border border-dashed border-neutral-700 hover:border-amber-500/50 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={e => setGlobalScheduleSolutionFile(e.target.files?.[0] || null)}
                      />
                      <Plus className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-[11px] text-neutral-500">파일 선택</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setGlobalScheduleQuestionFile(null); setGlobalScheduleSolutionFile(null); }} className="h-8 text-xs border-neutral-800 text-neutral-400">
                  취소
                </Button>
                <Button type="submit" disabled={isCreating} className="h-8 text-xs bg-indigo-600 text-white hover:bg-indigo-500">
                  {isCreating ? '등록 중...' : '등록하기'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/10 font-suit text-neutral-500 text-xs">
          {activeTab === 'ongoing' ? '진행 중인 학교 대항전 일정이 없습니다.' : '기록된 학교 대항전이 없습니다.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Schedule list */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-400 font-suit uppercase tracking-wider">
              {activeTab === 'ongoing' ? '진행 대항전 목록' : '종료된 기록 목록'}
            </h3>
            <div className="space-y-2">
              {filteredSchedules.map(schedule => {
                const isActive = schedule.id === selectedScheduleId;

                // D-day calculation (KST 기준)
                const getDday = () => {
                  if (!schedule.date) return null;
                  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const today = new Date(todayKST);
                  const target = new Date(schedule.date);
                  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diff;
                };

                const dday = !schedule.isClosed ? getDday() : null;

                const ddayLabel = (() => {
                  if (dday === null) return null;
                  if (dday === 0) return { text: 'D-Day', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
                  if (dday > 0) return { text: `D-${dday}`, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
                  return { text: `D+${Math.abs(dday)}`, cls: 'text-neutral-500 bg-neutral-800/60 border-neutral-700' };
                })();

                return (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedScheduleId(schedule.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 ${isActive
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-neutral-950/40 border-neutral-850 hover:border-neutral-800'
                      }`}
                  >
                    <div className="flex justify-between items-start w-full gap-2">
                      <span className="font-semibold text-sm text-neutral-100 truncate flex-1 min-w-0">{schedule.title}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ddayLabel && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${ddayLabel.cls}`}>
                            {ddayLabel.text}
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${schedule.isClosed
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                          }`}>
                          {schedule.isClosed ? '종료됨' : '진행중'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-suit w-full">
                      <span>일정: {schedule.date}</span>
                      <span>유형: {schedule.type === 'korean' ? '국어' : schedule.type === 'math' ? '수학' : '국어+수학'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Round details & Step Wizard */}
          {activeSchedule && (() => {
            // D-day check for the active schedule
            const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const activeDday = activeSchedule.date
              ? Math.round((new Date(activeSchedule.date).getTime() - new Date(todayKST).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const isLocked = !activeSchedule.isClosed && activeDday > 0;

            return (
              <div className="lg:col-span-8 space-y-6">
                {/* Title Header (always shown) */}
                <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-850 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-neutral-100 text-base">{activeSchedule.title}</h3>
                      <p className="text-[10px] text-neutral-500 mt-1 font-suit">
                        일정: {activeSchedule.date} | 유형: {activeSchedule.type === 'korean' ? '국어' : activeSchedule.type === 'math' ? '수학' : '국어+수학'}
                      </p>
                    </div>
                    {isSilmodan && !activeSchedule.isClosed && (
                      <button
                        onClick={handleCloseActiveRound}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-xs font-semibold font-suit"
                      >
                        대항전 최종 종료
                      </button>
                    )}
                  </div>
                  {/* PDF download links */}
                  {(activeSchedule.questionPdfUrl || activeSchedule.solutionPdfUrl) && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-900">
                      {activeSchedule.questionPdfUrl && (
                        <a
                          href={activeSchedule.questionPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-[11px] font-semibold font-suit"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          문제지 다운로드
                        </a>
                      )}
                      {activeSchedule.solutionPdfUrl && (
                        <a
                          href={activeSchedule.solutionPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors text-[11px] font-semibold font-suit"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          해설지 다운로드
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* LOCKED state for future rounds */}
                {isLocked ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 rounded-xl bg-neutral-950/60 border border-neutral-850 border-dashed flex flex-col items-center justify-center gap-4 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-neutral-500" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-bold text-neutral-300 font-suit text-sm">아직 개방되지 않은 대항전입니다</p>
                      <p className="text-xs text-neutral-500 font-suit">
                        대항전 당일(<strong className="text-amber-400">{activeSchedule.date}</strong>)이 되어야 참여할 수 있습니다.
                      </p>
                    </div>
                    <span className="text-3xl font-mono font-bold text-amber-400 tracking-tight">
                      D-{activeDday}
                    </span>
                  </motion.div>
                ) : (
                  <>

                    {/* Stepper Wizard Indicator */}
                    {activeTab === 'ongoing' && (
                      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 flex justify-between items-center text-xs font-suit">
                        <button
                          onClick={() => setActiveStep(1)}
                          className={`flex items-center gap-1.5 pb-1 border-b-2 font-semibold ${activeStep === 1
                              ? 'border-indigo-500 text-indigo-400'
                              : 'border-transparent text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          단계 1: 점수 제출
                        </button>
                        <div className="h-0.5 w-8 bg-neutral-800 flex-1 mx-2" />
                        <button
                          onClick={() => {
                            if (allTeammatesSubmitted) {
                              setActiveStep(2);
                            } else {
                              alert('우리 학교 멤버들의 점수 제출이 먼저 완료되어야 분배 단계로 갈 수 있습니다.');
                            }
                          }}
                          className={`flex items-center gap-1.5 pb-1 border-b-2 font-semibold ${activeStep === 2
                              ? 'border-indigo-500 text-indigo-400'
                              : allTeammatesSubmitted
                                ? 'border-transparent text-neutral-400 hover:text-neutral-200'
                                : 'border-transparent text-neutral-700 cursor-not-allowed'
                            }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          단계 2: 점수 분배
                        </button>
                        <div className="h-0.5 w-8 bg-neutral-800 flex-1 mx-2" />
                        <button
                          onClick={() => {
                            if (allTeammatesSubmitted) {
                              setActiveStep(3);
                            } else {
                              alert('점수 제출 및 분배 저장이 모두 선행되어야 결과를 볼 수 있습니다.');
                            }
                          }}
                          className={`flex items-center gap-1.5 pb-1 border-b-2 font-semibold ${activeStep === 3
                              ? 'border-indigo-500 text-indigo-400'
                              : allTeammatesSubmitted
                                ? 'border-transparent text-neutral-400 hover:text-neutral-200'
                                : 'border-transparent text-neutral-700 cursor-not-allowed'
                            }`}
                        >
                          <Swords className="w-3.5 h-3.5" />
                          단계 3: 대결 결과
                        </button>
                      </div>
                    )}

                    {/* Step Contents */}
                    <AnimatePresence mode="wait">
                      {/* Step 1: 점수 제출 현황 */}
                      {(activeStep === 1 || activeTab === 'records') && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-5 rounded-xl bg-neutral-900/30 border border-neutral-850 space-y-4"
                        >
                          <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-indigo-400" />
                              학교별 점수 제출 현황
                            </h4>
                            {activeTab === 'ongoing' && (
                              <span className="text-[10px] text-neutral-400 font-suit">
                                우리 학교 상태: {allTeammatesSubmitted ? '제출 완료' : '제출 대기중'}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {schoolsList.map(sch => {
                              const stats = schoolScores[sch];
                              const isMyTeam = sch === mySchool;
                              const canSeeDetails = activeSchedule.isClosed || isMyTeam;

                              return (
                                <div
                                  key={sch}
                                  className={`p-4 rounded-xl border space-y-3 ${isMyTeam ? 'bg-indigo-950/10 border-indigo-500/20' : 'bg-neutral-950/60 border-neutral-900'
                                    }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs text-neutral-200 flex items-center gap-1.5">
                                      <Shield className={`w-3.5 h-3.5 ${isMyTeam ? 'text-indigo-400' : 'text-neutral-500'}`} />
                                      {sch} {isMyTeam && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 rounded">우리 팀</span>}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-mono">
                                      제출 {stats.submittedCount}/{stats.count} 명
                                    </span>
                                  </div>

                                  <div className="bg-neutral-900/60 p-3 rounded-lg flex justify-between items-center">
                                    <span className="text-[10px] text-neutral-400">팀 점수 총합</span>
                                    <span className="font-mono text-sm font-bold text-neutral-100">
                                      {canSeeDetails ? (
                                        <span className="text-indigo-300">{stats.total} 점</span>
                                      ) : (
                                        <span className="text-neutral-600">비공개 (진행중)</span>
                                      )}
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                    {stats.members.map(m => (
                                      <div key={m.id} className="flex justify-between items-center text-[11px] bg-neutral-900/30 px-2.5 py-1.5 rounded border border-neutral-900">
                                        <span className="text-neutral-400">{profiles[m.id] || m.name}</span>
                                        <div className="flex items-center gap-1.5 font-mono">
                                          {m.isAbsent ? (
                                            <span className="text-amber-500 font-medium">미참여</span>
                                          ) : m.submitted ? (
                                            <>
                                              <span className="text-emerald-400 font-medium">제출 완료</span>
                                              {canSeeDetails && (
                                                <span className="text-neutral-500">({m.score}점)</span>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-neutral-600">미제출</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Inline score input form for the logged-in user if they haven't submitted */}
                          {(() => {
                            const myScoresForSchedule = roundScores.filter(s => s.user_id === authUser.id);
                            const needsKorean = activeSchedule.type === 'korean' || activeSchedule.type === 'both';
                            const needsMath = activeSchedule.type === 'math' || activeSchedule.type === 'both';
                            const needsExplore = activeSchedule.type === 'explore';
                            const hasKorean = myScoresForSchedule.some(s => s.subject === 'korean');
                            const hasMath = myScoresForSchedule.some(s => s.subject === 'math');
                            const hasExplore = myScoresForSchedule.some(s => s.subject === 'explore');
                            const hasAbsent = myScoresForSchedule.some(s => s.subject === 'absent');
                            const alreadySubmitted =
                              hasAbsent || (
                                (!needsKorean || hasKorean) &&
                                (!needsMath || hasMath) &&
                                (!needsExplore || hasExplore)
                              );
                            return !alreadySubmitted;
                          })() && activeTab === 'ongoing' && mySchool && (
                            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-850 space-y-4">
                              <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                                <Plus className="w-4 h-4 text-emerald-400" />
                                <h5 className="text-xs font-bold text-neutral-200 font-suit">내 점수 입력하기</h5>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {(activeSchedule.type === 'korean' || activeSchedule.type === 'both') && (
                                  <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-semibold">국어 점수 (0~100)</label>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      value={myKoreanInput}
                                      onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setMyKoreanInput(val);
                                      }}
                                      placeholder="국어 점수"
                                      className="bg-neutral-900 border-neutral-800 text-xs py-1"
                                    />
                                  </div>
                                )}
                                {(activeSchedule.type === 'math' || activeSchedule.type === 'both') && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <label className="block text-[10px] text-neutral-500 font-semibold">수학 틀린 문항 번호 (쉼표 구분)</label>
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                                        <Calculator className="w-3 h-3 text-neutral-500" />
                                        <span className="font-mono font-bold text-xs">{mathCalculatedScore}점</span>
                                      </div>
                                    </div>
                                    <Input
                                      type="text"
                                      value={myMathWrongInput}
                                      onChange={e => setMyMathWrongInput(e.target.value)}
                                      placeholder="예: 15, 22, 28 (만점이면 빈칸)"
                                      className="bg-neutral-900 border-neutral-800 text-xs py-1 font-mono"
                                    />
                                    <p className="text-[9px] text-neutral-600">※ 오답 번호 입력 시 배점표 기준으로 자동 차감됩니다. 만점이면 비워두세요.</p>
                                  </div>
                                )}
                                {activeSchedule.type === 'explore' && (
                                  <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-semibold">탐구 점수 (0~50)</label>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      value={myKoreanInput}
                                      onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setMyKoreanInput(val);
                                      }}
                                      placeholder="탐구 점수"
                                      className="bg-neutral-900 border-neutral-800 text-xs py-1"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!activeSchedule) return;
                                    if (!confirm('정말 이번 대항전에서 미참여로 등록하시겠습니까? (Z-score 및 팀 점수 계산에서 제외됩니다)')) return;
                                    setIsSavingScore(true);
                                    try {
                                      // 대항전 round_scores에 미참여를 나타내는 식별을 위해 특수 점수(예: -1) 혹은 custom field/meta를 저장할 수 있습니다.
                                      // 여기서는 round_scores에 subject: 'absent'로 score: 1을 저장하여 미참여자로 식별하게 처리합니다.
                                      await saveRoundScore(activeSchedule.id, authUser.id, 'absent', 1, null, false);
                                      alert('미참여자로 등록되었습니다.');
                                      const scoresData = await fetchRoundScores(activeSchedule.id);
                                      setRoundScores(scoresData || []);
                                    } catch (e) {
                                      console.error(e);
                                      alert('미참여 등록에 실패했습니다.');
                                    } finally {
                                      setIsSavingScore(false);
                                    }
                                  }}
                                  disabled={isSavingScore}
                                  className="h-8 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-suit font-bold transition-colors"
                                >
                                  미참여 등록
                                </button>
                                <Button
                                  onClick={handleSaveMyScore}
                                  disabled={isSavingScore}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-suit font-bold"
                                >
                                  {isSavingScore ? '제출 중...' : '점수 제출'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {activeTab === 'ongoing' && allTeammatesSubmitted && (
                            <div className="flex justify-end pt-2">
                              <Button
                                onClick={() => setActiveStep(2)}
                                className="text-xs bg-indigo-600 text-white hover:bg-indigo-500"
                              >
                                다음 단계: 점수 분배 설정하기
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Step 2: 점수 분배 전략 */}
                      {activeStep === 2 && activeTab === 'ongoing' && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-5 rounded-xl bg-neutral-900/30 border border-neutral-850 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                              <Coins className="w-4 h-4 text-amber-400" />
                              5개 라운드 점수 분배 전략
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-suit">
                              우리 팀 총합: <strong className="text-indigo-400 font-mono">{schoolScores[mySchool]?.total || 0}점</strong>
                            </span>
                          </div>

                          {!allTeammatesSubmitted ? (
                            <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-900 text-neutral-400 text-xs font-suit flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                              <span>우리 학교 팀원 모두가 시험 점수를 입력해야 점수 분배를 할 수 있습니다. (1단계 완료 필요)</span>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-neutral-400 leading-relaxed font-suit">
                                우리 팀의 총합 점수를 5개의 라운드에 배분하세요. 상대 학교의 분배 점수와 라운드별로 비교하여 더 높은 점수를 배분한 학교가 라운드를 이깁니다.
                                <br />
                                <strong>팀장(최고점자: {leaderName}님)만 최종 저장할 수 있습니다.</strong>
                              </p>

                              <div className="grid grid-cols-5 gap-2.5">
                                {[
                                  { num: 1, val: d1, setVal: setD1 },
                                  { num: 2, val: d2, setVal: setD2 },
                                  { num: 3, val: d3, setVal: setD3 },
                                  { num: 4, val: d4, setVal: setD4 },
                                  { num: 5, val: d5, setVal: setD5 },
                                ].map(r => (
                                  <div key={r.num} className="bg-neutral-950 p-3 rounded-lg border border-neutral-900 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase">{r.num}R</span>
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      disabled={activeSchedule.isClosed || !isLeader}
                                      value={r.val}
                                      onFocus={() => { isEditingDist.current = true; }}
                                      onBlur={() => { isEditingDist.current = false; }}
                                      onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        r.setVal(val);
                                      }}
                                      className="bg-neutral-900 border-neutral-800 text-center font-mono text-xs w-full p-1 h-8"
                                      placeholder="0"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                <div className="text-[11px] text-neutral-400 flex flex-col gap-0.5">
                                  <span>현재 분배 총합: <strong className="font-mono text-neutral-200">{(parseInt(d1)||0) + (parseInt(d2)||0) + (parseInt(d3)||0) + (parseInt(d4)||0) + (parseInt(d5)||0)}점</strong> / {schoolScores[mySchool]?.total || 0}점</span>
                                  {schoolScores[mySchool]?.total - ((parseInt(d1)||0) + (parseInt(d2)||0) + (parseInt(d3)||0) + (parseInt(d4)||0) + (parseInt(d5)||0)) !== 0 && (
                                    <span className="text-rose-400 font-semibold font-mono">남은 점수: {schoolScores[mySchool]?.total - ((parseInt(d1)||0) + (parseInt(d2)||0) + (parseInt(d3)||0) + (parseInt(d4)||0) + (parseInt(d5)||0))}점</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isLeader && (
                                    <span className="text-[10px] text-rose-400 font-suit">
                                      팀장({leaderName}님)만 저장이 가능합니다.
                                    </span>
                                  )}
                                  <Button
                                    onClick={handleSaveMyDistribution}
                                    disabled={isSavingDist || !isLeader || ((parseInt(d1)||0) + (parseInt(d2)||0) + (parseInt(d3)||0) + (parseInt(d4)||0) + (parseInt(d5)||0)) !== schoolScores[mySchool]?.total}
                                    className="h-8 text-xs bg-indigo-600 text-white hover:bg-indigo-500 font-suit"
                                  >
                                    {isSavingDist ? '저장 중...' : '분배 완료 및 저장'}
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}

                      {/* Step 3: 대결 결과 */}
                      {(activeStep === 3 || activeTab === 'records') && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-5 rounded-xl bg-neutral-900/30 border border-neutral-850 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                              <Swords className="w-4 h-4 text-indigo-400" />
                              대항전 승부 결과
                            </h4>
                            <div className="flex items-center gap-2">
                              {activeTab === 'ongoing' && allDistributionsSubmitted && battleStep === -1 && (
                                <Button
                                  onClick={startBattleSimulation}
                                  className="h-7 px-3 text-[10px] bg-emerald-600 text-white hover:bg-emerald-500 font-suit flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  대결 시작!
                                </Button>
                              )}
                            </div>
                          </div>

                          {!allDistributionsSubmitted && activeTab === 'ongoing' ? (
                            <div className="py-6 text-center text-xs text-neutral-500 font-suit flex flex-col items-center gap-2">
                              <HelpCircle className="w-8 h-8 text-neutral-600" />
                              <span>참여하는 모든 학교가 5개 라운드 분배 저장을 완료해야 결과를 볼 수 있습니다.</span>
                              <span className="text-[10px] text-neutral-600">
                                (현재 제출 완료 학교: {distributions.map(d => d.school).join(', ') || '없음'} / 전체 참여 학교: {participatingSchools.join(', ')})
                              </span>
                            </div>
                          ) : (
                            battleData && (
                              <div className="space-y-4">
                                {/* Schools Headers */}
                                <div className="flex justify-between items-center px-4 py-2 bg-neutral-950 rounded-lg border border-neutral-900 text-xs font-bold text-neutral-200">
                                  <span className="text-indigo-400 flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                    {battleData.schoolA}
                                  </span>
                                  <span className="text-neutral-500 font-mono text-[10px]">VS</span>
                                  <span className="text-rose-400 flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                                    {battleData.schoolB}
                                  </span>
                                </div>

                                {/* Animated Round list */}
                                <div className="space-y-2.5">
                                  {battleData.rounds.map((r, index) => {
                                    // If it is records tab, display everything immediately
                                    const isVisible = activeTab === 'records' || battleStep >= index;
                                    if (!isVisible) return null;

                                    const isWinA = r.winner === battleData.schoolA;
                                    const isWinB = r.winner === battleData.schoolB;

                                    return (
                                      <motion.div
                                        key={r.roundNum}
                                        initial={activeTab === 'records' ? {} : { opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${r.winner === '무승부'
                                            ? 'bg-neutral-900/40 border-neutral-800'
                                            : isWinA
                                              ? 'bg-indigo-950/10 border-indigo-500/20'
                                              : 'bg-rose-950/10 border-rose-500/20'
                                          }`}
                                      >
                                        {/* School A side */}
                                        <div className="flex items-center gap-3 w-1/3">
                                          <span className={`font-mono font-bold ${isWinA ? 'text-indigo-400 text-sm' : 'text-neutral-400'}`}>
                                            {r.scoreA}점
                                          </span>
                                          {isWinA && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold">WIN</span>}
                                        </div>

                                        {/* Round center badge */}
                                        <div className="w-1/3 text-center">
                                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{r.roundNum} ROUND</span>
                                        </div>

                                        {/* School B side */}
                                        <div className="flex items-center justify-end gap-3 w-1/3">
                                          {isWinB && <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">WIN</span>}
                                          <span className={`font-mono font-bold ${isWinB ? 'text-rose-400 text-sm' : 'text-neutral-400'}`}>
                                            {r.scoreB}점
                                          </span>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>

                                {/* Overall Winner Declaration */}
                                {(activeTab === 'records' || battleStep === 5) && (
                                  <motion.div
                                    initial={activeTab === 'records' ? {} : { scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.03] text-center space-y-2"
                                  >
                                    <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
                                    <h4 className="font-bold text-sm text-neutral-100 font-suit">대항전 최종 결과</h4>
                                    <p className="text-xs text-neutral-300 font-suit">
                                      {battleData.overallWinner === '무승부' ? (
                                        <span>양 학교가 무승부를 기록했습니다!</span>
                                      ) : (
                                        <span>
                                          우승 학교: <strong className="text-indigo-400">{battleData.overallWinner}</strong> ({battleData.winsA}승 vs {battleData.winsB}승)
                                        </span>
                                      )}
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
