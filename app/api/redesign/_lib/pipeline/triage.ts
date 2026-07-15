import type { Part } from "@google/genai";
import { callTriageAgent } from "../agents/triage-agent";
import type { CondensedEvent, Frame, Logger, TriagedAoi } from "../types";

interface Args {
  condensedEvents: CondensedEvent[];
  frames: Frame[];
  logger: Logger;
  workspaceContext?: string | null;
}

export function validateAoiFrameIndexes(aois: TriagedAoi[], framesLength: number): void {
  for (const a of aois) {
    for (const e of a.evidence) {
      if (e.frameIndex >= framesLength) {
        throw new Error(
          `Triage: frameIndex ${e.frameIndex} out of range (only ${framesLength} frames).`,
        );
      }
    }
  }
}

export async function triage({ condensedEvents, frames, logger, workspaceContext }: Args): Promise<TriagedAoi[]> {
  const framePairs: Part[] = frames.flatMap((f, i) => [
    { inlineData: { mimeType: f.mediaType, data: f.base64 } },
    { text: `^ frame #${i} at t=${f.tSeconds}s: ${f.description}` },
  ]);

  const userParts: Part[] = [
    ...framePairs,
    {
      text: `CONDENSED EVENT LOG (JSON):\n${JSON.stringify(condensedEvents, null, 2)}\n\nIdentify EVERY AOI you can ground in the evidence. Do not filter for importance — a downstream ranking step will select the most impactful ones. Return zero AOIs only if the session shows no genuine issues.`,
    },
  ];

  const aois = await callTriageAgent(userParts, logger, workspaceContext);
  validateAoiFrameIndexes(aois, frames.length);
  return aois;
}
