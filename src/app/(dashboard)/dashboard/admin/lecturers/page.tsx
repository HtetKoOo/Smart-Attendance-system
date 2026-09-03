import { requireRole } from "@/lib/session";
import { LecturerManagementContent } from "@/components/admin/lecturer-management";

export const metadata = {
  title: "Lecturer Management - Smart Attendance System",
};

export default async function LecturerManagementPage() {
  await requireRole("ADMIN");

  return <LecturerManagementContent />;
}
