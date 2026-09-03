import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const enrollment = await prisma.faceEmbedding.findFirst({
        where: { studentId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, studentId: true, createdAt: true, updatedAt: true },
      });

      return NextResponse.json({
        isEnrolled: !!enrollment,
        enrolledAt: enrollment?.updatedAt || null,
        embeddingId: enrollment?.id || null,
      });
    }

    // Return all enrolled student IDs
    const enrollments = await prisma.faceEmbedding.findMany({
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const enrolledStudentIds = enrollments.map((e) => e.studentId);
    return NextResponse.json({ enrolledStudentIds });
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
    const allowedKeys = new Set(["studentId", "embedding"]);
    const unexpectedKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
    if (unexpectedKeys.length > 0) {
      return NextResponse.json(
        { error: `Unexpected fields in request: ${unexpectedKeys.join(", ")}` },
        { status: 400 },
      );
    }

    const { studentId, embedding } = body;

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

    // Validate biometric embedding format (must be an array of 128 finite numbers)
    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json(
        {
          error:
            "Invalid embedding format. Expected a 128-dimensional numeric array.",
        },
        { status: 400 },
      );
    }

    const isValidNumbers = embedding.every(
      (val) =>
        typeof val === "number" && Number.isFinite(val) && !Number.isNaN(val),
    );

    if (!isValidNumbers) {
      return NextResponse.json(
        { error: "Embedding contains invalid or non-finite numbers." },
        { status: 400 },
      );
    }

    // Atomic replace / upsert: delete existing embeddings for this student and save new template
    const record = await prisma.$transaction(async (tx) => {
      await tx.faceEmbedding.deleteMany({
        where: { studentId },
      });

      return tx.faceEmbedding.create({
        data: {
          studentId,
          embedding,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Face template successfully enrolled for ${student.user.name}`,
      data: {
        id: record.id,
        studentId: record.studentId,
        updatedAt: record.updatedAt,
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
