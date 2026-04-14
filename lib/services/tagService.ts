import { supabase } from '../supabase';
import { Tag } from '../types';
import { getTagColor } from '../tag-variants';

export const tagService = {
    async fetchTags(userId: string) {
        return await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId)
            .order('name');
    },

    async addTag(name: string, userId: string) {
        const defaultIcon = 'Cpu';
        return await supabase.from('tags').insert([{
            name: name.trim(),
            user_id: userId,
            icon: defaultIcon,
            color: getTagColor(defaultIcon)
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
