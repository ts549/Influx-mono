import type { Logger, TriagedAoi } from "../types";

const DEFAULT_THRESHOLD = 0.9;

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`cosine: vector length mismatch (${a.length} vs ${b.length}).`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function totalIssueDuration(a: TriagedAoi): number {
  return a.evidence.reduce((sum, e) => sum + e.issueDuration, 0);
}

/**
 * Greedy single-linkage cluster of AOIs by embedding similarity. The winner of
 * each cluster absorbs the other members' evidence arrays. `breadthRecurrence`
 * is set to the number of distinct sessionReplayFilename values in the merged
 * evidence. `issueEmbedding` is stripped from the returned AOIs.
 */
export function dedupe(
  aois: TriagedAoi[],
  threshold: number = DEFAULT_THRESHOLD,
): TriagedAoi[] {
  const consumed = new Array<boolean>(aois.length).fill(false);
  const result: TriagedAoi[] = [];

  for (let i = 0; i < aois.length; i++) {
    if (consumed[i]) continue;
    const cluster: number[] = [i];
    consumed[i] = true;
    const ei = aois[i].issueEmbedding;
    if (!ei) throw new Error(`Dedupe: AOI at index ${i} is missing issueEmbedding.`);

    for (let j = i + 1; j < aois.length; j++) {
      if (consumed[j]) continue;
      const ej = aois[j].issueEmbedding;
      if (!ej) throw new Error(`Dedupe: AOI at index ${j} is missing issueEmbedding.`);
      if (cosine(ei, ej) >= threshold) {
        cluster.push(j);
        consumed[j] = true;
      }
    }

    const members = cluster.map((idx) => aois[idx]);
    const winner = members.reduce((best, m) => {
      if (m.evidence.length > best.evidence.length) return m;
      if (m.evidence.length < best.evidence.length) return best;
      return totalIssueDuration(m) > totalIssueDuration(best) ? m : best;
    });

    const mergedEvidence = members.flatMap((m) => m.evidence);
    const breadthRecurrence = new Set(mergedEvidence.map((e) => e.sessionReplayFilename))
      .size;

    result.push({
      issue: winner.issue,
      summarizedEvidence: winner.summarizedEvidence,
      solutions: winner.solutions,
      evidence: mergedEvidence,
      breadthRecurrence,
    });
  }

  return result;
}

export function dedupeWithLog(aois: TriagedAoi[], logger: Logger): TriagedAoi[] {
  const before = aois.length;
  const out = dedupe(aois);
  logger.log(`  Deduped ${before} AOI(s) down to ${out.length}.`);
  return out;
}
