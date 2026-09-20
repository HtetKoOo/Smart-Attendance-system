import type { Metadata } from "next";
import { CalendarClock, MapPin, UserRound } from "lucide-react";
import type { DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Schedule | KBU Smart Attendance System",
  description: "View your weekly class timetable.",
};

const days: DayOfWeek[] = [
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

export default async function StudentSchedulePage() {
  const session = await requireRole("STUDENT");
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, enrollments: { select: { courseId: true } } },
  });

  if (!student) {
    return <ProfileRequired />;
  }

  const courseIds = student.enrollments.map((enrollment) => enrollment.courseId);
  const schedules = await prisma.classSchedule.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: { select: { code: true, name: true } },
      classroom: { select: { name: true, location: true } },
      lecturer: { select: { user: { select: { name: true } } } },
    },
  });

  const schedulesByDay = new Map(
    days.map((day) => [
      day,
      schedules
        .filter((schedule) => schedule.dayOfWeek === day)
        .sort((first, second) => first.startTime.localeCompare(second.startTime)),
    ]),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
        <p className="mt-2 text-muted-foreground">
          Your weekly timetable based on current course enrollments.
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <CalendarClock className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No scheduled classes yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your classes will appear here after you are enrolled and schedules are assigned.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {days.map((day) => {
            const daySchedules = schedulesByDay.get(day) ?? [];
            return (
              <section key={day} className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="font-semibold">{formatDay(day)}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {daySchedules.length === 0
                      ? "No classes"
                      : `${daySchedules.length} class${daySchedules.length === 1 ? "" : "es"}`}
                  </p>
                </div>
                {daySchedules.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No classes scheduled.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {daySchedules.map((schedule) => (
                      <div key={schedule.id} className="p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium">{schedule.course.code}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {schedule.course.name}
                            </p>
                          </div>
                          <span className="w-fit rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                            {schedule.startTime}–{schedule.endTime}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <MapPin className="size-4 text-primary" />
                            {schedule.classroom.name}
                            {schedule.classroom.location ? ` · ${schedule.classroom.location}` : ""}
                          </p>
                          <p className="flex items-center gap-2">
                            <UserRound className="size-4 text-primary" />
                            {schedule.lecturer.user.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
