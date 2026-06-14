export type ExamType = 'korean' | 'math' | 'both';

export type ExamStatus = 'active' | 'break' | 'finished';

export type ExamPhase = 'korean' | 'break' | 'math' | 'finished';

export interface User {
  id: string;
  name: string;
  image?: string;
}

export interface ExamRecord {
  id: string;
  userId: string;
  type: ExamType;
  title: string; // 실모 이름
  koreanScore?: number | null;
  mathScore?: number | null;
  koreanWrongNumbers?: string | null;
  mathWrongNumbers?: string | null;
  totalScore: number;
  isPostTake?: boolean;
  createdAt: string;
}

export interface ExamSession {
  id: string;
  userId: string;
  status: ExamStatus;
  type: ExamType;
  startedAt: string;
  currentPhase: ExamPhase;
  remainingSeconds: number;
  totalDurationSeconds: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  image?: string;
  examCount: number;
  avgScore: number;
  highestScore: number;
  recentScore: number;
}

export interface LiveUserStatus {
  userId: string;
  name: string;
  image?: string;
  status: 'active' | 'break' | 'finished';
  currentPhase?: 'korean' | 'break' | 'math' | 'finished';
  examType?: ExamType;
  remainingSeconds?: number;
}

export interface GlobalSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: ExamType;
  createdBy: string;
  createdAt: string;
  is_silvival?: boolean;
  questionPdfUrl?: string | null;
  solutionPdfUrl?: string | null;
  isClosed?: boolean;
}

export interface ScheduleReview {
  id: string;
  scheduleTitle: string;
  uploaderId: string;
  reviewPdfUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamPoolItem {
  id: string;
  title: string;
  type: ExamType;
  created_by: string;
  question_pdf_url?: string;
  solution_pdf_url?: string;
  created_at: string;
  silmo_exam_votes?: { vote: number; user_id: string }[];
}
