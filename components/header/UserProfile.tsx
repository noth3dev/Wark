"use client";

import React from "react";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { motion } from "framer-motion";

export function UserProfile() {
    const { user, signOut, profileName } = useAuth();
    const router = useRouter();

    if (!user) return null;

    const displayName = profileName || user.email?.split('@')[0] || "User";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-3 py-1.5 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-full transition-all outline-none cursor-pointer group"
                >
                    <div className="w-5 h-5 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center shadow-inner">
                        <User className="w-3 h-3 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-white font-black uppercase tracking-[0.1em] truncate max-w-[80px]">{displayName}</span>
                </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-neutral-900/95 backdrop-blur-2xl border-white/10 rounded-[1.5rem] p-2 shadow-2xl z-[100]">
                <div className="px-3 py-3 border-b border-white/5 mb-1 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 leading-none">Active Protocol</p>
                    <p className="text-xs font-bold text-white truncate">{user.email}</p>
                </div>
                <div className="p-1 space-y-1">
                    <DropdownMenuItem
                        onClick={() => router.push("/profile")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 focus:text-white focus:bg-white/5 cursor-pointer transition-all"
                    >
                        <User className="w-4 h-4 text-neutral-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Profile Configuration</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-500 hover:text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer transition-all group"
                    >
                        <LogOut className="w-4 h-4 text-neutral-600 group-hover:text-rose-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Terminate Access</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
