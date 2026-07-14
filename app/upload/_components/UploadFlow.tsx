"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Dropzone, FilePreview, formatSize } from "./Dropzone";
import { ProgressPanel } from "./ProgressPanel";

type Phase = "idle" | "running" | "done" | "error";

interface QueuedSession {
  id: string;
  json: File;
  mp4: File;
  /** null while still counting; -1 if parse failed. */
  eventCount: number | null;
}

async function countJsonEvents(file: File): Promise<number | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") {
      const snapshots = (parsed as { data?: { snapshots?: unknown } }).data?.snapshots;
      if (Array.isArray(snapshots)) return snapshots.length;
    }
    return -1;
  } catch {
    return -1;
  }
}

const PROGRESS_CAP = 99;
const PROGRESS_TICK_MS = 300;

/** Ease progress toward the cap so it slows down instead of stalling at max. */
function computeProgress(elapsedMs: number): number {
  const pct = PROGRESS_CAP * (1 - Math.exp(-elapsedMs / 30_000));
  return Math.min(PROGRESS_CAP, Math.max(0, pct));
}

export function UploadFlow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pendingJson, setPendingJson] = useState<File | null>(null);
  const [pendingMp4, setPendingMp4] = useState<File | null>(null);
  const [queue, setQueue] = useState<QueuedSession[]>([]);
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

  const canAddSession = !!pendingJson && !!pendingMp4;
  const canAnalyze = queue.length > 0;

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const addSession = () => {
    if (!canAddSession || !pendingJson || !pendingMp4) return;
    const id = crypto.randomUUID();
    setQueue((prev) => [
      ...prev,
      { id, json: pendingJson, mp4: pendingMp4, eventCount: null },
    ]);
    setPendingJson(null);
    setPendingMp4(null);

    countJsonEvents(pendingJson).then((count) => {
      setQueue((prev) =>
        prev.map((s) => (s.id === id ? { ...s, eventCount: count ?? -1 } : s)),
      );
    });
  };

  const removeSession = (id: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== id));
  };

  const start = async () => {
    if (!canAnalyze) return;

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
    for (const s of queue) {
      form.append("posthog-raw", s.json);
      form.append("session-replay", s.mp4);
    }

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

  const reset = () => {
    abortRef.current?.abort();
    stopTimer();
    setPhase("idle");
    setProgress(0);
    setAnalysisId(null);
    setError(null);
    setPendingJson(null);
    setPendingMp4(null);
    setQueue([]);
  };

  const cancelRun = () => {
    abortRef.current?.abort();
    stopTimer();
    setPhase("idle");
    setProgress(0);
    setAnalysisId(null);
    setError(null);
  };

  if (phase === "running") {
    return <ProgressPanel progress={progress} onCancel={cancelRun} />;
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
            href={`/sessions/analysis/${analysisId}`}
            className="rounded-lg bg-brand px-[18px] py-[10px] text-[13.5px] font-semibold text-white hover:bg-brand-hover hover:text-white"
          >
            View analysis →
          </Link>
          <button
            type="button"
            onClick={reset}
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
            onClick={cancelRun}
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
      <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[12px] text-ink-faint">
            {canAddSession
              ? "Ready to queue this session."
              : "Both files are required to queue a session"}
          </span>
          <button
            type="button"
            onClick={addSession}
            disabled={!canAddSession}
            className={`rounded-[7px] px-[14px] py-2 text-[12.5px] font-semibold transition-colors ${
              canAddSession
                ? "cursor-pointer bg-ink text-white hover:bg-ink-muted"
                : "cursor-default bg-muted-strong text-ink-faint"
            }`}
          >
            Queue session
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {pendingJson ? (
            <FilePreview
              kind="json"
              file={pendingJson}
              onClear={() => setPendingJson(null)}
            />
          ) : (
            <Dropzone
              kind="json"
              title="Event export"
              description="Drop .json or browse"
              hint="JSON · MAX 500 MB"
              onFile={setPendingJson}
            />
          )}
          {pendingMp4 ? (
            <FilePreview
              kind="mp4"
              file={pendingMp4}
              onClear={() => setPendingMp4(null)}
            />
          ) : (
            <Dropzone
              kind="mp4"
              title="Session recording"
              description="Drop .mp4 or browse"
              hint="MP4 · H.264 · MAX 2 GB"
              onFile={setPendingMp4}
            />
          )}
        </div>
      </section>

      {queue.length > 0 && (
        <section className="mt-8 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="m-0 text-[15px] font-semibold tracking-[-0.2px]">
              Queued sessions
            </h2>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11.5px] text-ink-subtle">
                {queue.length}&nbsp;session{queue.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={start}
                disabled={!canAnalyze}
                className={`rounded-lg px-[18px] py-[10px] text-[13.5px] font-semibold transition-colors ${
                  canAnalyze
                    ? "cursor-pointer bg-brand text-white hover:bg-brand-hover"
                    : "cursor-default bg-muted-strong text-ink-faint"
                }`}
              >
                Analyze sessions
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {queue
              .map((s, i) => ({ s, i }))
              .reverse()
              .map(({ s, i }) => (
                <QueuedSessionRow
                  key={s.id}
                  index={i}
                  session={s}
                  onRemove={() => removeSession(s.id)}
                />
              ))}
          </div>
        </section>
      )}
    </>
  );
}

function formatEventCount(count: number | null): string {
  if (count === null) return "counting…";
  if (count < 0) return "events unknown";
  return `${count.toLocaleString("en-US")} events`;
}

function QueuedSessionRow({
  index,
  session,
  onRemove,
}: {
  index: number;
  session: QueuedSession;
  onRemove: () => void;
}) {
  const label = String(index + 1).padStart(2, "0");
  return (
    <div className="flex items-center gap-4 rounded-[10px] border border-line bg-surface px-4 py-3">
      <span className="font-mono text-[11px] font-semibold text-ink-faint">{label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate font-mono text-[12.5px] text-ink">
          {session.json.name}
          <span className="mx-[6px] text-ink-faint">+</span>
          {session.mp4.name}
        </span>
        <span className="font-mono text-[11px] text-ink-subtle">
          {formatSize(session.json.size)}
          <span className="mx-[6px] text-ink-faint">·</span>
          {formatEventCount(session.eventCount)}
          <span className="mx-[6px] text-ink-faint">·</span>
          {formatSize(session.mp4.size)}
        </span>
      </div>
      <span className="rounded-[20px] bg-[#ECFDF3] px-[9px] py-[3px] text-[11px] font-semibold text-success-text">
        Ready
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove session ${label}`}
        className="flex h-6 w-6 items-center justify-center rounded-md text-[13px] text-ink-faint hover:bg-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
