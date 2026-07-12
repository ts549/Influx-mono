"use client";

import { useMemo, useState } from "react";
import type { AnalysisFinding } from "@/lib/analyses-store";
import { OptionCard } from "./OptionCard";
import { PreviewModal } from "./PreviewModal";

interface Props {
  finding: AnalysisFinding;
}

function formatTimestamp(tSeconds: number): string {
  const total = Math.max(0, Math.round(tSeconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FindingCard({ finding }: Props) {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [dismissedIndexes, setDismissedIndexes] = useState<number[]>([]);

  const visibleOptions = useMemo(
    () =>
      finding.variants
        .map((variant, index) => ({ variant, index }))
        .filter(({ index }) => !dismissedIndexes.includes(index)),
    [finding.variants, dismissedIndexes],
  );

  const decided = chosenIndex !== null;
  const dismissedCount = dismissedIndexes.length;
  const cols = 1 + visibleOptions.length;
  const gridClass =
    cols <= 2
      ? "grid-cols-1 md:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 md:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  const handlePick = (index: number) => {
    setChosenIndex((prev) => (prev === index ? null : index));
  };

  const handleDismiss = (index: number) => {
    setDismissedIndexes((prev) => (prev.includes(index) ? prev : [...prev, index]));
    setChosenIndex((prev) => (prev === index ? null : prev));
  };

  const handleUndo = () => {
    setDismissedIndexes([]);
  };

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-[10px]">
        <h2 className="m-0 flex-1 text-[15.5px] font-semibold tracking-[-0.2px]">
          {finding.issue}
        </h2>
        <span className="rounded-[5px] bg-muted px-2 py-[3px] font-mono text-[11px] text-ink-subtle">
          t={formatTimestamp(finding.tSeconds)}
        </span>
        {decided ? (
          <span className="rounded-[20px] bg-accept px-[11px] py-1 text-[11.5px] font-semibold text-white">
            Option {String.fromCharCode(65 + chosenIndex)} selected
          </span>
        ) : (
          <span className="rounded-[20px] bg-muted px-[11px] py-1 text-[11.5px] font-medium text-ink-subtle">
            Awaiting review
          </span>
        )}
      </div>

      <p className="m-0 max-w-[820px] text-[13px] leading-[1.6] text-ink-muted">
        {finding.solution}
      </p>

      <div className={`grid items-start gap-4 ${gridClass}`}>
        <CurrentColumn
          image={finding.currentImage}
          caption={finding.currentCaption}
        />
        {visibleOptions.map(({ variant, index }) => (
          <OptionCard
            key={index}
            index={index}
            variant={variant}
            chosen={chosenIndex === index}
            dimmed={decided && chosenIndex !== index}
            onPick={() => handlePick(index)}
            onDismiss={() => handleDismiss(index)}
          />
        ))}
      </div>

      {dismissedCount > 0 && (
        <div className="flex items-center gap-2 text-[12px] text-ink-faint">
          <span>
            {dismissedCount} option{dismissedCount === 1 ? "" : "s"} dismissed.
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="cursor-pointer font-medium text-brand hover:text-brand-hover"
          >
            Undo
          </button>
        </div>
      )}
    </section>
  );
}

function CurrentColumn({ image, caption }: { image: string; caption: string }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const alt = "Current UI frame";

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="rounded-[4px] bg-muted px-[7px] py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-subtle">
          CURRENT
        </span>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Enlarge ${alt}`}
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
        <img src={image} alt={alt} className="block h-full w-full object-cover" />
      </div>
      <p className="m-0 text-[11.5px] leading-[1.5] text-ink-faint">{caption}</p>

      {previewOpen && (
        <PreviewModal src={image} alt={alt} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}
