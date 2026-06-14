import { useState, useCallback } from 'react';
import { Tag } from '../lib/types';
import { tagService } from '../lib/services/tagService';
import { TAG_VARIANTS } from '../lib/tag-variants';

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagGroups, setTagGroups] = useState<Record<string, string>>({});
    const [dbGroups, setDbGroups] = useState<any[]>([]);

    const fetchTags = useCallback(async (targetUserId: string) => {
        if (!targetUserId) return null;
        const [tagsRes, groupsRes] = await Promise.all([
            tagService.fetchTags(targetUserId),
            tagService.fetchTagGroups()
        ]);

        if (tagsRes.data) setTags(tagsRes.data);
        if (groupsRes.data) {
            setDbGroups(groupsRes.data);
            const nameMap: Record<string, string> = {};
            groupsRes.data.forEach(g => {
                // Key by icon for the new system
                nameMap[g.icon] = g.name;
            });
            setTagGroups(nameMap);
        }
        return tagsRes.data;
    }, []);

    const addTag = async (name: string, userId: string, icon?: string, color?: string) => {
        const { data } = await tagService.addTag(name, userId, icon, color);
        if (data) setTags(prev => [...prev, data]);
        return data;
    };

    const updateTag = async (id: string, updates: Partial<Tag>) => {
        const { error } = await tagService.updateTag(id, updates);
        if (!error) {
            setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            return true;
        }
        return false;
    };

    const deleteTag = async (id: string) => {
        const { error } = await tagService.deleteTag(id);
        if (!error) {
            setTags(prev => prev.filter(t => t.id !== id));
            return true;
        }
        return false;
    };

    const updateTagGroup = async (userId: string, icon: string, name: string, color?: string) => {
        const { error } = await tagService.updateTagGroup(icon, name, color);
        if (!error) {
            setTagGroups(prev => ({ ...prev, [icon]: name }));
            // Refresh DB groups state
            const groupsRes = await tagService.fetchTagGroups();
            if (groupsRes.data) setDbGroups(groupsRes.data);
            return true;
        }
        return false;
    };

    return { tags, tagGroups, dbGroups, fetchTags, addTag, updateTag, deleteTag, updateTagGroup, setTags };
}
