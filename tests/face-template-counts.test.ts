import assert from "node:assert/strict";
import test from "node:test";
import { countFaceTemplatesByStudent } from "../src/lib/face-template-counts.ts";

test("counts every stored face template for each student", () => {
  assert.deepEqual(
    countFaceTemplatesByStudent([
      { studentId: "student-1" },
      { studentId: "student-1" },
      { studentId: "student-1" },
      { studentId: "student-2" },
    ]),
    {
      "student-1": 3,
      "student-2": 1,
    },
  );
});

test("returns no enrollment counts when no templates exist", () => {
  assert.deepEqual(countFaceTemplatesByStudent([]), {});
});
