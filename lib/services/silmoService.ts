import { supabase } from '@/lib/supabase';
import { ExamRecord, ExamType, ExamPhase } from '@/types/silmo';

export async function fetchSilmoRecords() {
  const { data, error } = await supabase
    .from('silmo_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Convert underscore DB format to camelCase client interface
  return data.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    type: r.type,
    subject: r.subject,
    score: r.score,
    wrongNumbers: r.wrong_numbers,
    isPostTake: r.is_post_take,
    createdAt: r.created_at
  }));
}

export async function fetchUserProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, school')
      .eq('is_silmodan', 1);
    if (!error && data) return data;
  } catch (e) {
    console.warn("Failed to fetch profiles with school, falling back...", e);
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('is_silmodan', 1);
  if (error) throw error;
  return data.map(p => ({ ...p, school: '' }));
}

export async function fetchRoundDistributions(scheduleId: string) {
  const { data, error } = await supabase
    .from('silmo_round_distributions')
    .select('*')
    .eq('schedule_id', scheduleId);
  if (error) {
    console.warn("Failed to fetch round distributions:", error);
    return [];
  }
  return data;
}

export async function saveRoundDistribution(
  scheduleId: string,
  school: string,
  r1: number,
  r2: number,
  r3: number,
  r4: number,
  r5: number
) {
  const { error } = await supabase
    .from('silmo_round_distributions')
    .upsert({
      schedule_id: scheduleId,
      school,
      r1,
      r2,
      r3,
      r4,
      r5,
      created_at: new Date().toISOString()
    }, { onConflict: 'schedule_id,school' });
  if (error) throw error;
}

export async function fetchActiveExamSessions() {
  const { data, error } = await supabase
    .from('silmo_sessions')
    .select('*');
  if (error) throw error;
  return data;
}

