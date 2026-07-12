import Link from "next/link";
import { notFound } from "next/navigation";
import { AccentPill, Pill } from "@/components/ui/Pill";
import { Sidebar } from "@/components/ui/Sidebar";
import { getAnalysis } from "@/lib/analyses-store";
import { FindingCard } from "./_components/FindingCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params;
  const analysis = await getAnalysis(id);
  if (!analysis) notFound();

  const shortId = analysis.id.slice(0, 8);
  const totalVariants = analysis.findings.reduce(
    (acc, f) => acc + f.variants.length,
    0,
  );

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar />

      <main className="box-border flex flex-1 min-w-0 justify-center px-[44px] pb-[72px] pt-10">
        <div className="flex w-full max-w-[1280px] flex-col">
          <nav className="mb-[6px] text-[12px] text-ink-subtle">
            <span>Analyses</span>
            <span className="mx-[6px] text-ink-fainter">/</span>
            <span className="font-mono text-ink">{shortId}</span>
          </nav>

          <div className="mb-[10px] flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">
                Analysis <span className="font-mono font-semibold">{shortId}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Pill>{formatCreatedAt(analysis.createdAt)}</Pill>
                <AccentPill>
                  {analysis.findings.length} area
                  {analysis.findings.length === 1 ? "" : "s"} found
                </AccentPill>
                <Pill>
                  {totalVariants} redesign{totalVariants === 1 ? "" : "s"} rendered
                </Pill>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-[10px]">
              <Link
                href="/upload"
                className="rounded-lg border border-line bg-surface px-[14px] py-2 text-[12.5px] font-medium text-ink hover:bg-muted"
              >
                New analysis
              </Link>
            </div>
          </div>

          <p className="mb-7 text-[13px] text-ink-subtle">
            Review each finding and the redesign options generated for it.
          </p>

          {analysis.findings.length === 0 ? (
            <div className="rounded-card border border-line bg-surface p-10 text-center text-[13px] text-ink-subtle">
              This analysis produced no findings.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {analysis.findings.map((finding, i) => (
                <FindingCard key={i} finding={finding} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
