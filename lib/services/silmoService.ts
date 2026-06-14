import { supabase } from '@/lib/supabase';
import { ExamRecord, ExamType, ExamPhase } from '@/types/silmo';

export async function fetchSilmoRecords() {
  const { data, error } = await supabase
    .from('silmo_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchUserProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('is_silmodan', 1);
  if (error) throw error;
  return data;
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
  koreanScore: number | null,
  mathScore: number | null,
  totalScore: number,
  koreanWrongNumbers?: string | null,
  mathWrongNumbers?: string | null,
  isPostTake: boolean = false
) {
  const { error } = await supabase
    .from('silmo_records')
    .insert([{
      user_id: userId,
      title,
      type,
      korean_score: koreanScore,
      math_score: mathScore,
      korean_wrong_numbers: koreanWrongNumbers,
      math_wrong_numbers: mathWrongNumbers,
      total_score: totalScore,
      is_post_take: isPostTake,
      created_at: new Date().toISOString()
    }]);
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
  solutionPdfUrl?: string
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
      created_at: new Date().toISOString()
    }]);
  if (error) throw error;
}

export async function closeGlobalSchedule(id: string) {
  const { error } = await supabase
    .from('silmo_global_schedules')
    .update({ is_closed: true })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchAllGlobalSchedules() {
  const { data, error } = await supabase
    .from('silmo_global_schedules')
    .select('id, date, title, type, created_by, is_silvival, created_at, question_pdf_url, solution_pdf_url, is_closed');
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

export async function fetchSilvivalRounds(seasonIndex: number = 0) {
  const { data, error } = await supabase
    .from('silvival_rounds')
    .select('*')
    .eq('season_index', seasonIndex)
    .order('round_index', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateSilvivalRound(
  seasonIndex: number,
  roundIndex: number,
  fields: {
    exam1_title?: string;
    exam2_title?: string;
    scores1?: Record<string, number>;
    scores2?: Record<string, number>;
    double_or_nothing?: string;
    is_closed?: boolean;
    double_choice_locked?: boolean;
    winner_id?: string | null;
  }
) {
  const { error } = await supabase
    .from('silvival_rounds')
    .update({
      ...fields,
      updated_at: new Date().toISOString()
    })
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
  // Insert 4 rounds for the new season
  const rounds = [0, 1, 2, 3].map(roundIndex => ({
    season_index: seasonIndex,
    round_index: roundIndex,
    exam1_title: `시즌${seasonIndex + 1} ${roundIndex + 1}R 모의고사 A`,
    exam2_title: `시즌${seasonIndex + 1} ${roundIndex + 1}R 모의고사 B`,
    scores1: {},
    scores2: {},
    double_or_nothing: 'claim'
  }));

  const { error } = await supabase
    .from('silvival_rounds')
    .insert(rounds);
  if (error) throw error;
}
