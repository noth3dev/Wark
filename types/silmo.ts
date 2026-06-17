export type ExamType = 'korean' | 'math' | 'both' | 'explore';

export type ExamStatus = 'active' | 'break' | 'finished';

export type ExamPhase = 'korean' | 'break' | 'math' | 'explore' | 'finished';

export interface User {
  id: string;
  name: string;
  image?: string;
}

export interface ExamRecord {
  id: string;
  userId: string;
  type: ExamType; // 전체 시험 유형 (e.g. 'both', 'korean', 'math')
  title: string; // 실모 이름
  subject: string; // 'korean' | 'math' | 'explore' 등 개별 과목명
  score: number;
  wrongNumbers?: string | null;
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
  currentPhase?: 'korean' | 'break' | 'math' | 'explore' | 'finished';
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
  is_round_game?: boolean;
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
