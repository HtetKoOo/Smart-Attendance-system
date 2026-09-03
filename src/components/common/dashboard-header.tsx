"use client";

import { Menu, X } from "lucide-react";
import { UserMenu } from "@/components/common/user-menu";
import type { User as AuthUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface DashboardHeaderProps {
  title: string;
  user: AuthUser;
  role?: Role;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function DashboardHeader({
  title,
  user,
  role,
  isMobileMenuOpen = false,
  onMobileMenuToggle,
}: DashboardHeaderProps) {

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:ml-64">
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuToggle}
            className="rounded-lg border border-border p-2 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <UserMenu user={user} role={role} />
      </div>
    </header>
  );
}
