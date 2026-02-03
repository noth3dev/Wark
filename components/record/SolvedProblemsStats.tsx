"use client";

import React from "react";
import { CheckCircle2, Trophy } from "lucide-react";
import { Tag } from "@/lib/types";
import { useSolvedProblems } from "@/hooks/useSolvedProblems";
import { SolvedProblemsGraph } from "./CumulativeSolvedGraph";

interface SolvedProblemsStatsProps {
    date: Date;
    tags: Tag[];
}

export function SolvedProblemsStats({ date, tags }: SolvedProblemsStatsProps) {
    const dateStr = date.toLocaleDateString('sv-SE');
    const { totalCount, logs } = useSolvedProblems(null, dateStr);

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold font-suit">Resolved Objectives</h2>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <div className="flex flex-col sm:flex-row gap-6">
                    <StatCard
                        icon={<Trophy className="w-4 h-4 text-yellow-500" />}
                        label="Daily Total"
                        value={totalCount}
                        unit="Problems"
                    />
                </div>
                <SolvedProblemsGraph logs={logs} tags={tags} />
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: number, unit: string }) {
    return (
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-3">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono font-black text-white">{value}</span>
                <span className="text-[10px] font-bold text-neutral-600 uppercase">{unit}</span>
            </div>
        </div>
    );
}
