import type { Metadata } from "next";
import { BookOpen, CalendarDays, MapPin, UserRound } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Courses | KBU Smart Attendance System",
  description: "View your enrolled courses and class sessions.",
};

const dayOrder: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function formatDay(day: DayOfWeek) {
  return `${day.slice(0, 1)}${day.slice(1).toLowerCase()}`;
}

export default async function StudentCoursesPage() {
  const session = await requireRole("STUDENT");
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: {
          course: {
            include: {
              classSchedules: {
                include: {
                  classroom: { select: { name: true, location: true } },
                  lecturer: { select: { user: { select: { name: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    return <ProfileRequired />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="mt-2 text-muted-foreground">
          Courses you are currently enrolled in and their scheduled sessions.
        </p>
      </div>

      {student.enrollments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No course enrollments yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask an administrator to enroll you in a course.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {student.enrollments.map(({ id, course }) => {
            const schedules = [...course.classSchedules].sort(
              (first, second) =>
                dayOrder.indexOf(first.dayOfWeek) - dayOrder.indexOf(second.dayOfWeek) ||
                first.startTime.localeCompare(second.startTime),
            );

            return (
              <section key={id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                      <BookOpen className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{course.code}</p>
                      <h2 className="mt-0.5 font-semibold">{course.name}</h2>
                      {course.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {schedules.length} scheduled session{schedules.length === 1 ? "" : "s"}
                  </p>
                  {schedules.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No class schedule has been added for this course.
                    </p>
                  ) : (
                    schedules.map((schedule) => (
                      <div key={schedule.id} className="rounded-lg border border-border/70 p-3 text-sm">
                        <p className="flex items-center gap-2 font-medium">
                          <CalendarDays className="size-4 text-primary" />
                          {formatDay(schedule.dayOfWeek)} · {schedule.startTime}–{schedule.endTime}
                        </p>
                        <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {schedule.classroom.name}
                          {schedule.classroom.location ? ` · ${schedule.classroom.location}` : ""}
                        </p>
                        <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <UserRound className="size-3.5" />
                          {schedule.lecturer.user.name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
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
