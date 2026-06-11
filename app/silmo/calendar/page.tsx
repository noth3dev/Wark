'use client';

import React from 'react';
import { useSilmo } from '../silmo-context';
import { WeeklyCalendar } from '@/components/silmo/weekly-calendar';
import { CalendarIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function CalendarPage() {
  const { user: authUser } = useAuth();
  const {
    allRecords,
    profiles,
    globalTitles,
    globalSchedules,
    scheduledExams,
    handleAddSchedule,
    handleDeleteSchedule,
    handleCompleteSchedule
  } = useSilmo();

  if (!authUser) return null;

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 mb-2">
        <CalendarIcon className="w-4 h-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-200 font-suit">
          주간 모의고사 일정표
        </h3>
      </div>
      <WeeklyCalendar
        records={allRecords}
        profiles={profiles}
        currentUserId={authUser.id}
        globalTitles={globalTitles}
        globalSchedules={globalSchedules}
        scheduledExams={scheduledExams}
        onAddSchedule={handleAddSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        onCompleteSchedule={handleCompleteSchedule}
      />
    </div>
  );
}
