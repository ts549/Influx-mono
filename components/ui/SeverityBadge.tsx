import type { Severity } from "@/lib/types";

const STYLES: Record<Severity, { label: string; className: string }> = {
  high: {
    label: "High",
    className: "text-danger-text bg-danger-bg",
  },
  medium: {
    label: "Medium",
    className: "text-warning-text bg-warning-bg",
  },
  low: {
    label: "Low",
    className: "text-ink-subtle bg-muted",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = STYLES[severity];
  return (
    <span
      className={`rounded-[20px] px-[9px] py-[3px] text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
