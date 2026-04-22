import { useState, useEffect, useCallback, useMemo } from "react";
import { habitService, Habit } from "../lib/services/habitService";
import { useTags } from "./useTags";
import { format, startOfWeek, addDays, eachDayOfInterval, startOfDay } from "date-fns";
import { getTagColor } from "../lib/tag-variants";

export function useHabits(userId: string | undefined) {
    const { tags, fetchTags } = useTags();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [daysToShow, setDaysToShow] = useState(7);
    const [anchorDate, setAnchorDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [completions, setCompletions] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    const dates = useMemo(() => {
        return eachDayOfInterval({
            start: anchorDate,
            end: addDays(anchorDate, daysToShow - 1)
        });
    }, [anchorDate, daysToShow]);

    const fetchHabitData = useCallback(async () => {
        if (!userId || dates.length === 0) return;
        
        try {
            const fetchedHabits = await habitService.getHabits(userId);
            setHabits(fetchedHabits);
            fetchTags(userId);

            if (fetchedHabits.length > 0) {
                const startDate = format(dates[0], "yyyy-MM-dd");
                const endDate = format(dates[dates.length - 1], "yyyy-MM-dd");
                const habitIds = fetchedHabits.map(h => h.id);
                
                const fetchedCompletions = await habitService.getCompletions(habitIds, startDate, endDate);
                
                const completionMap: Record<string, boolean> = {};
                fetchedCompletions.forEach(c => {
                    completionMap[`${c.habit_id}:${c.date}`] = c.is_completed;
                });
                setCompletions(completionMap);
            }
        } catch (error) {
            console.error("Failed to fetch habits:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, dates, fetchTags]);

    useEffect(() => {
        fetchHabitData();
    }, [fetchHabitData]);

    const handleToggle = async (habitId: string, date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const key = `${habitId}:${dateStr}`;
        const currentStatus = completions[key] || false;
        const newStatus = !currentStatus;

        // Optimistic update
        setCompletions(prev => ({
            ...prev,
            [key]: newStatus
        }));

        try {
            await habitService.toggleCompletion(habitId, dateStr, newStatus);
        } catch (error) {
            console.error("Failed to toggle habit:", error);
            setCompletions(prev => ({
                ...prev,
                [key]: currentStatus
            }));
        }
    };

    const handleAddHabit = async (name: string, tagId: string | null) => {
        if (!userId || !name.trim()) return;

        const tag = tags.find(t => t.id === tagId);
        const color = tag ? getTagColor(tag.icon) : '#3b82f6';

        try {
            const newHabit = await habitService.addHabit(userId, name, color, tag?.icon || 'Check', tagId);
            setHabits(prev => [...prev, newHabit]);
            return newHabit;
        } catch (error) {
            console.error("Failed to add habit:", error);
            throw error;
        }
    };

    const handleDeleteHabit = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await habitService.deleteHabit(id);
            setHabits(prev => prev.filter(h => h.id !== id));
        } catch (error) {
            console.error("Failed to delete habit:", error);
            throw error;
        }
    };

    const shiftWeek = (n: number) => {
        setAnchorDate(prev => addDays(prev, n * 7));
    };

    const resetToCurrentWeek = () => {
        setAnchorDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    const adjustRange = (delta: number) => {
        setDaysToShow(prev => Math.max(1, prev + delta));
    };

    const today = startOfDay(new Date());

    const progress = useMemo(() => {
        if (habits.length === 0) return 0;
        const todayStr = format(today, "yyyy-MM-dd");
        const completedToday = habits.filter(h => completions[`${h.id}:${todayStr}`]).length;
        return Math.round((completedToday / habits.length) * 100);
    }, [habits, completions, today]);

    return {
        habits,
        dates,
        completions,
        isLoading,
        progress,
        tags,
        handleToggle,
        handleAddHabit,
        handleDeleteHabit,
        shiftWeek,
        resetToCurrentWeek,
        adjustRange,
        daysToShow,
        today
    };
}
