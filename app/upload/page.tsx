import Link from "next/link";
import { Sidebar } from "@/components/ui/Sidebar";
import { UploadFlow } from "./_components/UploadFlow";

export default function UploadPage() {
  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar />

      <main className="box-border flex flex-1 justify-center px-10 py-14">
        <div className="flex w-full max-w-[860px] flex-col">
          <nav className="mb-[6px] text-[12px] text-ink-subtle">
            <Link href="/jobs/142" className="text-ink-subtle hover:text-ink">
              Analyses
            </Link>
            <span className="mx-[6px] text-ink-fainter">/</span>
            <span className="text-ink">New analysis</span>
          </nav>

          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">New analysis</h1>
          <p className="mb-8 mt-2 max-w-[560px] text-[13.5px] leading-[1.55] text-ink-subtle">
            Upload a session export and its screen recording. itera aligns them, detects
            friction, and renders redesign options for every improvement it finds.
          </p>

          <UploadFlow />
        </div>
      </main>
    </div>
  );
}