export async function saveScoreRecord(
  userId: string,
  title: string,
  type: ExamType,
  subject: string,
  score: number,
  wrongNumbers?: string | null,
  isPostTake: boolean = false
) {
  const { error } = await supabase
    .from('silmo_records')
    .upsert({
      user_id: userId,
      title,
      type,
      subject,
      score,
      wrong_numbers: wrongNumbers,
      is_post_take: isPostTake,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id,title,subject,is_post_take' });
  if (error) throw error;
}

export async function upsertActiveExamSession(
  userId: string,
  phase: ExamPhase,
  remaining: number,
  type: ExamType
) {
  const { error } = await supabase
    .from('silmo_sessions')
    .upsert({
      user_id: userId,
      status: phase === 'break' ? 'break' : 'active',
      current_phase: phase,
      exam_type: type,
      remaining_seconds: Math.round(remaining),
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
}

export async function deleteActiveExamSession(userId: string) {
  const { error } = await supabase
    .from('silmo_sessions')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchGlobalSchedules(dateStr: string) {
  const { data, error } = await supabase
    .from('silmo_global_schedules')
    .select('*')
    .gte('date', dateStr)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createGlobalSchedule(
  dateStr: string,
  title: string,
  type: ExamType,
  createdBy: string,
  questionPdfUrl?: string,
  solutionPdfUrl?: string,
  isRoundGame: boolean = false
) {
  const { error } = await supabase
    .from('silmo_global_schedules')
    .insert([{
      date: dateStr,
      title,
      type,
      created_by: createdBy,
      question_pdf_url: questionPdfUrl || null,
      solution_pdf_url: solutionPdfUrl || null,
      is_round_game: isRoundGame,
      created_at: new Date().toISOString()
    }]);
  if (error) throw error;
}

export async function closeGlobalSchedule(id: string) {
  // 1. Get all scores from silmo_round_scores
  const { data: roundScores, error: fetchErr } = await supabase
    .from('silmo_round_scores')
    .select('*')
    .eq('schedule_id', id);
  
  if (fetchErr) throw fetchErr;

  // 2. Get schedule details (title, type)
  const { data: schedule, error: schedErr } = await supabase
    .from('silmo_global_schedules')
    .select('title, type')
    .eq('id', id)
    .single();
    
  if (schedErr) throw schedErr;

  // 3. Convert subject-based round scores into silmo_records (subject-based rows)
  if (roundScores && roundScores.length > 0) {
    const recordsToInsert = roundScores.map(rs => ({
      user_id: rs.user_id,
      title: schedule.title,
      type: schedule.type,
      subject: rs.subject,
      score: rs.score,
      wrong_numbers: rs.wrong_numbers,
      is_post_take: rs.is_post_take,
      created_at: rs.created_at
    }));

    const { error: insertErr } = await supabase
      .from('silmo_records')
      .upsert(recordsToInsert, { onConflict: 'user_id,title,subject,is_post_take' });
      
    if (insertErr) throw insertErr;
  }

  // 4. Update the schedule to closed
  const { error: updateErr } = await supabase
    .from('silmo_global_schedules')
    .update({ is_closed: true })
    .eq('id', id);
    
  if (updateErr) throw updateErr;

  // 5. Delete from silmo_round_scores
  await supabase
    .from('silmo_round_scores')
    .delete()
    .eq('schedule_id', id);
}

export async function saveRoundScore(
  scheduleId: string,
  userId: string,
  subject: string,
  score: number,
  wrongNumbers: string | null,
  isPostTake: boolean = false
) {
  const { error } = await supabase
    .from('silmo_round_scores')
    .upsert({
      schedule_id: scheduleId,
      user_id: userId,
      subject,
      score,
      wrong_numbers: wrongNumbers,
      is_post_take: isPostTake,
      created_at: new Date().toISOString()
    }, { onConflict: 'schedule_id,user_id,subject' });
  if (error) throw error;
}

export async function fetchRoundScores(scheduleId: string) {
  const { data, error } = await supabase
    .from('silmo_round_scores')
    .select('*')
    .eq('schedule_id', scheduleId);
  if (error) {
    console.warn("Failed to fetch round scores:", error);
    return [];
  }
  return data;
}

export async function fetchAllGlobalSchedules() {
  const { data, error } = await supabase
    .from('silmo_global_schedules')
    .select('id, date, title, type, created_by, is_silvival, created_at, question_pdf_url, solution_pdf_url, is_closed, is_round_game');
  if (error) throw error;
  return data;
}

export async function deleteGlobalSchedule(id: string) {
  const { error } = await supabase
    .from('silmo_global_schedules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchSilmoExamPool() {
  const { data, error } = await supabase
    .from('silmo_exam_pool')
    .select(`
      *,
      silmo_exam_votes ( vote, user_id )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExamPool(
  title: string,
  type: ExamType,
  createdBy: string,
  questionPdfUrl?: string,
  solutionPdfUrl?: string
) {
  const { error } = await supabase
    .from('silmo_exam_pool')
    .insert([{
      title,
      type,
      created_by: createdBy,
      question_pdf_url: questionPdfUrl,
      solution_pdf_url: solutionPdfUrl,
      created_at: new Date().toISOString()
    }]);
  if (error) throw error;
}

export async function voteExamPool(poolId: string, userId: string, vote: number) {
  if (vote === 0) {
    const { error } = await supabase
      .from('silmo_exam_votes')
      .delete()
      .eq('pool_id', poolId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('silmo_exam_votes')
      .upsert({
        pool_id: poolId,
        user_id: userId,
        vote,
        created_at: new Date().toISOString()
      }, { onConflict: 'pool_id,user_id' });
    if (error) throw error;
  }
}

export async function deleteExamPool(poolId: string) {
  const { error } = await supabase
    .from('silmo_exam_pool')
    .delete()
    .eq('id', poolId);
  if (error) throw error;
}

export async function lockInExam(
  poolId: string,
  dateStr: string,
  title: string,
  type: ExamType,
  createdBy: string,
  // Optional: auto-update silvival round title
  seasonIndex?: number,
  roundIndex?: number,
  examSlot?: 'exam1' | 'exam2'
) {
  // 1. Create global schedule with is_silvival = true
  const { error: insertErr } = await supabase
    .from('silmo_global_schedules')
    .insert([{
      date: dateStr,
      title,
      type,
      created_by: createdBy,
      is_silvival: true,
      created_at: new Date().toISOString()
    }]);
  if (insertErr) throw insertErr;

  // 3. Auto-update silvival round title if slot info provided
  if (seasonIndex !== undefined && roundIndex !== undefined && examSlot) {
    const fields = examSlot === 'exam1'
      ? { exam1_title: title }
      : { exam2_title: title };
    const { error: roundErr } = await supabase
      .from('silvival_rounds')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('season_index', seasonIndex)
      .eq('round_index', roundIndex);
    if (roundErr) console.error('Failed to update round title:', roundErr);
  }
}

export async function uploadSilmoPdf(file: File, type: 'question' | 'solution' | 'review'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${type}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('silmo_pdfs')
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('silmo_pdfs')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function fetchScheduleReviews() {
  const { data, error } = await supabase
    .from('silmo_schedule_reviews')
    .select('*');
  if (error) throw error;
  return data;
}

export async function saveScheduleReview(
  scheduleTitle: string,
  uploaderId: string,
  reviewPdfUrl: string
) {
  const { error } = await supabase
    .from('silmo_schedule_reviews')
    .upsert({
      schedule_title: scheduleTitle,
      uploader_id: uploaderId,
      review_pdf_url: reviewPdfUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'schedule_title' });
  if (error) throw error;
}

// ─── Silvival round meta (extensible bag) ────────────────────────────────────
// DB 컬럼을 추가하지 않아도 되도록, 런타임 확장 데이터는 meta JSONB 안에 저장합니다.
// 새 필드가 필요하면 이 타입에만 추가하면 됩니다.
export interface SilvivalRoundMeta {
  absent_players1?: string[];  // exam1 미참여 user_id 목록
  absent_players2?: string[];  // exam2 미참여 user_id 목록
  // ↓ 여기에 새 필드를 자유롭게 추가
  [key: string]: unknown;
}

// 고정 컬럼 필드 타입 (DB 스키마에 실제 컬럼이 있는 것들)
export interface SilvivalRoundFields {
  exam1_title?: string;
  exam2_title?: string;
  scores1?: Record<string, number>;
  scores2?: Record<string, number>;
  double_or_nothing?: string;
  is_closed?: boolean;
  double_choice_locked?: boolean;
  winner_id?: string | null;
}

export async function fetchSilvivalRounds(seasonIndex: number = 0) {
  const { data, error } = await supabase
    .from('silvival_rounds')
    .select('*')
    .eq('season_index', seasonIndex)
    .order('round_index', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * 라운드 고정 컬럼을 업데이트합니다.
 * meta 확장 필드는 updateSilvivalRoundMeta()를 사용하세요.
 */
export async function updateSilvivalRound(
  seasonIndex: number,
  roundIndex: number,
  fields: SilvivalRoundFields
) {
  const { error } = await supabase
    .from('silvival_rounds')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('season_index', seasonIndex)
    .eq('round_index', roundIndex);
  if (error) throw error;
}

/**
 * meta JSONB를 부분 업데이트합니다 (기존 키는 유지, 새 키만 덮어씀).
 * 예: updateSilvivalRoundMeta(0, 0, { absent_players1: ['uuid-a'] })
 */
export async function updateSilvivalRoundMeta(
  seasonIndex: number,
  roundIndex: number,
  patch: SilvivalRoundMeta
) {
  // 현재 meta를 읽어서 병합 후 저장 (Supabase는 JSONB 병합 연산자를 직접 지원하지 않음)
  const { data, error: fetchErr } = await supabase
    .from('silvival_rounds')
    .select('meta')
    .eq('season_index', seasonIndex)
    .eq('round_index', roundIndex)
    .single();
  if (fetchErr) throw fetchErr;

  const merged = { ...(data?.meta ?? {}), ...patch };

  const { error } = await supabase
    .from('silvival_rounds')
    .update({ meta: merged, updated_at: new Date().toISOString() })
    .eq('season_index', seasonIndex)
    .eq('round_index', roundIndex);
  if (error) throw error;
}

export async function fetchLatestSilvivalSeasonIndex(): Promise<number> {
  const { data, error } = await supabase
    .from('silvival_rounds')
    .select('season_index')
    .order('season_index', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return 0;
  return data[0].season_index as number;
}

export async function createSilvivalSeason(seasonIndex: number) {
  const rounds = [0, 1, 2, 3].map(roundIndex => ({
    season_index: seasonIndex,
    round_index: roundIndex,
    exam1_title: `시즌${seasonIndex + 1} ${roundIndex + 1}R 모의고사 A`,
    exam2_title: `시즌${seasonIndex + 1} ${roundIndex + 1}R 모의고사 B`,
    scores1: {},
    scores2: {},
    double_or_nothing: 'claim',
    meta: {},
  }));

  const { error } = await supabase
    .from('silvival_rounds')
    .insert(rounds);
  if (error) throw error;
}
