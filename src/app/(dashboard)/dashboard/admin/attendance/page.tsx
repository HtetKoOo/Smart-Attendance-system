import type { Metadata } from "next";
import { AttendanceReportContent } from "@/components/attendance/attendance-report-content";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Attendance History | KBU Smart Attendance System",
  description: "Review and export recorded attendance history.",
};

export default async function AttendanceHistoryPage() {
  await requireRole("ADMIN");

  return <AttendanceReportContent />;
}
