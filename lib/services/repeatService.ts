import { supabase } from '../supabase';

export interface RepeatState {
    rows: { id: string; name: string }[];
    columns: { id: string; name: string; color?: string }[];
    data: Record<string, Record<string, number>>;
}

export interface RepeatTable {
    id: string;
    user_id: string;
    name: string;
    state: RepeatState;
    created_at: string;
    updated_at: string;
}

export const repeatService = {
    async getTables(userId: string) {
        const { data, error } = await supabase
            .from('repeat_tables')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as RepeatTable[];
    },

    async addTable(userId: string, name: string) {
        const initialState: RepeatState = {
            rows: [],
            columns: [],
            data: {}
        };
        const { data, error } = await supabase
            .from('repeat_tables')
            .insert({
                user_id: userId,
                name,
                state: initialState
            })
            .select()
            .single();

        if (error) throw error;
        return data as RepeatTable;
    },

    async updateTableState(id: string, state: RepeatState) {
        const { error } = await supabase
            .from('repeat_tables')
            .update({ state, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteTable(id: string) {
        const { error } = await supabase
            .from('repeat_tables')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
