"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTags } from "./useTags";
import { useActiveSession } from "./useActiveSession";
import { sessionService } from "@/lib/services/sessionService";
import { calculateDaySegments } from "@/lib/timeUtils";
import { persistenceService } from "@/lib/services/persistenceService";
const SPRINT_SESSION_KEY = 'active_sprint_session';

export interface LocalSprintData {
    status: SprintStatus;
    startTime: number;
    duration: number; // minutes
    tag: { id: string, name: string, color: string };
    lastTimeLeft: number;
}

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
        if (user?.id) fetchTags(user.id);
    }, [fetchTags, user?.id]);

    useEffect(() => {
        const session = persistenceService.getActiveSession();
        if (session) {
            setActiveTag({ id: session.tagId, name: session.name, color: session.color });
        } else {
            setActiveTag(null);
        }

        // Restore sprint from local storage
        const savedSprint = localStorage.getItem(SPRINT_SESSION_KEY);
        if (savedSprint) {
            try {
                const data: LocalSprintData = JSON.parse(savedSprint);
                const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
                const totalSeconds = data.status === "sprinting" ? data.duration * 60 : data.duration * 0.1 * 60;
                
                if (elapsed < totalSeconds) {
                    setStatus(data.status);
                    setDuration(data.duration);
                    setStartTime(data.startTime);
                    setActiveTag(data.tag);
                    setTimeLeft(totalSeconds - elapsed);
                } else {
                    // Logic to handle completed sprint while away
                    if (data.status === "sprinting") {
                        // We need to complete it
                        // Set state so completeSprint can run
                        setStatus("sprinting");
                        setDuration(data.duration);
                        setStartTime(data.startTime);
                        setActiveTag(data.tag);
                        setTimeLeft(1); // Set to 1 to trigger the interval completion
                    } else {
                        localStorage.removeItem(SPRINT_SESSION_KEY);
                    }
                }
            } catch (e) {
                console.error("Failed to restore sprint state", e);
            }
        }
    }, [mounted]);

    // Persist sprint state whenever it changes
    useEffect(() => {
        if (status !== "idle" && status !== "finished" && startTime && activeTag) {
            const data: LocalSprintData = {
                status,
                startTime,
                duration,
                tag: activeTag,
                lastTimeLeft: timeLeft
            };
            localStorage.setItem(SPRINT_SESSION_KEY, JSON.stringify(data));
        } else {
            localStorage.removeItem(SPRINT_SESSION_KEY);
        }
    }, [status, startTime, duration, activeTag, timeLeft]);

    const completeSprint = useCallback(async () => {
        if (!user || !activeTag || !startTime) return;

        const endTime = Date.now();
        const segments = calculateDaySegments(new Date(startTime), new Date(endTime), activeTag.id, user.id);
        
        if (segments.length > 0) {
            const sprintSegments = segments.map(s => ({ ...s, is_sprint: true }));
            await sessionService.saveStudySessions(sprintSegments);
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
        
        // Handle partial save if aborting during sprint
        if (status === "sprinting" && startTime && activeTag) {
            const endTime = Date.now();
            const segments = calculateDaySegments(new Date(startTime), new Date(endTime), activeTag.id, user.id);
            if (segments.length > 0) {
                const sprintSegments = segments.map(s => ({ ...s, is_sprint: true }));
                await sessionService.saveStudySessions(sprintSegments);
            }
        }

        setStatus("idle");
        setTimeLeft(0);
        setStartTime(null);
        localStorage.removeItem(SPRINT_SESSION_KEY);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [user, status, startTime, activeTag]);

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
