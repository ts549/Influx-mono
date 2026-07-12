import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDomLookup,
  extractSignalEvents,
  findFirstFullSnapshot,
  getIdleThreshold,
} from "../../_lib/helpers/parse-events";

const IDLE_MS = 300_000;

interface TestNode {
  type: number;
  id?: number;
  tagName?: string;
  attributes?: Record<string, string>;
  textContent?: string;
  childNodes?: TestNode[];
}

const el = (
  id: number,
  tagName: string,
  attributes: Record<string, string> = {},
  childNodes: TestNode[] = [],
): TestNode => ({ type: 2, id, tagName, attributes, childNodes });
const txt = (id: number, textContent: string): TestNode => ({ type: 3, id, textContent });

// ---------- buildDomLookup ----------

test("buildDomLookup: null root -> empty map", () => {
  assert.equal(buildDomLookup(undefined).size, 0);
});

test("buildDomLookup: priority — testid beats class/placeholder/text", () => {
  const node = el(1, "button", { "data-testid": "primary", class: "btn", placeholder: "hi" }, [
    txt(2, "Click me"),
  ]);
  assert.equal(buildDomLookup(node).get(1), 'button[data-testid="primary"]');
});

test("buildDomLookup: class used when no testid — first word only", () => {
  const node = el(1, "div", { class: "container active dark" });
  assert.equal(buildDomLookup(node).get(1), "div.container");
});

test("buildDomLookup: placeholder used when no testid/class", () => {
  const node = el(1, "input", { placeholder: "Enter name" });
  assert.equal(buildDomLookup(node).get(1), 'input[placeholder="Enter name"]');
});

test("buildDomLookup: text child used when no other attrs", () => {
  const node = el(1, "button", {}, [txt(2, "Add task")]);
  assert.equal(buildDomLookup(node).get(1), 'button"Add task"');
});

test("buildDomLookup: text nodes get NO map entry of their own", () => {
  const node = el(1, "button", {}, [txt(2, "Click")]);
  const map = buildDomLookup(node);
  assert.ok(!map.has(2));
});

test("buildDomLookup: long attribute value truncated at 30 chars with ellipsis", () => {
  const node = el(1, "input", { placeholder: "a".repeat(60) });
  assert.match(buildDomLookup(node).get(1) ?? "", /…/);
});

test("buildDomLookup: nested elements all get entries", () => {
  const inner = el(2, "span", { class: "inner" });
  const outer = el(1, "div", { class: "outer" }, [inner]);
  const map = buildDomLookup(outer);
  assert.equal(map.size, 2);
  assert.equal(map.get(1), "div.outer");
  assert.equal(map.get(2), "span.inner");
});

// ---------- getIdleThreshold ----------

test("getIdleThreshold: no sessionIdle custom event -> 300000 default", () => {
  assert.equal(getIdleThreshold([]), 300_000);
});

test("getIdleThreshold: returns threshold from sessionIdle payload", () => {
  const snapshots = [{ type: 5, data: { tag: "sessionIdle", payload: { threshold: 60_000 } } }];
  assert.equal(getIdleThreshold(snapshots), 60_000);
});

test("getIdleThreshold: threshold=0 -> falls back to default", () => {
  const snapshots = [{ type: 5, data: { tag: "sessionIdle", payload: { threshold: 0 } } }];
  assert.equal(getIdleThreshold(snapshots), 300_000);
});

test("getIdleThreshold: negative threshold -> falls back to default", () => {
  const snapshots = [{ type: 5, data: { tag: "sessionIdle", payload: { threshold: -1 } } }];
  assert.equal(getIdleThreshold(snapshots), 300_000);
});

// ---------- extractSignalEvents ----------

const LOOKUP = new Map<number, string>([
  [1, "button.foo"],
  [2, "input.bar"],
  [3, "ul.list"],
]);

test("extractSignalEvents: mouse moves (source 1) filtered out", () => {
  const snapshots = [{ type: 3, delay: 100, data: { source: 1, positions: [] } }];
  assert.equal(extractSignalEvents(snapshots, LOOKUP, IDLE_MS).length, 0);
});

test("extractSignalEvents: viewport resize (source 4) filtered out", () => {
  const snapshots = [{ type: 3, delay: 100, data: { source: 4 } }];
  assert.equal(extractSignalEvents(snapshots, LOOKUP, IDLE_MS).length, 0);
});

test("extractSignalEvents: selection (source 14) filtered out", () => {
  const snapshots = [{ type: 3, delay: 100, data: { source: 14 } }];
  assert.equal(extractSignalEvents(snapshots, LOOKUP, IDLE_MS).length, 0);
});

