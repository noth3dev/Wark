import { supabase } from '../supabase';
import { ActiveSession } from '../types';

export const sessionService = {
    async getActiveSession(userId: string) {
        return await supabase
            .from('active_sessions')
            .select('*')
            .eq('user_id', userId)
            .limit(1);
    },

    async getAllActiveSessions(userId: string) {
        return await supabase
            .from('active_sessions')
            .select('*')
            .eq('user_id', userId);
    },

    async startActiveSession(userId: string, tagId: string) {
        return await supabase
            .from('active_sessions')
            .insert({
                user_id: userId,
                tag_id: tagId
            })
            .select()
            .single();
    },

    async deleteActiveSession(sessionId: string) {
        return await supabase
            .from('active_sessions')
            .delete()
            .eq('id', sessionId);
    },

    async saveStudySessions(sessions: any[]) {
        return await supabase.from('study_sessions').insert(sessions);
    },

    async fetchDailyTotals(userId: string, startOfDay: string) {
        return await supabase
            .from('study_sessions')
            .select('tag_id, duration')
            .eq('user_id', userId)
            .gte('created_at', startOfDay);
    }
};
