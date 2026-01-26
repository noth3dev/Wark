import { supabase } from '../supabase';
import { Tag } from '../types';

export const tagService = {
    async fetchTags() {
        return await supabase.from('tags').select('*');
    },

    async addTag(name: string, userId: string) {
        return await supabase.from('tags').insert([{
            name: name.trim(),
            user_id: userId,
            icon: 'Cpu'
        }]).select().single();
    },

    async updateTag(id: string, updates: Partial<Tag>) {
        return await supabase.from('tags')
            .update(updates)
            .eq('id', id);
    },

    async deleteTag(id: string) {
        // Dependencies (study_sessions) should be handled (either by DB cascade or manually)
        // Check if DB has cascade, if not manually delete
        await supabase.from('study_sessions').delete().eq('tag_id', id);
        return await supabase.from('tags').delete().eq('id', id);
    }
};
