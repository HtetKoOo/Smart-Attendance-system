import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 font-semibold text-sidebar-foreground"
    >
      <div className="shrink-0 rounded-lg bg-primary p-1.5">
        <GraduationCap className="size-5 text-primary-foreground" />
      </div>
      <span className="hidden text-sm leading-tight sm:inline">KBU Smart Attendance System</span>
    </Link>
  );
}
