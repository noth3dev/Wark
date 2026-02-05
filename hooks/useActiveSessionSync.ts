"use client";

import { useState, useEffect } from "react";
import { persistenceService } from "../lib/services/persistenceService";

export interface SessionStatus {
    time: string;
    seconds: number;
    tag: string;
    tagId: string | null;
    color: string;
    icon: string;
}

export function useActiveSessionSync() {
    const [status, setStatus] = useState<SessionStatus>({
        time: "00:00:00",
        seconds: 0,
        tag: "",
        tagId: null,
        color: "#22d3ee",
        icon: "Moon"
    });

    useEffect(() => {
        const updateStatus = () => {
            const session = persistenceService.getActiveSession();
            if (session) {
                const sessionStart = new Date(session.startTime);
                const now = new Date();

                const effectiveStartTime = (sessionStart.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : sessionStart.getTime();

                const elapsed = Date.now() - effectiveStartTime;
                const total = (session.accumulated || 0) + elapsed;
                const totalSeconds = Math.floor(total / 1000);

                const h = Math.floor(total / 3600000);
                const m = Math.floor((total % 3600000) / 60000);
                const s = Math.floor((total % 60000) / 1000);

                setStatus({
                    time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
                    seconds: totalSeconds,
                    tag: session.name || "",
                    tagId: session.tagId || null,
                    color: session.color || "#22d3ee",
                    icon: session.icon || "Moon"
                });
            } else {
                setStatus(prev => ({ ...prev, time: "00:00:00", seconds: 0, tag: "", tagId: null }));
            }
        };

        const interval = setInterval(updateStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    return status;
}
