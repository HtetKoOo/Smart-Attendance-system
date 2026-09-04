import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const enrollments = await prisma.faceEmbedding.findMany({
        where: { studentId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, studentId: true, createdAt: true, updatedAt: true },
      });
      const latestEnrollment = enrollments[0];

      return NextResponse.json({
        isEnrolled: enrollments.length > 0,
        enrolledAt: latestEnrollment?.updatedAt || null,
        embeddingId: latestEnrollment?.id || null,
        templateCount: enrollments.length,
      });
    }

    // Return all enrolled student IDs
    const enrollments = await prisma.faceEmbedding.findMany({
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const templateCounts = enrollments.reduce<Record<string, number>>(
      (counts, enrollment) => {
        counts[enrollment.studentId] = (counts[enrollment.studentId] || 0) + 1;
        return counts;
      },
      {},
    );
    const enrolledStudentIds = Object.keys(templateCounts);
    return NextResponse.json({ enrolledStudentIds, templateCounts });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching face enrollment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch face enrollment status" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    // Enforce a 16 KB body size limit before parsing JSON
    const contentLength = request.headers.get("content-length");
    const MAX_BODY_BYTES = 16 * 1024; // 16 KB
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large. Maximum allowed size is 16 KB." },
        { status: 413 },
      );
    }

    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large. Maximum allowed size is 16 KB." },
        { status: 413 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    // Reject unexpected fields – only studentId and embedding are accepted
    const allowedKeys = new Set(["studentId", "embedding", "embeddings"]);
    const unexpectedKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
    if (unexpectedKeys.length > 0) {
      return NextResponse.json(
        { error: `Unexpected fields in request: ${unexpectedKeys.join(", ")}` },
        { status: 400 },
      );
    }

    const { studentId, embedding, embeddings } = body;

    // Validate studentId
    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { error: "Valid Student ID is required" },
        { status: 400 },
      );
    }

    // Verify student exists in database
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student does not exist" },
        { status: 404 },
      );
    }

    if (embedding !== undefined && embeddings !== undefined) {
      return NextResponse.json(
        { error: "Send either embedding or embeddings, not both." },
        { status: 400 },
      );
    }

    // Backward compatible with existing single-template enrollment requests.
    const templatesToStore = embeddings !== undefined ? embeddings : [embedding];
    if (
      !Array.isArray(templatesToStore) ||
      templatesToStore.length < 1 ||
      templatesToStore.length > 3
    ) {
      return NextResponse.json(
        {
          error: "Provide between 1 and 3 biometric templates.",
        },
        { status: 400 },
      );
    }

    const isValidTemplates = templatesToStore.every(
      (template) =>
        Array.isArray(template) &&
        template.length === 128 &&
        template.every(
          (value) =>
            typeof value === "number" &&
            Number.isFinite(value) &&
            !Number.isNaN(value),
        ),
    );

    if (!isValidTemplates) {
      return NextResponse.json(
        {
          error:
            "Every template must contain exactly 128 finite numeric values.",
        },
        { status: 400 },
      );
    }

    const verifiedTemplates = templatesToStore as number[][];

    // Atomically replace every prior template with the newly verified templates.
    const templateCount = await prisma.$transaction(async (tx) => {
      await tx.faceEmbedding.deleteMany({
        where: { studentId },
      });

      const result = await tx.faceEmbedding.createMany({
        data: verifiedTemplates.map((template) => ({
          studentId,
          embedding: template,
        })),
      });
      return result.count;
    });

    return NextResponse.json({
      success: true,
      message: `${templateCount} face templates successfully enrolled for ${student.user.name}`,
      data: {
        studentId,
        templateCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error saving face enrollment:", error);
    return NextResponse.json(
      { error: "Failed to save face enrollment data" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { error: "Student ID parameter is required" },
        { status: 400 },
      );
    }

    // Delete all face embeddings for the student
    const deleteResult = await prisma.faceEmbedding.deleteMany({
      where: { studentId },
    });

    return NextResponse.json({
      success: true,
      message: "Face enrollment data deleted successfully",
      count: deleteResult.count,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error deleting face enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete face enrollment" },
      { status: 500 },
    );
  }
}
