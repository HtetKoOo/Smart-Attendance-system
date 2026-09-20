import type { Metadata } from "next";
import { LecturerScheduleContent } from "@/components/lecturer/lecturer-schedule-content";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "My Schedule | KBU Smart Attendance System", description: "View your weekly teaching timetable." };

export default async function LecturerSchedulePage() {
  await requireRole("LECTURER");
  return <LecturerScheduleContent />;
}
