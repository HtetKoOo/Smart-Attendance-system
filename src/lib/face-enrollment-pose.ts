export type EnrollmentPose = "center" | "left" | "right";

export interface LandmarkPoint {
  x: number;
  y: number;
}

export interface PoseLandmarks {
  leftEye: LandmarkPoint[];
  rightEye: LandmarkPoint[];
  nose: LandmarkPoint[];
}

export interface EnrollmentPoseAnalysis {
  yawOffset: number;
  rollDegrees: number;
  detectedPose: EnrollmentPose | "transition";
}

const CENTER_YAW_LIMIT = 0.13;
const TURN_YAW_MINIMUM = 0.07;
const TURN_YAW_MAXIMUM = 0.65;
export const MAX_ENROLLMENT_ROLL_DEGREES = 12;

function averagePoint(points: LandmarkPoint[]): LandmarkPoint | null {
  if (points.length === 0) return null;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

export function getExpectedEnrollmentPose(step: number): EnrollmentPose {
  if (step <= 4) return "center";
  if (step <= 7) return "left";
  return "right";
}

export function getEnrollmentPoseInstruction(pose: EnrollmentPose): string {
  if (pose === "left") return "Turn your face slightly to your left and hold still.";
  if (pose === "right") return "Turn your face slightly to your right and hold still.";
  return "Look straight at the camera and hold still.";
}

export function analyzeEnrollmentPose(
  landmarks: PoseLandmarks,
): EnrollmentPoseAnalysis | null {
  const leftEyeCenter = averagePoint(landmarks.leftEye);
  const rightEyeCenter = averagePoint(landmarks.rightEye);
  if (!leftEyeCenter || !rightEyeCenter || landmarks.nose.length < 4) return null;

  const eyeDistance = Math.hypot(
    rightEyeCenter.x - leftEyeCenter.x,
    rightEyeCenter.y - leftEyeCenter.y,
  );
  if (eyeDistance < 1) return null;

  const eyeMidpointX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
  const noseTip = landmarks.nose[3];
  const yawOffset = (noseTip.x - eyeMidpointX) / eyeDistance;
  const rollDegrees =
    (Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x,
    ) *
      180) /
    Math.PI;

  let detectedPose: EnrollmentPose | "transition" = "transition";
  if (Math.abs(yawOffset) <= CENTER_YAW_LIMIT) detectedPose = "center";
  // face-api landmarks use the camera's unmirrored coordinate space even
  // though the preview is mirrored for the student.
  else if (yawOffset <= -TURN_YAW_MINIMUM) detectedPose = "left";
  else if (yawOffset >= TURN_YAW_MINIMUM) detectedPose = "right";

  return { yawOffset, rollDegrees, detectedPose };
}

export function isEnrollmentPoseAccepted(
  analysis: EnrollmentPoseAnalysis,
  expectedPose: EnrollmentPose,
): boolean {
  if (Math.abs(analysis.rollDegrees) > MAX_ENROLLMENT_ROLL_DEGREES) return false;
  if (expectedPose === "center") {
    return Math.abs(analysis.yawOffset) <= CENTER_YAW_LIMIT;
  }
  if (expectedPose === "left") {
    return (
      analysis.yawOffset <= -TURN_YAW_MINIMUM &&
      analysis.yawOffset >= -TURN_YAW_MAXIMUM
    );
  }
  return (
    analysis.yawOffset >= TURN_YAW_MINIMUM &&
    analysis.yawOffset <= TURN_YAW_MAXIMUM
  );
}
