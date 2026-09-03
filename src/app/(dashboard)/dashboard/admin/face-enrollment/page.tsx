import { requireRole } from "@/lib/session";
import { FaceEnrollmentContent } from "@/components/face/face-enrollment-content";

export const metadata = {
  title: "Student Face Enrollment - Smart Attendance System",
};

export default async function FaceEnrollmentPage() {
  await requireRole("ADMIN");

  return <FaceEnrollmentContent />;
}
