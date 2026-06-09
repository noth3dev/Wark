import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExamRecord, User, LeaderboardEntry } from '@/types/silmo';
import { Trophy, Medal, Target, BarChart, Zap } from 'lucide-react';

interface LeaderboardProps {
  records: ExamRecord[];
  users: User[];
  globalTitles?: string[];
}

export function Leaderboard({ records, users, globalTitles = [] }: LeaderboardProps) {
  // Aggregate stats per user
  const getNormalizedScore = (rec: ExamRecord) => {
    if (rec.type === 'both') {
      const kor = rec.koreanScore || 0;
      const math = rec.mathScore || 0;
      return (kor + math) / 2;
    } else if (rec.type === 'korean') {
      return rec.koreanScore || 0;
    } else {
      return rec.mathScore || 0;
    }
  };

  const leaderboardEntries: LeaderboardEntry[] = users.map(user => {
    const userRecords = records.filter(r => r.userId === user.id);
    const examCount = userRecords.length;

    if (examCount === 0) {
      return {
        userId: user.id,
        name: user.name,
        examCount: 0,
        avgScore: 0,
        highestScore: 0,
        recentScore: 0
      };
    }

    const normalizedScores = userRecords.map(getNormalizedScore);
    const avgScore = Math.round(normalizedScores.reduce((acc, s) => acc + s, 0) / examCount);

    const globalScheduleRecords = globalTitles.length > 0
      ? userRecords.filter(r => globalTitles.includes(r.title))
      : userRecords;

    const highestScore = globalScheduleRecords.length > 0
      ? Math.max(...globalScheduleRecords.map(getNormalizedScore))
      : 0;
    
    // Sort records to find the most recent
    const sortedRecords = [...userRecords].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const recentScore = getNormalizedScore(sortedRecords[0]);

    return {
      userId: user.id,
      name: user.name,
      image: user.image,
      examCount,
      avgScore,
      highestScore,
      recentScore
    };
  });

  // Sort by average score descending, then highest score, then exam count
  const sortedEntries = leaderboardEntries.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    if (b.highestScore !== a.highestScore) return b.highestScore - a.highestScore;
    return b.examCount - a.examCount;
  });

  const topThree = sortedEntries.slice(0, 3);
  const remaining = sortedEntries.slice(3);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-neutral-300 fill-neutral-300/20" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-700 fill-amber-700/20" />;
    return <span className="text-xs text-neutral-500 font-semibold font-mono tabular-nums">{rank}</span>;
  };

  const getPodiumBadgeColor = (index: number) => {
    if (index === 0) return 'border-amber-400/30 bg-amber-400/[0.02]';
    if (index === 1) return 'border-neutral-300/30 bg-neutral-300/[0.02]';
    return 'border-amber-700/30 bg-amber-700/[0.02]';
  };

  const getPodiumIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] animate-pulse" />;
    if (index === 1) return <Medal className="w-7 h-7 text-neutral-300" />;
    return <Medal className="w-6 h-6 text-amber-700" />;
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Render 2nd, 1st, 3rd for podium layouts if we have enough entries */}
        {[1, 0, 2].map((podiumIdx) => {
          const entry = topThree[podiumIdx];
          if (!entry) return <div key={podiumIdx} className="hidden sm:block border border-dashed border-neutral-900 rounded-xl" />;
          
          const rank = podiumIdx + 1;
          const cardClasses = `border rounded-xl transition-all duration-300 hover:scale-[1.01] ${getPodiumBadgeColor(podiumIdx)}`;

          return (
            <Card key={entry.userId} className={cardClasses}>
              <CardContent className="p-4 flex flex-col items-center justify-between text-center min-h-[140px] sm:min-h-[160px] gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    {getPodiumIcon(podiumIdx)}
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-[9px] font-bold font-mono">
                      {rank}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold font-suit text-neutral-100 truncate max-w-[80px] sm:max-w-full">
                    {entry.name}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums leading-none">
                    {entry.avgScore}점
                  </span>
                  <span className="text-[10px] text-neutral-500 font-suit font-medium mt-1">
                    평균 점수
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Leaderboard Table */}
      <div className="border border-neutral-800 bg-neutral-950/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/30 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-suit">
                <th className="py-3 px-4 text-center w-12">순위</th>
                <th className="py-3 px-4">닉네임</th>
                <th className="py-3 px-4 text-center w-20">응시</th>
                <th className="py-3 px-4 text-right">평균 점수</th>
                <th className="py-3 px-4 text-right">최고 점수</th>
                <th className="py-3 px-4 text-right pr-6">최근 점수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-xs font-suit font-medium text-neutral-300">
              {sortedEntries.map((entry, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                
                return (
                  <tr 
                    key={entry.userId} 
                    className={`hover:bg-neutral-900/30 transition-colors duration-150 group ${
                      isTopThree ? 'bg-neutral-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {getRankBadge(rank)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-neutral-200 group-hover:text-neutral-100 ${
                        isTopThree ? 'font-semibold' : ''
                      }`}>
                        {entry.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-400">
                      {entry.examCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-100 tabular-nums">
                      {entry.avgScore}점
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-400">
                      {entry.highestScore}점
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-400 pr-6">
                      {entry.recentScore}점
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
