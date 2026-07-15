"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Workspace } from "@/lib/workspaces-store";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";

interface NavItem {
  label: string;
  icon: string;
  href: string;
  activeFor?: string[];
}

const NAV: NavItem[] = [
  { label: "Overview", icon: "◫", href: "/" },
  { label: "Sessions", icon: "▸", href: "/sessions" },
  { label: "Upload", icon: "↑", href: "/upload" },
  { label: "Settings", icon: "⚙", href: "/settings" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "#") return false;
  if (pathname === item.href) return true;
  if (pathname.startsWith(`${item.href}/`)) return true;
  return item.activeFor?.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

interface Props {
  currentWorkspace: string;
  workspaces: Workspace[];
}

export function Sidebar({ currentWorkspace, workspaces }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleSwitch = async (name: string) => {
    if (name === currentWorkspace || switchingTo) return;
    setSwitchingTo(name);
    try {
      const res = await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <aside className="flex w-[232px] flex-shrink-0 flex-col bg-sidebar px-3 pb-4 pt-5">
      <div className="flex items-center gap-[9px] px-2 pb-[18px]">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-brand text-[13px] font-bold text-white">
          i
        </div>
        <div className="text-[15px] font-semibold tracking-[-0.2px] text-sidebar-textStrong">
          Influx
        </div>
      </div>

      <div className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-sidebar-textFaint">
        Workspaces
      </div>

      <div className="flex flex-col gap-[2px]">
        {workspaces.map((w) => {
          const active = w.name === currentWorkspace;
          const isSwitching = switchingTo === w.name;
          return (
            <button
              key={w.name}
              type="button"
              onClick={() => handleSwitch(w.name)}
              disabled={active || switchingTo !== null}
              className={
                active
                  ? "flex items-center gap-[10px] rounded-[7px] border border-sidebar-borderStrong bg-sidebar-raised px-[10px] py-2 text-left text-[12.5px] font-medium text-sidebar-text"
                  : "flex items-center gap-[10px] rounded-[7px] px-[10px] py-2 text-left text-[12.5px] text-sidebar-textMuted transition-colors hover:bg-sidebar-raised hover:text-sidebar-text disabled:opacity-60"
              }
            >
              <div
                className={
                  active
                    ? "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] bg-sidebar-chip text-[10px] font-semibold text-[#C9C9D2]"
                    : "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] bg-sidebar-chip/50 text-[10px] font-semibold text-sidebar-textMuted"
                }
              >
                {w.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{w.name}</span>
              {isSwitching && (
                <span className="ml-auto text-[10px] text-sidebar-textFaint">…</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setCreatingWorkspace(true)}
        className="mb-[18px] mt-1 flex items-center gap-[10px] rounded-[7px] px-[10px] py-2 text-[13px] text-sidebar-textMuted hover:bg-sidebar-raised hover:text-sidebar-text"
      >
        <span className="w-[14px] text-center">+</span>
        New workspace
      </button>

      <div className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-sidebar-textFaint">
        Workspace
      </div>

      <nav className="flex flex-col gap-[2px]">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-[10px] rounded-[7px] bg-brand/[0.16] px-[10px] py-2 text-[13px] font-medium text-sidebar-textOnActive"
                  : "flex items-center gap-[10px] rounded-[7px] px-[10px] py-2 text-[13px] text-sidebar-textMuted hover:bg-sidebar-raised hover:text-sidebar-text"
              }
            >
              <span className="w-[14px] text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-[10px] border-t border-sidebar-border px-2 py-[10px]">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-sidebar-chip text-[11px] font-semibold text-sidebar-text">
          DF
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="text-[12px] font-medium text-sidebar-text">Dana Fisher</span>
          <span className="text-[11px] text-sidebar-textFaint">dana@acme.io</span>
        </div>
      </div>

      {creatingWorkspace && (
        <CreateWorkspaceModal onClose={() => setCreatingWorkspace(false)} />
      )}
    </aside>
  );
}
