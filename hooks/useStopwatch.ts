import { useRef, useCallback, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { useTags } from "./useTags";
import { useActiveSession } from "./useActiveSession";
import { useDailyTotals } from "./useDailyTotals";
import { useTimer } from "./useTimer";
import { useStopwatchSync } from "./useStopwatchSync";
import { persistenceService } from "../lib/services/persistenceService";

export function useStopwatch(onSave?: () => void) {
    const { user } = useAuth();
    const switchingRef = useRef(false);

    // Fragmented Hooks
    const { tags, fetchTags, addTag: addTagBase, updateTag: updateTagBase, deleteTag: deleteTagBase } = useTags();
    const {
        activeSession,
        fetchActiveSession,
        startSession,
        endSession,
        cleanupOrphanedSessions
    } = useActiveSession(user?.id);
    const { dailyTimes, fetchDailyTotals } = useDailyTotals();
    const time = useTimer(activeSession?.start_time || null, activeSession ? (dailyTimes[activeSession.tag_id] || 0) : 0);

    const refreshAll = useCallback(async () => {
        if (!user) return;
        const currentTags = await fetchTags();
        const totals = await fetchDailyTotals(user.id);
        const session = await fetchActiveSession();

        if (session && currentTags) {
            const tag = currentTags.find(t => t.id === session.tag_id);
            persistenceService.setActiveSession({
                tagId: session.tag_id,
                startTime: new Date(session.start_time).getTime(),
                color: tag?.color || '#22d3ee',
                name: tag?.name || "Unknown",
                icon: tag?.icon || 'Moon',
                sessionId: session.id,
                accumulated: totals[session.tag_id] || 0
            });
        } else {
            persistenceService.clearActiveSession();
        }
    }, [user, fetchTags, fetchDailyTotals, fetchActiveSession]);

    useEffect(() => {
        if (user) refreshAll();
    }, [user, refreshAll]);

    // Real-time synchronization
    useStopwatchSync(user?.id, refreshAll);

    const handleTagClick = async (tagId: string) => {
        if ((activeSession && activeSession.tag_id === tagId) || switchingRef.current || !user) return;

        switchingRef.current = true;
        try {
            persistenceService.clearActiveSession();
            await cleanupOrphanedSessions();
            const newSession = await startSession(tagId);

            if (newSession) {
                const tag = tags.find(t => t.id === tagId);
                persistenceService.setActiveSession({
                    tagId,
                    startTime: new Date(newSession.start_time).getTime(),
                    color: tag?.color || '#22d3ee',
                    name: tag?.name || "Unknown",
                    icon: tag?.icon || 'Moon',
                    sessionId: newSession.id,
                    accumulated: dailyTimes[tagId] || 0
                });
            }
        } catch (error) {
            console.error("Error switching tags:", error);
            await refreshAll();
        } finally {
            switchingRef.current = false;
        }
    };

    const addTag = async (name: string) => {
        if (!user) return null;
        return await addTagBase(name, user.id);
    };

    const updateTag = async (id: string, name: string, color: string, icon: string) => {
        const success = await updateTagBase(id, { name, color, icon });
        if (success) {
            const session = persistenceService.getActiveSession();
            if (session && session.tagId === id) {
                persistenceService.setActiveSession({
                    ...session, name, color, icon
                });
            }
        }
        return success;
    };

    const deleteTag = async (id: string) => {
        const success = await deleteTagBase(id);
        if (success) {
            const session = persistenceService.getActiveSession();
            if (session && session.tagId === id) {
                persistenceService.clearActiveSession();
                await cleanupOrphanedSessions();
            }
        }
        return success;
    };

    return {
        time,
        tags,
        activeTagId: activeSession?.tag_id || null,
        activeSession,
        dailyTimes,
        handleTagClick,
        addTag,
        updateTag,
        deleteTag
    };
}
