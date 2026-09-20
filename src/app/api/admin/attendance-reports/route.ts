import { NextRequest, NextResponse } from "next/server";
import { AttendanceStatus, Prisma } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const MAX_REPORT_ROWS = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | null, fieldName: string) {
  if (!value || !DATE_PATTERN.test(value)) {
    throw new Error(`Invalid ${fieldName} date. Use YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid ${fieldName} date.`);
  }

  return date;
}
async function getLecturerAttendanceScope(userId: string): Promise<Prisma.AttendanceWhereInput> {
  const lecturer = await prisma.lecturer.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

  return { classSchedule: { lecturerId: lecturer.id } };
}



export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "LECTURER"]);

    const { searchParams } = new URL(request.url);
    const from = parseDate(searchParams.get("from"), "start");
    const to = parseDate(searchParams.get("to"), "end");
    const classScheduleId = searchParams.get("classScheduleId") || undefined;
    const status = searchParams.get("status") || undefined;

    if (from > to) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date." },
        { status: 400 },
      );
    }

    if (
      status &&
      status !== "PRESENT" &&
      status !== "LATE" &&
      status !== "ABSENT"
    ) {
      return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
    }

    const attendanceStatus = status as AttendanceStatus | undefined;
    const lecturerScope: Prisma.AttendanceWhereInput =
      session.user.role === "LECTURER"
        ? await getLecturerAttendanceScope(session.user.id)
        : {};

    const where: Prisma.AttendanceWhereInput = {
      date: { gte: from, lte: to },
      ...lecturerScope,
      ...(classScheduleId ? { classScheduleId } : {}),
      ...(attendanceStatus ? { status: attendanceStatus } : {}),
    };

    const [total, groupedStatuses, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.attendance.findMany({
        where,
        take: MAX_REPORT_ROWS,
        orderBy: [{ date: "desc" }, { recognizedAt: "desc" }, { createdAt: "desc" }],
        include: {
          student: {
            select: {
              studentId: true,
              user: { select: { name: true } },
            },
          },
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

    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0 };
    for (const group of groupedStatuses) {
      counts[group.status] = group._count._all;
    }

    return NextResponse.json({
      summary: {
        total,
        present: counts.PRESENT,
        late: counts.LATE,
        absent: counts.ABSENT,
      },
      truncated: total > MAX_REPORT_ROWS,
      maxRows: MAX_REPORT_ROWS,
      attendances: attendances.map((attendance) => ({
        id: attendance.id,
        date: attendance.date.toISOString(),
        status: attendance.status,
        recognizedAt: attendance.recognizedAt?.toISOString() ?? null,
        student: {
          id: attendance.student.studentId,
          name: attendance.student.user.name,
        },
        course: attendance.course,
        schedule: {
          dayOfWeek: attendance.classSchedule.dayOfWeek,
          startTime: attendance.classSchedule.startTime,
          endTime: attendance.classSchedule.endTime,
          classroom: attendance.classSchedule.classroom.name,
          lecturer: attendance.classSchedule.lecturer.user.name,
        },
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error loading attendance report:", error);
    return NextResponse.json({ error: "Failed to load attendance report." }, { status: 500 });
  }
}

