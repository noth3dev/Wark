export interface DaySegment {
    tag_id: string;
    duration: number;
    created_at: string;
    user_id: string;
}

export function calculateDaySegments(
    startTime: Date,
    endTime: Date,
    tagId: string,
    userId: string
): DaySegment[] {
    const segments: DaySegment[] = [];

    if (startTime.toDateString() === endTime.toDateString()) {
        const duration = endTime.getTime() - startTime.getTime();
        if (duration >= 1000) {
            segments.push({
                user_id: userId,
                tag_id: tagId,
                duration,
                created_at: startTime.toISOString()
            });
        }
        return segments;
    }

    // Split across days
    const endOfFirstDay = new Date(startTime);
    endOfFirstDay.setHours(23, 59, 59, 999);
    const durationDay1 = endOfFirstDay.getTime() - startTime.getTime();
    if (durationDay1 > 1000) {
        segments.push({
            user_id: userId,
            tag_id: tagId,
            duration: durationDay1,
            created_at: startTime.toISOString()
        });
    }

    let currentDay = new Date(startTime);
    currentDay.setDate(currentDay.getDate() + 1);
    currentDay.setHours(0, 0, 0, 0);

    while (currentDay.toDateString() !== endTime.toDateString()) {
        segments.push({
            user_id: userId,
            tag_id: tagId,
            duration: 24 * 60 * 60 * 1000,
            created_at: new Date(currentDay).toISOString()
        });
        currentDay.setDate(currentDay.getDate() + 1);
    }

    const startOfLastDay = new Date(endTime);
    startOfLastDay.setHours(0, 0, 0, 0);
    const durationLastDay = endTime.getTime() - startOfLastDay.getTime();
    if (durationLastDay > 1000) {
        segments.push({
            user_id: userId,
            tag_id: tagId,
            duration: durationLastDay,
            created_at: startOfLastDay.toISOString()
        });
    }

    return segments;
}

export function getEffectiveStartTime(startTimeStr: string): number {
    const startTime = new Date(startTimeStr);
    const now = new Date();

    // If started before today, only count from 00:00:00 today
    return (startTime.toDateString() !== now.toDateString())
        ? new Date(now.setHours(0, 0, 0, 0)).getTime()
        : startTime.getTime();
}
