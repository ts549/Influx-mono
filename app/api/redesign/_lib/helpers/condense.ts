import type { CondensedEvent } from "../types";
import type { SignalEvent } from "./parse-events";

const MAX_MUTATION_DESC_LEN = 200;

function collapseMutations(descriptions: string[]): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const d of descriptions) {
    if (!seen.has(d)) {
      seen.add(d);
      unique.push(d);
    }
  }
  const joined = unique.join("; ");
  return joined.length > MAX_MUTATION_DESC_LEN
    ? `${joined.slice(0, MAX_MUTATION_DESC_LEN)}… (${unique.length} mutations)`
    : joined;
}

interface MutationBuf {
  lastDelay: number;
  descriptions: string[];
}

export function condense(signalEvents: SignalEvent[]): CondensedEvent[] {
  const sorted = [...signalEvents].sort((a, b) => a.delay - b.delay);

  const collapsed: SignalEvent[] = [];
  let mutationBuf: MutationBuf | null = null;

  const flushMutations = () => {
    if (!mutationBuf) return;
    collapsed.push({
      delay: mutationBuf.lastDelay,
      kind: "mutation",
      description: collapseMutations(mutationBuf.descriptions),
    });
    mutationBuf = null;
  };

  for (const e of sorted) {
    if (e.kind === "mutation") {
      if (!mutationBuf) {
        mutationBuf = { lastDelay: e.delay, descriptions: [e.description] };
      } else {
        mutationBuf.lastDelay = e.delay;
        mutationBuf.descriptions.push(e.description);
      }
      continue;
    }

    flushMutations();

    const last = collapsed[collapsed.length - 1];
    const isSameInputSession =
      e.kind === "input" && last?.kind === "input" && last.nodeId === e.nodeId;
    if (isSameInputSession) {
      collapsed[collapsed.length - 1] = e;
    } else {
      collapsed.push(e);
    }
  }
  flushMutations();

  return collapsed.map((e) => ({
    tSeconds: Number((e.delay / 1000).toFixed(1)),
    kind: e.kind,
    description: e.description,
  }));
}
