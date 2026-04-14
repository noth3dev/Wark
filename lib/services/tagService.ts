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
        await supabase.from('study_sessions').delete().eq('tag_id', id);
        return await supabase.from('tags').delete().eq('id', id);
    },

    async fetchTagGroups(userId: string) {
        return await supabase
            .from('tag_groups')
            .select('*')
            .eq('user_id', userId);
    },

    async updateTagGroup(userId: string, icon: string, name: string) {
        const color = getTagColor(icon);
        return await supabase
            .from('tag_groups')
            .upsert({ user_id: userId, icon, color, name }, { onConflict: 'user_id,icon,color' });
    }
};
