import { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { LecturerRosterContent } from "@/components/lecturer/lecturer-roster-content";

export const metadata: Metadata = {
  title: "My Course Students | Smart Attendance System",
  description: "View students enrolled in your assigned courses.",
};

export default async function LecturerEnrollmentsPage() {
  await requireRole("LECTURER");

  return <LecturerRosterContent />;
}
