import { useState, useEffect, useRef } from 'react';

export function useTimer(activeStartTime: string | null, initialAccumulated: number) {
    const [time, setTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (activeStartTime) {
            if (timerRef.current) clearInterval(timerRef.current);

            timerRef.current = setInterval(() => {
                const startTime = new Date(activeStartTime);
                const now = new Date();

                const effectiveStartTime = (startTime.toDateString() !== now.toDateString())
                    ? new Date(now.setHours(0, 0, 0, 0)).getTime()
                    : startTime.getTime();

                const elapsed = Date.now() - effectiveStartTime;
                setTime(initialAccumulated + elapsed);
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setTime(0);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeStartTime, initialAccumulated]);

    return time;
}
