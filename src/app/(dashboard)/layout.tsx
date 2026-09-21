import { getSession } from "@/lib/session";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { DashboardNavigation } from "@/components/common/dashboard-navigation";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getSession();

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const role = (user.role as Role | undefined) ?? undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardNavigation user={user} role={role} />

      <div className="flex flex-1 flex-col lg:ml-64">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
