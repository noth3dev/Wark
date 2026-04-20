"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../lib/auth-context";
import { useTags } from "./useTags";
import { Airport, HOME_AIRPORT, getFlightPhase, FlightPhase } from "../lib/flight/airports";
import { persistenceService } from "../lib/services/persistenceService";

export type FlightStatus = "idle" | "boarding" | "inflight" | "arrived";

export interface FlightSession {
    departure: Airport;
    destination: Airport;
    tagId: string;
    durationMinutes: number;
    startTime: number;       // timestamp ms
    status: FlightStatus;
}

const STORAGE_KEY = "active_flight_session";
const UNLOCKED_KEY = "unlocked_airports";

function loadSession(): FlightSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch { return null; }
}

function saveSession(session: FlightSession | null) {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
}

function loadUnlocked(): string[] {
    try {
        const raw = localStorage.getItem(UNLOCKED_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch { return []; }
}

function saveUnlocked(codes: string[]) {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(codes));
}

export function useFlight() {
    const { user } = useAuth();
    const { tags, fetchTags } = useTags();

    const [session, setSession] = useState<FlightSession | null>(null);
    const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
    const [elapsed, setElapsed] = useState(0); // seconds
    const [mounted, setMounted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Init
    useEffect(() => {
        setMounted(true);
        const saved = loadSession();
        if (saved && saved.status === "inflight") {
            setSession(saved);
        }
        setUnlockedCodes(loadUnlocked());
    }, []);

    // Fetch tags
    useEffect(() => {
        if (user) fetchTags(user.id);
    }, [user, fetchTags]);

    // Timer tick
    useEffect(() => {
        if (session?.status === "inflight") {
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const elapsedSec = Math.floor((now - session.startTime) / 1000);
                const totalSec = session.durationMinutes * 60;

                if (elapsedSec >= totalSec) {
                    // Flight completed
                    setElapsed(totalSec);
                    setSession(prev => {
                        if (!prev) return null;
                        const updated = { ...prev, status: "arrived" as FlightStatus };
                        saveSession(null); // clear persisted session
                        return updated;
                    });
                    // Unlock the destination
                    setUnlockedCodes(prev => {
                        const code = session.destination.code;
                        if (!prev.includes(code)) {
                            const next = [...prev, code];
                            saveUnlocked(next);
                            return next;
                        }
                        return prev;
                    });
                    if (intervalRef.current) clearInterval(intervalRef.current);
                } else {
                    setElapsed(elapsedSec);
                }
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [session?.status, session?.startTime, session?.durationMinutes, session?.destination.code]);

    const progress = session ? Math.min(elapsed / (session.durationMinutes * 60), 1) : 0;
    const phase: FlightPhase = getFlightPhase(progress);
    const timeLeft = session ? Math.max(session.durationMinutes * 60 - elapsed, 0) : 0;

    const startFlight = useCallback((destination: Airport, tagId: string, durationMinutes: number) => {
        const newSession: FlightSession = {
            departure: HOME_AIRPORT,
            destination,
            tagId,
            durationMinutes,
            startTime: Date.now(),
            status: "inflight",
        };
        setSession(newSession);
        setElapsed(0);
        saveSession(newSession);

        // Sync with global timer
        const selectedTag = tags.find(t => t.id === tagId);
        if (selectedTag) {
            persistenceService.setActiveSession({
                tagId: selectedTag.id,
                startTime: Date.now(),
                color: selectedTag.color || "#22d3ee",
                name: selectedTag.name,
                icon: "Moon",
                sessionId: `flight-${Date.now()}`,
                accumulated: 0
            });
        }
    }, [tags]);

    const cancelFlight = useCallback(() => {
        setSession(null);
        setElapsed(0);
        saveSession(null);
    }, []);

    const resetFlight = useCallback(() => {
        setSession(null);
        setElapsed(0);
        saveSession(null);
    }, []);

    return {
        // State
        session,
        tags,
        elapsed,
        progress,
        phase,
        timeLeft,
        unlockedCodes,
        mounted,
        // Actions
        startFlight,
        cancelFlight,
        resetFlight,
    };
}
