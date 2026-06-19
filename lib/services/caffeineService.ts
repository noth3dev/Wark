import { supabase } from '../supabase';

export interface CaffeineIntake {
    id: string;
    user_id: string;
    amount: number;
    intake_at: string;
    created_at: string;
}

export const caffeineService = {
    async addIntake(userId: string, amount: number, intakeAt: Date = new Date()) {
        const { data, error } = await supabase
            .from('caffeine_intake')
            .insert({
                user_id: userId,
                amount,
                intake_at: intakeAt.toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as CaffeineIntake;
    },

    async getIntakes(userId: string, from?: Date) {
        let query = supabase
            .from('caffeine_intake')
            .select('*')
            .eq('user_id', userId)
            .order('intake_at', { ascending: false });

        if (from) {
            query = query.gte('intake_at', from.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as CaffeineIntake[];
    },

    async deleteIntake(id: string) {
        const { error } = await supabase
            .from('caffeine_intake')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // 목표 카페인 농도 불러오기
    async getTarget(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('profiles')
            .select('caffeine_target')
            .eq('id', userId)
            .single();

        if (error || !data) return 80; // 기본값 80mg
        return data.caffeine_target ?? 80;
    },

    // 목표 카페인 농도 저장
    async setTarget(userId: string, target: number) {
        const { error } = await supabase
            .from('profiles')
            .update({ caffeine_target: target })
            .eq('id', userId);

        if (error) throw error;
    }
};
