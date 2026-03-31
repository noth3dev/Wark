import { useState, useCallback, useRef, useEffect } from 'react';
import { ActiveSession } from '../lib/types';
import { sessionService } from '../lib/services/sessionService';
import { calculateDaySegments } from '../lib/timeUtils';

export function useActiveSession(userId: string | undefined) {
    const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
    const [loading, setLoading] = useState(true);
    const activeSessionRef = useRef<ActiveSession | null>(null);

    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    const fetchActiveSession = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return null;
        }
        setLoading(true);
        const { data } = await sessionService.getActiveSession(userId);
        if (data && data.length > 0) {
            setActiveSession(data[0]);
            setLoading(false);
            return data[0];
        } else {
            setActiveSession(null);
            setLoading(false);
            return null;
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchActiveSession();
        else setLoading(false);
    }, [userId, fetchActiveSession]);

    const startSession = async (tagId: string) => {
        if (!userId) return null;
        const { data, error } = await sessionService.startActiveSession(userId, tagId);
        if (!error && data) {
            setActiveSession(data);
            return data;
        }
        return null;
    };

    const endSession = async (sessionToEnd?: ActiveSession) => {
        const session = sessionToEnd || activeSessionRef.current;
        if (!session || !userId) return null;

        const { data: sessionData } = await sessionService.getActiveSession(userId); // Double check DB
        const dbSession = sessionData?.[0];

        if (dbSession) {
            const startTime = new Date(dbSession.start_time);
            const endTime = new Date();
            const segments = calculateDaySegments(startTime, endTime, dbSession.tag_id, userId);

            if (segments.length > 0) {
                await sessionService.saveStudySessions(segments);
            }
        }

        await sessionService.deleteActiveSession(session.id);

        if (activeSessionRef.current?.id === session.id) {
            setActiveSession(null);
        }

        return session;
    };

    const cleanupOrphanedSessions = async () => {
        if (!userId) return;
        const { data: dbActiveSessions } = await sessionService.getAllActiveSessions(userId);
        if (dbActiveSessions && dbActiveSessions.length > 0) {
            for (const session of dbActiveSessions) {
                await endSession(session);
            }
        }
    };

    return {
        activeSession,
        loading,
        setActiveSession,
        fetchActiveSession,
        startSession,
        endSession,
        cleanupOrphanedSessions
    };
}
