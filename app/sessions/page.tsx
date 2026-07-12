import Link from "next/link";
import { Sidebar } from "@/components/ui/Sidebar";
import { listAnalyses, type AnalysisSummary } from "@/lib/analyses-store";
import { formatCreatedAt, relativeTime } from "@/lib/format-time";
import { getCurrentWorkspace } from "@/lib/workspace";
import { listWorkspaces } from "@/lib/workspaces-store";

// The disk store changes between builds, so opt out of build-time prerendering
// and re-read the folder on every request.
export const dynamic = "force-dynamic";

export default async function AnalysesListPage() {
  const [currentWorkspace, workspaces] = await Promise.all([
    getCurrentWorkspace(),
    listWorkspaces(),
  ]);
  const analyses: AnalysisSummary[] = await listAnalyses(currentWorkspace);

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar currentWorkspace={currentWorkspace} workspaces={workspaces} />

      <main className="box-border flex flex-1 min-w-0 justify-center px-[44px] pb-[72px] pt-10">
        <div className="flex w-full max-w-[1080px] flex-col">
          <div className="mb-[10px] flex min-w-0 flex-col gap-2">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">Sessions</h1>
            <p className="m-0 text-[13px] text-ink-subtle">
              Every session run so far, newest first.
            </p>
          </div>

          {analyses.length === 0 ? (
            <div className="mt-6 rounded-card border border-line bg-surface p-10 text-center">
              <p className="mb-4 text-[13px] text-ink-subtle">
                No analyses yet. Upload a PostHog export and its recording to run the pipeline.
              </p>
              <Link
                href="/upload"
                className="inline-block rounded-lg bg-brand px-[18px] py-[10px] text-[13.5px] font-semibold text-white hover:bg-brand-hover hover:text-white"
              >
                Start an analysis →
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col overflow-hidden rounded-card border border-line bg-surface">
              <div className="grid grid-cols-[1fr_180px_140px_60px] gap-4 border-b border-line-softest px-5 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.6px] text-ink-faint">
                <span>Analysis</span>
                <span>Created</span>
                <span>Findings</span>
                <span />
              </div>
              {analyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/sessions/analysis/${a.id}`}
                  className="grid grid-cols-[1fr_180px_140px_60px] items-center gap-4 border-b border-line-softest px-5 py-4 text-[13px] transition-colors last:border-b-0 hover:bg-muted-soft"
                >
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <span className="truncate font-mono text-[13px] font-medium text-ink">
                      {a.id.slice(0, 8)}
                    </span>
                    <span className="truncate font-mono text-[10.5px] text-ink-faint">
                      {a.id}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-ink">{relativeTime(a.createdAt)}</span>
                    <span className="text-[11px] text-ink-faint">
                      {formatCreatedAt(a.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="rounded-[20px] bg-brand-soft px-[10px] py-[3px] text-[11.5px] font-semibold text-brand">
                      {a.findingCount} area{a.findingCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="text-right text-[13px] text-ink-subtle">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
