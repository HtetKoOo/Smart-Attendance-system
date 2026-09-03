import { requireRole } from "@/lib/session";
import { ScheduleManagementContent } from "@/components/admin/schedule-management";

export const metadata = {
  title: "Schedule Management - KBU Smart Attendance System",
};

export default async function ScheduleManagementPage() {
  await requireRole("ADMIN");

  return <ScheduleManagementContent />;
}
