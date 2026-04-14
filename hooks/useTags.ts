import { useState, useCallback } from 'react';
import { Tag } from '../lib/types';
import { tagService } from '../lib/services/tagService';

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagGroups, setTagGroups] = useState<Record<string, string>>({});

    const fetchTags = useCallback(async (targetUserId: string) => {
        if (!targetUserId) return null;
        const [tagsRes, groupsRes] = await Promise.all([
            tagService.fetchTags(targetUserId),
            tagService.fetchTagGroups(targetUserId)
        ]);

        if (tagsRes.data) setTags(tagsRes.data);
        if (groupsRes.data) {
            const nameMap: Record<string, string> = {};
            groupsRes.data.forEach(g => {
                // Key by icon for the new system
                nameMap[g.icon] = g.name;
            });
            setTagGroups(nameMap);
        }
        return tagsRes.data;
    }, []);

    const addTag = async (name: string, userId: string) => {
        const { data } = await tagService.addTag(name, userId);
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

    const updateTagGroup = async (userId: string, icon: string, name: string) => {
        const { error } = await tagService.updateTagGroup(userId, icon, name);
        if (!error) {
            setTagGroups(prev => ({ ...prev, [icon]: name }));
            return true;
        }
        return false;
    };

    return { tags, tagGroups, fetchTags, addTag, updateTag, deleteTag, updateTagGroup, setTags };
}
