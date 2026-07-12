import type { Part } from "@google/genai";
import { callUiGeneratorAgent } from "../agents/ui-generator-agent";
import type { Frame, GeneratedVariant, Logger, TriagedAoi } from "../types";

const MAX_HTML_BYTES = 50 * 1024;

export function validateRenderability(html: string, variantIdx: number): void {
  const tag = `variant ${variantIdx + 1}`;
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error(`${tag} exceeds ${MAX_HTML_BYTES} byte size ceiling.`);
  }
  if (/<script[\s>]/i.test(html)) {
    throw new Error(`${tag} contains a <script> tag — violates renderability guardrail.`);
  }
  if (/<link\b[^>]*\bhref\s*=\s*["']https?:/i.test(html)) {
    throw new Error(`${tag} references an external stylesheet — violates renderability guardrail.`);
  }
  if (/<img\b[^>]*\bsrc\s*=\s*["']https?:/i.test(html)) {
    throw new Error(`${tag} references an external image URL — violates renderability guardrail.`);
  }
}

interface Args {
  aoi: TriagedAoi;
  frame: Frame;
  logger: Logger;
}

export async function generateUi({ aoi, frame, logger }: Args): Promise<GeneratedVariant[]> {
  const userParts: Part[] = [
    { inlineData: { mimeType: frame.mediaType, data: frame.base64 } },
    {
      text: [
        `Current UI shown above at t=${frame.tSeconds}s: ${frame.description}`,
        "",
        "ISSUE:",
        aoi.issue,
        "",
        "SOLUTION:",
        aoi.solution,
        "",
        "FEATURE SPECS:",
        aoi.featureSpecs,
        "",
        "Produce 2-3 distinct HTML variants implementing these specs while preserving every UI element the specs do not explicitly change.",
      ].join("\n"),
    },
  ];

  const variants = await callUiGeneratorAgent(userParts, logger);
  variants.forEach((v, i) => validateRenderability(v.html, i));
  return variants;
}
