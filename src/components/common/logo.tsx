import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold">
      <div className="rounded-lg bg-primary p-1.5">
        <GraduationCap className="size-5 text-primary-foreground" />
      </div>
      <span className="hidden sm:inline">Smart Attendance</span>
    </Link>
  );
}
