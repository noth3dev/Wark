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

    async addTag(name: string, userId: string, icon?: string, color?: string) {
        const defaultIcon = icon || 'Cpu';
        const defaultColor = color || getTagColor(defaultIcon);
        return await supabase.from('tags').insert([{
            name: name.trim(),
            user_id: userId,
            icon: defaultIcon,
            color: defaultColor
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

    async fetchTagGroups() {
        return await supabase
            .from('tag_groups')
            .select('*');
    },

    async updateTagGroup(icon: string, name: string, color?: string) {
        const defaultColor = color || getTagColor(icon);
        return await supabase
            .from('tag_groups')
            .upsert({ icon, color: defaultColor, name }, { onConflict: 'icon' });
    }
};
