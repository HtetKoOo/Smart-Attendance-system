"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  disabled = false,
  comingSoon = false,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={disabled ? "#" : href}
      onClick={(e) => disabled && e.preventDefault()}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive && !disabled
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        disabled && "cursor-not-allowed opacity-50",
      )}
      title={comingSoon ? "Coming soon" : undefined}
    >
      <Icon className="size-4" />
      <span className="hidden md:inline">{label}</span>
      {comingSoon && (
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">
          Soon
        </span>
      )}
    </Link>
  );
}
