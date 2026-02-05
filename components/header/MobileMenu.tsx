"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BarChart2, Music } from "lucide-react";

interface MobileMenuProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.nav
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="absolute top-full left-0 w-full bg-neutral-900 border-b border-white/10 md:hidden overflow-hidden"
                >
                    <div className="flex flex-col p-4 gap-2">
                        <MobileNavLink href="/" icon={<Clock className="w-5 h-5" />} label="Timer" onClick={() => setIsOpen(false)} />
                        <MobileNavLink href="/record" icon={<BarChart2 className="w-5 h-5" />} label="Records" onClick={() => setIsOpen(false)} />
                        <MobileNavLink href="/playlist" icon={<Music className="w-5 h-5" />} label="Playlist" onClick={() => setIsOpen(false)} />
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}

function MobileNavLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <Link href={href} className="flex items-center gap-4 px-6 py-4 text-neutral-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all" onClick={onClick}>
            {icon}
            <span className="text-base font-bold font-suit">{label}</span>
        </Link>
    );
}
