"use client";

import { motion } from "framer-motion";

interface TimerDisplayProps {
    time: number;
}

export function TimerDisplay({ time }: TimerDisplayProps) {
    const formatTime = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center w-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[18vw] sm:text-[10rem] md:text-[14rem] landscape:text-[15vh] font-extralight tabular-nums tracking-tighter leading-none text-white transition-all duration-700 select-none text-center"
            >
                {formatTime(time)}
            </motion.div>
        </div>
    );
}
