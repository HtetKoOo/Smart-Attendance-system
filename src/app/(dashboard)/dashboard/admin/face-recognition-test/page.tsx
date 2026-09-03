import { requireRole } from "@/lib/session";
import { FaceRecognitionTestContent } from "@/components/face/face-recognition-test-content";

export const metadata = {
  title: "Face Recognition Test - KBU Smart Attendance System",
};

export default async function FaceRecognitionTestPage() {
  await requireRole("ADMIN");

  return <FaceRecognitionTestContent />;
}
