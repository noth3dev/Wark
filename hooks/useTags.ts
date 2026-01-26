import { useState, useCallback } from 'react';
import { Tag } from '../lib/types';
import { tagService } from '../lib/services/tagService';

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);

    const fetchTags = useCallback(async () => {
        const { data } = await tagService.fetchTags();
        if (data) setTags(data);
        return data;
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

    return { tags, fetchTags, addTag, updateTag, deleteTag, setTags };
}
