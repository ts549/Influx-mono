import { readFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI, Type, type Part, type Schema } from "@google/genai";
import { TriageResponseSchema } from "../helpers/schema";
import { withRetry } from "../helpers/retry";
import type { Logger, TriagedAoi } from "../types";

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
    "triage_agent.md",
  );
  cachedSystemPrompt = await readFile(promptPath, "utf8");
  return cachedSystemPrompt;
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    aois: {
      type: Type.ARRAY,
      minItems: "0",
      maxItems: "3",
      items: {
        type: Type.OBJECT,
        properties: {
          frameIndex: {
            type: Type.INTEGER,
            description:
              "Index into the frames array of the frame that most clearly shows this AOI.",
          },
          issue: { type: Type.STRING },
          solution: { type: Type.STRING },
          featureSpecs: { type: Type.STRING },
        },
        required: ["frameIndex", "issue", "solution", "featureSpecs"],
      },
    },
  },
  required: ["aois"],
};

export async function callTriageAgent(
  userParts: Part[],
  logger: Logger,
): Promise<TriagedAoi[]> {
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
  if (!text) throw new Error("Triage: Gemini returned an empty response.");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Triage: response was not valid JSON: ${(e as Error).message}`,
    );
  }

  const parsed = TriageResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Triage: response failed schema validation: ${parsed.error.message}`,
    );
  }

  return parsed.data.aois;
}
