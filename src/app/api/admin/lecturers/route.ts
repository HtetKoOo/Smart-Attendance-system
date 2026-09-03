import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - List all lecturers
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
            { lecturerId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [lecturers, total] = await Promise.all([
      prisma.lecturer.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lecturer.count({ where }),
    ]);

    return NextResponse.json({
      data: lecturers,
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
    console.error("Error fetching lecturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturers" },
      { status: 500 },
    );
  }
}

// POST - Link a registered account to a new lecturer profile.
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
      Object.keys(body).some((key) => !["userId", "lecturerId"].includes(key))
    ) {
      return NextResponse.json({ error: "Invalid request fields" }, { status: 400 });
    }
    const { userId, lecturerId } = body;

    if (!userId || !lecturerId || typeof userId !== "string" || typeof lecturerId !== "string") {
      return NextResponse.json(
        { error: "Registered account and lecturer ID are required" },
        { status: 400 },
      );
    }

    // Check if lecturer ID already exists
    const existingLecturer = await prisma.lecturer.findUnique({
      where: { lecturerId },
    });
    if (existingLecturer) {
      return NextResponse.json(
        { error: "Lecturer ID already exists" },
        { status: 409 },
      );
    }

    // Promote only a normal registered account without an existing profile.
    const lecturer = await prisma.$transaction(async (tx) => {
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

      await tx.user.update({
        where: { id: user.id },
        data: { role: "LECTURER" },
      });

      return tx.lecturer.create({
        data: {
          userId: user.id,
          lecturerId,
        },
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
        },
      });
    });

    return NextResponse.json(lecturer, { status: 201 });
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
    console.error("Error creating lecturer:", error);
    return NextResponse.json(
      { error: "Failed to create lecturer" },
      { status: 500 },
    );
  }
}
