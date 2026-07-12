"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Dropzone, FilePreview } from "./Dropzone";
import { ProgressPanel } from "./ProgressPanel";

type Phase = "idle" | "running" | "done" | "error";

const PROGRESS_CAP = 99;
const PROGRESS_TICK_MS = 300;

/** Ease progress toward the cap so it slows down instead of stalling at max. */
function computeProgress(elapsedMs: number): number {
  const pct = PROGRESS_CAP * (1 - Math.exp(-elapsedMs / 30_000));
  return Math.min(PROGRESS_CAP, Math.max(0, pct));
}

export function UploadFlow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [json, setJson] = useState<File | null>(null);
  const [mp4, setMp4] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  const canStart = !!json && !!mp4;

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = async () => {
    if (!canStart || !json || !mp4) return;

    setPhase("running");
    setProgress(0);
    setError(null);
    setAnalysisId(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const t0 = Date.now();
    timerRef.current = window.setInterval(() => {
      setProgress(computeProgress(Date.now() - t0));
    }, PROGRESS_TICK_MS);

    const form = new FormData();
    form.append("posthog-raw", json);
    form.append("session-replay", mp4);

    try {
      const res = await fetch("/api/redesign", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const payload = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;

      if (!res.ok || !payload?.id) {
        throw new Error(payload?.error ?? `Request failed (${res.status})`);
      }

      stopTimer();
      setProgress(100);
      setAnalysisId(payload.id);
      setPhase("done");
    } catch (e) {
      if (controller.signal.aborted) return;
      stopTimer();
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    stopTimer();
    setPhase("idle");
    setProgress(0);
    setAnalysisId(null);
    setError(null);
    setJson(null);
    setMp4(null);
  };

  if (phase === "running") {
    return <ProgressPanel progress={progress} onCancel={cancel} />;
  }

  if (phase === "done" && analysisId) {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ECFDF3] text-[11px] font-bold text-success-text">
            ✓
          </div>
          <div className="flex flex-1 flex-col gap-[1px]">
            <span className="text-[14px] font-semibold">Analysis complete</span>
            <span className="font-mono text-[11.5px] text-ink-subtle">{analysisId}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/analysis/${analysisId}`}
            className="rounded-lg bg-brand px-[18px] py-[10px] text-[13.5px] font-semibold text-white hover:bg-brand-hover hover:text-white"
          >
            View analysis →
          </Link>
          <button
            type="button"
            onClick={cancel}
            className="rounded-[7px] border border-line px-[14px] py-2 text-[12.5px] font-medium text-ink-subtle hover:bg-muted hover:text-ink"
          >
            Start another
          </button>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-danger-border bg-danger-bg p-6">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[14px] font-semibold text-danger-text">
            Analysis failed
          </span>
          <span className="text-[12.5px] text-ink-muted">
            {error ?? "Unknown error."}
          </span>
        </div>
        <div>
          <button
            type="button"
            onClick={cancel}
            className="rounded-[7px] border border-line bg-surface px-[14px] py-2 text-[12.5px] font-medium text-ink hover:bg-muted"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {json ? (
          <FilePreview kind="json" file={json} onClear={() => setJson(null)} />
        ) : (
          <Dropzone
            kind="json"
            title="Event export"
            description=".json from PostHog → Session replay → Export events"
            hint="JSON · MAX 500 MB"
            onFile={setJson}
          />
        )}
        {mp4 ? (
          <FilePreview kind="mp4" file={mp4} onClear={() => setMp4(null)} />
        ) : (
          <Dropzone
            kind="mp4"
            title="Session recording"
            description=".mp4 screen recording of the same session"
            hint="MP4 · H.264 · MAX 2 GB"
            onFile={setMp4}
          />
        )}
      </div>

      <div className="mt-6 flex items-center gap-[14px]">
        {canStart ? (
          <button
            type="button"
            onClick={start}
            className="cursor-pointer rounded-lg bg-brand px-[18px] py-[10px] text-[13.5px] font-semibold text-white hover:bg-brand-hover"
          >
            Start analysis
          </button>
        ) : (
          <>
            <div className="cursor-default rounded-lg bg-muted-strong px-[18px] py-[10px] text-[13.5px] font-semibold text-ink-faint">
              Start analysis
            </div>
            <span className="text-[12.5px] text-ink-faint">Both files are required</span>
          </>
        )}
      </div>
    </>
  );
}
