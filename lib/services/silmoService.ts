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
    .select('id, display_name');
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
  totalScore: number
) {
  const { error } = await supabase
    .from('silmo_records')
    .insert([{
      user_id: userId,
      title,
      type,
      korean_score: koreanScore,
      math_score: mathScore,
      total_score: totalScore,
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
      remaining_seconds: remaining,
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
  createdBy: string
) {
  const { error } = await supabase
    .from('silmo_global_schedules')
    .insert([{
      date: dateStr,
      title,
      type,
      created_by: createdBy,
      created_at: new Date().toISOString()
    }]);
  if (error) throw error;
}

export async function fetchAllGlobalSchedules() {
  const { data, error } = await supabase
    .from('silmo_global_schedules')
    .select('title');
  if (error) throw error;
  return data;
}
