import React from "react";
import { BatteryCharging, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { useBattery } from "../../hooks/useBattery";
import { motion } from "framer-motion";

export function BatteryIndicator() {
    const { level, charging, supported } = useBattery();

    if (!supported) return null;

    const getIconColor = () => {
        if (charging) return "text-cyan-400";
        if (level <= 0.2) return "text-rose-500 animate-pulse";
        if (level <= 0.6) return "text-neutral-400";
        return "text-emerald-400";
    };

    const Icon = () => {
        if (charging) return <BatteryCharging className={`w-4 h-4 ${getIconColor()}`} />;
        if (level <= 0.2) return <BatteryLow className={`w-4 h-4 ${getIconColor()}`} />;
        if (level <= 0.6) return <BatteryMedium className={`w-4 h-4 ${getIconColor()}`} />;
        return <BatteryFull className={`w-4 h-4 ${getIconColor()}`} />;
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full transition-all hover:bg-white/[0.08]"
        >
            <Icon />
            <span className={`text-[10px] font-black font-mono tracking-tight tabular-nums ${level <= 0.2 && !charging ? 'text-rose-500' : 'text-neutral-400'
                }`}>
                {Math.round(level * 100)}%
            </span>
        </motion.div>
    );
}
