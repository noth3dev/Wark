import { supabase } from '../supabase';

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    icon?: string;
    color: string;
    tag_id?: string | null;
    created_at: string;
}

export interface HabitCompletion {
    id: string;
    habit_id: string;
    date: string; // YYYY-MM-DD
    is_completed: boolean;
}

export const habitService = {
    async getHabits(userId: string) {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Habit[];
    },

    async addHabit(userId: string, name: string, color: string = '#3b82f6', icon: string = 'Check', tagId: string | null = null) {
        const { data, error } = await supabase
            .from('habits')
            .insert({
                user_id: userId,
                name,
                color,
                icon,
                tag_id: tagId
            })
            .select()
            .single();

        if (error) throw error;
        return data as Habit;
    },

    async updateHabit(id: string, updates: Partial<Habit>) {
        const { error } = await supabase
            .from('habits')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteHabit(id: string) {
        const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getCompletions(habitIds: string[], startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('habit_completions')
            .select('*')
            .in('habit_id', habitIds)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;
        return data as HabitCompletion[];
    },

    async toggleCompletion(habitId: string, date: string, isCompleted: boolean) {
        const { data, error } = await supabase
            .from('habit_completions')
            .upsert({
                habit_id: habitId,
                date: date,
                is_completed: isCompleted
            }, {
                onConflict: 'habit_id, date'
            })
            .select()
            .single();

        if (error) throw error;
        return data as HabitCompletion;
    }
};
