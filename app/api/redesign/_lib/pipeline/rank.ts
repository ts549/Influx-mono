import type { RankedAoi, TriagedAoi } from "../types";

const TIME_COST_WEIGHT = 0.4;
const BREADTH_WEIGHT = 0.35;
const DEPTH_WEIGHT = 0.25;

export function rank(aois: TriagedAoi[]): RankedAoi[] {
  const metrics = aois.map((a) => ({
    timeCost: a.evidence.reduce((acc, e) => acc + e.issueDuration, 0),
    depthRecurrence: a.evidence.length,
    breadthRecurrence: a.breadthRecurrence,
  }));

  const maxTimeCost = metrics.reduce((max, m) => Math.max(max, m.timeCost), 0);
  const maxBreadth = metrics.reduce((max, m) => Math.max(max, m.breadthRecurrence), 0);
  const maxDepth = metrics.reduce((max, m) => Math.max(max, m.depthRecurrence), 0);

  return aois.map((a, i) => {
    const { timeCost, depthRecurrence, breadthRecurrence } = metrics[i];
    const timeTerm = maxTimeCost > 0 ? (timeCost / maxTimeCost) * TIME_COST_WEIGHT : 0;
    const breadthTerm =
      maxBreadth > 0 ? (breadthRecurrence / maxBreadth) * BREADTH_WEIGHT : 0;
    const depthTerm =
      maxDepth > 0 ? (depthRecurrence / maxDepth) * DEPTH_WEIGHT : 0;
    return {
      ...a,
      timeCost,
      depthRecurrence,
      score: timeTerm + breadthTerm + depthTerm,
    };
  });
}
