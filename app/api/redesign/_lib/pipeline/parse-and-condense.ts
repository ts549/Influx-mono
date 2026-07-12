import { condense } from "../helpers/condense";
import {
  buildDomLookup,
  extractSignalEvents,
  findFirstFullSnapshot,
  getIdleThreshold,
  type RrwebSnapshot,
} from "../helpers/parse-events";
import type { CondensedEvent } from "../types";

export function parseAndCondense(rawSnapshots: RrwebSnapshot[]): CondensedEvent[] {
  const fullSnapshot = findFirstFullSnapshot(rawSnapshots);
  const domLookup = buildDomLookup(fullSnapshot?.data?.node);
  const idleThreshold = getIdleThreshold(rawSnapshots);
  const signalEvents = extractSignalEvents(rawSnapshots, domLookup, idleThreshold);
  return condense(signalEvents);
}
