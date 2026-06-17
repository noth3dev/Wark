'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import Auth from '@/components/Auth';
import { SilmoProvider, useSilmo } from './silmo-context';
import { AlertCircle, Loader2, Database, BarChart2, Clock, Calendar as CalendarIcon, Activity, Trophy, Zap, Settings, Swords } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScoreModal } from '@/components/silmo/score-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExamType } from '@/types/silmo';

function SilmoLayoutContent({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading, isSilmodan } = useAuth();
  const {
    isDbConnected,
    dbErrorMsg,
    currentSilmoUser,
    isScoreModalOpen,
    setIsScoreModalOpen,
    finishedExamType,
    prefilledTitle,
    setPrefilledTitle,
    setCompletedScheduleId,
    existingTitles,
    handleSaveScore,
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
    handleCreateGlobalSchedule
  } = useSilmo();

  const [isCreatingSchedule, setIsCreatingSchedule] = React.useState(false);
  const handleCreateScheduleWithLoading = async () => {
    setIsCreatingSchedule(true);
    try { await handleCreateGlobalSchedule(); } finally { setIsCreatingSchedule(false); }
  };

  const pathname = usePathname();

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

  // Not a Silmodan member (is_silmodan !== 1)
  if (authUser && !isSilmodan) {
    return (
      <main className="h-full bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />
        <div className="z-10 text-center max-w-md px-6 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 font-suit">실모단 전용 서비스입니다</h2>
          <p className="text-xs text-neutral-400 font-suit leading-relaxed">
            죄송합니다. 이 페이지는 승인된 계정만 접근하실 수 있습니다.
          </p>
          <p className="text-[11px] text-neutral-600 font-suit">
            문의는 안받습니다
          </p>
        </div>
      </main>
    );
  }

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

        {/* Navigation Tabs */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 mb-6 flex items-center justify-start gap-1 p-1 max-w-full overflow-x-auto no-scrollbar rounded-lg">
          <Link href="/silmo" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <BarChart2 className="w-3.5 h-3.5" />
            대시보드
          </Link>
          <Link href="/silmo/timer" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/timer' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Clock className="w-3.5 h-3.5" />
            타이머
          </Link>
          <Link href="/silmo/calendar" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/calendar' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <CalendarIcon className="w-3.5 h-3.5" />
            일정(달력)
          </Link>
          <Link href="/silmo/status" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/status' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Activity className="w-3.5 h-3.5" />
            현황
          </Link>
          <Link href="/silmo/records" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/records' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Trophy className="w-3.5 h-3.5" />
            기록
          </Link>
          <Link href="/silmo/round" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/round' ? 'bg-neutral-800 text-indigo-400' : 'text-indigo-400/70 hover:bg-neutral-800/50 hover:text-indigo-400'}`}>
            <Swords className="w-3.5 h-3.5 text-indigo-400" />
            ROUND (대항전)
          </Link>
          <Link href="/silmo/silvival" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/silvival' ? 'bg-neutral-800 text-indigo-400' : 'text-indigo-400/70 hover:bg-neutral-800/50 hover:text-indigo-400'}`}>
            <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            SILVIVAL
          </Link>
          <Link href="/silmo/rules" className={`text-xs px-4 py-2 font-suit flex items-center gap-1.5 rounded-md transition-colors ${pathname === '/silmo/rules' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            규칙 & 시뮬레이터
          </Link>
        </div>

        {/* Page Content */}
        {children}
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
                    className={`py-1.5 rounded border text-[11px] font-medium transition-all ${globalScheduleType === t
                      ? 'border-neutral-200 bg-neutral-100 text-neutral-950'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-750'
                      }`}
                  >
                    {t === 'korean' ? '국어' : t === 'math' ? '수학' : '국어+수학'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium flex items-center gap-1">
                문제지 PDF
                <span className="text-neutral-600">(선택)</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setGlobalScheduleQuestionFile(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-neutral-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer"
              />
              {globalScheduleQuestionFile && (
                <span className="text-[10px] text-emerald-400">✓ {globalScheduleQuestionFile.name}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium flex items-center gap-1">
                해설지 PDF
                <span className="text-neutral-600">(선택)</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setGlobalScheduleSolutionFile(e.target.files?.[0] || null)}
                className="w-full text-[11px] text-neutral-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer"
              />
              {globalScheduleSolutionFile && (
                <span className="text-[10px] text-emerald-400">✓ {globalScheduleSolutionFile.name}</span>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-1.5 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsGlobalScheduleModalOpen(false)}
              disabled={isCreatingSchedule}
              className="border-neutral-800 text-neutral-400 hover:bg-neutral-900 text-[10px] py-1 h-7 px-3"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateScheduleWithLoading}
              disabled={isCreatingSchedule}
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400 text-[10px] py-1 h-7 px-3 font-semibold min-w-[64px]"
            >
              {isCreatingSchedule ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />업로드중</span>
              ) : '등록하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function SilmoLayout({ children }: { children: React.ReactNode }) {
  return (
    <SilmoProvider>
      <SilmoLayoutContent>{children}</SilmoLayoutContent>
    </SilmoProvider>
  );
}
