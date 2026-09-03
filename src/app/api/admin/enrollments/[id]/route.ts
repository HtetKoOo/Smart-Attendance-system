import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// DELETE - Remove a specific enrollment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Delete enrollment only — historical Attendance records are NOT deleted
    await prisma.enrollment.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error deleting enrollment:", error);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
