import { randomUUID } from "node:crypto";
import Table from "cli-table3";
import { NextResponse } from "next/server";
import { type AnalysisFinding, saveAnalysis } from "@/lib/analyses-store";
import { getCurrentWorkspace } from "@/lib/workspace";
import { extractEventFrames } from "./_lib/pipeline/extract-frames";
import { generateUi } from "./_lib/pipeline/generate-ui";
import type { RrwebSnapshot } from "./_lib/helpers/parse-events";
import { createLogger } from "./_lib/logger";
import { parseAndCondense } from "./_lib/pipeline/parse-and-condense";
import { rank } from "./_lib/pipeline/rank";
import { embed } from "./_lib/pipeline/embed";
import { dedupeWithLog } from "./_lib/pipeline/dedupe";
import { renderAllVariants } from "./_lib/render-variants";
import { triage } from "./_lib/pipeline/triage";
import type { Frame, GeneratedAoi, GeneratedSolution, RankedAoi, TriagedAoi } from "./_lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_JSON_BYTES = 500 * 1024 * 1024;
const MAX_MP4_BYTES = 2 * 1024 * 1024 * 1024;

function extractSnapshots(parsed: unknown): RrwebSnapshot[] | null {
  if (Array.isArray(parsed)) return parsed as RrwebSnapshot[];
  if (parsed && typeof parsed === "object") {
    const data = (parsed as { data?: { snapshots?: unknown } }).data;
    if (data && Array.isArray(data.snapshots)) return data.snapshots as RrwebSnapshot[];
  }
  return null;
}

function badRequest(requestId: string, message: string) {
  return NextResponse.json({ requestId, error: message }, { status: 400 });
}

function serverError(requestId: string, message: string) {
  return NextResponse.json({ requestId, error: message }, { status: 500 });
}

function formatRankingTable(ranked: RankedAoi[]): string {
  if (ranked.length === 0) return "  (no AOIs to rank)";

  const table = new Table({
    head: ["AOI", "Evidence", "Time Cost", "Breadth Recurrence", "Depth Recurrence", "Score"],
    style: { head: [], border: [] },
    wordWrap: true,
    colWidths: [50, 40, null, null, null, null],
  });

  for (const a of ranked) {
    table.push([
      a.issue,
      a.evidence
        .map((e) => `t=${e.tSeconds.toFixed(1)}s-${(e.tSeconds + e.issueDuration).toFixed(1)}s`)
        .join(", "),
      `${a.timeCost.toFixed(1)}s`,
      String(a.breadthRecurrence),
      String(a.depthRecurrence),
      a.score.toFixed(2),
    ]);
  }

  return table.toString();
}

interface ParsedSession {
  jsonFile: File;
  mp4File: File;
  rawSnapshots: RrwebSnapshot[];
}

