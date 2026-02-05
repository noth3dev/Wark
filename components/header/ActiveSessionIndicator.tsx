"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { usePathname } from "next/navigation";
import { SessionStatus } from "../../hooks/useActiveSessionSync";

interface ActiveSessionIndicatorProps {
    status: SessionStatus;
}

export function ActiveSessionIndicator({ status }: ActiveSessionIndicatorProps) {
    const pathname = usePathname();

    if (pathname === "/") return null;

    const IconComponent = (LucideIcons as any)[status.icon];

    return (
        <div
            className="flex items-center gap-3 px-3 py-1.5 bg-[#0f1115] border-2 rounded-full transition-all duration-500"
            style={{ borderColor: status.color }}
        >
            {IconComponent ? (
                <IconComponent className="w-3 h-3 text-white" />
            ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
            )}
            <span className="text-[11px] font-mono font-bold text-white tabular-nums">{status.time}</span>
            <span className="hidden xs:inline text-[10px] text-white font-bold uppercase tracking-wider">{status.tag}</span>
        </div>
    );
}
