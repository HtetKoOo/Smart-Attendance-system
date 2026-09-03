import { requireRole } from "@/lib/session";
import { FaceDetectionContent } from "@/components/face/face-detection-content";

export const metadata = {
  title: "Face Detection - KBU Smart Attendance System",
};

export default async function FaceDetectionPage() {
  await requireRole(["ADMIN", "LECTURER"]);

  return <FaceDetectionContent />;
}
