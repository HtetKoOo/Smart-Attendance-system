import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET - Registered users who have a password but are not yet a student or lecturer.
export async function GET() {
  try {
    await requireRole("ADMIN");

    const users = await prisma.user.findMany({
      where: {
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
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching unlinked users:", error);
    return NextResponse.json(
      { error: "Failed to fetch registered accounts" },
      { status: 500 },
    );
  }
}
