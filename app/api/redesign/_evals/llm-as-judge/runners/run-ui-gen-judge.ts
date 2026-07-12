import "../../support/env";

export async function runUiGenJudgeSuite(_opts: { resultsDir?: string } = {}): Promise<{
  cases: number;
  skipped: boolean;
}> {
  console.log("[ui-gen] judge not yet implemented (phase 2).");
  return { cases: 0, skipped: true };
}

if (require.main === module) {
  runUiGenJudgeSuite().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