export async function POST(req: Request) {
  const requestId = randomUUID();
  const logger = createLogger(requestId);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return serverError(requestId, "GEMINI_API_KEY is not set on the server.");
    }

    const form = await req.formData().catch(() => null);
    if (!form) return badRequest(requestId, "Body must be multipart/form-data.");

    const posthogFiles = form.getAll("posthog-raw");
    const videoFiles = form.getAll("session-replay");

    if (posthogFiles.length === 0 || videoFiles.length === 0) {
      return badRequest(requestId, "At least one 'posthog-raw' + 'session-replay' pair is required.");
    }
    if (posthogFiles.length !== videoFiles.length) {
      return badRequest(
        requestId,
        `'posthog-raw' and 'session-replay' counts must match (got ${posthogFiles.length} and ${videoFiles.length}).`,
      );
    }

    const sessions: ParsedSession[] = [];
    for (let i = 0; i < posthogFiles.length; i++) {
      const jsonFile = posthogFiles[i];
      const mp4File = videoFiles[i];
      if (!(jsonFile instanceof File)) {
        return badRequest(requestId, `Field 'posthog-raw' at index ${i} is not a file.`);
      }
      if (!(mp4File instanceof File)) {
        return badRequest(requestId, `Field 'session-replay' at index ${i} is not a file.`);
      }
      if (jsonFile.size > MAX_JSON_BYTES) {
        return badRequest(requestId, `'posthog-raw' at index ${i} exceeds 500 MB limit.`);
      }
      if (mp4File.size > MAX_MP4_BYTES) {
        return badRequest(requestId, `'session-replay' at index ${i} exceeds 2 GB limit.`);
      }

      let rawSnapshots: RrwebSnapshot[];
      try {
        const text = await jsonFile.text();
        const parsed = JSON.parse(text) as unknown;
        const snapshots = extractSnapshots(parsed);
        if (!snapshots) {
          return badRequest(
            requestId,
            `'posthog-raw' at index ${i} must be either an rrweb snapshot array or a PostHog export with data.snapshots.`,
          );
        }
        rawSnapshots = snapshots;
      } catch (e) {
        return badRequest(
          requestId,
          `'posthog-raw' at index ${i} is not valid JSON: ${(e as Error).message}`,
        );
      }

      sessions.push({ jsonFile, mp4File, rawSnapshots });
    }

    logger.log(`Received ${sessions.length} session(s) in this batch.`);

    logger.log("Triaging sessions in parallel...");
    const perSession = await Promise.all(
      sessions.map(async (s, i) => {
        const condensedEvents = parseAndCondense(s.rawSnapshots);
        logger.log(`  Session ${i + 1} (${s.mp4File.name}): ${condensedEvents.length} condensed event(s).`);
        const videoBuffer = Buffer.from(await s.mp4File.arrayBuffer());
        const frames = await extractEventFrames({ videoBuffer, condensedEvents, logger });
        logger.log(`  Session ${i + 1}: extracted ${frames.length} frame(s).`);
        const aois = await triage({ condensedEvents, frames, logger });
        logger.log(`  Session ${i + 1}: triaged ${aois.length} AOI(s).`);
        return { frames, aois, filename: s.mp4File.name };
      }),
    );

    let cumulativeOffset = 0;
    const flatFrames: Frame[] = [];
    const flatAois: TriagedAoi[] = [];
    for (const s of perSession) {
      for (const a of s.aois) {
        for (const e of a.evidence) {
          e.frameIndex += cumulativeOffset;
          e.sessionReplayFilename = s.filename;
        }
        flatAois.push({ ...a, breadthRecurrence: 1 });
      }
      flatFrames.push(...s.frames);
      cumulativeOffset += s.frames.length;
    }
    logger.log(`  Flattened to ${flatAois.length} AOI(s) across ${flatFrames.length} frame(s).`);

    logger.log("Embedding AOI descriptions via Gemini...");
    const embedded = await embed(flatAois, logger);

    logger.log("Deduplicating AOIs by cosine similarity (>= 0.90)...");
    const deduped = dedupeWithLog(embedded, logger);

    logger.log("Ranking AOIs by time cost + breadth + depth...");
    const ranked = rank(deduped).sort((a, b) => b.score - a.score);
    logger.log(formatRankingTable(ranked));

    const selected = ranked.slice(0, 3);
    if (ranked.length > selected.length) {
      logger.log(`  Selected top ${selected.length} of ${ranked.length} AOI(s) for UI generation.`);
    }

    logger.log("Generating UI variants per solution via Gemini...");
    const aois: GeneratedAoi[] = [];
    for (let i = 0; i < selected.length; i++) {
      const t = selected[i];
      const primaryFrame = flatFrames[t.evidence[t.evidence.length - 1].frameIndex];
      const generatedSolutions: GeneratedSolution[] = [];
      for (let si = 0; si < t.solutions.length; si++) {
        const s = t.solutions[si];
        logger.log(`  AOI ${i + 1} / Solution ${si + 1}: ${s.solution.slice(0, 80)}${s.solution.length > 80 ? "…" : ""}`);
        const mockup = await generateUi({ issue: t.issue, solution: s, frame: primaryFrame, logger });
        generatedSolutions.push({ solution: s.solution, featureSpecs: s.featureSpecs, mockup });
      }
      aois.push({
        issue: t.issue,
        summarizedEvidence: t.summarizedEvidence,
        evidence: t.evidence,
        solutions: generatedSolutions,
        breadthRecurrence: t.breadthRecurrence,
        depthRecurrence: t.depthRecurrence,
      });
    }

    logger.log("Rendering variants to PNG via Puppeteer...");
    const rendered = await renderAllVariants(aois, logger);

    const findings: AnalysisFinding[] = rendered.map((aoi) => {
      const frame = flatFrames[aoi.frameIndex];
      return {
        issue: aoi.issue,
        summarizedEvidence: aoi.summarizedEvidence,
        evidence: aoi.evidence.map((e) => ({
          tSeconds: e.tSeconds,
          issueDuration: e.issueDuration,
          sessionReplayFilename: e.sessionReplayFilename,
        })),
        currentImage: `data:${frame.mediaType};base64,${frame.base64}`,
        currentCaption: frame.description,
        solutions: aoi.solutions.map((s) => ({
          explanation: s.solution,
          featureSpecs: s.featureSpecs,
          screenshotBase64: s.mockup.screenshotBase64,
        })),
        breadthRecurrence: aoi.breadthRecurrence,
        depthRecurrence: aoi.depthRecurrence,
      };
    });

    const analysisId = randomUUID();
    const workspace = await getCurrentWorkspace();
    await saveAnalysis({
      id: analysisId,
      createdAt: new Date().toISOString(),
      workspace,
      findings,
    });
    logger.log(`Done. Wrote ${findings.length} finding(s) to analysis ${analysisId}.`);
    return NextResponse.json({ id: analysisId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Pipeline failed: ${message}`);
    return serverError(requestId, message);
  } finally {
    await logger.flush().catch(() => undefined);
  }
}
