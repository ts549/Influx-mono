"use client";

import { useMemo, useState, useTransition } from "react";
import type { ChoiceAction, Finding, FindingState } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { MockupPreview } from "./mockups";
import { OptionCard } from "./OptionCard";

interface Props {
  jobId: string;
  finding: Finding;
  initialState: FindingState;
  showEvidence: boolean;
  dimUnpicked: boolean;
}

export function FindingCard({
  jobId,
  finding,
  initialState,
  showEvidence,
  dimUnpicked,
}: Props) {
  const [state, setState] = useState<FindingState>(initialState);
  const [, startTransition] = useTransition();

  const persist = (action: ChoiceAction) => {
    startTransition(() => {
      void fetch(`/api/jobs/${jobId}/choice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId: finding.id, action }),
      });
    });
  };

  const handlePick = (optionId: string) => {
    setState((prev) => ({
      ...prev,
      chosenOptionId: prev.chosenOptionId === optionId ? null : optionId,
    }));
    persist({ type: "select", optionId });
  };

  const handleDismiss = (optionId: string) => {
    setState((prev) => ({
      chosenOptionId: prev.chosenOptionId === optionId ? null : prev.chosenOptionId,
      dismissedOptionIds: prev.dismissedOptionIds.includes(optionId)
        ? prev.dismissedOptionIds
        : [...prev.dismissedOptionIds, optionId],
    }));
    persist({ type: "dismiss", optionId });
  };

  const handleUndo = () => {
    setState((prev) => ({ ...prev, dismissedOptionIds: [] }));
    persist({ type: "undo-dismissals" });
  };

  const visibleOptions = useMemo(
    () => finding.options.filter((o) => !state.dismissedOptionIds.includes(o.id)),
    [finding.options, state.dismissedOptionIds],
  );

  const chosen = state.chosenOptionId;
  const decided = !!chosen;
  const chosenLetter = chosen?.toUpperCase() ?? "";
  const dismissedCount = state.dismissedOptionIds.length;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
      <div className="flex items-center gap-[10px]">
        <SeverityBadge severity={finding.severity} />
        <h2 className="m-0 flex-1 text-[15.5px] font-semibold tracking-[-0.2px]">
          {finding.title}
        </h2>
        {showEvidence && (
          <>
            <span className="rounded-[5px] bg-muted px-2 py-[3px] font-mono text-[11px] text-ink-subtle">
              {finding.evidence.metric}
            </span>
            <span className="rounded-[5px] bg-muted px-2 py-[3px] font-mono text-[11px] text-ink-subtle">
              {finding.evidence.timeRange}
            </span>
          </>
        )}
        {decided ? (
          <span className="rounded-[20px] bg-brand px-[11px] py-1 text-[11.5px] font-semibold text-white">
            Option {chosenLetter} selected
          </span>
        ) : (
          <span className="rounded-[20px] bg-muted px-[11px] py-1 text-[11.5px] font-medium text-ink-subtle">
            Awaiting review
          </span>
        )}
      </div>

      <p className="m-0 max-w-[820px] text-[13px] leading-[1.6] text-ink-muted">
        {finding.description}
      </p>

      <div className="grid grid-cols-4 items-start gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-[4px] bg-muted px-[7px] py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-subtle">
              Current
            </span>
          </div>
          <MockupPreview kind={finding.currentMockup} />
          <p className="m-0 text-[11.5px] leading-[1.5] text-ink-faint">
            {finding.currentCaption}
          </p>
        </div>

        {visibleOptions.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            chosen={state.chosenOptionId === option.id}
            dimmed={dimUnpicked && decided && state.chosenOptionId !== option.id}
            onPick={() => handlePick(option.id)}
            onDismiss={() => handleDismiss(option.id)}
          />
        ))}

        {/* Fill remaining columns so the grid stays 4-wide */}
        {Array.from({ length: Math.max(0, 3 - visibleOptions.length) }).map((_, i) => (
          <div key={`spacer-${i}`} />
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
