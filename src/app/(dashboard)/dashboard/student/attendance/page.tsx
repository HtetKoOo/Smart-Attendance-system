import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Attendance | KBU Smart Attendance System",
  description: "Review your personal attendance records.",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatRecognizedTime(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function statusClasses(status: AttendanceStatus) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-800";
  if (status === "LATE") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default async function StudentAttendancePage() {
  const session = await requireRole("STUDENT");
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return <ProfileRequired />;
  }

  const [total, groupedStatuses, attendances] = await Promise.all([
    prisma.attendance.count({ where: { studentId: student.id } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId: student.id },
      _count: { _all: true },
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      take: 100,
      orderBy: [{ date: "desc" }, { recognizedAt: "desc" }, { createdAt: "desc" }],
      include: {
        course: { select: { code: true, name: true } },
        classSchedule: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            classroom: { select: { name: true } },
            lecturer: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  const counts: Record<AttendanceStatus, number> = { PRESENT: 0, LATE: 0, ABSENT: 0 };
  for (const group of groupedStatuses) counts[group.status] = group._count._all;
  const attended = counts.PRESENT + counts.LATE;
  const attendanceRate = total === 0 ? 0 : Math.round((attended / total) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="mt-2 text-muted-foreground">
          Your personal attendance history. Only records linked to your student profile are shown.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={ClipboardList} label="Recorded" value={total.toString()} />
        <SummaryCard icon={CheckCircle2} label="Present" value={counts.PRESENT.toString()} />
        <SummaryCard icon={Clock3} label="Late" value={counts.LATE.toString()} />
        <SummaryCard icon={AlertCircle} label="Attendance rate" value={`${attendanceRate}%`} />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold">Attendance records</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing your {Math.min(total, 100)} most recent record{total === 1 ? "" : "s"}.
          </p>
        </div>
        {attendances.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ClipboardList className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No attendance recorded yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Records will appear after an authorized attendance session.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {attendances.map((attendance) => (
              <article key={attendance.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{attendance.course.code}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses(attendance.status)}`}>
                        {attendance.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{attendance.course.name}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium">{formatDate(attendance.date)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recognized {formatRecognizedTime(attendance.recognizedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>
                    {attendance.classSchedule.dayOfWeek} · {attendance.classSchedule.startTime}–{attendance.classSchedule.endTime}
                  </p>
                  <p className="sm:text-right">
                    {attendance.classSchedule.classroom.name} · {attendance.classSchedule.lecturer.user.name}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
        {total > 100 && (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Showing the newest 100 of {total} records.
          </p>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function ProfileRequired() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold">Student profile required</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask an administrator to link this registered account to a student profile.
      </p>
    </div>
  );
}
