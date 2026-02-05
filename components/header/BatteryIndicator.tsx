"use client";

import React from "react";
import { BatteryCharging, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { useBattery } from "../../hooks/useBattery";

export function BatteryIndicator() {
    const { level, charging, supported } = useBattery();

    if (!supported) return null;

    const Icon = () => {
        if (charging) return <BatteryCharging className="w-3.5 h-3.5" />;
        if (level <= 0.2) return <BatteryLow className="w-3.5 h-3.5" />;
        if (level <= 0.6) return <BatteryMedium className="w-3.5 h-3.5" />;
        return <BatteryFull className="w-3.5 h-3.5" />;
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-full text-muted-foreground transition-colors hover:text-foreground">
            <Icon />
            <span className="text-[10px] font-mono font-bold">{Math.round(level * 100)}%</span>
        </div>
    );
}
