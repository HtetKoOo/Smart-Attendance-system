import { requireRole } from "@/lib/session";
import { CourseManagementContent } from "@/components/admin/course-management";

export const metadata = {
  title: "Course Management - Smart Attendance System",
};

export default async function CourseManagementPage() {
  await requireRole("ADMIN");

  return <CourseManagementContent />;
}
