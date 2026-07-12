"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

type WorkspaceType = "personal" | "organization";

const ORG_TOOLTIP = "Organization workspaces will be available in a future version.";

export function CreateWorkspaceModal({ onClose }: Props) {
  const router = useRouter();
  const [type, setType] = useState<WorkspaceType>("personal");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const existsRes = await fetch("/api/workspaces/get-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const existsPayload = (await existsRes.json().catch(() => null)) as {
        exists?: boolean;
        error?: string;
      } | null;
      if (!existsRes.ok) {
        throw new Error(existsPayload?.error ?? `Lookup failed (${existsRes.status})`);
      }
      if (existsPayload?.exists) {
        setError(`A workspace named "${trimmed}" already exists.`);
        setSubmitting(false);
        return;
      }

      const createRes = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, type }),
      });
      const createPayload = (await createRes.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!createRes.ok) {
        throw new Error(createPayload?.error ?? `Create failed (${createRes.status})`);
      }

      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create workspace"
      onClick={() => (submitting ? undefined : onClose())}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="relative flex w-full max-w-[440px] flex-col gap-5 rounded-[14px] border border-line bg-surface p-6 shadow-popStrong"
      >
        <button
          type="button"
          onClick={() => onClose()}
          disabled={submitting}
          aria-label="Close"
          className="absolute right-5 top-5 text-[16px] leading-none text-ink-subtle hover:text-ink disabled:opacity-40"
        >
          ✕
        </button>

        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[16px] font-semibold tracking-[-0.2px]">Create workspace</h2>
          <p className="m-0 text-[12.5px] text-ink-subtle">
            Workspaces keep sessions, analyses and members separate.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TypeCard
            selected={type === "personal"}
            onSelect={() => setType("personal")}
            icon="◔"
            title="Personal"
            description="Just you. Your own sessions and analyses."
          />
          <TypeCard
            selected={false}
            disabled
            title="Organization"
            icon="◫"
            tooltip={ORG_TOOLTIP}
            description="Shared with your team. Invite members and manage roles."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="workspace-name" className="text-[12.5px] font-medium text-ink">
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. project-a"
            disabled={submitting}
            autoFocus
            className="rounded-lg border border-line bg-surface px-[12px] py-[10px] text-[13px] text-ink outline-none placeholder:text-ink-fainter focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
          />
          {error && (
            <span className="text-[12px] text-danger-text">{error}</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line-softest pt-4">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={submitting}
            className="rounded-[7px] border border-line px-[14px] py-2 text-[12.5px] font-medium text-ink hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-[7px] bg-brand px-[16px] py-2 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:bg-muted-strong disabled:text-ink-faint"
          >
            {submitting ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TypeCardProps {
  selected: boolean;
  disabled?: boolean;
  icon: string;
  title: string;
  description: string;
  tooltip?: string;
  onSelect?: () => void;
}

function TypeCard({
  selected,
  disabled = false,
  icon,
  title,
  description,
  tooltip,
  onSelect,
}: TypeCardProps) {
  const base =
    "relative flex flex-col gap-2 rounded-[10px] border p-3 text-left transition-colors";
  const state = disabled
    ? "cursor-not-allowed border-line bg-muted-soft opacity-60"
    : selected
      ? "cursor-pointer border-brand bg-brand-softer"
      : "cursor-pointer border-line bg-surface hover:border-brand-border";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      title={tooltip}
      aria-pressed={selected}
      className={`${base} ${state}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-[26px] w-[26px] items-center justify-center rounded-[6px] text-[12px] ${
            selected ? "bg-brand-soft text-brand" : "bg-muted text-ink-subtle"
          }`}
        >
          {icon}
        </div>
        <RadioDot selected={selected} disabled={disabled} />
      </div>
      <div className="flex flex-col gap-[3px]">
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <span className="text-[11.5px] leading-[1.4] text-ink-subtle">{description}</span>
      </div>
    </button>
  );
}

function RadioDot({ selected, disabled }: { selected: boolean; disabled: boolean }) {
  if (disabled) {
    return <span className="h-[14px] w-[14px] rounded-full border border-line" />;
  }
  return selected ? (
    <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-brand">
      <span className="h-[6px] w-[6px] rounded-full bg-brand" />
    </span>
  ) : (
    <span className="h-[14px] w-[14px] rounded-full border border-line" />
  );
}
