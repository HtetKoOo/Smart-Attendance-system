import Link from "next/link";
import { BarChart3, BookOpen, Users, Users2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { LucideIcon } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard - KBU Smart Attendance System",
};

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const { start, end } = getTodayRange();

  const [studentCount, lecturerCount, courseCount, todayCount, recentAttendance] =
    await Promise.all([
      prisma.student.count(),
      prisma.lecturer.count(),
      prisma.course.count(),
      prisma.attendance.count({ where: { date: { gte: start, lt: end } } }),
      prisma.attendance.findMany({
        take: 5,
        orderBy: { recognizedAt: "desc" },
        include: {
          student: { select: { studentId: true, user: { select: { name: true } } } },
          course: { select: { code: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Live overview from your attendance system
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Users} title="Total Students" value={studentCount.toString()} description="Student profiles" />
        <SummaryCard icon={Users2} title="Total Lecturers" value={lecturerCount.toString()} description="Lecturer profiles" />
        <SummaryCard icon={BookOpen} title="Total Courses" value={courseCount.toString()} description="Configured courses" />
        <SummaryCard icon={BarChart3} title="Records Today" value={todayCount.toString()} description="Attendance records saved today" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Quick Links</h3>
          <div className="space-y-2 text-sm">
            <Link href="/dashboard/admin/students" className="block text-primary hover:underline">→ Manage Students</Link>
            <Link href="/dashboard/admin/lecturers" className="block text-primary hover:underline">→ Manage Lecturers</Link>
            <Link href="/dashboard/admin/enrollments" className="block text-primary hover:underline">→ Manage Course Enrollments</Link>
            <Link href="/dashboard/attendance/record" className="block text-primary hover:underline">→ Record Attendance</Link>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Recent Attendance</h3>
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance has been recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm">
                  <div>
                    <p className="font-medium">{record.student.user.name}</p>
                    <p className="text-xs text-muted-foreground">{record.course.code} · {record.student.studentId}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{record.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
}

function SummaryCard({ icon: Icon, title, value, description }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2"><Icon className="size-6 text-primary" /></div>
      </div>
    </div>
  );
}
