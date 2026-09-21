"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import { UserMenu } from "@/components/common/user-menu";
import type { User as AuthUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface DashboardHeaderProps {
  title: string;
  section?: string;
  user: AuthUser;
  role?: Role;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function DashboardHeader({
  title,
  section,
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
          <div className="flex min-w-0 items-center gap-1.5 text-sm sm:text-base">
            {section && (
              <>
                <span className="hidden truncate text-muted-foreground sm:inline">
                  {section}
                </span>
                <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              </>
            )}
            <span className="truncate font-semibold">{title}</span>
          </div>
        </div>

        <UserMenu user={user} role={role} />
      </div>
    </header>
  );
}
