import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "LECTURER"]);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const classScheduleId = searchParams.get("classScheduleId");

    if (!classScheduleId) {
      return NextResponse.json({ error: "classScheduleId is required" }, { status: 400 });
    }

    // Fetch the schedule to verify it exists and get the courseId
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

    // Find all students enrolled in this course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: schedule.courseId },
      select: { studentId: true },
    });

    const enrolledStudentIds = enrollments.map((e) => e.studentId);

    if (enrolledStudentIds.length === 0) {
      return NextResponse.json({ templates: [] });
    }

    // Fetch FaceEmbeddings for these enrolled students
    const faceEmbeddings = await prisma.faceEmbedding.findMany({
      where: { studentId: { in: enrolledStudentIds } },
      include: {
        student: {
          select: {
            studentId: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    // Validate and format templates safely
    const templates = faceEmbeddings
      .map((record) => {
        const embedding = record.embedding;
        
        // Ensure it's an array of 128 finite numbers
        if (!Array.isArray(embedding) || embedding.length !== 128) return null;
        
        const isValidNumbers = embedding.every(
          (val) => typeof val === "number" && Number.isFinite(val) && !Number.isNaN(val)
        );
        
        if (!isValidNumbers) return null;

        return {
          embeddingId: record.id,
          studentDbId: record.studentId,
          studentId: record.student.studentId,
          studentName: record.student.user.name,
          embedding: embedding,
        };
      })
      .filter((t) => t !== null);

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
