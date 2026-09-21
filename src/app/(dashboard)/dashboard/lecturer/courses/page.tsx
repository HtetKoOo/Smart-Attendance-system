import type { Metadata } from "next";
import { LecturerCoursesContent } from "@/components/lecturer/lecturer-courses-content";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "My Courses | KBU Smart Attendance System", description: "View courses and sessions assigned to you." };

export default async function LecturerCoursesPage() {
  await requireRole("LECTURER");
  return <LecturerCoursesContent />;
}
