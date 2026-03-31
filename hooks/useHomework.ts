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
    tag_id?: string | null;
    time_spent: number;
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
    tag_id?: string | null;
    time_spent: number;
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
                time_spent: h.time_spent || 0,
                status: h.status || (h.is_completed ? "completed" : "todo"),
                subtasks: Array.isArray(h.subtasks) ? h.subtasks.map((st: any) => ({
                    ...st,
                    time_spent: st.time_spent || 0,
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

    const addHomework = useCallback(async (content: string, is_plus_alpha: boolean = false, tag_id?: string | null) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("homeworks")
                .insert({ 
                    user_id: user.id, 
                    content, 
                    is_completed: false, 
                    status: "todo",
                    subtasks: [],
                    is_plus_alpha,
                    tag_id,
                    time_spent: 0
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

    const addSubtask = useCallback(async (homeworkId: string, parentId: string | null, content: string, tag_id?: string | null) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        // Inherit tag from parent/root if not provided
        let inheritedTagId = tag_id;
        if (!inheritedTagId) {
            if (parentId === homeworkId) {
                inheritedTagId = homework.tag_id;
            } else {
                const findParentTag = (nodes: Subtask[]): string | null | undefined => {
                    for (const n of nodes) {
                        if (n.id === parentId) return n.tag_id;
                        const childTag = findParentTag(n.subtasks || []);
                        if (childTag !== undefined) return childTag;
                    }
                    return undefined;
                };
                inheritedTagId = findParentTag(homework.subtasks || []) || homework.tag_id;
            }
        }

        const newSub: Subtask = { 
            id: Math.random().toString(36).substring(2, 9), 
            content, 
            status: "todo",
            is_completed: false, 
            is_plus_alpha: false, 
            subtasks: [], 
            created_at: new Date().toISOString(),
            tag_id: inheritedTagId,
            time_spent: 0
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

    const updateHomework = useCallback(async (id: string, updates: { content?: string, tag_id?: string | null }) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === id);
        if (!homework) return;

        let finalUpdates: any = { ...updates };
        
        // If tag_id is changing, propagate to all subtasks
        if (updates.tag_id !== undefined && updates.tag_id !== homework.tag_id) {
            const propagateTag = (nodes: Subtask[]): Subtask[] => {
                return nodes.map(n => ({
                    ...n,
                    tag_id: updates.tag_id,
                    subtasks: propagateTag(n.subtasks || [])
                }));
            };
            const updatedSubs = propagateTag(homework.subtasks || []);
            finalUpdates.subtasks = updatedSubs;
        }

        try {
            await saveHomework(id, finalUpdates);
            setHomeworks(prev => prev.map(h => h.id === id ? { ...h, ...finalUpdates } : h));
        } catch (err) { console.error(err); }
    }, [user, homeworks]);

    const updateSubtask = useCallback(async (homeworkId: string, subtaskId: string, updates: { content?: string, tag_id?: string | null }) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        const { tasks } = Utils.recursiveUpdateSubtasks(homework.subtasks || [], subtaskId, (t) => {
            const isTagChanging = updates.tag_id !== undefined && updates.tag_id !== t.tag_id;
            
            if (isTagChanging) {
                const propagateTag = (nodes: Subtask[]): Subtask[] => {
                    return nodes.map(n => ({
                        ...n,
                        tag_id: updates.tag_id,
                        subtasks: propagateTag(n.subtasks || [])
                    }));
                };
                return {
                    ...t,
                    ...updates,
                    subtasks: propagateTag(t.subtasks || [])
                };
            }
            return {
                ...t,
                ...updates
            };
        });

        try {
            await saveHomework(homeworkId, { subtasks: tasks });
            setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, subtasks: tasks } : h));
        } catch (err) { console.error(err); }
    }, [user, homeworks]);

    const recordTime = useCallback(async (homeworkId: string, taskId: string, additionalMs: number) => {
        if (!user) return;
        const homework = homeworks.find(h => h.id === homeworkId);
        if (!homework) return;

        if (homeworkId === taskId) {
            const newTotal = (homework.time_spent || 0) + additionalMs;
            try {
                await saveHomework(homeworkId, { time_spent: newTotal });
                setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, time_spent: newTotal } : h));
            } catch (err) { console.error(err); }
        } else {
            const { tasks: updatedSubtasks } = Utils.recursiveUpdateSubtasks(homework.subtasks || [], taskId, (t) => ({
                ...t,
                time_spent: (t.time_spent || 0) + additionalMs
            }));
            try {
                await saveHomework(homeworkId, { subtasks: updatedSubtasks });
                setHomeworks(prev => prev.map(h => h.id === homeworkId ? { ...h, subtasks: updatedSubtasks } : h));
            } catch (err) { console.error(err); }
        }
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

    return { 
        homeworks, 
        loading, 
        addHomework, 
        toggleHomework, 
        deleteHomework, 
        addSubtask, 
        updateHomework,
        updateSubtask,
        recordTime,
        toggleSubtask, 
        deleteSubtask, 
        setPlannedDate, 
        smartPlan 
    };
}
