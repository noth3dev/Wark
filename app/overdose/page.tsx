"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Coffee, 
    Plus, 
    History, 
    Zap, 
    Calendar, 
    BarChart3, 
    Trash2, 
    AlertCircle,
    ChevronDown,
    Clock,
    TrendingUp
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { caffeineService, CaffeineIntake } from "../../lib/services/caffeineService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { 
    format, 
    isSameDay, 
    isSameWeek, 
    isSameMonth, 
    startOfDay, 
    startOfWeek, 
    startOfMonth,
    subHours
} from "date-fns";

const CAFFEINE_HALF_LIFE = 5; // hours

export default function OverdosePage() {
    const { user } = useAuth();
    const [intakes, setIntakes] = useState<CaffeineIntake[]>([]);
    const [amount, setAmount] = useState<string>("100");
    const [intakeTime, setIntakeTime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [isLoading, setIsLoading] = useState(true);
    const [currentLevel, setCurrentLevel] = useState(0);

    const fetchIntakes = useCallback(async () => {
        if (!user) return;
        try {
            const data = await caffeineService.getIntakes(user.id);
            setIntakes(data);
        } catch (error) {
            console.error("Failed to fetch intakes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchIntakes();
    }, [fetchIntakes]);

    const calculateCurrentCaffeine = useCallback(() => {
        const now = new Date();
        let total = 0;
        intakes.forEach(intake => {
            const timeDiff = (now.getTime() - new Date(intake.intake_at).getTime()) / (1000 * 60 * 60);
            if (timeDiff >= 0) {
                total += intake.amount * Math.pow(0.5, timeDiff / CAFFEINE_HALF_LIFE);
            }
        });
        setCurrentLevel(total);
    }, [intakes]);

    useEffect(() => {
        calculateCurrentCaffeine();
        const interval = setInterval(calculateCurrentCaffeine, 50); // update every 50ms for smooth real-time decay
        return () => clearInterval(interval);
    }, [calculateCurrentCaffeine]);

    const handleAddIntake = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount) return;

        try {
            await caffeineService.addIntake(user.id, parseFloat(amount), new Date(intakeTime));
            setAmount("100");
            setIntakeTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
            fetchIntakes();
        } catch (error) {
            console.error("Failed to add intake:", error);
        }
    };

    const handleDeleteIntake = async (id: string) => {
        try {
            await caffeineService.deleteIntake(id);
            fetchIntakes();
        } catch (error) {
            console.error("Failed to delete intake:", error);
        }
    };

    const getStats = () => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const weekStart = startOfWeek(now);
        const monthStart = startOfMonth(now);

        let daily = 0;
        let weekly = 0;
        let monthly = 0;

        intakes.forEach(intake => {
            const date = new Date(intake.intake_at);
            if (date >= todayStart) daily += intake.amount;
            if (date >= weekStart) weekly += intake.amount;
            if (date >= monthStart) monthly += intake.amount;
        });

        return { daily, weekly, monthly };
    };

    const stats = getStats();

    const getStatusColor = (level: number) => {
        if (level < 100) return "text-emerald-400";
        if (level < 250) return "text-amber-400";
        return "text-rose-500";
    };

    const getStatusText = (level: number) => {
        if (level < 100) return "Safe";
        if (level < 200) return "Active";
        if (level < 300) return "Jittery";
        return "Overdose Warning";
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-neutral-500">Please sign in to track caffeine intake.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent"
                        >
                            Caffeine Tracker
                        </motion.h1>
                        <p className="text-neutral-500 mt-2">Monitor your caffeine levels and optimize your performance.</p>
                    </div>
                    <Badge variant="outline" className="px-4 py-1.5 border-white/10 bg-white/5 text-xs font-medium">
                        <Zap className="w-3 h-3 mr-2 text-amber-400" />
                        Half-life: 5 Hours
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Gauge */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Gauge Card */}
                        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-md overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6">
                                <TrendingUp className={`w-6 h-6 ${getStatusColor(currentLevel)} opacity-50`} />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-neutral-400 text-sm font-medium">Current Concentration</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <div className="relative">
                                    <svg className="w-48 h-48 sm:w-64 sm:h-64 rotate-[-90deg]">
                                        <circle
                                            cx="50%"
                                            cy="50%"
                                            r="45%"
                                            className="stroke-white/5 fill-none"
                                            strokeWidth="8"
                                        />
                                        <motion.circle
                                            initial={{ strokeDasharray: "0 1000" }}
                                            animate={{ strokeDasharray: `${(Math.min(currentLevel, 400) / 400) * 283}% 1000` }}
                                            cx="50%"
                                            cy="50%"
                                            r="45%"
                                            className={`fill-none transition-colors duration-500 ${
                                                currentLevel < 150 ? 'stroke-emerald-500' : 
                                                currentLevel < 300 ? 'stroke-amber-500' : 'stroke-rose-500'
                                            }`}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span 
                                            className="text-4xl sm:text-5xl font-bold font-mono"
                                        >
                                            {currentLevel.toFixed(2)}
                                        </span>
                                        <span className="text-neutral-500 text-sm font-medium uppercase tracking-widest mt-1">mg</span>
                                    </div>
                                </div>
                                
                                    <div className="mt-4 flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                            <span className="text-[10px] text-neutral-400 uppercase tracking-tighter font-bold">Estimated clear time:</span>
                                            <span className="text-[10px] font-mono text-white">
                                                {currentLevel > 0.5 
                                                    ? `${(CAFFEINE_HALF_LIFE * Math.log2(currentLevel / 0.5)).toFixed(1)} hours` 
                                                    : "Cleared"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 text-center">
                                        <span className={`text-xl font-bold ${getStatusColor(currentLevel)}`}>
                                            {getStatusText(currentLevel)}
                                        </span>
                                        <p className="text-neutral-500 text-[11px] mt-1 max-w-xs">
                                            Estimated amount of caffeine remaining in your system.
                                        </p>
                                    </div>
                            </CardContent>
                        </Card>

                        {/* Periodic Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: "Daily Total", value: stats.daily, icon: <Calendar className="w-4 h-4" /> },
                                { label: "Weekly Total", value: stats.weekly, icon: <BarChart3 className="w-4 h-4" /> },
                                { label: "Monthly Total", value: stats.monthly, icon: <History className="w-4 h-4" /> }
                            ].map((stat, i) => (
                                <Card key={i} className="bg-white/[0.03] border-white/10">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 text-neutral-500 mb-2 text-xs font-medium uppercase tracking-wider">
                                            {stat.icon}
                                            {stat.label}
                                        </div>
                                        <div className="text-2xl font-bold font-mono">
                                            {stat.value.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">mg</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Controls & History */}
                    <div className="space-y-8">
                        {/* Add Intake Card */}
                        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Register Intake</CardTitle>
                                <CardDescription>Log a new caffeine consumption</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddIntake} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-neutral-500 uppercase font-bold">Amount (mg)</label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={amount} 
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="bg-white/5 border-white/10 pl-10 focus:ring-amber-500/20"
                                            />
                                            <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {[
                                                { label: "Espresso", value: "63" },
                                                { label: "Americano", value: "150" },
                                                { label: "Energy Drink", value: "80" },
                                                { label: "Monster", value: "160" },
                                            ].map(preset => (
                                                <button 
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() => setAmount(preset.value)}
                                                    className="px-2 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-neutral-500 uppercase font-bold">Intake Time</label>
                                        <div className="relative">
                                            <Input 
                                                type="datetime-local" 
                                                value={intakeTime} 
                                                onChange={(e) => setIntakeTime(e.target.value)}
                                                className="bg-white/5 border-white/10 pl-10 focus:ring-amber-500/20"
                                            />
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200 transition-colors">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Log Caffeine
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Recent History */}
                        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg">Recent Logs</CardTitle>
                                <History className="w-4 h-4 text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-3">
                                        <AnimatePresence initial={false}>
                                            {intakes.length === 0 ? (
                                                <p className="text-center py-10 text-neutral-500 text-sm italic">No entries yet</p>
                                            ) : (
                                                intakes.map((intake) => (
                                                    <motion.div 
                                                        key={intake.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                                                <Coffee className="w-4 h-4 text-amber-400" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold">{intake.amount} mg</div>
                                                                <div className="text-[10px] text-neutral-500 font-mono">
                                                                    {format(new Date(intake.intake_at), "MMM d, HH:mm")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteIntake(intake.id)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-neutral-500"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </motion.div>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Info Alert */}
                <Card className="bg-amber-500/5 border-amber-500/10">
                    <CardContent className="flex gap-4 pt-6">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-amber-500">Caffeine Advisory</h4>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Caffeine metabolism varies significantly between individuals. Factors like age, weight, genetics, and health conditions can affect half-life. The 400mg daily limit is a general guideline for healthy adults. Always consult with a healthcare professional regarding your intake.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
