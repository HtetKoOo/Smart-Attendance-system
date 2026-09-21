"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  course: { code: string; name: string };
  classroom: { name: string; location: string | null };
}

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function formatDay(day: string) {
  return `${day.slice(0, 1)}${day.slice(1).toLowerCase()}`;
}

function ScheduleSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-2" aria-label="Loading schedule">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4"><Skeleton className="h-5 w-24" /><Skeleton className="mt-2 h-3 w-16" /></div>
          <div className="space-y-3 p-5"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-48" /><Skeleton className="h-6 w-28" /></div>
        </div>
      ))}
    </div>
  );
}

export function LecturerScheduleContent() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedules() {
      try {
        setError(null);
        const response = await fetch("/api/attendance/schedules");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load your schedule");
        setSchedules(data.schedules || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load your schedule");
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, []);

  const schedulesByDay = useMemo(() => new Map(days.map((day) => [day, schedules.filter((schedule) => schedule.dayOfWeek === day).sort((first, second) => first.startTime.localeCompare(second.startTime))])), [schedules]);

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">My Schedule</h1><p className="mt-2 text-muted-foreground">Your weekly teaching timetable, based on assigned class schedules.</p></div>
      {loading ? (
        <ScheduleSkeleton />
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center"><CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 font-semibold">No scheduled classes yet</h2><p className="mt-2 text-sm text-muted-foreground">Ask an administrator to assign you to a class schedule.</p></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {days.map((day) => {
            const daySchedules = schedulesByDay.get(day) || [];
            return <section key={day} className="rounded-xl border border-border bg-card shadow-sm"><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">{formatDay(day)}</h2><p className="mt-1 text-xs text-muted-foreground">{daySchedules.length === 0 ? "No classes" : `${daySchedules.length} class${daySchedules.length === 1 ? "" : "es"}`}</p></div>{daySchedules.length === 0 ? <p className="px-5 py-6 text-sm text-muted-foreground">No classes scheduled.</p> : <div className="divide-y divide-border">{daySchedules.map((schedule) => <div key={schedule.id} className="p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium">{schedule.course.code}</p><p className="mt-0.5 text-sm text-muted-foreground">{schedule.course.name}</p></div><span className="w-fit rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">{schedule.startTime}–{schedule.endTime}</span></div><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{schedule.classroom.name}{schedule.classroom.location ? ` · ${schedule.classroom.location}` : ""}</p></div>)}</div>}</section>;
          })}
        </div>
      )}
    </div>
  );
}
