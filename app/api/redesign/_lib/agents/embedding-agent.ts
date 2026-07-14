import { GoogleGenAI } from "@google/genai";
import { withRetry } from "../helpers/retry";
import type { Logger } from "../types";

const MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = 768;

export async function embedIssues(
  texts: string[],
  logger: Logger,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const ai = new GoogleGenAI({ apiKey });

  const response = await withRetry(
    () =>
      ai.models.embedContent({
        model: MODEL,
        contents: texts,
        config: {
          taskType: "SEMANTIC_SIMILARITY",
          outputDimensionality: OUTPUT_DIMENSIONALITY,
        },
      }),
    { logger },
  );

  const embeddings = response.embeddings;
  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error(
      `Embed: expected ${texts.length} embeddings, got ${embeddings?.length ?? 0}.`,
    );
  }

  return embeddings.map((e, i) => {
    if (!e.values || e.values.length === 0) {
      throw new Error(`Embed: embedding at index ${i} has no values.`);
    }
    return e.values;
  });
}
