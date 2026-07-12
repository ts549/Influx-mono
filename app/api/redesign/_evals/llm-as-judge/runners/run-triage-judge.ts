import "../../support/env";

import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { condense } from "../../../_lib/helpers/condense";
import {
  buildDomLookup,
  extractSignalEvents,
  findFirstFullSnapshot,
  getIdleThreshold,
  type RrwebSnapshot,
} from "../../../_lib/helpers/parse-events";
import { extractEventFrames } from "../../../_lib/pipeline/extract-frames";
import { triage } from "../../../_lib/triage";
import type { CondensedEvent, Frame, TriagedAoi } from "../../../_lib/types";
import { consoleLogger } from "../../support/silent-logger";
import { runTriageJudge, type TriageJudgment } from "../judges/triage-judge";

const JUDGE_MODEL_LABEL = "claude-sonnet-4-5";

const CASES_DIR = path.join(__dirname, "..", "cases", "triage");
const RESULTS_ROOT = path.join(__dirname, "..", "results");

const timestampSlug = () =>
  new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

interface CaseInputs {
  condensedEvents: CondensedEvent[];
  frames: Frame[];
  expected: string;
}

async function loadCaseInputs(caseDir: string): Promise<CaseInputs> {
  const posthogPath = path.join(caseDir, "posthog-raw.json");
  const condensedPath = path.join(caseDir, "events-condensed.json");
  const videoPath = path.join(caseDir, "session-replay.mp4");
  const expectedPath = path.join(caseDir, "expected.md");

  if (!(await pathExists(videoPath))) throw new Error("case is missing session-replay.mp4");
  if (!(await pathExists(expectedPath))) throw new Error("case is missing expected.md");

  const condensedEvents = await loadCondensedEvents({ condensedPath, posthogPath });
  const videoBuffer = await readFile(videoPath);
  const frames = await extractEventFrames({
    videoBuffer,
    condensedEvents,
    logger: consoleLogger(),
  });
  const expected = await readFile(expectedPath, "utf8");

  return { condensedEvents, frames, expected };
}

async function loadCondensedEvents(args: {
  condensedPath: string;
  posthogPath: string;
}): Promise<CondensedEvent[]> {
  const { condensedPath, posthogPath } = args;
  if (await pathExists(condensedPath)) {
    return JSON.parse(await readFile(condensedPath, "utf8")) as CondensedEvent[];
  }
  if (!(await pathExists(posthogPath))) {
    throw new Error("case needs either events-condensed.json or posthog-raw.json");
  }
  const raw = JSON.parse(await readFile(posthogPath, "utf8")) as {
    data?: { snapshots?: RrwebSnapshot[] };
  };
  const rawSnapshots = raw?.data?.snapshots;
  if (!Array.isArray(rawSnapshots) || rawSnapshots.length === 0) {
    throw new Error("posthog-raw.json is missing data.snapshots");
  }
  const fullSnapshot = findFirstFullSnapshot(rawSnapshots);
  if (!fullSnapshot) throw new Error("no FullSnapshot in data.snapshots");
  const domLookup = buildDomLookup(fullSnapshot.data?.node);
  const idleThreshold = getIdleThreshold(rawSnapshots);
  const signalEvents = extractSignalEvents(rawSnapshots, domLookup, idleThreshold);
  return condense(signalEvents);
}

interface CaseRecord {
  caseName: string;
  judge: "triage";
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  expected?: string;
  actualAois?: TriagedAoi[];
  judgment?: TriageJudgment;
  error?: string;
}

