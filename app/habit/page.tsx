"use client";

import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { useHabits } from "../../hooks/useHabits";
import { HabitProgressBar } from "../../components/habit/HabitProgressBar";
import { HabitHeader } from "../../components/habit/HabitHeader";
import { HabitGrid } from "../../components/habit/HabitGrid";
import { HabitAddDialog } from "../../components/habit/HabitAddDialog";
import { HabitAnalytics } from "../../components/habit/HabitAnalytics";

export default function HabitPage() {
    const { user } = useAuth();
    const {
        habits,
        dates,
        completions,
        isLoading,
        progress,
        tags,
        handleToggle,
        handleAddHabit,
        handleDeleteHabit,
        shiftWeek,
        resetToCurrentWeek,
        adjustRange,
        daysToShow,
        today
    } = useHabits(user?.id);
    
    const [isAddingHabit, setIsAddingHabit] = useState(false);

    if (!user) return null;

    return (
        <main className="h-full bg-[#0a0a0a] text-white overflow-y-auto no-scrollbar relative font-suit">
            <HabitProgressBar progress={progress} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-40 space-y-12 sm:space-y-16">
                <HabitHeader 
                    progress={progress}
                    daysToShow={daysToShow}
                    onShiftWeek={shiftWeek}
                    onResetToCurrentWeek={resetToCurrentWeek}
                    onAdjustRange={adjustRange}
                    onAddHabit={() => setIsAddingHabit(true)}
                />

                <HabitGrid 
                    habits={habits}
                    dates={dates}
                    completions={completions}
                    tags={tags}
                    isLoading={isLoading}
                    today={today}
                    onToggle={handleToggle}
                    onDelete={handleDeleteHabit}
                />

                <HabitAnalytics 
                    habits={habits}
                    dates={dates}
                    completions={completions}
                />
            </div>

            <HabitAddDialog 
                isOpen={isAddingHabit}
                onClose={() => setIsAddingHabit(false)}
                onAdd={handleAddHabit}
                tags={tags}
            />
        </main>
    );
}
