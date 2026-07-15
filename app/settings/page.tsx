import { Sidebar } from "@/components/ui/Sidebar";
import { getCurrentWorkspace } from "@/lib/workspace";
import { getWorkspaceContextFilename } from "@/lib/workspace-context-store";
import { listWorkspaces } from "@/lib/workspaces-store";
import { SettingsForm } from "./_components/SettingsForm";

export default async function SettingsPage() {
  const [currentWorkspace, workspaces] = await Promise.all([
    getCurrentWorkspace(),
    listWorkspaces(),
  ]);
  const existingContextFilename = await getWorkspaceContextFilename(currentWorkspace);

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar currentWorkspace={currentWorkspace} workspaces={workspaces} />

      <main className="box-border flex flex-1 justify-center px-10 py-14">
        <div className="flex w-full max-w-[860px] flex-col">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.3px]">Settings</h1>
          <p className="mb-8 mt-2 text-[13.5px] text-ink-subtle">
            <span className="font-mono">{currentWorkspace}</span> workspace
          </p>

          <SettingsForm
            currentWorkspaceName={currentWorkspace}
            existingContextFilename={existingContextFilename}
          />
        </div>
      </main>
    </div>
  );
}
