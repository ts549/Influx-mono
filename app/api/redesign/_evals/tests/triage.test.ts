import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAoiFrameIndexes } from "../../_lib/triage";
import type { TriagedAoi } from "../../_lib/types";

const aoi = (frameIndex: number): TriagedAoi => ({
  frameIndex,
  issue: "x",
  solution: "y",
  featureSpecs: "z",
});

test("validateAoiFrameIndexes: index 0 with 1 frame -> OK", () => {
  assert.doesNotThrow(() => validateAoiFrameIndexes([aoi(0)], 1));
});

test("validateAoiFrameIndexes: multiple in-bounds indexes -> OK", () => {
  assert.doesNotThrow(() => validateAoiFrameIndexes([aoi(0), aoi(2)], 3));
});

test("validateAoiFrameIndexes: index out of range -> throws with clear message", () => {
  assert.throws(() => validateAoiFrameIndexes([aoi(5)], 3), /frameIndex 5 out of range/);
});

test("validateAoiFrameIndexes: index equal to length -> throws (0-indexed)", () => {
  assert.throws(() => validateAoiFrameIndexes([aoi(3)], 3), /frameIndex 3 out of range/);
});

test("validateAoiFrameIndexes: any AOI with 0 frames -> throws", () => {
  assert.throws(() => validateAoiFrameIndexes([aoi(0)], 0), /out of range/);
});

test("validateAoiFrameIndexes: empty AOIs -> no throw", () => {
  assert.doesNotThrow(() => validateAoiFrameIndexes([], 3));
});
