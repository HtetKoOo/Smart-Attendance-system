import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - List all schedules
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");
    const lecturerId = searchParams.get("lecturerId");
    const classroomId = searchParams.get("classroomId");
    const dayOfWeek = searchParams.get("dayOfWeek");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;

    const where: Record<string, string> = {};

    if (courseId) where.courseId = courseId;
    if (lecturerId) where.lecturerId = lecturerId;
    if (classroomId) where.classroomId = classroomId;
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;

    const [schedules, total] = await Promise.all([
      prisma.classSchedule.findMany({
        where,
        include: {
          course: { select: { code: true, name: true } },
          classroom: { select: { name: true, location: true } },
          lecturer: {
            select: { lecturerId: true, user: { select: { name: true } } },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      }),
      prisma.classSchedule.count({ where }),
    ]);

    return NextResponse.json({
      data: schedules,
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
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

// POST - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { courseId, classroomId, lecturerId, dayOfWeek, startTime, endTime } =
      body;

    if (
      !courseId ||
      !classroomId ||
      !lecturerId ||
      !dayOfWeek ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM" },
        { status: 400 },
      );
    }

    // Validate end time is after start time
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (endTotalMin <= startTotalMin) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    // Verify related records exist
    const [course, classroom, lecturer] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.classroom.findUnique({ where: { id: classroomId } }),
      prisma.lecturer.findUnique({ where: { id: lecturerId } }),
    ]);

    if (!course || !classroom || !lecturer) {
      return NextResponse.json(
        { error: "Invalid course, classroom, or lecturer" },
        { status: 400 },
      );
    }

    const schedule = await prisma.classSchedule.create({
      data: {
        courseId,
        classroomId,
        lecturerId,
        dayOfWeek,
        startTime,
        endTime,
      },
      include: {
        course: { select: { code: true, name: true } },
        classroom: { select: { name: true, location: true } },
        lecturer: {
          select: { lecturerId: true, user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 },
    );
  }
}
