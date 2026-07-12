import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { AccentPill, Pill } from "@/components/ui/Pill";
import { getJob } from "@/lib/jobs-store";
import { FindingCard } from "./_components/FindingCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobResultsPage({ params }: PageProps) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  const showEvidence = true;
  const dimUnpicked = true;

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar />

      <main className="box-border flex flex-1 min-w-0 justify-center px-[44px] pb-[72px] pt-10">
        <div className="flex w-full max-w-[1280px] flex-col">
          <nav className="mb-[6px] text-[12px] text-ink-subtle">
            <span>Analyses</span>
            <span className="mx-[6px] text-ink-fainter">/</span>
            <span className="text-ink">#{job.id}</span>
          </nav>

          <div className="mb-[10px] flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">
                Session{" "}
                <span className="font-mono font-semibold">{job.sessionCode}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Pill>{job.durationLabel}</Pill>
                <Pill>{job.source}</Pill>
                <Pill>{job.completedAtLabel}</Pill>
                <AccentPill>{job.findings.length} areas found</AccentPill>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-[10px]">
              <div className="flex rounded-lg bg-muted-strong p-[2px] text-[12px] font-medium">
                <span className="rounded-md bg-surface px-3 py-[5px] text-ink shadow-card">
                  Feed
                </span>
                <Link
                  href={`/jobs/${job.id}/split`}
                  className="px-3 py-[5px] text-ink-subtle hover:text-ink"
                >
                  Split
                </Link>
              </div>
              <Link
                href="/upload"
                className="rounded-lg border border-line bg-surface px-[14px] py-2 text-[12.5px] font-medium text-ink hover:bg-muted"
              >
                New analysis
              </Link>
            </div>
          </div>

          <p className="mb-7 text-[13px] text-ink-subtle">
            Review each finding and choose the redesign to move forward with. Hover an option
            to select or dismiss it.
          </p>

          <div className="flex flex-col gap-5">
            {job.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                jobId={job.id}
                finding={finding}
                initialState={
                  job.state[finding.id] ?? {
                    chosenOptionId: null,
                    dismissedOptionIds: [],
                  }
                }
                showEvidence={showEvidence}
                dimUnpicked={dimUnpicked}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
