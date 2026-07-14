import { embedIssues } from "../agents/embedding-agent";
import type { Logger, TriagedAoi } from "../types";

export async function embed(aois: TriagedAoi[], logger: Logger): Promise<TriagedAoi[]> {
  if (aois.length === 0) return aois;

  const texts = aois.map((a) => `${a.issue}\n\n${a.summarizedEvidence}`);
  const embeddings = await embedIssues(texts, logger);
  logger.log(`  Embedded ${aois.length} AOI description(s) in one batch.`);

  return aois.map((a, i) => ({ ...a, issueEmbedding: embeddings[i] }));
}
