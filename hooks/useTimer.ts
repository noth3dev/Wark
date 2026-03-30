import { useState, useEffect, useRef } from 'react';

export function useTimer(activeStartTime: string | null, initialAccumulated: number) {
    const [time, setTime] = useState(initialAccumulated);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const updateTimer = () => {
            if (activeStartTime) {
                const startTime = new Date(activeStartTime);
                const now = new Date();

                const effectiveStartTime = (startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();

                const elapsed = Date.now() - effectiveStartTime;
                setTime(initialAccumulated + elapsed);
            } else {
                setTime(initialAccumulated);
            }
        };

        updateTimer();
        
        if (activeStartTime) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(updateTimer, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeStartTime, initialAccumulated]);

    return time;
}
