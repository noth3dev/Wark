import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExamRecord } from '@/types/silmo';
import { Award, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardCardsProps {
  records: ExamRecord[];
}

export function DashboardCards({ records }: DashboardCardsProps) {
  // 1. Total Exams
  const totalExams = records.length;

  // Helper to normalize any record to a 100-point scale
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

  // 2. Average Score (100pt scale)
  const averageScore = totalExams > 0
    ? Math.round(records.reduce((acc, rec) => acc + getNormalizedScore(rec), 0) / totalExams)
    : 0;

  // 3. Highest Score (100pt scale)
  const highestScore = totalExams > 0
    ? Math.max(...records.map(getNormalizedScore))
    : 0;

  // 4. Recent Score Details
  const recentRecord = totalExams > 0
    ? [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const getRecentLabel = (rec: ExamRecord | null) => {
    if (!rec) return '기록 없음';
    const typeLabel = rec.type === 'korean' ? '국어' : rec.type === 'math' ? '수학' : '국+수';
    const scoreVal = rec.type === 'both'
      ? `${rec.koreanScore}/${rec.mathScore}`
      : (rec.koreanScore ?? rec.mathScore);
    return `${typeLabel} (${scoreVal}점)`;
  };

  const stats = [
    {
      title: '총 응시 횟수',
      value: `${totalExams}회`,
      description: '누적 실전 모의고사',
      icon: CheckCircle,
    },
    {
      title: '평균 점수',
      value: `${averageScore}점`,
      description: '100점 만점 기준 환산',
      icon: TrendingUp,
    },
    {
      title: '최고 점수',
      value: `${highestScore}점`,
      description: '단일 과목/평균 최고 기록',
      icon: Award,
    },
    {
      title: '최근 점수',
      value: recentRecord ? `${getNormalizedScore(recentRecord)}점` : '-',
      description: getRecentLabel(recentRecord),
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 transition-all duration-300 shadow-sm relative overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-medium text-neutral-400 font-suit uppercase tracking-wider">
                  {stat.title}
                </span>
                <Icon className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-100 font-mono tracking-tight tabular-nums">
                  {stat.value}
                </span>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium font-suit">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
