import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - Return courses that belong to this lecturer's schedules
export async function GET() {
  try {
    const session = await requireRole("LECTURER");

    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    const schedules = await prisma.classSchedule.findMany({
      where: { lecturerId: lecturer.id },
      select: {
        course: { select: { id: true, code: true, name: true } },
      },
    });

    // Deduplicate courses
    const seen = new Set<string>();
    const courses = schedules
      .map((s) => s.course)
      .filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

    return NextResponse.json({ courses });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching lecturer courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
