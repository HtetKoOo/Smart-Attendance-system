export type AttendanceActorRole = "ADMIN" | "LECTURER" | "STUDENT";

interface AttendanceActorInput {
  role: AttendanceActorRole;
  lecturerId: string | null;
  scheduleLecturerId: string;
}

export function canRecordScheduleAttendance({
  role,
  lecturerId,
  scheduleLecturerId,
}: AttendanceActorInput) {
  if (role === "ADMIN") return true;
  return role === "LECTURER" && lecturerId !== null && lecturerId === scheduleLecturerId;
}

export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseAttendanceDate(value: string, now = new Date()) {
  if (!DATE_PATTERN.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  const maxFutureDate = new Date(now);
  maxFutureDate.setUTCHours(23, 59, 59, 999);
  maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 1);

  return date <= maxFutureDate ? date : null;
}
