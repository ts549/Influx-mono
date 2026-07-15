"use client";

import { useRef, useState, type DragEvent } from "react";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = "text/plain,.txt";

interface Props {
  onFile: (file: File) => void;
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function ContextDropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    if (!(file.type === "text/plain" || name.endsWith(".txt"))) {
      setError("Wrong file type — expected .txt.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File exceeds 20 MB limit.");
      return;
    }
    onFile(file);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDrop={(e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) accept(file);
      }}
      onDragOver={(e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        if (!isDragging) setDragging(true);
      }}
      onDragLeave={(e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        setDragging(false);
      }}
      aria-label="Workspace context — drop a .txt file or browse"
      className={`group flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center gap-[10px] rounded-[12px] border-[1.5px] border-dashed bg-surface px-6 py-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        isDragging
          ? "border-brand bg-brand-softer"
          : "border-[#D6D6DE] hover:border-brand hover:bg-brand-softer"
      }`}
    >
      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-brand-soft text-brand">
        <span className="text-[18px]">☰</span>
      </div>
      <div className="text-[14px] font-semibold text-ink">No context added yet</div>
      <div className="text-[12.5px] text-ink-subtle">
        {isDragging ? "Drop to upload" : "Drop a document or browse"}
      </div>
      <div className="font-mono text-[10.5px] tracking-[0.4px] text-ink-faint">
        TXT · MAX 20 MB
      </div>
      {error && <div className="text-[11.5px] font-medium text-danger-text">{error}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
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
  filename: string;
  size?: number;
  chipLabel: string;
  onClear: () => void;
}

export function ContextFilePreview({ filename, size, chipLabel, onClear }: FilePreviewProps) {
  return (
    <div className="relative flex min-h-[180px] w-full flex-col items-center justify-center gap-[10px] rounded-[12px] border border-line bg-surface px-6 py-8 text-center">
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove file"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-[13px] text-ink-faint hover:bg-muted hover:text-ink"
      >
        ✕
      </button>
      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-brand-soft text-brand">
        <span className="text-[18px]">☰</span>
      </div>
      <div className="flex min-w-0 flex-col items-center gap-[2px]">
        <span className="max-w-full truncate font-mono text-[13px] font-medium text-ink">
          {filename}
        </span>
        {size !== undefined && (
          <span className="text-[11.5px] text-ink-subtle">{formatSize(size)}</span>
        )}
      </div>
      <span className="rounded-[20px] bg-[#ECFDF3] px-[9px] py-[3px] text-[11px] font-semibold text-success-text">
        {chipLabel}
      </span>
    </div>
  );
}
