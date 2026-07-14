"use client";

import { useRef, useState, type DragEvent } from "react";

export type DropzoneKind = "json" | "mp4";

export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const ACCEPT: Record<DropzoneKind, string> = {
  json: "application/json,.json",
  mp4: "video/mp4,.mp4",
};

const MAX_BYTES: Record<DropzoneKind, number> = {
  json: 500 * 1024 * 1024,
  mp4: 2 * 1024 * 1024 * 1024,
};

interface DropzoneProps {
  kind: DropzoneKind;
  title: string;
  description: string;
  hint: string;
  onFile: (file: File) => void;
}

function KindGlyph({ kind, size }: { kind: DropzoneKind; size: "sm" | "lg" }) {
  const dim =
    size === "lg"
      ? "h-[42px] w-[42px] rounded-[10px] text-[15px]"
      : "h-9 w-9 rounded-lg text-[12px]";
  const fontClass = kind === "json" ? "font-mono font-semibold" : "";
  return (
    <div
      className={`flex ${dim} flex-shrink-0 items-center justify-center bg-brand-soft text-brand ${fontClass}`}
    >
      {kind === "json" ? "{ }" : "▶"}
    </div>
  );
}

function isKindMatch(kind: DropzoneKind, file: File): boolean {
  const name = file.name.toLowerCase();
  if (kind === "json") return file.type === "application/json" || name.endsWith(".json");
  return file.type === "video/mp4" || name.endsWith(".mp4");
}

export function Dropzone({ kind, title, description, hint, onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File) => {
    setError(null);
    if (!isKindMatch(kind, file)) {
      setError(`Wrong file type — expected ${kind.toUpperCase()}.`);
      return;
    }
    if (file.size > MAX_BYTES[kind]) {
      setError("File exceeds the maximum size.");
      return;
    }
    onFile(file);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) accept(file);
  };

  const onDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (!isDragging) setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <button
      type="button"
      onClick={openPicker}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      aria-label={`${title} — drop a file or browse`}
      className={`group flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center gap-[10px] rounded-[12px] border-[1.5px] border-dashed bg-surface px-6 py-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        isDragging
          ? "border-brand bg-brand-softer"
          : "border-[#D6D6DE] hover:border-brand hover:bg-brand-softer"
      }`}
    >
      <KindGlyph kind={kind} size="lg" />
      <div className="mt-[2px] text-[14px] font-semibold text-ink">{title}</div>
      <div className="text-[12.5px] leading-[1.5] text-ink-subtle">{description}</div>
      <div className="mt-[6px] rounded-[7px] border border-line bg-surface px-3 py-[6px] text-[12.5px] font-medium text-ink group-hover:bg-muted">
        {isDragging ? "Drop to upload" : "Browse files"}
      </div>
      <div className="font-mono text-[10.5px] tracking-[0.4px] text-ink-faint">{hint}</div>
      {error && (
        <div className="text-[11.5px] font-medium text-danger-text">{error}</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) accept(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}

interface FilePreviewProps {
  kind: DropzoneKind;
  file: File;
  onClear: () => void;
}

export function FilePreview({ kind, file, onClear }: FilePreviewProps) {
  return (
    <div className="relative flex min-h-[260px] w-full flex-col items-center justify-center gap-[10px] rounded-[12px] border border-line bg-surface px-6 py-8 text-center">
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove file"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-[13px] text-ink-faint hover:bg-muted hover:text-ink"
      >
        ✕
      </button>
      <KindGlyph kind={kind} size="lg" />
      <div className="flex min-w-0 max-w-full flex-col items-center gap-[2px]">
        <span className="max-w-full truncate font-mono text-[13px] font-medium text-ink">
          {file.name}
        </span>
        <span className="text-[11.5px] text-ink-subtle">{formatSize(file.size)}</span>
      </div>
      <span className="rounded-[20px] bg-[#ECFDF3] px-[9px] py-[3px] text-[11px] font-semibold text-success-text">
        Ready
      </span>
    </div>
  );
}
