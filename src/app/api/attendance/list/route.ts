import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "LECTURER"]);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const classScheduleId = searchParams.get("classScheduleId");
    const date = searchParams.get("date");

    if (!classScheduleId || !date) {
      return NextResponse.json({ error: "classScheduleId and date are required" }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }

    // Verify schedule exists
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: classScheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    if (userRole === "LECTURER") {
      // Find lecturer ID
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: session.user.id },
      });
      if (!lecturer || schedule.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Forbidden: Not your schedule" }, { status: 403 });
      }
    }

    // Fetch attendance list for this schedule + date
    const attendances = await prisma.attendance.findMany({
      where: {
        classScheduleId,
        date: attendanceDate,
      },
      include: {
        student: {
          select: {
            studentId: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: {
        recognizedAt: "desc",
      },
    });

    const formattedAttendances = attendances.map((a) => ({
      id: a.id,
      studentId: a.student.studentId,
      studentName: a.student.user.name,
      status: a.status,
      recognizedAt: a.recognizedAt,
    }));

    return NextResponse.json({ attendances: formattedAttendances });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching attendance list:", error);
    return NextResponse.json({ error: "Failed to fetch attendance list" }, { status: 500 });
  }
}
