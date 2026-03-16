"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTags } from "./useTags";
import { useActiveSession } from "./useActiveSession";
import { sessionService } from "@/lib/services/sessionService";
import { calculateDaySegments } from "@/lib/timeUtils";
import { persistenceService } from "@/lib/services/persistenceService";

export type SprintStatus = "idle" | "sprinting" | "breaking" | "finished";

export function useSprint() {
    const { user } = useAuth();
    const { tags, fetchTags } = useTags();
    const { startSession, cleanupOrphanedSessions } = useActiveSession(user?.id);
    
    const [status, setStatus] = useState<SprintStatus>("idle");
    const [duration, setDuration] = useState<number>(60); // minutes
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [mounted, setMounted] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [activeTag, setActiveTag] = useState<{ id: string, name: string, color: string } | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchTags();
    }, [fetchTags]);

    useEffect(() => {
        const session = persistenceService.getActiveSession();
        if (session) {
            setActiveTag({ id: session.tagId, name: session.name, color: session.color });
        } else {
            setActiveTag(null);
        }
    }, [mounted]);

    const completeSprint = useCallback(async () => {
        if (!user || !activeTag || !startTime) return;

        const endTime = Date.now();
        const segments = calculateDaySegments(new Date(startTime), new Date(endTime), activeTag.id, user.id);
        
        if (segments.length > 0) {
            const sprintSegments = segments.map(s => ({ ...s, is_sprint: true }));
            await sessionService.saveStudySessions(sprintSegments);
        }

        // Clean up active session
        const { data: activeSessions } = await sessionService.getActiveSession(user.id);
        if (activeSessions && activeSessions.length > 0) {
            await sessionService.deleteActiveSession(activeSessions[0].id);
        }

        // Start break
        const breakMins = Math.floor(duration * 0.1);
        if (breakMins > 0) {
            setStatus("breaking");
            setTimeLeft(breakMins * 60);
        } else {
            setStatus("finished");
        }
    }, [user, activeTag, startTime, duration]);

    const startSprint = useCallback(async (mins: number) => {
        if (!user || !activeTag) return;
        
        setDuration(mins);
        setTimeLeft(mins * 60);
        setStatus("sprinting");
        setStartTime(Date.now());
    }, [user, activeTag]);

    const cancelSprint = useCallback(async () => {
        if (!user) return;
        
        const { data: activeSessions } = await sessionService.getActiveSession(user.id);
        if (activeSessions && activeSessions.length > 0) {
            await sessionService.deleteActiveSession(activeSessions[0].id);
        }
        
        setStatus("idle");
        setTimeLeft(0);
        setStartTime(null);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [user]);

    useEffect(() => {
        if ((status === "sprinting" || status === "breaking") && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        if (status === "sprinting") {
                            completeSprint();
                        } else {
                            setStatus("finished");
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, timeLeft, completeSprint]);

    return {
        status,
        tags,
        activeTag,
        duration,
        timeLeft,
        startSprint,
        cancelSprint,
        mounted
    };
}
