import type { Part } from "@google/genai";
import { callUiGeneratorAgent } from "../agents/ui-generator-agent";
import type { AoiSolution, Frame, GeneratedMockup, Logger } from "../types";

const MAX_HTML_BYTES = 50 * 1024;

export function validateRenderability(html: string): void {
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error(`variant exceeds ${MAX_HTML_BYTES} byte size ceiling.`);
  }
  if (/<script[\s>]/i.test(html)) {
    throw new Error(`variant contains a <script> tag — violates renderability guardrail.`);
  }
  if (/<link\b[^>]*\bhref\s*=\s*["']https?:/i.test(html)) {
    throw new Error(`variant references an external stylesheet — violates renderability guardrail.`);
  }
  if (/<img\b[^>]*\bsrc\s*=\s*["']https?:/i.test(html)) {
    throw new Error(`variant references an external image URL — violates renderability guardrail.`);
  }
}

interface Args {
  issue: string;
  solution: AoiSolution;
  frame: Frame;
  logger: Logger;
}

export async function generateUi({ issue, solution, frame, logger }: Args): Promise<GeneratedMockup> {
  const userParts: Part[] = [
    { inlineData: { mimeType: frame.mediaType, data: frame.base64 } },
    {
      text: [
        `Current UI shown above at t=${frame.tSeconds}s: ${frame.description}`,
        "",
        "ISSUE:",
        issue,
        "",
        "SOLUTION:",
        solution.solution,
        "",
        "FEATURE SPECS:",
        solution.featureSpecs,
        "",
        "Produce one HTML implementation of these specs while preserving every UI element the specs do not explicitly change.",
      ].join("\n"),
    },
  ];

  const mockup = await callUiGeneratorAgent(userParts, logger);
  validateRenderability(mockup.html);
  return mockup;
}
