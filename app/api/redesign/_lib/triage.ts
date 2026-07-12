import type { Part } from "@google/genai";
import { callTriageAgent } from "./agents/triage-agent";
import type { CondensedEvent, Frame, Logger, TriagedAoi } from "./types";

interface Args {
  condensedEvents: CondensedEvent[];
  frames: Frame[];
  logger: Logger;
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

export async function triage({ condensedEvents, frames, logger }: Args): Promise<TriagedAoi[]> {
  const framePairs: Part[] = frames.flatMap((f, i) => [
    { inlineData: { mimeType: f.mediaType, data: f.base64 } },
    { text: `^ frame #${i} at t=${f.tSeconds}s: ${f.description}` },
  ]);

  const userParts: Part[] = [
    ...framePairs,
    {
      text: `CONDENSED EVENT LOG (JSON):\n${JSON.stringify(condensedEvents, null, 2)}\n\nIdentify the 2-3 most impactful AOIs per the instructions.`,
    },
  ];

  const aois = await callTriageAgent(userParts, logger);
  validateAoiFrameIndexes(aois, frames.length);
  return aois;
}