async function runCase(caseDir: string, resultsDir: string): Promise<CaseRecord> {
  const caseName = path.basename(caseDir);
  console.log(`\n[triage] case: ${caseName}`);

  const startedAt = new Date().toISOString();
  let record: CaseRecord;

  try {
    const { condensedEvents, frames, expected } = await loadCaseInputs(caseDir);
    console.log(`  ${condensedEvents.length} events, ${frames.length} frames`);

    console.log(`  running triage...`);
    const actualAois = await triage({
      condensedEvents,
      frames,
      logger: consoleLogger(),
    });
    console.log(`  triage produced ${actualAois.length} AOI(s)`);

    console.log(`  running judge (${JUDGE_MODEL_LABEL})...`);
    const judgment = await runTriageJudge({ condensedEvents, expected, actualAois });

    record = {
      caseName,
      judge: "triage",
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: true,
      expected,
      actualAois,
      judgment,
    };

    printCaseSummary(judgment);
  } catch (err) {
    record = {
      caseName,
      judge: "triage",
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error(`  FAILED: ${record.error}`);
  }

  await writeFile(
    path.join(resultsDir, `${caseName}.json`),
    JSON.stringify(record, null, 2),
    "utf8",
  );
  return record;
}

function printCaseSummary(j: TriageJudgment) {
  const matches = j.matches.filter((m) => m.verdict === "match").length;
  const partials = j.matches.filter((m) => m.verdict === "partial").length;
  const misses = j.matches.filter((m) => m.verdict === "miss").length;
  const halluc = j.extraActualAois.filter((e) => e.verdict === "hallucination").length;
  const plausible = j.extraActualAois.filter((e) => e.verdict === "plausible").length;
  console.log(
    `  scores: match=${matches} partial=${partials} miss=${misses} plausible-extras=${plausible} hallucinations=${halluc}`,
  );
}

interface Tally {
  cases: number;
  passed: number;
  failed: number;
  match: number;
  partial: number;
  miss: number;
  plausible: number;
  hallucination: number;
  precision?: number;
  recall?: number;
  f1?: number;
}

function tally(records: CaseRecord[]): Tally {
  const t: Tally = {
    cases: records.length,
    passed: 0,
    failed: 0,
    match: 0,
    partial: 0,
    miss: 0,
    plausible: 0,
    hallucination: 0,
  };
  for (const r of records) {
    if (!r.ok || !r.judgment) {
      t.failed++;
      continue;
    }
    t.passed++;
    for (const m of r.judgment.matches) t[m.verdict]++;
    for (const e of r.judgment.extraActualAois) t[e.verdict]++;
  }

  const tp = t.match + 0.5 * t.partial;
  const totalExpected = t.match + t.partial + t.miss;
  const totalActual = t.match + t.partial + t.plausible + t.hallucination;

  const recall = totalExpected > 0 ? tp / totalExpected : 0;
  const precision = totalActual > 0 ? (tp + t.plausible) / totalActual : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  t.precision = Number(precision.toFixed(2));
  t.recall = Number(recall.toFixed(2));
  t.f1 = Number(f1.toFixed(2));

  return t;
}

export async function runTriageJudgeSuite(opts: { resultsDir?: string } = {}): Promise<Tally> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required to run production triage.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for the judge.");
  }
  if (!(await pathExists(CASES_DIR))) {
    console.log(`no cases directory at ${CASES_DIR}. nothing to do.`);
    return { cases: 0, passed: 0, failed: 0, match: 0, partial: 0, miss: 0, plausible: 0, hallucination: 0 };
  }

  const entries = await readdir(CASES_DIR, { withFileTypes: true });
  const caseDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(CASES_DIR, e.name));
  if (caseDirs.length === 0) {
    console.log(`no cases under ${CASES_DIR}.`);
    return { cases: 0, passed: 0, failed: 0, match: 0, partial: 0, miss: 0, plausible: 0, hallucination: 0 };
  }

  const outDir = opts.resultsDir ?? path.join(RESULTS_ROOT, `${timestampSlug()}_triage`);
  await mkdir(outDir, { recursive: true });
  console.log(`writing results to: ${outDir}`);

  const records: CaseRecord[] = [];
  for (const c of caseDirs) records.push(await runCase(c, outDir));

  const summary = tally(records);
  await writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log(`\n=== triage judge summary ===`);
  console.log(JSON.stringify(summary, null, 2));
  console.log(`(results dir: ${outDir})`);

  return summary;
}

if (require.main === module) {
  runTriageJudgeSuite().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
