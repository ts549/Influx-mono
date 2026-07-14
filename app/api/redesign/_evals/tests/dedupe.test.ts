import assert from "node:assert/strict";
import { test } from "node:test";
import { cosine, dedupe } from "../../_lib/pipeline/dedupe";
import type { AoiEvidence, TriagedAoi } from "../../_lib/types";

const evidence = (
  count: number,
  filename: string,
  durationPerEntry: number = 1,
): AoiEvidence[] =>
  Array.from({ length: count }, (_, i) => ({
    frameIndex: i,
    tSeconds: i,
    issueDuration: durationPerEntry,
    sessionReplayFilename: filename,
  }));

const aoi = (
  id: string,
  emb: number[],
  ev: AoiEvidence[],
): TriagedAoi => ({
  issue: `issue ${id}`,
  summarizedEvidence: `evidence ${id}`,
  evidence: ev,
  solutions: [{ solution: "s", featureSpecs: "f" }],
  breadthRecurrence: 1,
  issueEmbedding: emb,
});

test("cosine: identical vectors -> 1", () => {
  assert.ok(Math.abs(cosine([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
});

test("cosine: orthogonal vectors -> 0", () => {
  assert.equal(cosine([1, 0], [0, 1]), 0);
});

test("cosine: zero vector -> 0 (no NaN)", () => {
  assert.equal(cosine([0, 0], [1, 1]), 0);
});

test("cosine: length mismatch throws", () => {
  assert.throws(() => cosine([1, 2], [1, 2, 3]), /length mismatch/);
});

test("dedupe: dissimilar AOIs pass through unchanged in count", () => {
  const out = dedupe([
    aoi("a", [1, 0, 0], evidence(1, "x.mp4")),
    aoi("b", [0, 1, 0], evidence(1, "y.mp4")),
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].breadthRecurrence, 1);
  assert.equal(out[1].breadthRecurrence, 1);
});

test("dedupe: similar AOIs cluster; winner has most evidence entries", () => {
  const out = dedupe([
    aoi("a", [1, 0], evidence(1, "x.mp4")),
    aoi("b", [1, 0.01], evidence(3, "y.mp4")),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].issue, "issue b");
  assert.equal(out[0].evidence.length, 4);
});

test("dedupe: tiebreak by total issueDuration when evidence counts equal", () => {
  const out = dedupe([
    aoi("short", [1, 0], evidence(2, "x.mp4", 1)),
    aoi("long", [1, 0.01], evidence(2, "y.mp4", 5)),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].issue, "issue long");
});

test("dedupe: merged evidence includes all clustered AOIs' entries", () => {
  const out = dedupe([
    aoi("a", [1, 0], evidence(2, "x.mp4")),
    aoi("b", [1, 0.01], evidence(3, "y.mp4")),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].evidence.length, 5);
  const filenames = out[0].evidence.map((e) => e.sessionReplayFilename).sort();
  assert.deepEqual(filenames, ["x.mp4", "x.mp4", "y.mp4", "y.mp4", "y.mp4"]);
});

test("dedupe: breadthRecurrence counts distinct sessionReplayFilename values", () => {
  const out = dedupe([
    aoi("a", [1, 0], evidence(1, "x.mp4")),
    aoi("b", [1, 0.01], evidence(1, "y.mp4")),
    aoi("c", [1, 0.02], evidence(1, "z.mp4")),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].breadthRecurrence, 3);
});

test("dedupe: same-session duplicates only count as breadth 1", () => {
  const out = dedupe([
    aoi("a", [1, 0], evidence(1, "x.mp4")),
    aoi("b", [1, 0.01], evidence(1, "x.mp4")),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].breadthRecurrence, 1);
});

test("dedupe: strips issueEmbedding from returned AOIs", () => {
  const out = dedupe([aoi("a", [1, 0], evidence(1, "x.mp4"))]);
  assert.equal(out[0].issueEmbedding, undefined);
});

test("dedupe: threshold boundary — exactly 0.9 merges", () => {
  const out = dedupe(
    [aoi("a", [1, 0], evidence(1, "x.mp4")), aoi("b", [0.9, Math.sqrt(1 - 0.81)], evidence(1, "y.mp4"))],
    0.9,
  );
  assert.equal(out.length, 1);
});

test("dedupe: threshold boundary — below 0.9 does not merge", () => {
  const out = dedupe(
    [aoi("a", [1, 0], evidence(1, "x.mp4")), aoi("b", [0.5, Math.sqrt(0.75)], evidence(1, "y.mp4"))],
    0.9,
  );
  assert.equal(out.length, 2);
});

test("dedupe: empty input -> empty output", () => {
  assert.deepEqual(dedupe([]), []);
});
