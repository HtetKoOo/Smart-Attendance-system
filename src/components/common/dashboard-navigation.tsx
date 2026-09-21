"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/common/sidebar";
import { DashboardHeader } from "@/components/common/dashboard-header";
import { getDashboardHeaderLabel } from "@/lib/dashboard-page-title";
import type { User as AuthUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface DashboardNavigationProps {
  user: AuthUser;
  role?: Role;
}

export function DashboardNavigation({ user, role }: DashboardNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const headerLabel = getDashboardHeaderLabel(pathname);

  return (
    <>
      <Sidebar
        role={role}
        mobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <DashboardHeader
        title={headerLabel.title}
        section={headerLabel.section}
        user={user}
        role={role}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen((open) => !open)}
      />
    </>
  );
}
