import assert from "node:assert/strict";
import { test } from "node:test";
import { condense } from "../../_lib/helpers/condense";
import type { SignalEvent } from "../../_lib/helpers/parse-events";

test("condense: empty input returns empty array", () => {
  assert.deepEqual(condense([]), []);
});

test("condense: sorts events by delay", () => {
  const input: SignalEvent[] = [
    { delay: 3000, kind: "click", description: "c" },
    { delay: 1000, kind: "click", description: "a" },
    { delay: 2000, kind: "click", description: "b" },
  ];
  const result = condense(input);
  assert.deepEqual(
    result.map((r) => r.description),
    ["a", "b", "c"],
  );
});

test("condense: tSeconds = 1500ms -> 1.5", () => {
  const result = condense([{ delay: 1500, kind: "click", description: "x" }]);
  assert.equal(result[0].tSeconds, 1.5);
});

test("condense: tSeconds = 1550ms -> 1.6 (rounding)", () => {
  const result = condense([{ delay: 1550, kind: "click", description: "x" }]);
  assert.equal(result[0].tSeconds, 1.6);
});

test("condense: kind carried through", () => {
  const result = condense([{ delay: 1000, kind: "mutation", description: "m" }]);
  assert.equal(result[0].kind, "mutation");
});

test("condense: input events on same node collapse — keeps last", () => {
  const input: SignalEvent[] = [
    { delay: 1000, kind: "input", nodeId: 5, description: 'typed "a"' },
    { delay: 1100, kind: "input", nodeId: 5, description: 'typed "ab"' },
    { delay: 1200, kind: "input", nodeId: 5, description: 'typed "abc"' },
  ];
  const result = condense(input);
  assert.equal(result.length, 1);
  assert.equal(result[0].tSeconds, 1.2);
  assert.equal(result[0].description, 'typed "abc"');
});

test("condense: input on different nodes NOT collapsed", () => {
  const input: SignalEvent[] = [
    { delay: 1000, kind: "input", nodeId: 5, description: "typed A" },
    { delay: 1100, kind: "input", nodeId: 6, description: "typed B" },
  ];
  assert.equal(condense(input).length, 2);
});

test("condense: input collapse broken by click", () => {
  const input: SignalEvent[] = [
    { delay: 1000, kind: "input", nodeId: 5, description: "typed A" },
    { delay: 1100, kind: "click", description: "clicked X" },
    { delay: 1200, kind: "input", nodeId: 5, description: "typed B" },
  ];
  assert.equal(condense(input).length, 3);
});

test("condense: mutation collapse dedupes descriptions", () => {
  const input: SignalEvent[] = [
    { delay: 4800, kind: "mutation", description: "item added" },
    { delay: 4800, kind: "mutation", description: "item removed" },
    { delay: 4800, kind: "mutation", description: "item added" },
  ];
  const result = condense(input);
  assert.equal(result.length, 1);
  assert.equal(result[0].description, "item added; item removed");
});

test("condense: mutation collapse uses last delay", () => {
  const input: SignalEvent[] = [
    { delay: 4800, kind: "mutation", description: "a" },
    { delay: 4900, kind: "mutation", description: "b" },
    { delay: 5000, kind: "mutation", description: "c" },
  ];
  const result = condense(input);
  assert.equal(result[0].tSeconds, 5.0);
});

test("condense: mutation collapse truncates past 200 chars with count", () => {
  const long = Array.from({ length: 20 }, (_, i) => `mutation ${i} adding an element to the list`);
  const input: SignalEvent[] = long.map((d, i) => ({
    delay: 4000 + i,
    kind: "mutation",
    description: d,
  }));
  const result = condense(input);
  assert.equal(result.length, 1);
  assert.match(result[0].description, /\(20 mutations\)$/);
});

test("condense: mutation collapse broken by non-mutation", () => {
  const input: SignalEvent[] = [
    { delay: 1000, kind: "mutation", description: "m1" },
    { delay: 1100, kind: "mutation", description: "m2" },
    { delay: 1200, kind: "click", description: "clicked" },
    { delay: 1300, kind: "mutation", description: "m3" },
    { delay: 1400, kind: "mutation", description: "m4" },
  ];
  const result = condense(input);
  assert.equal(result.length, 3);
  assert.equal(result[0].description, "m1; m2");
  assert.equal(result[1].description, "clicked");
  assert.equal(result[2].description, "m3; m4");
});

test("condense: scroll events NOT collapsed (already batched upstream)", () => {
  const input: SignalEvent[] = [
    { delay: 1000, kind: "scroll", description: "scrolled A" },
    { delay: 1100, kind: "scroll", description: "scrolled B" },
  ];
  assert.equal(condense(input).length, 2);
});
