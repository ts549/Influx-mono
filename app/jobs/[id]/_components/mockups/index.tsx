import type { MockupKind } from "@/lib/types";
import { MockupFrame } from "./MockupFrame";

export function MockupPreview({ kind }: { kind: MockupKind }) {
  switch (kind) {
    case "upgrade-modal-current":
      return <UpgradeModalCurrent />;
    case "upgrade-modal-preselect":
      return <UpgradeModalPreselect />;
    case "upgrade-modal-compare":
      return <UpgradeModalCompare />;
    case "upgrade-modal-recommended":
      return <UpgradeModalRecommended />;
    case "onboarding-current":
      return <OnboardingCurrent />;
    case "onboarding-steps":
      return <OnboardingSteps />;
    case "onboarding-essentials":
      return <OnboardingEssentials />;
    case "table-current":
      return <TableCurrent />;
    case "table-chips":
      return <TableChips />;
    case "table-facets":
      return <TableFacets />;
    case "table-query":
      return <TableQuery />;
    case "empty-current":
      return <EmptyCurrent />;
    case "empty-checklist":
      return <EmptyChecklist />;
    case "empty-sample":
      return <EmptySample />;
  }
}

// ---------- Upgrade modal ----------

function PlanCard({
  name,
  price,
  selected = false,
  radio,
}: {
  name: string;
  price: string;
  selected?: boolean;
  radio?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-[5px] p-[7px_6px] ${
        selected ? "border-[1.5px] border-brand bg-brand-softer" : "border border-line-soft"
      }`}
    >
      <span
        className={`text-[8px] ${
          selected ? "font-semibold text-brand" : "text-ink-subtle"
        }`}
      >
        {radio ? `${radio} ${name}` : name}
      </span>
      <span className="text-[9.5px] font-semibold">{price}</span>
      <div
        className={`h-[3px] rounded-[2px] ${selected ? "bg-brand-ring" : "bg-line-softer"}`}
      />
      <div
        className={`h-[3px] w-[70%] rounded-[2px] ${
          selected ? "bg-brand-ring" : "bg-line-softer"
        }`}
      />
    </div>
  );
}

function UpgradeModalShell({ children }: { children: React.ReactNode }) {
  return (
    <MockupFrame tone="gray">
      <div className="flex w-full flex-col gap-[9px] rounded-lg bg-surface p-3 shadow-mockup">
        {children}
      </div>
    </MockupFrame>
  );
}

function UpgradeModalCurrent() {
  return (
    <UpgradeModalShell>
      <div className="text-[10px] font-semibold">Upgrade workspace</div>
      <div className="grid grid-cols-3 gap-[6px]">
        <PlanCard name="Free" price="$0" />
        <PlanCard name="Pro" price="$12" />
        <PlanCard name="Business" price="$29" />
      </div>
      <div className="flex justify-end">
        <span className="rounded-[4px] bg-muted-strong px-[10px] py-1 text-[8.5px] font-semibold text-[#B4B4BC]">
          Upgrade
        </span>
      </div>
    </UpgradeModalShell>
  );
}

function UpgradeModalPreselect() {
  return (
    <UpgradeModalShell>
      <div className="text-[10px] font-semibold">Upgrade workspace</div>
      <div className="grid grid-cols-3 gap-[6px]">
        <PlanCard name="Free" price="$0" radio="○" />
        <PlanCard name="Pro" price="$12" radio="◉" selected />
        <PlanCard name="Business" price="$29" radio="○" />
      </div>
      <div className="flex justify-end">
        <span className="rounded-[4px] bg-brand px-[10px] py-1 text-[8.5px] font-semibold text-white">
          Upgrade to Pro — $12/seat
        </span>
      </div>
    </UpgradeModalShell>
  );
}

function UpgradeModalCompare() {
  return (
    <MockupFrame tone="gray">
      <div className="flex w-full flex-col gap-[7px] rounded-lg bg-surface p-3 shadow-mockup">
        <div className="text-[10px] font-semibold">Compare plans</div>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-1 text-[7.5px] text-ink-subtle">
          <span />
          <span className="font-semibold text-ink">Pro $12</span>
          <span className="font-semibold text-ink">Biz $29</span>
          <span>Unlimited replays</span>
          <span className="text-success-text">✓</span>
          <span className="text-success-text">✓</span>
          <span>AI mockups</span>
          <span className="text-success-text">✓</span>
          <span className="text-success-text">✓</span>
          <span>SSO &amp; audit log</span>
          <span className="text-ink-fainter">—</span>
          <span className="text-success-text">✓</span>
          <span>Seats included</span>
          <span>10</span>
          <span>50</span>
        </div>
        <div className="flex items-center justify-between border-t border-line-softest pt-[6px]">
          <span className="text-[7.5px] text-ink-faint">Billed yearly</span>
          <span className="rounded-[4px] bg-brand px-[10px] py-1 text-[8.5px] font-semibold text-white">
            Choose Pro
          </span>
        </div>
      </div>
    </MockupFrame>
  );
}

function UpgradeModalRecommended() {
  return (
    <MockupFrame tone="gray">
      <div className="flex w-[78%] flex-col items-center gap-2 rounded-lg bg-surface px-3 py-[14px] text-center shadow-mockup">
        <span className="rounded-[10px] bg-brand-soft px-2 py-[2px] text-[7.5px] font-semibold text-brand">
          Recommended
        </span>
        <div className="text-[11px] font-semibold">
          Pro — $12
          <span className="text-[7.5px] font-normal text-ink-subtle">/seat/mo</span>
        </div>
        <div className="flex w-4/5 flex-col gap-[3px]">
          <div className="h-[3px] rounded-[2px] bg-line-softer" />
          <div className="h-[3px] rounded-[2px] bg-line-softer" />
          <div className="h-[3px] w-[60%] self-center rounded-[2px] bg-line-softer" />
        </div>
        <span className="rounded-[4px] bg-brand px-[14px] py-[5px] text-[8.5px] font-semibold text-white">
          Upgrade to Pro
        </span>
        <span className="text-[7.5px] text-brand">Compare all plans →</span>
      </div>
    </MockupFrame>
  );
}

// ---------- Onboarding ----------

function OnboardingShell({
  width = "82%",
  children,
}: {
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <MockupFrame center={false} className="justify-center">
      <div
        className="flex flex-col gap-[6px] rounded-lg border border-line-soft bg-surface p-3"
        style={{ width }}
      >
        {children}
      </div>
    </MockupFrame>
  );
}

function FieldRow() {
  return <div className="h-[14px] rounded-[4px] border border-line-soft" />;
}

function OnboardingCurrent() {
  return (
    <MockupFrame center={false} className="justify-center">
      <div className="flex w-[82%] flex-col gap-[6px] rounded-lg border border-line-soft bg-surface p-3">
        <div className="text-[10px] font-semibold">Set up your workspace</div>
        <FieldRow />
        <FieldRow />
        <FieldRow />
        <FieldRow />
        <FieldRow />
        <FieldRow />
        <div className="text-center text-[7px] text-ink-fainter">
          + 3 more fields below the fold
        </div>
      </div>
    </MockupFrame>
  );
}

function StepDot({ n, active = false }: { n: number; active?: boolean }) {
  return (
    <span
      className={`flex h-[14px] w-[14px] items-center justify-center rounded-full text-[7px] font-semibold ${
        active ? "bg-brand text-white" : "bg-line-softer text-ink-faint"
      }`}
    >
      {n}
    </span>
  );
}

function OnboardingSteps() {
  return (
    <OnboardingShell>
      <div className="flex items-center gap-1">
        <StepDot n={1} active />
        <div className="h-[2px] flex-1 bg-brand-ring" />
        <StepDot n={2} />
        <div className="h-[2px] flex-1 bg-line-softer" />
        <StepDot n={3} />
      </div>
      <div className="text-[10px] font-semibold">Workspace basics</div>
      <div className="text-[7px] text-ink-faint">Step 1 of 3 · 30 seconds</div>
      <FieldRow />
      <FieldRow />
      <div className="rounded-[4px] bg-brand py-[5px] text-center text-[8.5px] font-semibold text-white">
        Continue
      </div>
    </OnboardingShell>
  );
}

function OnboardingEssentials() {
  return (
    <OnboardingShell>
      <div className="text-[10px] font-semibold">Set up your workspace</div>
      <div className="text-[7px] text-ink-faint">
        Just the essentials — everything else can wait.
      </div>
      <FieldRow />
      <FieldRow />
      <FieldRow />
      <div className="flex justify-between rounded-[4px] border border-dashed border-line px-[6px] py-1 text-[7px] text-ink-subtle">
        <span>Invite teammates (optional)</span>
        <span>▸</span>
      </div>
      <div className="rounded-[4px] bg-brand py-[5px] text-center text-[8.5px] font-semibold text-white">
        Create workspace
      </div>
    </OnboardingShell>
  );
}

// ---------- Table ----------

function TableRow({ cols = 3 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      <div className="h-[1px] flex-[2]" />
      <div className="h-[4px] flex-[2] rounded-[2px] bg-line-soft" />
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <div key={i} className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
      ))}
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <MockupFrame center={false} className="!p-[14px]">
      <div className="box-border flex h-full w-full flex-col gap-[6px] rounded-lg border border-line-soft bg-surface p-[10px]">
        {children}
      </div>
    </MockupFrame>
  );
}

function ColumnHeader() {
  return (
    <div className="flex gap-[6px] border-b border-line-softest pb-[3px] text-[7px] text-ink-faint">
      <span className="flex-[2]">NAME</span>
      <span className="flex-1">STATUS</span>
      <span className="flex-1">OWNER</span>
    </div>
  );
}

function BasicRows({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-[6px]">
          <div className="h-[4px] flex-[2] rounded-[2px] bg-line-soft" />
          <div className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
          <div className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
        </div>
      ))}
    </>
  );
}

function TableCurrent() {
  return (
    <TableShell>
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-semibold">Projects</span>
        <div className="w-[70px] rounded-[4px] border border-line-soft px-2 py-[3px] text-[7.5px] text-ink-fainter">
          Search…
        </div>
      </div>
      <ColumnHeader />
      <BasicRows count={4} />
    </TableShell>
  );
}

function TableChips() {
  return (
    <TableShell>
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-semibold">Projects</span>
        <div className="w-[70px] rounded-[4px] border border-line-soft px-2 py-[3px] text-[7.5px] text-ink-fainter">
          Search…
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="rounded-[10px] bg-brand-soft px-[7px] py-[2px] text-[7px] font-medium text-brand">
          Status: Active ✕
        </span>
        <span className="rounded-[10px] border border-line-soft px-[7px] py-[2px] text-[7px] font-medium text-ink-subtle">
          Owner ▾
        </span>
        <span className="rounded-[10px] border border-line-soft px-[7px] py-[2px] text-[7px] font-medium text-ink-subtle">
          Last 7 days ▾
        </span>
        <span className="rounded-[10px] px-[7px] py-[2px] text-[7px] font-medium text-ink-faint">
          + Filter
        </span>
      </div>
      <ColumnHeader />
      <BasicRows count={3} />
    </TableShell>
  );
}

function TableFacets() {
  return (
    <MockupFrame center={false} className="!p-[14px]">
      <div className="box-border flex h-full w-full gap-2 rounded-lg border border-line-soft bg-surface p-[10px]">
        <div className="flex w-[34%] flex-col gap-[5px] border-r border-line-softest pr-[6px]">
          <span className="text-[7px] font-semibold text-ink-faint">STATUS</span>
          <span className="text-[7px] text-ink">
            ☑ Active <span className="text-ink-faint">128</span>
          </span>
          <span className="text-[7px] text-ink-subtle">
            ☐ Paused <span className="text-ink-faint">42</span>
          </span>
          <span className="text-[7px] text-ink-subtle">
            ☐ Archived <span className="text-ink-faint">311</span>
          </span>
          <span className="mt-[3px] text-[7px] font-semibold text-ink-faint">OWNER</span>
          <span className="text-[7px] text-ink-subtle">
            ☐ Me <span className="text-ink-faint">36</span>
          </span>
          <span className="text-[7px] text-ink-subtle">
            ☐ My team <span className="text-ink-faint">90</span>
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-[6px]">
          <span className="text-[9.5px] font-semibold">Projects</span>
          <div className="flex gap-[6px] border-b border-line-softest pb-[3px] text-[7px] text-ink-faint">
            <span className="flex-[2]">NAME</span>
            <span className="flex-1">STATUS</span>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-[6px]">
              <div className="h-[4px] flex-[2] rounded-[2px] bg-line-soft" />
              <div className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

function TableQuery() {
  return (
    <MockupFrame center={false} className="!p-[14px]">
      <div className="relative box-border flex h-full w-full flex-col gap-[6px] rounded-lg border border-line-soft bg-surface p-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-semibold">Projects</span>
          <div className="flex w-[96px] justify-between rounded-[4px] border border-brand-border px-2 py-[3px] text-[7.5px] text-ink-subtle">
            <span>status:active</span>
            <span className="font-mono text-ink-faint">⌘K</span>
          </div>
        </div>
        <div className="absolute right-[10px] top-[26px] z-[2] flex w-[110px] flex-col gap-[3px] rounded-[5px] border border-line-soft bg-surface p-[5px] shadow-menu">
          <span className="text-[6.5px] font-semibold text-ink-faint">SUGGESTED</span>
          <span className="rounded-[3px] bg-brand-soft px-[5px] py-[2px] text-[7px] text-ink">
            status: active
          </span>
          <span className="px-[5px] py-[2px] text-[7px] text-ink-subtle">owner: me</span>
          <span className="px-[5px] py-[2px] text-[7px] text-ink-subtle">
            updated: last 7 days
          </span>
        </div>
        <ColumnHeader />
        <BasicRows count={3} />
      </div>
    </MockupFrame>
  );
}

// ---------- Empty ----------

function EmptyShell({ children }: { children: React.ReactNode }) {
  return (
    <MockupFrame center={false} className="!p-[14px]">
      <div className="box-border flex h-full w-full flex-col gap-[7px] justify-center rounded-lg border border-line-soft bg-surface p-3">
        {children}
      </div>
    </MockupFrame>
  );
}

function EmptyCurrent() {
  return (
    <MockupFrame center={false} className="!p-[14px]">
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border border-line-soft bg-surface">
        <span className="text-[9px] text-ink-faint">No data yet</span>
      </div>
    </MockupFrame>
  );
}

function EmptyChecklist() {
  return (
    <EmptyShell>
      <div className="text-[10px] font-semibold">Get set up in 3 steps</div>
      <div className="flex items-center gap-[5px] text-[7.5px]">
        <span className="flex h-[11px] w-[11px] items-center justify-center rounded-full bg-brand text-[6px] text-white">
          ✓
        </span>
        <span className="text-ink-faint line-through">Create your workspace</span>
      </div>
      <div className="flex items-center gap-[5px] text-[7.5px]">
        <span className="box-border h-[11px] w-[11px] rounded-full border border-brand" />
        <span className="font-medium text-ink">Connect a data source</span>
        <span className="ml-auto text-brand">2 min →</span>
      </div>
      <div className="flex items-center gap-[5px] text-[7.5px]">
        <span className="box-border h-[11px] w-[11px] rounded-full border border-line" />
        <span className="text-ink-subtle">Invite your team</span>
      </div>
      <div className="mt-[3px] h-[3px] rounded-[2px] bg-line-softer">
        <div className="h-full w-1/3 rounded-[2px] bg-brand" />
      </div>
      <span className="text-[6.5px] text-ink-faint">1 of 3 complete</span>
    </EmptyShell>
  );
}

function EmptySample() {
  return (
    <MockupFrame center={false} className="!p-[14px]">
      <div className="box-border flex h-full w-full flex-col gap-[6px] rounded-lg border border-line-soft bg-surface p-[10px]">
        <div className="flex items-center justify-between rounded-[4px] bg-brand-soft px-[7px] py-1">
          <span className="text-[7px] font-medium text-brand">Viewing sample data</span>
          <span className="rounded-[3px] bg-brand px-[7px] py-[2px] text-[7px] font-semibold text-white">
            Connect source
          </span>
        </div>
        <span className="text-[8.5px] font-semibold opacity-55">Weekly active users</span>
        <div className="flex flex-1 items-end gap-1 pb-[2px] opacity-[0.45]">
          {[30, 45, 38, 60, 52, 74, 68].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px] bg-brand-border"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex gap-[6px] opacity-[0.45]">
          <div className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
          <div className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
          <div className="h-[4px] flex-1 rounded-[2px] bg-line-soft" />
        </div>
      </div>
    </MockupFrame>
  );
}
