import { FaceCalibrationContent } from "@/components/face/face-calibration-content";
import { requireRole } from "@/lib/session";

export const metadata = {
  title: "Recognition Calibration - KBU Smart Attendance System",
};

export default async function FaceCalibrationPage() {
  await requireRole("ADMIN");
  return <FaceCalibrationContent />;
}
