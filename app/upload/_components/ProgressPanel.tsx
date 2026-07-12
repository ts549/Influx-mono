"use client";

interface StageDef {
  label: string;
  note: string;
  start: number;
  end: number;
}

const STAGES: StageDef[] = [
  { label: "Parsing event stream", note: "12,402 events", start: 0, end: 30 },
  { label: "Aligning replay to events", note: "frame matching", start: 30, end: 55 },
  {
    label: "Detecting friction patterns",
    note: "rage clicks · dead ends · drop-offs",
    start: 55,
    end: 85,
  },
  { label: "Rendering mockup options", note: "2–3 per finding", start: 85, end: 100 },
];

interface Props {
  progress: number;
  onCancel: () => void;
}

export function ProgressPanel({ progress, onCancel }: Props) {
  const remainingSec = Math.max(1, Math.ceil(((100 - progress) / 100) * 9));
  const pctLabel = `${Math.round(progress)}%`;

  return (
    <div className="flex flex-col gap-[18px] rounded-card border border-line bg-surface p-6">
      <div className="flex items-center gap-3">
        <Spinner />
        <div className="flex flex-1 flex-col gap-[1px]">
          <span className="text-[14px] font-semibold">Analyzing session</span>
          <span className="font-mono text-[11.5px] text-ink-subtle">
            job_8f3a41c2 · session_8f3a41c2
          </span>
        </div>
        <span className="font-mono text-[13px] font-semibold text-brand">{pctLabel}</span>
      </div>

      <div className="h-[6px] overflow-hidden rounded-[4px] bg-[#EEEEF2]">
        <div
          className="h-full rounded-[4px] bg-brand transition-[width] duration-150 ease-linear"
          style={{ width: pctLabel }}
        />
      </div>

      <div className="flex flex-col gap-3 pt-[2px]">
        {STAGES.map((s) => {
          const done = progress >= s.end;
          const active = progress >= s.start && progress < s.end;
          const glyph = done ? "✓" : active ? "●" : "○";
          const highlight = done || active;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                  highlight ? "bg-brand-soft text-brand" : "bg-muted text-ink-fainter"
                }`}
              >
                {glyph}
              </div>
              <span
                className={`text-[13px] font-medium ${
                  highlight ? "text-ink" : "text-ink-faint"
                }`}
              >
                {s.label}
              </span>
              <span className="text-[11.5px] text-ink-faint">{s.note}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-line-softest pt-[14px]">
        <span className="text-[12px] text-ink-subtle">~{remainingSec}s remaining</span>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[7px] border border-line px-3 py-[6px] text-[12.5px] font-medium text-ink-subtle hover:bg-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-[18px] w-[18px] box-border animate-spin rounded-full border-2 border-brand-ring border-t-brand" />
  );
}
