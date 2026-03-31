"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import * as Utils from "../lib/homework-utils";

export interface Subtask {
    id: string;
    content: string;
    is_completed: boolean;
    is_plus_alpha: boolean;
    subtasks: Subtask[];
    created_at: string;
    planned_date?: string | null;
    completed_at?: string | null;
    status: "todo" | "in_progress" | "completed";
}

export interface Homework {
    id: string;
    content: string;
    is_completed: boolean;
    is_plus_alpha: boolean;
    created_at: string;
    user_id?: string;
    subtasks?: Subtask[];
    planned_date?: string | null;
    completed_at?: string | null;
    status: "todo" | "in_progress" | "completed";
}

export function useHomework(userIdOverride?: string) {
    const { user } = useAuth();
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUser = userIdOverride || user?.id;

    const fetchHomeworks = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("homeworks")
                .select("*")
                .eq("user_id", currentUser)
                .order("created_at", { ascending: false });

            if (error) throw error;
            
            const formattedData = (data || []).map(h => ({
                ...h,
                status: h.status || (h.is_completed ? "completed" : "todo"),
                subtasks: Array.isArray(h.subtasks) ? h.subtasks.map((st: any) => ({
                    ...st,
                    status: st.status || (st.is_completed ? "completed" : "todo")
                })) : []
            }));
            
            setHomeworks(formattedData);
        } catch (err) {
            console.error("Failed to fetch homeworks:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchHomeworks();
    }, [fetchHomeworks]);

    const saveHomework = async (id: string, updates: Partial<Homework>) => {
        const { error } = await supabase
            .from("homeworks")
            .update(updates)
            .eq("id", id);
        if (error) {
            console.error(`Update failed for ${id}:`, error.message, error.details);
            throw error;
        }
    };

    const addHomework = useCallback(async (content: string, is_plus_alpha: boolean = false) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("homeworks")
                .insert({ 
                    user_id: user.id, 
                    content, 
                    is_completed: false, 
                    subtasks: [],
                    is_plus_alpha 
                })
                .select().single();
            if (error) throw error;
            setHomeworks(prev => [data, ...prev]);
        } catch (err) { console.error(err); }
    }, [user]);

    const toggleHomework = useCallback(async (id: string, currentStatus: string) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === id);
        if (!homework) return;

        // Status Rotation: todo -> in_progress -> completed -> todo
        let nextStatus: "todo" | "in_progress" | "completed";
        if (currentStatus === "todo") nextStatus = "in_progress";
        else if (currentStatus === "in_progress") nextStatus = "completed";
        else nextStatus = "todo";

        const now = nextStatus === "completed" ? new Date().toISOString() : null;
        const updatedSubtasks = Utils.setAllChildrenStatus(homework.subtasks || [], nextStatus, now);

        try {
            await saveHomework(id, { 
                status: nextStatus,
                is_completed: nextStatus === "completed", 
                subtasks: updatedSubtasks,
                completed_at: now 
            });
            setHomeworks(prev => prev.map(h => h.id === id ? { 
                ...h, 
                status: nextStatus,
                is_completed: nextStatus === "completed", 
                subtasks: updatedSubtasks, 
                completed_at: now 
            } : h));
        } catch (err) { console.error(err); }
    }, [user, homeworks]);

    const deleteHomework = useCallback(async (id: string) => {
        if (!user) return;
        try {
            await supabase.from("homeworks").delete().eq("id", id);
            setHomeworks(prev => prev.filter(h => h.id !== id));
        } catch (err) { console.error(err); }
    }, [user]);

    const addSubtask = useCallback(async (homeworkId: string, parentId: string | null, content: string) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        const newSub: Subtask = { 
            id: Math.random().toString(36).substring(2, 9), 
            content, 
            status: "todo",
            is_completed: false, 
            is_plus_alpha: false, 
            subtasks: [], 
            created_at: new Date().toISOString() 
        };
        
        let updatedSubtasks: Subtask[];
        if (parentId === homeworkId) {
            updatedSubtasks = [...(homework.subtasks || []), newSub];
        } else {
            const { tasks } = Utils.recursiveUpdateSubtasks(homework.subtasks || [], parentId!, (t) => ({
                is_completed: false, 
                completed_at: null, // Adding a child uncompletes the parent
                subtasks: [...(t.subtasks || []), newSub]
            }));
            updatedSubtasks = tasks;
        }

        try {
            await saveHomework(homeworkId, { 
                is_completed: false, 
                completed_at: null,
                subtasks: updatedSubtasks 
            });
            setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, is_completed: false, completed_at: null, subtasks: updatedSubtasks } : h));
        } catch (err) { console.error(err); }
    }, [user, homeworks]);

    const toggleSubtask = useCallback(async (homeworkId: string, subtaskId: string) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        const updateStatusRecursive = (tasks: Subtask[], targetId: string): { tasks: Subtask[], found: boolean } => {
            let found = false;
            const updated = tasks.map(t => {
                if (t.id === targetId) {
                    found = true;
                    let nextStatus: "todo" | "in_progress" | "completed";
                    if (t.status === "todo") nextStatus = "in_progress";
                    else if (t.status === "in_progress") nextStatus = "completed";
                    else nextStatus = "todo";

                    const now = nextStatus === "completed" ? new Date().toISOString() : null;
                    return { 
                        ...t, 
                        status: nextStatus,
                        is_completed: nextStatus === "completed", 
                        completed_at: now,
                        subtasks: Utils.setAllChildrenStatus(t.subtasks || [], nextStatus, now) 
                    };
                }
                if (t.subtasks?.length) {
                    const { tasks: sub, found: subFound } = updateStatusRecursive(t.subtasks, targetId);
                    if (subFound) {
                        found = true;
                        const nextStatus = Utils.recalculateParentStatus3(sub);
                        return { 
                            ...t, 
                            subtasks: sub, 
                            status: nextStatus,
                            is_completed: nextStatus === "completed",
                            completed_at: nextStatus === "completed" ? (t.completed_at || new Date().toISOString()) : null
                        };
                    }
                }
                return t;
            });
            return { tasks: updated, found };
        };

        const { tasks: updatedSubtasks } = updateStatusRecursive(homework.subtasks || [], subtaskId);
        const nextStatus = Utils.recalculateParentStatus3(updatedSubtasks);
        const parentCompletedAt = nextStatus === "completed" ? (homework.completed_at || new Date().toISOString()) : null;

        try {
            await saveHomework(homeworkId, { 
                status: nextStatus,
                is_completed: nextStatus === "completed", 
                subtasks: updatedSubtasks,
                completed_at: parentCompletedAt
            });
            setHomeworks(prev => prev.map(h => h.id === homeworkId ? { 
                ...h, 
                status: nextStatus,
                is_completed: nextStatus === "completed", 
                subtasks: updatedSubtasks, 
                completed_at: parentCompletedAt 
            } : h));
        } catch (err) { console.error(err); }
    }, [user, homeworks]);

    const deleteSubtask = useCallback(async (homeworkId: string, subtaskId: string) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        const filterRecursive = (tasks: Subtask[], targetId: string): { tasks: Subtask[], found: boolean } => {
            let found = false;
            const filtered = tasks.filter(t => {
                if (t.id === targetId) { found = true; return false; }
                return true;
            });
            if (found) return { tasks: filtered, found: true };

            const updated = tasks.map(t => {
                const { tasks: sub, found: subFound } = filterRecursive(t.subtasks || [], targetId);
                if (subFound) {
                    found = true;
                    const status = sub.length > 0 ? Utils.recalculateParentStatus(sub) : t.is_completed;
                    return { 
                        ...t, 
                        subtasks: sub, 
                        is_completed: status,
                        completed_at: status ? t.completed_at : null 
                    };
                }
                return t;
            });
            return { tasks: updated, found };
        };

        const { tasks: updatedSubtasks } = filterRecursive(homework.subtasks || [], subtaskId);
        const allDone = updatedSubtasks.length > 0 ? Utils.recalculateParentStatus(updatedSubtasks) : homework.is_completed;

        try {
            const now = allDone ? (homework.completed_at || new Date().toISOString()) : null;
            await saveHomework(homeworkId, { 
                is_completed: allDone, 
                completed_at: now,
                subtasks: updatedSubtasks 
            });
            setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, is_completed: allDone, completed_at: now, subtasks: updatedSubtasks } : h));
        } catch (err) { console.error(err); }
    }, [user, homeworks]);

    const setPlannedDate = useCallback(async (homeworkId: string, targetId: string, date: string | null) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        if (homeworkId === targetId) {
            try {
                await saveHomework(homeworkId, { planned_date: date });
                setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, planned_date: date } : h));
            } catch (err) { console.error(err); }
        } else {
            const { tasks: updatedSubtasks } = Utils.recursiveUpdateSubtasks(homework.subtasks || [], targetId, () => ({ planned_date: date }));
            try {
                await saveHomework(homeworkId, { subtasks: updatedSubtasks });
                setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, subtasks: updatedSubtasks } : h));
            } catch (err) { console.error(err); }
        }
    }, [user, homeworks]);

    const smartPlan = useCallback(async (hwList: Homework[]) => {
        if (!user || hwList.length === 0) return;

        try {
            const planMap = Utils.calculateBalancedPlan(hwList);

            const updatedHomeworks = hwList.map(h => {
                const updateNodes = (nodes: Subtask[]): Subtask[] => {
                    return nodes.map(n => ({
                        ...n,
                        planned_date: planMap[n.id] || n.planned_date,
                        subtasks: updateNodes(n.subtasks || [])
                    }));
                };

                return {
                    ...h,
                    planned_date: planMap[h.id] || h.planned_date,
                    subtasks: updateNodes(h.subtasks || [])
                };
            });

            await Promise.all(updatedHomeworks.map(h => saveHomework(h.id, { 
                planned_date: h.planned_date, 
                subtasks: h.subtasks 
            })));

            setHomeworks(prev => prev.map(h => {
                const updated = updatedHomeworks.find(uh => uh.id === h.id);
                return updated || h;
            }));
        } catch (err: any) { 
            console.error("Smart planning failed:", err.message || err); 
            alert(`Scheduling failed: ${err.message || "Check if SQL update was applied."}`);
        }
    }, [user, homeworks]);

    return { homeworks, loading, addHomework, toggleHomework, deleteHomework, addSubtask, toggleSubtask, deleteSubtask, setPlannedDate, smartPlan };
}
