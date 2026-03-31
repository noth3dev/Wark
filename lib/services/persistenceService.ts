"use client";

const ACTIVE_SESSION_KEY = 'active_study_session';
const ACTIVE_TASK_KEY = 'active_study_task';

export interface LocalSessionData {
    tagId: string;
    startTime: number;
    color: string;
    name: string;
    icon: string;
    sessionId: string;
    accumulated: number;
}

export interface LocalTaskData {
    hwId: string;
    taskId: string;
    tagId: string | null;
    startTime: number;
}

export const persistenceService = {
    getActiveSession(): LocalSessionData | null {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse session data", e);
            return null;
        }
    },

    setActiveSession(data: LocalSessionData): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(data));
    },

    clearActiveSession(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ACTIVE_SESSION_KEY);
    },

    getActiveTask(): LocalTaskData | null {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem(ACTIVE_TASK_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse task data", e);
            return null;
        }
    },

    setActiveTask(data: LocalTaskData): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ACTIVE_TASK_KEY, JSON.stringify(data));
    },

    clearActiveTask(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ACTIVE_TASK_KEY);
    }
};