test("extractSignalEvents: click produces one signal, carries delay", () => {
  const snapshots = [{ type: 3, delay: 1000, data: { source: 2, type: 2, id: 1 } }];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, "click");
  assert.equal(result[0].delay, 1000);
  assert.match(result[0].description, /button\.foo/);
});

test("extractSignalEvents: interaction sub-type != click is filtered", () => {
  const snapshots = [
    { type: 3, delay: 1000, data: { source: 2, type: 0, id: 1 } },
    { type: 3, delay: 1100, data: { source: 2, type: 1, id: 1 } },
  ];
  assert.equal(extractSignalEvents(snapshots, LOOKUP, IDLE_MS).length, 0);
});

test("extractSignalEvents: input carries nodeId for downstream collapse", () => {
  const snapshots = [{ type: 3, delay: 1000, data: { source: 5, id: 2, text: "hello" } }];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, "input");
  assert.equal(result[0].nodeId, 2);
});

test("extractSignalEvents: input text truncated at 40 chars", () => {
  const snapshots = [{ type: 3, delay: 1000, data: { source: 5, id: 2, text: "a".repeat(60) } }];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.match(result[0].description, /…/);
});

test("extractSignalEvents: mutation adds and removes each produce a signal", () => {
  const snapshots = [
    {
      type: 3,
      delay: 1000,
      data: {
        source: 0,
        adds: [{ parentId: 3, node: { type: 3, textContent: "buy milk" } }],
        removes: [{ id: 1 }],
      },
    },
  ];
  assert.equal(extractSignalEvents(snapshots, LOOKUP, IDLE_MS).length, 2);
});

test("extractSignalEvents: scroll batching — consecutive same-node -> one batch", () => {
  const snapshots = [
    { type: 3, delay: 1000, data: { source: 3, id: 1, x: 0, y: 0 } },
    { type: 3, delay: 1100, data: { source: 3, id: 1, x: 0, y: 100 } },
    { type: 3, delay: 1200, data: { source: 3, id: 1, x: 0, y: 200 } },
  ];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.equal(result.filter((e) => e.kind === "scroll").length, 1);
});

test("extractSignalEvents: scroll batching — click between breaks batch", () => {
  const snapshots = [
    { type: 3, delay: 1000, data: { source: 3, id: 1, x: 0, y: 0 } },
    { type: 3, delay: 1100, data: { source: 3, id: 1, x: 0, y: 100 } },
    { type: 3, delay: 1200, data: { source: 2, type: 2, id: 1 } },
    { type: 3, delay: 1300, data: { source: 3, id: 1, x: 0, y: 200 } },
  ];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.equal(result.filter((e) => e.kind === "scroll").length, 2);
});

test("extractSignalEvents: scroll batching — different nodes -> separate batches", () => {
  const snapshots = [
    { type: 3, delay: 1000, data: { source: 3, id: 1, x: 0, y: 100 } },
    { type: 3, delay: 1100, data: { source: 3, id: 2, x: 0, y: 200 } },
  ];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.equal(result.filter((e) => e.kind === "scroll").length, 2);
});

test("extractSignalEvents: scroll dwell duration capped by idle threshold", () => {
  const idleMs = 5000;
  const snapshots = [
    { type: 3, delay: 1000, data: { source: 3, id: 1, x: 0, y: 0 } },
    { type: 3, delay: 100_000, data: { source: 3, id: 1, x: 0, y: 100 } },
  ];
  const scroll = extractSignalEvents(snapshots, LOOKUP, idleMs).find((e) => e.kind === "scroll");
  assert.match(scroll?.description ?? "", /5\.0s/);
});

test("extractSignalEvents: unknown node id falls back to node#N label", () => {
  const snapshots = [{ type: 3, delay: 1000, data: { source: 2, type: 2, id: 999 } }];
  const result = extractSignalEvents(snapshots, LOOKUP, IDLE_MS);
  assert.match(result[0].description, /node#999/);
});

// ---------- findFirstFullSnapshot ----------

test("findFirstFullSnapshot: returns the first type-2 entry", () => {
  const snapshots = [
    { type: 4, data: {} },
    { type: 2, delay: 1, data: { node: { type: 2 } } },
    { type: 2, delay: 2, data: { node: { type: 2 } } },
  ];
  assert.equal(findFirstFullSnapshot(snapshots)?.delay, 1);
});

test("findFirstFullSnapshot: no type-2 entries -> null", () => {
  assert.equal(findFirstFullSnapshot([{ type: 3, data: {} }]), null);
});
