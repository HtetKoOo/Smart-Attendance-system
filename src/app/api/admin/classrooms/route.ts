import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - List all classrooms
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
            { name: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [classrooms, total] = await Promise.all([
      prisma.classroom.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.classroom.count({ where }),
    ]);

    return NextResponse.json({
      data: classrooms,
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
    console.error("Error fetching classrooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch classrooms" },
      { status: 500 },
    );
  }
}

// POST - Create a new classroom
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { name, location } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Classroom name is required" },
        { status: 400 },
      );
    }

    // Check if classroom name already exists
    const existingClassroom = await prisma.classroom.findUnique({
      where: { name },
    });
    if (existingClassroom) {
      return NextResponse.json(
        { error: "Classroom name already exists" },
        { status: 409 },
      );
    }

    const classroom = await prisma.classroom.create({
      data: { name, location: location || null },
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating classroom:", error);
    return NextResponse.json(
      { error: "Failed to create classroom" },
      { status: 500 },
    );
  }
}
