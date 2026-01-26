"use client";

import { useEffect, useState } from "react";

export function BottomClock() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!currentTime) return null;

    return (
        <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 pointer-events-none select-none z-50">
            <span className="text-[10px] sm:text-xs text-neutral-500 font-mono tracking-[0.2em] opacity-40">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
        </div>
    );
}
