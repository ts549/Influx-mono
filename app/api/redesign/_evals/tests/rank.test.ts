import assert from "node:assert/strict";
import { test } from "node:test";
import { rank } from "../../_lib/pipeline/rank";
import type { TriagedAoi } from "../../_lib/types";

interface AoiSpec {
  durations?: number[];
  breadth?: number;
  filename?: string;
}

const aoi = ({ durations = [1], breadth = 1, filename = "x.mp4" }: AoiSpec = {}): TriagedAoi => ({
  issue: "x",
  summarizedEvidence: "s",
  evidence: durations.map((issueDuration, i) => ({
    frameIndex: i,
    tSeconds: i,
    issueDuration,
    sessionReplayFilename: filename,
  })),
  solutions: [{ solution: "y", featureSpecs: "z" }],
  breadthRecurrence: breadth,
});

test("rank: empty input -> empty output", () => {
  assert.deepEqual(rank([]), []);
});

test("rank: single AOI wins all three axes -> score = 1", () => {
  const [r] = rank([aoi({ durations: [2, 3], breadth: 1 })]);
  assert.equal(r.timeCost, 5);
  assert.equal(r.depthRecurrence, 2);
  assert.equal(r.breadthRecurrence, 1);
  assert.equal(r.score, 1);
});

test("rank: 3-term formula weights sum correctly", () => {
  const [big, small] = rank([
    aoi({ durations: [10, 10], breadth: 4 }),
    aoi({ durations: [2], breadth: 1 }),
  ]);
  assert.equal(big.timeCost, 20);
  assert.equal(big.depthRecurrence, 2);
  assert.equal(big.breadthRecurrence, 4);
  assert.equal(big.score, 1);
  const expected = (2 / 20) * 0.4 + (1 / 4) * 0.35 + (1 / 2) * 0.25;
  assert.ok(Math.abs(small.score - expected) < 1e-9);
});

test("rank: all-zero timeCosts contribute 0 to the time term (no NaN)", () => {
  const [a, b] = rank([
    aoi({ durations: [0, 0], breadth: 2 }),
    aoi({ durations: [0], breadth: 1 }),
  ]);
  assert.equal(a.timeCost, 0);
  assert.equal(b.timeCost, 0);
  const expectedA = (2 / 2) * 0.35 + (2 / 2) * 0.25;
  const expectedB = (1 / 2) * 0.35 + (1 / 2) * 0.25;
  assert.ok(Math.abs(a.score - expectedA) < 1e-9);
  assert.ok(Math.abs(b.score - expectedB) < 1e-9);
});

test("rank: preserves TriagedAoi fields on RankedAoi (renamed field is depthRecurrence)", () => {
  const [r] = rank([aoi({ durations: [1], breadth: 1 })]);
  assert.equal(r.issue, "x");
  assert.equal(r.summarizedEvidence, "s");
  assert.equal(r.solutions.length, 1);
  assert.equal(r.evidence.length, 1);
  assert.equal(r.breadthRecurrence, 1);
  assert.equal(r.depthRecurrence, 1);
});
