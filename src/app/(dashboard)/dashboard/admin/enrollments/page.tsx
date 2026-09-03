import { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { EnrollmentManagementContent } from "@/components/admin/enrollment-management";

export const metadata: Metadata = {
  title: "Course Enrollments | KBU Smart Attendance System",
  description: "Manage course enrollments for students.",
};

export default async function EnrollmentsPage() {
  await requireRole("ADMIN");

  return <EnrollmentManagementContent />;
}
