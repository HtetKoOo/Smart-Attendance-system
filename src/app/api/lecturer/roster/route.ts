import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - Lecturer reads the roster for one of their own courses
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("LECTURER");

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify the course belongs to at least one schedule assigned to this lecturer
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    const ownedSchedule = await prisma.classSchedule.findFirst({
      where: { lecturerId: lecturer.id, courseId },
    });

    if (!ownedSchedule) {
      return NextResponse.json(
        { error: "Forbidden: This course is not assigned to you" },
        { status: 403 },
      );
    }

    // Return enrolled students for this course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { enrolledAt: "asc" },
    });

    const roster = enrollments.map((e) => ({
      enrollmentId: e.id,
      studentDbId: e.student.id,
      studentId: e.student.studentId,
      studentName: e.student.user.name,
      studentEmail: e.student.user.email,
      enrolledAt: e.enrolledAt,
    }));

    return NextResponse.json({ roster });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching roster:", error);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
  }
}
