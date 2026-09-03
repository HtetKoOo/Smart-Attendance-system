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

    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(lecturer);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching lecturer:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturer" },
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
    const { name, email, lecturerId } = body;

    if (!name || !email || !lecturerId) {
      return NextResponse.json(
        { error: "Name, email, and lecturer ID are required" },
        { status: 400 },
      );
    }

    // Check lecturer exists
    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer not found" },
        { status: 404 },
      );
    }

    // Check if new email already exists (and it's different from current)
    if (email !== lecturer.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 },
        );
      }
    }

    // Check if new lecturer ID already exists (and it's different from current)
    if (lecturerId !== lecturer.lecturerId) {
      const existingLecturer = await prisma.lecturer.findUnique({
        where: { lecturerId },
      });
      if (existingLecturer) {
        return NextResponse.json(
          { error: "Lecturer ID already exists" },
          { status: 409 },
        );
      }
    }

    // Update user and lecturer
    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: lecturer.userId },
        data: { name, email },
      });

      return tx.lecturer.update({
        where: { id },
        data: { lecturerId },
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating lecturer:", error);
    return NextResponse.json(
      { error: "Failed to update lecturer" },
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

    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer not found" },
        { status: 404 },
      );
    }

    // Delete lecturer (cascade delete user via Prisma relation)
    await prisma.lecturer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting lecturer:", error);
    return NextResponse.json(
      { error: "Failed to delete lecturer" },
      { status: 500 },
    );
  }
}
