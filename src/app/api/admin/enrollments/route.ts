import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const MAX_BODY_BYTES = 4 * 1024; // 4 KB limit

// GET - List all enrollments with optional filtering
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const studentSearch = searchParams.get("student")?.toLowerCase() || "";
    const courseSearch = searchParams.get("course")?.toLowerCase() || "";

    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        course: { select: { id: true, code: true, name: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const filtered = enrollments.filter((e) => {
      const matchStudent =
        !studentSearch ||
        e.student.user.name.toLowerCase().includes(studentSearch) ||
        e.student.studentId.toLowerCase().includes(studentSearch);
      const matchCourse =
        !courseSearch ||
        e.course.code.toLowerCase().includes(courseSearch) ||
        e.course.name.toLowerCase().includes(courseSearch);
      return matchStudent && matchCourse;
    });

    return NextResponse.json({ enrollments: filtered });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error listing enrollments:", error);
    return NextResponse.json({ error: "Failed to list enrollments" }, { status: 500 });
  }
}

// POST - Create a new enrollment
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    // Body size guard
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

    // Allowlist validation
    const allowedKeys = new Set(["studentId", "courseId"]);
    const unexpected = Object.keys(body).filter((k) => !allowedKeys.has(k));
    if (unexpected.length > 0) {
      return NextResponse.json(
        { error: `Unexpected fields: ${unexpected.join(", ")}` },
        { status: 400 },
      );
    }

    const { studentId, courseId } = body;
    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify student and course exist
    const [student, course] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Atomic create with duplicate protection
    try {
      const enrollment = await prisma.enrollment.create({
        data: { studentId, courseId },
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          course: { select: { id: true, code: true, name: true } },
        },
      });
      return NextResponse.json({ created: true, enrollment }, { status: 201 });
    } catch (dbError) {
      if (
        dbError &&
        typeof dbError === "object" &&
        "code" in dbError &&
        (dbError as Record<string, unknown>).code === "P2002"
      ) {
        const existing = await prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId, courseId } },
          include: {
            student: { include: { user: { select: { name: true, email: true } } } },
            course: { select: { id: true, code: true, name: true } },
          },
        });
        return NextResponse.json({ created: false, enrollment: existing }, { status: 200 });
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
    console.error("Error creating enrollment:", error);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}
