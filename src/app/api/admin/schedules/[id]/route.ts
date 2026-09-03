import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const schedule = await prisma.classSchedule.findUnique({
      where: { id },
      include: {
        course: { select: { code: true, name: true } },
        classroom: { select: { name: true, location: true } },
        lecturer: {
          select: { lecturerId: true, user: { select: { name: true } } },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

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

    // Check schedule exists
    const schedule = await prisma.classSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
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

    const updated = await prisma.classSchedule.update({
      where: { id },
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

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const schedule = await prisma.classSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    await prisma.classSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 },
    );
  }
}
