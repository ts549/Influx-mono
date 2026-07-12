import Link from "next/link";

type NavItem = { label: string; icon: string; href: string; active?: boolean };

const NAV: NavItem[] = [
  { label: "Overview", icon: "◫", href: "#" },
  { label: "Sessions", icon: "▸", href: "#" },
  { label: "Analyses", icon: "✦", href: "/jobs/142", active: true },
  { label: "Upload", icon: "↑", href: "/upload" },
  { label: "Settings", icon: "⚙", href: "#" },
];

export function Sidebar() {
  return (
    <aside className="flex w-[232px] flex-shrink-0 flex-col bg-sidebar px-3 pb-4 pt-5">
      <div className="flex items-center gap-[9px] px-2 pb-[18px]">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-brand text-[13px] font-bold text-white">
          i
        </div>
        <div className="text-[15px] font-semibold tracking-[-0.2px] text-sidebar-textStrong">
          itera
        </div>
      </div>

      <button
        type="button"
        className="mb-[18px] flex items-center justify-between rounded-lg border border-sidebar-borderStrong bg-sidebar-raised px-[10px] py-2 transition-colors hover:bg-sidebar-hover"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-sidebar-chip text-[10px] font-semibold text-[#C9C9D2]">
            A
          </div>
          <span className="text-[12.5px] font-medium text-sidebar-text">acme-web</span>
        </div>
        <span className="text-[10px] text-sidebar-textFaint">▾</span>
      </button>

      <div className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-sidebar-textFaint">
        Workspace
      </div>

      <nav className="flex flex-col gap-[2px]">
        {NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              item.active
                ? "flex items-center gap-[10px] rounded-[7px] bg-brand/[0.16] px-[10px] py-2 text-[13px] font-medium text-sidebar-textOnActive"
                : "flex items-center gap-[10px] rounded-[7px] px-[10px] py-2 text-[13px] text-sidebar-textMuted hover:bg-sidebar-raised hover:text-sidebar-text"
            }
          >
            <span className="w-[14px] text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
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
    </aside>
  );
}
