import { Homework, Subtask } from "../hooks/useHomework";

export const getWeekDates = (): string[] => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

export const recursiveUpdateSubtasks = (
    tasks: Subtask[], 
    targetId: string, 
    updater: (task: Subtask) => Partial<Subtask> | null
): { tasks: Subtask[], found: boolean } => {
    let found = false;
    const updated = tasks.map(t => {
        if (t.id === targetId) {
            found = true;
            const updates = updater(t);
            return updates ? { ...t, ...updates } : t;
        }
        if (t.subtasks?.length) {
            const { tasks: sub, found: subFound } = recursiveUpdateSubtasks(t.subtasks, targetId, updater);
            if (subFound) {
                found = true;
                // Basic consistency check: if children changed, parent might need status update
                // (This is usually handled by specific callers like toggleSubtask)
                return { ...t, subtasks: sub };
            }
        }
        return t;
    });
    return { tasks: updated, found };
};

/**
 * Sets all children in a task tree to a specific completion status
 */
export const setAllChildrenStatus = (tasks: Subtask[], status: boolean): Subtask[] => {
    return tasks.map(t => ({
        ...t,
        is_completed: status,
        subtasks: setAllChildrenStatus(t.subtasks || [], status)
    }));
};

/**
 * Recalculates parent completion status based on its children
 */
export const recalculateParentStatus = (tasks: Subtask[]): boolean => {
    if (tasks.length === 0) return false;
    return tasks.every(t => t.is_completed);
};

/**
 * Sequential Window Stride Algorithm
 * Strictly separates items of the same subject into different sequential windows.
 * e.g. Bridge 1 on Mon, Bridge 2 on Tue/Wed.
 */
export const calculateBalancedPlan = (hwList: Homework[]): Record<string, string> => {
    const dates = getWeekDates();
    const groups: Record<string, { id: string; content: string }[]> = {};

    const gatherLeafs = (rootId: string, nodes: Subtask[]) => {
        const sortedNodes = [...nodes].sort((a, b) => a.content.localeCompare(b.content));
        sortedNodes.forEach(n => {
            if (!n.subtasks || n.subtasks.length === 0) {
                if (!groups[rootId]) groups[rootId] = [];
                groups[rootId].push({ id: n.id, content: n.content });
            } else {
                gatherLeafs(rootId, n.subtasks);
            }
        });
    };

    const sortedHwList = [...hwList].sort((a, b) => a.content.localeCompare(b.content));
    sortedHwList.forEach(h => {
        if (!h.subtasks || h.subtasks.length === 0) {
            if (!groups[h.id]) groups[h.id] = [];
            groups[h.id].push({ id: h.id, content: h.content });
        } else {
            gatherLeafs(h.id, h.subtasks || []);
        }
    });

    const rootIds = Object.keys(groups);
    const planMap: Record<string, string> = {};
    const dayLoad = new Array(7).fill(0);
    
    // Sort rootIds to follow sortedHwList
    const rootNameMap: Record<string, string> = {};
    sortedHwList.forEach(h => { rootNameMap[h.id] = h.content; });
    const sortedRootIds = rootIds.sort((a, b) => rootNameMap[a].localeCompare(rootNameMap[b]));

    const maxItems = Math.max(...sortedRootIds.map(rid => groups[rid].length), 0);

    // Iteratively place the i-th item of each parent
    for (let i = 0; i < maxItems; i++) {
        for (const rid of sortedRootIds) {
            const task = groups[rid][i];
            if (!task) continue;

            const N = groups[rid].length;
            // Each task j of N gets a unique window of width (7/N)
            // Window for j is [floor(j * 7 / N), floor((j+1) * 7 / N) - 1]
            const winStart = Math.floor(i * 7 / N);
            const winEnd = Math.min(6, Math.floor((i + 1) * 7 / N) - 1);

            let bestDay = winStart;
            let minLoad = Infinity;

            for (let d = winStart; d <= winEnd; d++) {
                if (dayLoad[d] < minLoad) {
                    minLoad = dayLoad[d];
                    bestDay = d;
                }
            }

            planMap[task.id] = dates[bestDay];
            dayLoad[bestDay]++;
        }
    }

    return planMap;
};
