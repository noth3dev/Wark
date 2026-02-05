"use client";

import Link from "next/link";
import React from "react";

interface NavLinkProps {
    href: string;
    title: string;
    icon: React.ReactNode;
}

export function NavLink({ href, title, icon }: NavLinkProps) {
    return (
        <Link
            href={href}
            className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title={title}
        >
            {icon}
        </Link>
    );
}
