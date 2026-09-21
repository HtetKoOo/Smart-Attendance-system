import { NextResponse } from "next/server";
import { validateAccountSettingsPayload } from "@/lib/account-settings-validation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const MAX_BODY_BYTES = 4096;

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const contentLength = Number(request.headers.get("content-length") || "0");

    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const validation = validateAccountSettingsPayload(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validation.name },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating account settings:", error);
    return NextResponse.json({ error: "Failed to update account settings." }, { status: 500 });
  }
}
