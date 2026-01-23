"use client";

import { Bell } from "lucide-react";

export function NotificationCenter() {
    return (
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full border-2 border-background" />
        </button>
    );
}
