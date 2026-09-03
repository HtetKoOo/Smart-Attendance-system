import { BookOpen, ClipboardCheck, Clock, ScanFace } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Student Dashboard - KBU Smart Attendance System" };

const dayNames: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT");
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { enrollments: { include: { course: { select: { id: true, code: true, name: true } } } } },
  });

  if (!student) {
    return <div className="rounded-lg border border-border bg-card p-6"><h2 className="text-xl font-semibold">Student profile required</h2><p className="mt-2 text-sm text-muted-foreground">Ask an administrator to link this registered account to a student profile.</p></div>;
  }

  const courseIds = student.enrollments.map((enrollment) => enrollment.courseId);
  const [todaySchedules, attendanceCount, faceEmbedding] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { courseId: { in: courseIds }, dayOfWeek: dayNames[new Date().getDay()] },
      include: { course: { select: { code: true, name: true } }, classroom: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.attendance.count({ where: { studentId: student.id } }),
    prisma.faceEmbedding.findFirst({ where: { studentId: student.id }, select: { id: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div><h2 className="text-3xl font-bold">Student Dashboard</h2><p className="mt-2 text-muted-foreground">Your enrolled courses and recorded attendance</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={BookOpen} title="My Courses" value={student.enrollments.length.toString()} description="Current enrollments" />
        <SummaryCard icon={Clock} title="Classes Today" value={todaySchedules.length.toString()} description="Scheduled classes" />
        <SummaryCard icon={ClipboardCheck} title="Recorded Attendance" value={attendanceCount.toString()} description="Attendance records saved" />
        <SummaryCard icon={ScanFace} title="Face Enrollment" value={faceEmbedding ? "Ready" : "Pending"} description="Recognition template status" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6"><h3 className="mb-4 font-semibold">My Courses</h3>{student.enrollments.length === 0 ? <p className="text-sm text-muted-foreground">You are not enrolled in a course yet.</p> : <div className="space-y-3">{student.enrollments.map(({ course }) => <div key={course.id} className="rounded-lg border border-border/50 p-3"><p className="text-sm font-medium">{course.code}</p><p className="text-xs text-muted-foreground">{course.name}</p></div>)}</div>}</section>
        <section className="rounded-lg border border-border bg-card p-6"><h3 className="mb-4 font-semibold">Today&apos;s Schedule</h3>{todaySchedules.length === 0 ? <p className="text-sm text-muted-foreground">No classes are scheduled today.</p> : <div className="space-y-3">{todaySchedules.map((schedule) => <div key={schedule.id} className="rounded-lg border border-border/50 p-3"><p className="text-sm font-medium">{schedule.startTime} · {schedule.course.code}</p><p className="text-xs text-muted-foreground">{schedule.course.name} · {schedule.classroom.name}</p></div>)}</div>}</section>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, description }: { icon: LucideIcon; title: string; value: string; description: string }) { return <div className="rounded-lg border border-border bg-card p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><div className="rounded-lg bg-primary/10 p-2"><Icon className="size-6 text-primary" /></div></div></div>; }
