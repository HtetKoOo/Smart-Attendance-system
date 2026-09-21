import type { Role } from "@prisma/client";
import { AccountSettingsContent } from "@/components/settings/account-settings-content";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

interface AccountSettingsPageProps {
  role: Role;
}

export async function AccountSettingsPage({ role }: AccountSettingsPageProps) {
  const session = await requireRole(role);

  let profileIdentifier: string | null = null;
  if (role === "STUDENT") {
    const profile = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { studentId: true },
    });
    profileIdentifier = profile?.studentId ?? null;
  } else if (role === "LECTURER") {
    const profile = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
      select: { lecturerId: true },
    });
    profileIdentifier = profile?.lecturerId ?? null;
  }

  return (
    <AccountSettingsContent
      initialName={session.user.name}
      email={session.user.email}
      role={role}
      profileIdentifier={profileIdentifier}
    />
  );
}
