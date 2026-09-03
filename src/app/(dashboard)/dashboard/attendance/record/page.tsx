import { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { AttendanceRecordContent } from "@/components/attendance/attendance-record-content";

export const metadata: Metadata = {
  title: "Record Attendance | Smart Attendance System",
  description: "Record attendance using facial recognition.",
};

export default async function AttendanceRecordPage() {
  await requireRole(["ADMIN", "LECTURER"]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Select a class schedule and start the camera to record attendance.
        </p>
      </div>

      <AttendanceRecordContent />
    </div>
  );
}
