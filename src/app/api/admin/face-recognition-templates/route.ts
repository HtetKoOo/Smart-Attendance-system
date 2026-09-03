import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/face-recognition-templates
 *
 * Returns ONLY the minimum biometric data needed for local Euclidean matching:
 * - student record id
 * - student human-readable ID
 * - student name
 * - 128-dimensional numeric embedding
 *
 * Email, sessions, accounts, and all other student fields are intentionally excluded.
 * Endpoint is protected to ADMIN role only.
 */
export async function GET() {
  try {
    await requireRole("ADMIN");

    const embeddings = await prisma.faceEmbedding.findMany({
      select: {
        id: true,
        studentId: true,
        embedding: true,
        student: {
          select: {
            studentId: true,
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Filter and validate embeddings: must be an array of exactly 128 finite numbers.
    // Malformed entries are silently excluded to prevent client-side crashes.
    const EMBEDDING_LENGTH = 128;
    const templates = embeddings
      .map((row) => {
        const arr = row.embedding;
        if (
          !Array.isArray(arr) ||
          arr.length !== EMBEDDING_LENGTH ||
          !arr.every(
            (v) =>
              typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v),
          )
        ) {
          return null;
        }
        return {
          embeddingId: row.id,
          studentId: row.student.studentId,
          studentDbId: row.studentId,
          studentName: row.student.user.name,
          embedding: arr as number[],
        };
      })
      .filter(Boolean);

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error loading recognition templates:", error);
    return NextResponse.json(
      { error: "Failed to load face recognition templates" },
      { status: 500 },
    );
  }
}
