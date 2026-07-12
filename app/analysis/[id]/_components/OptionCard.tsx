"use client";

import { useEffect, useState } from "react";
import type { AnalysisVariant } from "@/lib/analyses-store";

interface Props {
  index: number;
  variant: AnalysisVariant;
  chosen: boolean;
  dimmed: boolean;
  onPick: () => void;
  onDismiss: () => void;
}

export function OptionCard({ index, variant, chosen, dimmed, onPick, onDismiss }: Props) {
  const [hovered, setHovered] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const label = `Option ${String.fromCharCode(65 + index)}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ opacity: dimmed ? 0.45 : 1 }}
      className="relative flex min-w-0 flex-col gap-2 transition-opacity"
    >
      {chosen && (
        <div className="pointer-events-none absolute -inset-2 rounded-[14px] border-2 border-accept" />
      )}

      <div className="flex items-center gap-2">
        <span className="rounded-[4px] bg-brand-soft px-[7px] py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.5px] text-brand">
          {label.toUpperCase()}
        </span>
        {chosen && (
          <span className="rounded-[20px] bg-accept px-2 py-[2px] text-[10.5px] font-semibold text-white">
            ✓ Selected
          </span>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Enlarge ${label}`}
        onClick={() => setPreviewOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPreviewOpen(true);
          }
        }}
        className="relative h-[220px] cursor-zoom-in overflow-hidden rounded-panel border border-line bg-muted-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={variant.screenshotBase64}
          alt={label}
          className="block h-full w-full object-cover"
        />

        {hovered && (
          <div className="absolute right-[10px] top-[10px] z-[3] flex gap-[6px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPick();
              }}
              title={chosen ? "Deselect this option" : "Choose this option"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accept text-[14px] text-white shadow-popStrong hover:bg-accept-hover"
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
              className="box-border flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-[13px] text-danger-text shadow-pop hover:border-danger-border hover:bg-danger-bg"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <p className="m-0 text-[11.5px] leading-[1.5] text-ink-subtle">{variant.reasoning}</p>

      {previewOpen && (
        <PreviewModal
          src={variant.screenshotBase64}
          alt={label}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

function PreviewModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} preview`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full max-w-[min(1600px,95vw)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-5 top-4 z-10 flex items-center gap-[6px] leading-none text-ink-subtle hover:text-ink"
        >
          <span className="text-[18px]">✕</span>
          <span className="text-[12px] font-medium tracking-wide">Esc</span>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block max-h-[90vh] w-auto rounded-panel border border-line bg-surface object-contain"
        />
      </div>
    </div>
  );
}
