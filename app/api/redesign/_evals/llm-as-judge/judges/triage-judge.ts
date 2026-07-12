import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { withRetry } from "../../../_lib/helpers/retry";
import type { CondensedEvent, TriagedAoi } from "../../../_lib/types";

const MODEL = "claude-sonnet-4-5-20250929";

let cachedSystemPrompt: string | null = null;
async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt !== null) return cachedSystemPrompt;
  const promptPath = path.join(__dirname, "prompts", "triage_judge.md");
  cachedSystemPrompt = await readFile(promptPath, "utf8");
  return cachedSystemPrompt;
}

const VerdictSchema = z.enum(["match", "partial", "miss"]);
const ExtraVerdictSchema = z.enum(["plausible", "hallucination"]);

export const TriageJudgmentSchema = z.object({
  matches: z.array(
    z.object({
      expectedAoi: z.string(),
      matchedActualIndex: z.number().int().nullable(),
      verdict: VerdictSchema,
      reasoning: z.string().min(1),
    }),
  ),
  extraActualAois: z.array(
    z.object({
      actualIndex: z.number().int(),
      aoi: z.string(),
      verdict: ExtraVerdictSchema,
      reasoning: z.string().min(1),
    }),
  ),
  overallNotes: z.string(),
});

export type TriageJudgment = z.infer<typeof TriageJudgmentSchema>;

const TOOL: Anthropic.Tool = {
  name: "submit_grade",
  description: "Submit the graded judgment for this triage output.",
  input_schema: {
    type: "object",
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            expectedAoi: {
              type: "string",
              description:
                "The expected AOI being graded, quoted or paraphrased from expected.md.",
            },
            matchedActualIndex: {
              type: ["integer", "null"],
              description: "Index into the actual AOIs array, or null if no match.",
            },
            verdict: { type: "string", enum: ["match", "partial", "miss"] },
            reasoning: {
              type: "string",
              description:
                "Evidence for the verdict — cite specifics from expected/actual/events.",
            },
          },
          required: ["expectedAoi", "matchedActualIndex", "verdict", "reasoning"],
        },
      },
      extraActualAois: {
        type: "array",
        items: {
          type: "object",
          properties: {
            actualIndex: { type: "integer" },
            aoi: {
              type: "string",
              description:
                "Brief label for the extra AOI (quote or paraphrase the actual issue).",
            },
            verdict: { type: "string", enum: ["plausible", "hallucination"] },
            reasoning: { type: "string" },
          },
          required: ["actualIndex", "aoi", "verdict", "reasoning"],
        },
      },
      overallNotes: {
        type: "string",
        description: "Optional overall notes on the triage output. Empty string if none.",
      },
    },
    required: ["matches", "extraActualAois", "overallNotes"],
  },
};

interface Args {
  condensedEvents: CondensedEvent[];
  expected: string;
  actualAois: TriagedAoi[];
}

export async function runTriageJudge({
  condensedEvents,
  expected,
  actualAois,
}: Args): Promise<TriageJudgment> {
  const client = new Anthropic();
  const systemPrompt = await loadSystemPrompt();

  const userText = [
    "# CONDENSED EVENT LOG",
    "```json",
    JSON.stringify(condensedEvents, null, 2),
    "```",
    "",
    "# EXPECTED",
    expected.trim(),
    "",
    "# ACTUAL TRIAGE OUTPUT",
    "```json",
    JSON.stringify(actualAois, null, 2),
    "```",
    "",
    "Grade the actual output against the expected per the instructions. Call submit_grade exactly once.",
  ].join("\n");

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "submit_grade" },
      messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
    }),
  );

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Triage judge: Claude did not return a submit_grade tool call.");
  }

  const parsed = TriageJudgmentSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `Triage judge: response failed schema validation: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}
