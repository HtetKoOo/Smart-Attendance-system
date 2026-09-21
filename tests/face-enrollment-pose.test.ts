import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeEnrollmentPose,
  getExpectedEnrollmentPose,
  isEnrollmentPoseAccepted,
} from "../src/lib/face-enrollment-pose.ts";

function landmarks(noseTipX: number, rightEyeY = 0) {
  return {
    leftEye: [{ x: -10, y: 0 }],
    rightEye: [{ x: 10, y: rightEyeY }],
    nose: [
      { x: 0, y: 2 },
      { x: 0, y: 4 },
      { x: 0, y: 6 },
      { x: noseTipX, y: 8 },
    ],
  };
}

test("maps enrollment steps to center, left, and right poses", () => {
  assert.equal(getExpectedEnrollmentPose(1), "center");
  assert.equal(getExpectedEnrollmentPose(4), "center");
  assert.equal(getExpectedEnrollmentPose(5), "left");
  assert.equal(getExpectedEnrollmentPose(7), "left");
  assert.equal(getExpectedEnrollmentPose(8), "right");
  assert.equal(getExpectedEnrollmentPose(10), "right");
});

test("accepts only the requested head direction", () => {
  const center = analyzeEnrollmentPose(landmarks(0));
  const left = analyzeEnrollmentPose(landmarks(-4));
  const right = analyzeEnrollmentPose(landmarks(4));
  assert.ok(center && left && right);
  assert.equal(isEnrollmentPoseAccepted(center, "center"), true);
  assert.equal(isEnrollmentPoseAccepted(left, "left"), true);
  assert.equal(isEnrollmentPoseAccepted(right, "right"), true);
  assert.equal(isEnrollmentPoseAccepted(left, "right"), false);
  assert.equal(isEnrollmentPoseAccepted(right, "left"), false);
});

test("rejects an excessive sideways head tilt", () => {
  const tilted = analyzeEnrollmentPose(landmarks(0, 8));
  assert.ok(tilted);
  assert.equal(isEnrollmentPoseAccepted(tilted, "center"), false);
});

test("rejects missing or unusable landmark geometry", () => {
  assert.equal(
    analyzeEnrollmentPose({ leftEye: [], rightEye: [], nose: [] }),
    null,
  );
});
