import { readFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI, Type, type Part, type Schema } from "@google/genai";
import { GenerateUiResponseSchema } from "../helpers/schema";
import { withRetry } from "../helpers/retry";
import type { GeneratedVariant, Logger } from "../types";

const MODEL = "gemini-flash-latest";

let cachedSystemPrompt: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt !== null) return cachedSystemPrompt;
  const promptPath = path.join(
    process.cwd(),
    "app",
    "api",
    "redesign",
    "_lib",
    "prompts",
    "ui_generator_agent.md",
  );
  cachedSystemPrompt = await readFile(promptPath, "utf8");
  return cachedSystemPrompt;
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    variants: {
      type: Type.ARRAY,
      minItems: "2",
      maxItems: "3",
      items: {
        type: Type.OBJECT,
        properties: {
          rationale: { type: Type.STRING },
          html: { type: Type.STRING },
        },
        required: ["rationale", "html"],
      },
    },
  },
  required: ["variants"],
};

export async function callUiGeneratorAgent(
  userParts: Part[],
  logger: Logger,
): Promise<GeneratedVariant[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = await loadSystemPrompt();

  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: userParts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    { logger },
  );

  const text = response.text;
  if (!text) throw new Error("Generate-UI: Gemini returned an empty response.");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Generate-UI: response was not valid JSON: ${(e as Error).message}`,
    );
  }

  const parsed = GenerateUiResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Generate-UI: response failed schema validation: ${parsed.error.message}`,
    );
  }

  return parsed.data.variants;
}
