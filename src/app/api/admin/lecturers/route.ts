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

// POST - Create a new lecturer
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { name, email, lecturerId } = body;

    if (!name || !email || !lecturerId) {
      return NextResponse.json(
        { error: "Name, email, and lecturer ID are required" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
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

    // Create user and lecturer in a transaction
    const lecturer = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          role: "LECTURER",
        },
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
    console.error("Error creating lecturer:", error);
    return NextResponse.json(
      { error: "Failed to create lecturer" },
      { status: 500 },
    );
  }
}
