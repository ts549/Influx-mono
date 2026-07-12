const DEFAULT_IDLE_THRESHOLD_MS = 300_000;

const NODE_TYPE = { DOCUMENT: 0, DOCTYPE: 1, ELEMENT: 2, TEXT: 3, CDATA: 4, COMMENT: 5 } as const;
const RRWEB = { INCREMENTAL: 3, CUSTOM: 5 } as const;
const INCR_SOURCE = { MUTATION: 0, INTERACTION: 2, SCROLL: 3, INPUT: 5 } as const;
const INTERACTION_CLICK = 2;

interface RrwebNode {
  id?: number;
  type?: number;
  tagName?: string;
  attributes?: Record<string, string>;
  textContent?: string;
  childNodes?: RrwebNode[];
}

export interface RrwebSnapshot {
  type: number;
  delay?: number;
  data?: {
    node?: RrwebNode;
    source?: number;
    type?: number;
    id?: number;
    text?: string;
    y?: number;
    tag?: string;
    payload?: { threshold?: number };
    adds?: Array<{ parentId: number; node: RrwebNode }>;
    removes?: Array<{ id: number }>;
  };
}

export interface SignalEvent {
  delay: number;
  kind: "click" | "input" | "mutation" | "scroll";
  description: string;
  nodeId?: number;
}

function truncate(s: unknown, n: number): string {
  const str = String(s ?? "");
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

function firstTextChild(node: RrwebNode): string | null {
  for (const child of node.childNodes ?? []) {
    if (child.type === NODE_TYPE.TEXT && child.textContent?.trim()) {
      return child.textContent.trim();
    }
  }
  return null;
}

function elementLabel(node: RrwebNode): string {
  const tag = (node.tagName ?? "el").toLowerCase();
  const attrs = node.attributes ?? {};
  const testid = attrs["data-testid"];
  const cls = attrs.class ?? attrs.className;
  const placeholder = attrs.placeholder;
  const text = firstTextChild(node);

  let hint: string | null = null;
  if (testid) hint = `[data-testid="${truncate(testid, 30)}"]`;
  else if (cls) hint = `.${String(cls).split(/\s+/)[0]}`;
  else if (placeholder) hint = `[placeholder="${truncate(placeholder, 30)}"]`;
  else if (text) hint = `"${truncate(text, 30)}"`;

  return hint ? `${tag}${hint}` : tag;
}

export function buildDomLookup(root: RrwebNode | undefined): Map<number, string> {
  const map = new Map<number, string>();
  const walk = (node: RrwebNode | undefined) => {
    if (!node) return;
    if (node.type === NODE_TYPE.ELEMENT && typeof node.id === "number") {
      map.set(node.id, elementLabel(node));
    }
    for (const child of node.childNodes ?? []) walk(child);
  };
  walk(root);
  return map;
}

export function getIdleThreshold(rawSnapshots: RrwebSnapshot[]): number {
  for (const snap of rawSnapshots) {
    if (snap.type === RRWEB.CUSTOM && snap.data?.tag === "sessionIdle") {
      const t = snap.data.payload?.threshold;
      if (typeof t === "number" && t > 0) return t;
    }
  }
  return DEFAULT_IDLE_THRESHOLD_MS;
}

function describe(id: number, lookup: Map<number, string>): string {
  return lookup.get(id) ?? `node#${id}`;
}

function extractAnyText(node: RrwebNode | undefined): string {
  if (!node) return "";
  if (node.type === NODE_TYPE.TEXT) return (node.textContent ?? "").trim();
  for (const child of node.childNodes ?? []) {
    const t = extractAnyText(child);
    if (t) return t;
  }
  return "";
}

interface ScrollBatch {
  id: number;
  startDelay: number;
  lastDelay: number;
  lastY: number;
}

function processScrollBatches(
  rawSnapshots: RrwebSnapshot[],
  domLookup: Map<number, string>,
  idleThresholdMs: number,
): SignalEvent[] {
  const batches: ScrollBatch[] = [];
  let current: ScrollBatch | null = null;
  const flush = () => {
    if (current) {
      batches.push(current);
      current = null;
    }
  };

  for (const snap of rawSnapshots) {
    const isScroll =
      snap.type === RRWEB.INCREMENTAL && snap.data?.source === INCR_SOURCE.SCROLL;
    if (isScroll) {
      const id = snap.data?.id ?? -1;
      const delay = snap.delay ?? 0;
      const y = snap.data?.y ?? 0;
      if (!current || current.id !== id) {
        flush();
        current = { id, startDelay: delay, lastDelay: delay, lastY: y };
      } else {
        current.lastDelay = delay;
        current.lastY = y;
      }
    } else {
      flush();
    }
  }
  flush();

  return batches.map((b) => {
    const durationMs = Math.min(Math.max(0, b.lastDelay - b.startDelay), idleThresholdMs);
    return {
      delay: b.startDelay,
      kind: "scroll" as const,
      description: `scrolled ${describe(b.id, domLookup)} for ${(durationMs / 1000).toFixed(1)}s (to y=${b.lastY})`,
    };
  });
}

export function extractSignalEvents(
  rawSnapshots: RrwebSnapshot[],
  domLookup: Map<number, string>,
  idleThresholdMs: number,
): SignalEvent[] {
  const events: SignalEvent[] = [];

  for (const snap of rawSnapshots) {
    if (snap.type !== RRWEB.INCREMENTAL) continue;
    const source = snap.data?.source;
    const delay = snap.delay ?? 0;

    if (source === INCR_SOURCE.INTERACTION && snap.data?.type === INTERACTION_CLICK) {
      const id = snap.data.id ?? -1;
      events.push({
        delay,
        kind: "click",
        description: `clicked ${describe(id, domLookup)}`,
      });
    } else if (source === INCR_SOURCE.INPUT) {
      const id = snap.data?.id ?? -1;
      events.push({
        delay,
        kind: "input",
        nodeId: id,
        description: `typed "${truncate(snap.data?.text ?? "", 40)}" into ${describe(id, domLookup)}`,
      });
    } else if (source === INCR_SOURCE.MUTATION) {
      for (const add of snap.data?.adds ?? []) {
        const parentLabel = describe(add.parentId, domLookup);
        const nodeText = extractAnyText(add.node);
        events.push({
          delay,
          kind: "mutation",
          description: nodeText
            ? `item added: "${truncate(nodeText, 40)}" in ${parentLabel}`
            : `item added in ${parentLabel}`,
        });
      }
      for (const rem of snap.data?.removes ?? []) {
        events.push({
          delay,
          kind: "mutation",
          description: `item removed: ${describe(rem.id, domLookup)}`,
        });
      }
    }
  }

  events.push(...processScrollBatches(rawSnapshots, domLookup, idleThresholdMs));
  return events;
}

export function findFirstFullSnapshot(rawSnapshots: RrwebSnapshot[]): RrwebSnapshot | null {
  return rawSnapshots.find((s) => s.type === 2) ?? null;
}
