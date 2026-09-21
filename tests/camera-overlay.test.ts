import test from "node:test";
import assert from "node:assert/strict";
import { mirrorOverlayX } from "../src/lib/camera-overlay.ts";

test("mirrors a bounding box horizontally inside the canvas", () => {
  assert.equal(mirrorOverlayX(640, 100, 120), 420);
  assert.equal(mirrorOverlayX(640, 420, 120), 100);
});

test("keeps a centered bounding box centered", () => {
  assert.equal(mirrorOverlayX(640, 270, 100), 270);
});
