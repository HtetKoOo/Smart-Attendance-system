import { requireRole } from "@/lib/session";
import { ClassroomManagementContent } from "@/components/admin/classroom-management";

export const metadata = {
  title: "Classroom Management - Smart Attendance System",
};

export default async function ClassroomManagementPage() {
  await requireRole("ADMIN");

  return <ClassroomManagementContent />;
}
