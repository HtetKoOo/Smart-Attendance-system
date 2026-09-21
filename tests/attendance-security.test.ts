import assert from "node:assert/strict";
import test from "node:test";
import {
  canRecordScheduleAttendance,
  isUniqueConstraintError,
  parseAttendanceDate,
} from "../src/lib/attendance-security.ts";

test("allows an administrator to record any schedule", () => {
  assert.equal(
    canRecordScheduleAttendance({
      role: "ADMIN",
      lecturerId: null,
      scheduleLecturerId: "lecturer-2",
    }),
    true,
  );
});

test("allows only the assigned lecturer to record a schedule", () => {
  assert.equal(
    canRecordScheduleAttendance({
      role: "LECTURER",
      lecturerId: "lecturer-1",
      scheduleLecturerId: "lecturer-1",
    }),
    true,
  );
  assert.equal(
    canRecordScheduleAttendance({
      role: "LECTURER",
      lecturerId: "lecturer-1",
      scheduleLecturerId: "lecturer-2",
    }),
    false,
  );
  assert.equal(
    canRecordScheduleAttendance({
      role: "LECTURER",
      lecturerId: null,
      scheduleLecturerId: "lecturer-1",
    }),
    false,
  );
});

test("never allows a student to record attendance", () => {
  assert.equal(
    canRecordScheduleAttendance({
      role: "STUDENT",
      lecturerId: null,
      scheduleLecturerId: "lecturer-1",
    }),
    false,
  );
});

test("recognizes only Prisma unique constraint errors as duplicates", () => {
  assert.equal(isUniqueConstraintError({ code: "P2002" }), true);
  assert.equal(isUniqueConstraintError({ code: "P2025" }), false);
  assert.equal(isUniqueConstraintError(new Error("P2002")), false);
  assert.equal(isUniqueConstraintError(null), false);
});

test("accepts real calendar dates including leap day", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");
  assert.equal(
    parseAttendanceDate("2024-02-29", now)?.toISOString(),
    "2024-02-29T00:00:00.000Z",
  );
});

test("rejects malformed and impossible calendar dates", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");
  assert.equal(parseAttendanceDate("20-09-2026", now), null);
  assert.equal(parseAttendanceDate("2026-02-29", now), null);
  assert.equal(parseAttendanceDate("2026-09-31", now), null);
});

test("allows one-day timezone drift but rejects later future dates", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");
  assert.notEqual(parseAttendanceDate("2026-09-21", now), null);
  assert.equal(parseAttendanceDate("2026-09-22", now), null);
});
