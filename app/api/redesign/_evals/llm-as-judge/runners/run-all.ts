import "../../support/env";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { runTriageJudgeSuite } from "./run-triage-judge";
import { runUiGenJudgeSuite } from "./run-ui-gen-judge";

const RESULTS_ROOT = path.join(__dirname, "..", "results");

const timestampSlug = () =>
  new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");

async function main() {
  const parentDir = path.join(RESULTS_ROOT, `${timestampSlug()}_all`);
  await mkdir(parentDir, { recursive: true });
  console.log(`running full eval suite -> ${parentDir}\n`);

  const triageDir = path.join(parentDir, "triage");
  const uiGenDir = path.join(parentDir, "ui-gen");
  await mkdir(triageDir, { recursive: true });
  await mkdir(uiGenDir, { recursive: true });

  const triageSummary = await runTriageJudgeSuite({ resultsDir: triageDir });
  const uiGenSummary = await runUiGenJudgeSuite({ resultsDir: uiGenDir });

  console.log("\n=== full suite summary ===");
  console.log("triage:", JSON.stringify(triageSummary, null, 2));
  console.log("ui-gen:", JSON.stringify(uiGenSummary, null, 2));
  console.log(`(results dir: ${parentDir})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
