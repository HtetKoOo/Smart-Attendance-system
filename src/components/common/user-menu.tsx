"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as AuthUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

interface UserMenuProps {
  user: AuthUser;
  role?: Role;
}

export function UserMenu({ user, role }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Reload page to clear session cookies
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/";
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        title={user.name || "User"}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {(user.name?.charAt(0) || "U").toUpperCase()}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-xs font-medium">{user.name || "User"}</div>
          <div className="text-xs text-muted-foreground">
            {role || "STUDENT"}
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-background shadow-lg">
            <div className="border-b border-border p-3">
              <div className="text-sm font-semibold">{user.name || "User"}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              {role && (
                <div className="mt-1 inline-block rounded bg-muted px-2 py-1 text-xs font-medium">
                  {role}
                </div>
              )}
            </div>
            <div className="p-2">
              <button
                disabled={isLoading}
                onClick={handleLogout}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted text-foreground",
                )}
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
