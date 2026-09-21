"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, CalendarDays, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  course: { code: string; name: string };
  classroom: { name: string; location: string | null };
}

const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function formatDay(day: string) {
  return `${day.slice(0, 1)}${day.slice(1).toLowerCase()}`;
}

function CoursesSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2" aria-label="Loading courses">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-primary/5 p-5"><div className="flex gap-3"><Skeleton className="size-10 rounded-lg" /><div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-44" /></div></div></div>
          <div className="space-y-3 p-5"><Skeleton className="h-3 w-28" />{Array.from({ length: 2 }, (_, sessionIndex) => <div key={sessionIndex} className="rounded-lg border border-border/70 p-3"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-28" /></div>)}</div>
        </div>
      ))}
    </div>
  );
}

export function LecturerCoursesContent() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedules() {
      try {
        setError(null);
        const response = await fetch("/api/attendance/schedules");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load your courses");
        setSchedules(data.schedules || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load your courses");
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, []);

  const courses = useMemo(() => {
    const courseMap = new Map<string, { code: string; name: string; schedules: Schedule[] }>();
    for (const schedule of schedules) {
      const key = `${schedule.course.code}-${schedule.course.name}`;
      const course = courseMap.get(key) ?? { code: schedule.course.code, name: schedule.course.name, schedules: [] };
      course.schedules.push(schedule);
      courseMap.set(key, course);
    }
    return [...courseMap.values()].sort((first, second) => first.code.localeCompare(second.code));
  }, [schedules]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="mt-2 text-muted-foreground">Courses and class sessions assigned to your lecturer account.</p>
      </div>
      {loading ? (
        <CoursesSkeleton />
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 font-semibold">No courses assigned yet</h2><p className="mt-2 text-sm text-muted-foreground">Ask an administrator to assign you to a class schedule.</p></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {courses.map((course) => (
            <section key={course.code} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-primary/5 p-5"><div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><BookOpen className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-primary">{course.code}</p><h2 className="mt-0.5 font-semibold">{course.name}</h2></div></div></div>
              <div className="p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{course.schedules.length} scheduled session{course.schedules.length === 1 ? "" : "s"}</p><div className="space-y-3">
                {[...course.schedules].sort((first, second) => dayOrder.indexOf(first.dayOfWeek) - dayOrder.indexOf(second.dayOfWeek) || first.startTime.localeCompare(second.startTime)).map((schedule) => (
                  <div key={schedule.id} className="rounded-lg border border-border/70 p-3 text-sm"><div className="flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-primary" />{formatDay(schedule.dayOfWeek)} · {schedule.startTime}–{schedule.endTime}</div><p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{schedule.classroom.name}{schedule.classroom.location ? ` · ${schedule.classroom.location}` : ""}</p></div>
                ))}
              </div></div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
