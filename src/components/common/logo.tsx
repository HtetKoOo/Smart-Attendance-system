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
      aria-label="KBU Smart Attendance System"
    >
      <div className="shrink-0 rounded-lg bg-primary p-1.5">
        <GraduationCap className="size-5 text-primary-foreground" />
      </div>
      <span className="hidden min-w-0 sm:block">
        <span className="block whitespace-nowrap text-sm leading-4">KBU Smart Attendance</span>
        {showProjectLabel && (
          <span
            className="block whitespace-nowrap text-[9px] font-medium uppercase leading-3 tracking-[0.08em] text-sidebar-foreground/65"
          >
            Academic Seminar Project
          </span>
        )}
      </span>
    </Link>
  );
}
