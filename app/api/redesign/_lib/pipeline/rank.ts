import type { RankedAoi, TriagedAoi } from "../types";

const TIME_COST_WEIGHT = 0.6;
const RECURRENCE_WEIGHT = 0.4;

export function rank(aois: TriagedAoi[]): RankedAoi[] {
  const metrics = aois.map((a) => ({
    timeCost: a.evidence.reduce((acc, e) => acc + e.issueDuration, 0),
    recurrence: a.evidence.length,
  }));

  const maxTimeCost = metrics.reduce((max, m) => Math.max(max, m.timeCost), 0);
  const maxRecurrence = metrics.reduce((max, m) => Math.max(max, m.recurrence), 0);

  return aois.map((a, i) => {
    const { timeCost, recurrence } = metrics[i];
    const timeTerm = maxTimeCost > 0 ? (timeCost / maxTimeCost) * TIME_COST_WEIGHT : 0;
    const recurrenceTerm =
      maxRecurrence > 0 ? (recurrence / maxRecurrence) * RECURRENCE_WEIGHT : 0;
    return {
      ...a,
      timeCost,
      recurrence,
      score: timeTerm + recurrenceTerm,
    };
  });
}
