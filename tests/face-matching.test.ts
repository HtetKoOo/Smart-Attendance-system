import assert from "node:assert/strict";
import test from "node:test";
import {
  AMBIGUITY_MARGIN,
  DEFAULT_RECOGNITION_THRESHOLD,
  evaluateFaceMatch,
  type FaceMatchTemplate,
} from "../src/lib/face-matching.ts";

function template(
  studentDbId: string,
  studentId: string,
  studentName: string,
  embedding: number[],
): FaceMatchTemplate {
  return { studentDbId, studentId, studentName, embedding };
}

test("chooses the closest template for a student without treating that student's other templates as ambiguous", () => {
  const result = evaluateFaceMatch(
    [0, 0],
    [
      template("student-a", "A001", "Aye Aye", [0.12, 0]),
      template("student-a", "A001", "Aye Aye", [0.05, 0]),
      template("student-b", "B001", "Bo Bo", [0.3, 0]),
    ],
  );

  assert.equal(result.best?.studentDbId, "student-a");
  assert.equal(result.best?.distance, 0.05);
  assert.equal(result.runnerUp?.studentDbId, "student-b");
  assert.equal(result.isWithinThreshold, true);
  assert.equal(result.isAmbiguous, false);
});

test("rejects a nearest face outside the configured recognition threshold", () => {
  const result = evaluateFaceMatch(
    [0, 0],
    [template("student-a", "A001", "Aye Aye", [0.49, 0])],
  );

  assert.equal(result.best?.studentDbId, "student-a");
  assert.equal(result.isWithinThreshold, false);
  assert.equal(result.isAmbiguous, false);
  assert.equal(DEFAULT_RECOGNITION_THRESHOLD, 0.48);
});

test("marks close matches from different students as ambiguous", () => {
  const result = evaluateFaceMatch(
    [0, 0],
    [
      template("student-a", "A001", "Aye Aye", [0.2, 0]),
      template("student-b", "B001", "Bo Bo", [0.2 + AMBIGUITY_MARGIN / 2, 0]),
    ],
  );

  assert.equal(result.best?.studentDbId, "student-a");
  assert.equal(result.runnerUp?.studentDbId, "student-b");
  assert.equal(result.isWithinThreshold, true);
  assert.equal(result.isAmbiguous, true);
});

test("returns no candidate when no enrollment template exists", () => {
  const result = evaluateFaceMatch([0, 0], []);

  assert.equal(result.best, null);
  assert.equal(result.runnerUp, null);
  assert.equal(result.isWithinThreshold, false);
  assert.equal(result.isAmbiguous, false);
});
