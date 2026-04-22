"use client";

import React from "react";
import { motion } from "framer-motion";

interface HabitProgressBarProps {
    progress: number;
}

export function HabitProgressBar({ progress }: HabitProgressBarProps) {
    return (
        <div className="fixed top-[64px] left-0 w-full z-50 h-[1.5px] bg-white/10">
            <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
            />
        </div>
    );
}
