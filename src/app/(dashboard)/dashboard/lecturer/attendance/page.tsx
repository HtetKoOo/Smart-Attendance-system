import type { Metadata } from "next";
import { AttendanceReportContent } from "@/components/attendance/attendance-report-content";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Attendance History | KBU Smart Attendance System",
  description: "Review attendance for class schedules assigned to you.",
};

export default async function LecturerAttendanceHistoryPage() {
  await requireRole("LECTURER");

  return <AttendanceReportContent />;
}
