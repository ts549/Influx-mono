"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateWorkspaceName } from "@/lib/validate-workspace-name";
import { ContextDropzone, ContextFilePreview } from "./ContextDropzone";

type Phase = "idle" | "saving";

interface Props {
  currentWorkspaceName: string;
  existingContextFilename: string | null;
}

export function SettingsForm({ currentWorkspaceName, existingContextFilename }: Props) {
  const router = useRouter();
  const [nameDraft, setNameDraft] = useState(currentWorkspaceName);
  const [contextFile, setContextFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const nameChanged = nameDraft.trim() !== currentWorkspaceName;
  const nameError = nameChanged ? validateWorkspaceName(nameDraft.trim()) : null;
  const canSave = phase === "idle" && !nameError && (nameChanged || !!contextFile);

  const handleSave = async () => {
    setError(null);
    setStatus(null);
    setPhase("saving");

    const form = new FormData();
    form.append("oldName", currentWorkspaceName);
    if (nameChanged) form.append("newName", nameDraft.trim());
    if (contextFile) form.append("context", contextFile);

    try {
      const res = await fetch("/api/workspaces/update", { method: "POST", body: form });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        workspaceName?: string;
      } | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? `Request failed (${res.status})`);
      }
      setContextFile(null);
      setStatus("Saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPhase("idle");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.2px]">Workspace</h2>
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-[3px]">
              <label
                htmlFor="workspace-name"
                className="text-[13.5px] font-semibold text-ink"
              >
                Workspace name
              </label>
              <span className="text-[12px] text-ink-subtle">
                Shown in the workspace switcher and invites.
              </span>
            </div>
            <input
              id="workspace-name"
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={60}
              className="min-w-[220px] rounded-[8px] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink focus:border-brand focus:outline-none"
            />
          </div>
          {nameError && (
            <div className="mt-3 text-[11.5px] font-medium text-danger-text">
              {nameError}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.2px]">Workspace context</h2>
        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
          <p className="m-0 text-[12.5px] leading-[1.55] text-ink-subtle">
            Optionally add a document describing what your product does and what specific
            features or pages are for. Influx uses it during triage to diagnose issues more
            accurately — helpful, but everything works without it.
          </p>
          {contextFile ? (
            <ContextFilePreview
              filename={contextFile.name}
              size={contextFile.size}
              chipLabel="Ready"
              onClear={() => setContextFile(null)}
            />
          ) : existingContextFilename ? (
            <ContextFilePreview
              filename={existingContextFilename}
              chipLabel="Saved"
              onClear={() => {
                setContextFile(null);
              }}
            />
          ) : (
            <ContextDropzone onFile={setContextFile} />
          )}
          {contextFile ? null : existingContextFilename ? (
            <ReplaceLink onFile={setContextFile} />
          ) : null}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`rounded-lg px-[18px] py-[10px] text-[13.5px] font-semibold transition-colors ${
            canSave
              ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
              : "cursor-default bg-muted-strong text-ink-faint"
          }`}
        >
          {phase === "saving" ? "Saving…" : "Save"}
        </button>
        {error && <span className="text-[12.5px] font-medium text-danger-text">{error}</span>}
        {status && !error && (
          <span className="text-[12.5px] font-medium text-success-text">{status}</span>
        )}
      </div>
    </div>
  );
}

function ReplaceLink({ onFile }: { onFile: (f: File) => void }) {
  return (
    <div className="text-[12px] text-ink-subtle">
      <label className="cursor-pointer font-medium text-brand hover:text-brand-hover">
        Replace with a new .txt file
        <input
          type="file"
          accept="text/plain,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
