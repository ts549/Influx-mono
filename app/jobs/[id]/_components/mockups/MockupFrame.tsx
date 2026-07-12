import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Background color of the outer frame. Design uses #E9E9EE for upgrade modals, #F7F7F9 elsewhere. */
  tone?: "gray" | "soft";
  /** Whether the inner content should be centered (modal look). */
  center?: boolean;
  className?: string;
}

export function MockupFrame({ children, tone = "soft", center = true, className = "" }: Props) {
  return (
    <div
      className={`h-[190px] overflow-hidden rounded-panel border border-line box-border p-[14px] ${
        tone === "gray" ? "bg-[#E9E9EE] px-[18px] py-4" : "bg-muted-soft"
      } ${center ? "flex items-center justify-center" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
