import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireRole(["ADMIN", "LECTURER"]);
    const userRole = session.user.role;

    const where: Record<string, string> = {};

    if (userRole === "LECTURER") {
      // Find lecturer ID
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: session.user.id },
      });
      if (!lecturer) {
        return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
      }
      where.lecturerId = lecturer.id;
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: {
        course: { select: { code: true, name: true } },
        classroom: { select: { name: true, location: true } },
        lecturer: {
          select: { user: { select: { name: true } } },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}
