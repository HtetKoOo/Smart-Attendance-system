import Link from "next/link";
import { BookOpen, ClipboardCheck, Clock, Users } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Lecturer Dashboard - KBU Smart Attendance System" };

const dayNames: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default async function LecturerDashboardPage() {
  const session = await requireRole("LECTURER");
  const lecturer = await prisma.lecturer.findUnique({ where: { userId: session.user.id } });

  if (!lecturer) {
    return <div className="rounded-lg border border-border bg-card p-6"><h2 className="text-xl font-semibold">Lecturer profile required</h2><p className="mt-2 text-sm text-muted-foreground">Ask an administrator to link this registered account to a lecturer profile.</p></div>;
  }

  const schedules = await prisma.classSchedule.findMany({
    where: { lecturerId: lecturer.id },
    include: { course: { select: { id: true, code: true, name: true } }, classroom: { select: { name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  const courses = [...new Map(schedules.map((item) => [item.course.id, item.course])).values()];
  const courseIds = courses.map((course) => course.id);
  const [studentRows, attendanceCount] = await Promise.all([
    prisma.enrollment.findMany({ where: { courseId: { in: courseIds } }, distinct: ["studentId"], select: { studentId: true } }),
    prisma.attendance.count({ where: { classSchedule: { lecturerId: lecturer.id } } }),
  ]);
  const todaySchedules = schedules.filter((item) => item.dayOfWeek === dayNames[new Date().getDay()]);

  return (
    <div className="space-y-8">
      <div><h2 className="text-3xl font-bold">Lecturer Dashboard</h2><p className="mt-2 text-muted-foreground">Your live courses, students, and class schedule</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={BookOpen} title="My Courses" value={courses.length.toString()} description="Courses with assigned schedules" />
        <SummaryCard icon={Users} title="My Students" value={studentRows.length.toString()} description="Enrolled across my courses" />
        <SummaryCard icon={Clock} title="Classes Today" value={todaySchedules.length.toString()} description="Scheduled classes" />
        <SummaryCard icon={ClipboardCheck} title="Attendance Records" value={attendanceCount.toString()} description="Records for my classes" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6"><h3 className="mb-4 font-semibold">My Courses</h3>{courses.length === 0 ? <p className="text-sm text-muted-foreground">No courses have been assigned yet.</p> : <div className="space-y-3">{courses.map((course) => <div key={course.id} className="rounded-lg border border-border/50 p-3"><p className="text-sm font-medium">{course.code}</p><p className="text-xs text-muted-foreground">{course.name}</p></div>)}</div>}</section>
        <section className="rounded-lg border border-border bg-card p-6"><h3 className="mb-4 font-semibold">Today&apos;s Classes</h3>{todaySchedules.length === 0 ? <p className="text-sm text-muted-foreground">No classes are scheduled today.</p> : <div className="space-y-3">{todaySchedules.map((schedule) => <div key={schedule.id} className="rounded-lg border border-border/50 p-3"><p className="text-sm font-medium">{schedule.startTime} · {schedule.course.code}</p><p className="text-xs text-muted-foreground">{schedule.course.name} · {schedule.classroom.name}</p></div>)}</div>}<Link href="/dashboard/attendance/record" className="mt-4 inline-block text-sm text-primary hover:underline">→ Record Attendance</Link></section>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, description }: { icon: LucideIcon; title: string; value: string; description: string }) { return <div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><div className="rounded-lg bg-primary/10 p-2"><Icon className="size-6 text-primary" /></div></div></div>; }
