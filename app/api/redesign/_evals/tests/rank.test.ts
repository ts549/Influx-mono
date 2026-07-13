import assert from "node:assert/strict";
import { test } from "node:test";
import { rank } from "../../_lib/pipeline/rank";
import type { TriagedAoi } from "../../_lib/types";

const aoi = (durations: number[]): TriagedAoi => ({
  issue: "x",
  summarizedEvidence: "s",
  evidence: durations.map((issueDuration, i) => ({
    frameIndex: i,
    tSeconds: i,
    issueDuration,
  })),
  solutions: [{ solution: "y", featureSpecs: "z" }],
});

test("rank: empty input -> empty output", () => {
  assert.deepEqual(rank([]), []);
});

test("rank: attaches timeCost, recurrence, score to each AOI", () => {
  const [r] = rank([aoi([2, 3])]);
  assert.equal(r.timeCost, 5);
  assert.equal(r.recurrence, 2);
  assert.equal(r.score, 1);
});

test("rank: scores relative to per-batch max", () => {
  const [big, small] = rank([aoi([10, 10]), aoi([2])]);
  assert.equal(big.timeCost, 20);
  assert.equal(big.recurrence, 2);
  assert.equal(big.score, 1);
  assert.equal(small.timeCost, 2);
  assert.equal(small.recurrence, 1);
  const expected = (2 / 20) * 0.6 + (1 / 2) * 0.4;
  assert.ok(Math.abs(small.score - expected) < 1e-9);
});

test("rank: all-zero timeCosts contribute 0 to the time term (no NaN)", () => {
  const [a, b] = rank([aoi([0, 0]), aoi([0])]);
  assert.equal(a.timeCost, 0);
  assert.equal(b.timeCost, 0);
  assert.equal(a.score, 0.4);
  assert.equal(b.score, (1 / 2) * 0.4);
});

test("rank: preserves TriagedAoi fields on RankedAoi", () => {
  const [r] = rank([aoi([1])]);
  assert.equal(r.issue, "x");
  assert.equal(r.summarizedEvidence, "s");
  assert.equal(r.solutions.length, 1);
  assert.equal(r.evidence.length, 1);
});
