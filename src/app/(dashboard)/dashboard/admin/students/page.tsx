import { requireRole } from "@/lib/session";
import { StudentManagementContent } from "@/components/admin/student-management";

export const metadata = {
  title: "Student Management - Smart Attendance System",
};

export default async function StudentManagementPage() {
  await requireRole("ADMIN");

  return <StudentManagementContent />;
}
