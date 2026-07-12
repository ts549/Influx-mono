import type { ReactNode } from "react";

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[20px] border border-line bg-surface px-[10px] py-[3px] text-[11.5px] text-ink-subtle">
      {children}
    </span>
  );
}

export function AccentPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[20px] bg-brand-soft px-[10px] py-[3px] text-[11.5px] font-semibold text-brand">
      {children}
    </span>
  );
}

export function MonoChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[5px] bg-muted px-2 py-[3px] font-mono text-[11px] text-ink-subtle">
      {children}
    </span>
  );
}
