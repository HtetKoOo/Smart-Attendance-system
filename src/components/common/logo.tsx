import Link from "next/link";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  showProjectLabel?: boolean;
}

export function Logo({ showProjectLabel = false }: LogoProps) {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 font-semibold text-sidebar-foreground"
    >
      <div className="shrink-0 rounded-lg bg-primary p-1.5">
        <GraduationCap className="size-5 text-primary-foreground" />
      </div>
      <span className="hidden min-w-0 sm:block">
        <span className="block text-sm leading-tight">KBU Smart Attendance System</span>
        {showProjectLabel && (
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/65">
            Academic Seminar Project
          </span>
        )}
      </span>
    </Link>
  );
}
