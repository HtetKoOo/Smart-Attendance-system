import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - List all students
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase() || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;

    const where = search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              user: {
                email: { contains: search, mode: "insensitive" as const },
              },
            },
            { studentId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      data: students,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}

// POST - Link a registered account to a new student profile.
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 4096) {
      return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
    }

    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      Object.keys(body).some((key) => !["userId", "studentId"].includes(key))
    ) {
      return NextResponse.json({ error: "Invalid request fields" }, { status: 400 });
    }
    const { userId, studentId } = body;

    if (!userId || !studentId || typeof userId !== "string" || typeof studentId !== "string") {
      return NextResponse.json(
        { error: "Registered account and student ID are required" },
        { status: 400 },
      );
    }

    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });
    if (existingStudent) {
      return NextResponse.json(
        { error: "Student ID already exists" },
        { status: 409 },
      );
    }

    // Only a normal registered account without a profile can become a student.
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          role: "STUDENT",
          student: null,
          lecturer: null,
          accounts: {
            some: {
              providerId: "credential",
              password: { not: null },
            },
          },
        },
      });

      if (!user) {
        throw new Error("Registered account is unavailable or already linked");
      }

      return tx.student.create({
        data: {
          userId: user.id,
          studentId,
        },
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
        },
      });
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("unavailable or already linked")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
