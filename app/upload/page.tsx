import Link from "next/link";
import { Sidebar } from "@/components/ui/Sidebar";
import { getCurrentWorkspace } from "@/lib/workspace";
import { listWorkspaces } from "@/lib/workspaces-store";
import { UploadFlow } from "./_components/UploadFlow";

export default async function UploadPage() {
  const [currentWorkspace, workspaces] = await Promise.all([
    getCurrentWorkspace(),
    listWorkspaces(),
  ]);

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar currentWorkspace={currentWorkspace} workspaces={workspaces} />

      <main className="box-border flex flex-1 justify-center px-10 py-14">
        <div className="flex w-full max-w-[860px] flex-col">
          <nav className="mb-[6px] text-[12px] text-ink-subtle">
            <Link href="/sessions" className="text-ink-subtle hover:text-ink">
              Sessions
            </Link>
            <span className="mx-[6px] text-ink-fainter">/</span>
            <span className="text-ink">New analysis</span>
          </nav>

          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">New analysis</h1>
          <p className="mb-8 mt-2 max-w-[560px] text-[13.5px] leading-[1.55] text-ink-subtle">
            Upload a session export and its screen recording. Influx aligns them, detects
            friction, and renders redesign options for every improvement it finds.
          </p>

          <UploadFlow />
        </div>
      </main>
    </div>
  );
}
