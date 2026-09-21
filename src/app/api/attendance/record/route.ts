import { NextRequest, NextResponse } from "next/server";
import {
  canRecordScheduleAttendance,
  isUniqueConstraintError,
  parseAttendanceDate,
} from "@/lib/attendance-security";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// If LATE needs to be calculated automatically in a future phase, it can be implemented using this constant.
export const LATE_GRACE_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "LECTURER"]);
    const userRole = session.user.role as "ADMIN" | "LECTURER";

    // Enforce payload size limit
    const MAX_BODY_BYTES = 10 * 1024; // 10 KB limit to prevent large payloads (e.g. embeddings or images)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawText = await request.text();
    if (new TextEncoder().encode(rawText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Strict allowlist validation
    const allowedKeys = new Set(["studentDbId", "classScheduleId", "date"]);
    const unexpectedKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
    
    if (unexpectedKeys.length > 0) {
      return NextResponse.json(
        { error: `Unexpected fields in request: ${unexpectedKeys.join(", ")}` },
        { status: 400 }
      );
    }

    const { studentDbId, classScheduleId, date } = body;

    if (
      !studentDbId || typeof studentDbId !== "string" ||
      !classScheduleId || typeof classScheduleId !== "string" ||
      !date || typeof date !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload fields" }, { status: 400 });
    }

    const attendanceDate = parseAttendanceDate(date);
    if (!attendanceDate) {
      return NextResponse.json({ error: "Invalid or future attendance date" }, { status: 400 });
    }

    // Verify schedule exists
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: classScheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    let lecturerId: string | null = null;
    if (userRole === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      lecturerId = lecturer?.id ?? null;
    }

    if (!canRecordScheduleAttendance({
      role: userRole,
      lecturerId,
      scheduleLecturerId: schedule.lecturerId,
    })) {
      return NextResponse.json({ error: "Forbidden: Not your schedule" }, { status: 403 });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentDbId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: studentDbId,
          courseId: schedule.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Student is not enrolled in this course" }, { status: 400 });
    }

    // Create or find existing attendance record atomically
    const now = new Date();

    try {
      const attendance = await prisma.attendance.create({
        data: {
          studentId: studentDbId,
          courseId: schedule.courseId,
          classScheduleId,
          date: attendanceDate,
          status: "PRESENT",
          recognizedAt: now,
        },
      });

      return NextResponse.json({ 
        created: true, 
        attendance 
      }, { status: 201 });
    } catch (dbError) {
      if (isUniqueConstraintError(dbError)) {
        const existingAttendance = await prisma.attendance.findUnique({
          where: {
            studentId_classScheduleId_date: {
              studentId: studentDbId,
              classScheduleId,
              date: attendanceDate,
            },
          },
        });
        return NextResponse.json({ 
          created: false, 
          attendance: existingAttendance 
        }, { status: 200 });
      }
      throw dbError;
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error recording attendance:", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
