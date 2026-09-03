"use client";

import { useState } from "react";
import { Sidebar } from "@/components/common/sidebar";
import { DashboardHeader } from "@/components/common/dashboard-header";
import type { User as AuthUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface DashboardNavigationProps {
  user: AuthUser;
  role?: Role;
}

export function DashboardNavigation({ user, role }: DashboardNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Sidebar
        role={role}
        mobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <DashboardHeader
        title="Dashboard"
        user={user}
        role={role}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen((open) => !open)}
      />
    </>
  );
}
