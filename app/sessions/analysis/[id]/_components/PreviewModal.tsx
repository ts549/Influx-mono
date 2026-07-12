"use client";

import { useEffect } from "react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

export function PreviewModal({ src, alt, onClose }: Props) {
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
