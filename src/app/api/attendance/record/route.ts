import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// If LATE needs to be calculated automatically in a future phase, it can be implemented using this constant.
export const LATE_GRACE_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "LECTURER"]);
    const userRole = session.user.role;

    // Enforce payload size limit
    const MAX_BODY_BYTES = 10 * 1024; // 10 KB limit to prevent large payloads (e.g. embeddings or images)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
    }

    // Parse date and ensure it's not in the future (allow small drift)
    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // We allow up to tomorrow to handle simple timezone offsets, but reject far future.
    const maxFutureDate = new Date(today);
    maxFutureDate.setDate(maxFutureDate.getDate() + 1);

    if (requestDate > maxFutureDate) {
      return NextResponse.json({ error: "Cannot record attendance for future dates" }, { status: 400 });
    }

    // Verify schedule exists
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: classScheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // If Lecturer, verify ownership
    if (userRole === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: session.user.id },
      });
      if (!lecturer || schedule.lecturerId !== lecturer.id) {
        return NextResponse.json({ error: "Forbidden: Not your schedule" }, { status: 403 });
      }
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
    const attendanceDate = new Date(date); // Store at midnight UTC for consistency with DB Date type
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
      if (
        dbError && 
        typeof dbError === "object" && 
        "code" in dbError && 
        (dbError as Record<string, unknown>).code === "P2002"
      ) {
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
