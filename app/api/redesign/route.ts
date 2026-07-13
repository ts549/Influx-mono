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
import { renderAllVariants } from "./_lib/render-variants";
import { triage } from "./_lib/pipeline/triage";
import type { GeneratedAoi, GeneratedSolution, RankedAoi } from "./_lib/types";

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
    head: ["AOI", "Evidence", "Time Cost", "Recurrence", "Score"],
    style: { head: [], border: [] },
    wordWrap: true,
    colWidths: [50, 40, null, null, null],
  });

  for (const a of ranked) {
    table.push([
      a.issue,
      a.evidence
        .map((e) => `t=${e.tSeconds.toFixed(1)}s-${(e.tSeconds + e.issueDuration).toFixed(1)}s`)
        .join(", "),
      `${a.timeCost.toFixed(1)}s`,
      String(a.recurrence),
      a.score.toFixed(2),
    ]);
  }

  return table.toString();
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

    const posthogFile = form.get("posthog-raw");
    const videoFile = form.get("session-replay");

    if (!(posthogFile instanceof File)) {
      return badRequest(requestId, "Missing multipart field 'posthog-raw'.");
    }
    if (!(videoFile instanceof File)) {
      return badRequest(requestId, "Missing multipart field 'session-replay'.");
    }
    if (posthogFile.size > MAX_JSON_BYTES) {
      return badRequest(requestId, "'posthog-raw' exceeds 500 MB limit.");
    }
    if (videoFile.size > MAX_MP4_BYTES) {
      return badRequest(requestId, "'session-replay' exceeds 2 GB limit.");
    }

    let rawSnapshots: RrwebSnapshot[];
    try {
      const text = await posthogFile.text();
      const parsed = JSON.parse(text) as unknown;
      const snapshots = extractSnapshots(parsed);
      if (!snapshots) {
        return badRequest(
          requestId,
          "'posthog-raw' must be either an rrweb snapshot array or a PostHog export with data.snapshots.",
        );
      }
      rawSnapshots = snapshots;
    } catch (e) {
      return badRequest(requestId, `'posthog-raw' is not valid JSON: ${(e as Error).message}`);
    }

    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

    logger.log("Parsing rrweb events...");
    const condensedEvents = parseAndCondense(rawSnapshots);
    logger.log(`  Extracted ${condensedEvents.length} condensed events.`);

    logger.log("Extracting frames from session-replay.mp4...");
    const frames = await extractEventFrames({ videoBuffer, condensedEvents, logger });
    logger.log(`  Extracted ${frames.length} frame(s).`);

    logger.log("Triaging most impactful AOIs via Gemini...");
    const triaged = await triage({ condensedEvents, frames, logger });
    logger.log(`  Triage picked ${triaged.length} AOI(s).`);

    logger.log("Ranking AOIs by time cost + recurrence...");
    const ranked = rank(triaged).sort((a, b) => b.score - a.score);
    logger.log(formatRankingTable(ranked));

    const selected = ranked.slice(0, 3);
    if (ranked.length > selected.length) {
      logger.log(`  Selected top ${selected.length} of ${ranked.length} AOI(s) for UI generation.`);
    }

    logger.log("Generating UI variants per solution via Gemini...");
    const aois: GeneratedAoi[] = [];
    for (let i = 0; i < selected.length; i++) {
      const t = selected[i];
      const primaryFrame = frames[t.evidence[t.evidence.length - 1].frameIndex];
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
      });
    }

    logger.log("Rendering variants to PNG via Puppeteer...");
    const rendered = await renderAllVariants(aois, logger);

    const findings: AnalysisFinding[] = rendered.map((aoi) => {
      const frame = frames[aoi.frameIndex];
      return {
        issue: aoi.issue,
        summarizedEvidence: aoi.summarizedEvidence,
        evidence: aoi.evidence.map((e) => ({
          tSeconds: e.tSeconds,
          issueDuration: e.issueDuration,
        })),
        currentImage: `data:${frame.mediaType};base64,${frame.base64}`,
        currentCaption: frame.description,
        solutions: aoi.solutions.map((s) => ({
          explanation: s.solution,
          featureSpecs: s.featureSpecs,
          screenshotBase64: s.mockup.screenshotBase64,
        })),
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
