import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ANALYSES_DIR = path.join(process.cwd(), "app", "data", "sessions");

export interface AnalysisSolution {
  explanation: string;
  featureSpecs: string;
  screenshotBase64: string;
}

export interface AnalysisEvidence {
  tSeconds: number;
  issueDuration: number;
}

export interface AnalysisFinding {
  issue: string;
  summarizedEvidence: string;
  evidence: AnalysisEvidence[];
  currentImage: string;
  currentCaption: string;
  solutions: AnalysisSolution[];
}

export interface Analysis {
  id: string;
  createdAt: string;
  workspace: string;
  findings: AnalysisFinding[];
}

export interface AnalysisSummary {
  id: string;
  createdAt: string;
  workspace: string;
  findingCount: number;
}

function filePath(id: string): string {
  return path.join(ANALYSES_DIR, `${id}.json`);
}

export async function saveAnalysis(analysis: Analysis): Promise<void> {
  await mkdir(ANALYSES_DIR, { recursive: true });
  await writeFile(filePath(analysis.id), JSON.stringify(analysis, null, 2), "utf8");
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  try {
    const text = await readFile(filePath(id), "utf8");
    return JSON.parse(text) as Analysis;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function listAnalyses(workspace?: string): Promise<AnalysisSummary[]> {
  let entries: string[];
  try {
    entries = await readdir(ANALYSES_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const summaries: AnalysisSummary[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const id = entry.slice(0, -".json".length);
    const analysis = await getAnalysis(id);
    if (!analysis) continue;
    if (workspace !== undefined && analysis.workspace !== workspace) continue;
    summaries.push({
      id: analysis.id,
      createdAt: analysis.createdAt,
      workspace: analysis.workspace,
      findingCount: analysis.findings.length,
    });
  }
  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
