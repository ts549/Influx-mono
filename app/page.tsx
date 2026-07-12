import Link from "next/link";
import { Sidebar } from "@/components/ui/Sidebar";
import { listAnalyses, type AnalysisSummary } from "@/lib/analyses-store";
import { relativeTime } from "@/lib/format-time";
import { getCurrentWorkspace } from "@/lib/workspace";
import { listWorkspaces } from "@/lib/workspaces-store";

// Analyses are read from disk on every request; disable static prerendering.
export const dynamic = "force-dynamic";

const RECENT_LIMIT = 5;

export default async function OverviewPage() {
  const [currentWorkspace, workspaces] = await Promise.all([
    getCurrentWorkspace(),
    listWorkspaces(),
  ]);
  const analyses = await listAnalyses(currentWorkspace);
  const totalAreas = analyses.reduce((sum, a) => sum + a.findingCount, 0);
  const recent = analyses.slice(0, RECENT_LIMIT);

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar currentWorkspace={currentWorkspace} workspaces={workspaces} />

      <main className="box-border flex flex-1 min-w-0 justify-center px-[44px] pb-[72px] pt-10">
        <div className="flex w-full max-w-[1080px] flex-col">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">Overview</h1>
              <p className="m-0 text-[13px] text-ink-subtle">{currentWorkspace} workspace</p>
            </div>
            <Link
              href="/upload"
              className="rounded-lg bg-brand px-[14px] py-2 text-[12.5px] font-medium text-white hover:bg-brand-hover hover:text-white"
            >
              New analysis
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <StatCard label="Analyses run" value={analyses.length} />
            <StatCard label="Areas of improvement found" value={totalAreas} />
          </div>

          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="m-0 text-[15px] font-semibold tracking-[-0.2px]">Recent sessions</h2>
            <Link
              href="/sessions"
              className="text-[12.5px] font-medium text-brand hover:text-brand-hover"
            >
              View all sessions →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-card border border-line bg-surface p-10 text-center text-[13px] text-ink-subtle">
              No sessions yet. Upload a PostHog export and its recording to run the pipeline.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((a) => (
                <SessionRow key={a.id} analysis={a} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <span className="text-[12.5px] font-medium text-ink-subtle">{label}</span>
      <span className="text-[32px] font-semibold leading-none tracking-[-0.5px]">{value}</span>
    </div>
  );
}

function SessionRow({ analysis }: { analysis: AnalysisSummary }) {
  return (
    <Link
      href={`/sessions/analysis/${analysis.id}`}
      className="grid grid-cols-[minmax(140px,auto)_1fr_auto_100px] items-center gap-4 rounded-[10px] border border-line bg-surface px-[18px] py-[14px] transition-colors hover:bg-muted-soft"
    >
      <span className="font-mono text-[13px] font-medium text-ink">
        {analysis.id.slice(0, 8)}
      </span>
      <span className="text-[12.5px] text-ink-subtle">PostHog · web</span>
      <span className="rounded-[20px] bg-brand-soft px-[10px] py-[3px] text-[11.5px] font-semibold text-brand">
        {analysis.findingCount} area{analysis.findingCount === 1 ? "" : "s"}
      </span>
      <span className="text-right text-[12px] text-ink-subtle">
        {relativeTime(analysis.createdAt)}
      </span>
    </Link>
  );
}
