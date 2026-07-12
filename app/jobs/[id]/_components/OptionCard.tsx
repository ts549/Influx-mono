"use client";

import { useState } from "react";
import type { Option } from "@/lib/types";
import { MockupPreview } from "./mockups";

interface Props {
  option: Option;
  chosen: boolean;
  dimmed: boolean;
  onPick: () => void;
  onDismiss: () => void;
}

export function OptionCard({ option, chosen, dimmed, onPick, onDismiss }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ opacity: dimmed ? 0.45 : 1 }}
      className="relative flex min-w-0 flex-col gap-2 transition-opacity"
    >
      {chosen && (
        <div className="pointer-events-none absolute -inset-2 rounded-[14px] border-2 border-brand" />
      )}

      <div className="flex items-center gap-2">
        <span className="rounded-[4px] bg-brand-soft px-[7px] py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.5px] text-brand">
          {option.label}
        </span>
        {chosen && (
          <span className="rounded-[20px] bg-brand px-2 py-[2px] text-[10.5px] font-semibold text-white">
            ✓ Selected
          </span>
        )}
      </div>

      <MockupPreview kind={option.mockup} />

      <p className="text-[11.5px] leading-[1.5] text-ink-subtle">{option.rationale}</p>

      {hovered && (
        <div className="absolute right-[10px] top-[36px] z-[3] flex gap-[6px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPick();
            }}
            title="Choose this option"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[13px] text-white shadow-popStrong hover:bg-brand-hover"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            title="Dismiss option"
            className="box-border flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-[12px] text-danger-text shadow-pop hover:border-danger-border hover:bg-danger-bg"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
