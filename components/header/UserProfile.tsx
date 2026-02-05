"use client";

import React from "react";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function UserProfile() {
    const { user, signOut, profileName } = useAuth();
    const router = useRouter();

    if (!user) return null;

    const displayName = profileName || user.email || "me";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-full transition-all outline-none cursor-pointer">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    <span className="text-xs text-white font-medium truncate max-w-[80px]">{displayName}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-white/10 backdrop-blur-xl rounded-2xl">
                <DropdownMenuLabel className="font-suit text-xs text-neutral-500">Account</DropdownMenuLabel>
                <DropdownMenuItem className="px-2 py-2">
                    <span className="text-sm font-bold text-white">{displayName}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
