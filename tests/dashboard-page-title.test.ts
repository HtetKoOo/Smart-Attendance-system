import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardHeaderLabel } from "../src/lib/dashboard-page-title.ts";

test("shows the matching admin page title", () => {
  assert.deepEqual(getDashboardHeaderLabel("/dashboard/admin/students"), {
    section: "Academic Management",
    title: "Students",
  });
  assert.deepEqual(getDashboardHeaderLabel("/dashboard/admin/lecturers"), {
    section: "Academic Management",
    title: "Lecturers",
  });
  assert.deepEqual(
    getDashboardHeaderLabel("/dashboard/admin/face-recognition-test"),
    { section: "Advanced Tools", title: "Face Recognition Test" },
  );
});

test("shows role-specific page titles", () => {
  assert.deepEqual(getDashboardHeaderLabel("/dashboard/lecturer/courses"), {
    section: "Lecturer",
    title: "My Courses",
  });
  assert.deepEqual(getDashboardHeaderLabel("/dashboard/student/attendance"), {
    section: "Student",
    title: "My Attendance",
  });
});

test("keeps dashboard titles and safely handles unknown routes", () => {
  assert.deepEqual(getDashboardHeaderLabel("/dashboard/admin"), { title: "Dashboard" });
  assert.deepEqual(getDashboardHeaderLabel("/dashboard/not-found"), {
    title: "Dashboard",
  });
});
