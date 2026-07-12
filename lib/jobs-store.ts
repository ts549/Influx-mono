import type { ChoiceAction, Finding, FindingState, Job, JobSummary } from "./types";

const SEED_FINDINGS: Finding[] = [
  {
    id: "f1",
    severity: "high",
    title: "Disabled upgrade CTA gives no path forward",
    description:
      "The user opened the upgrade modal three times and clicked the disabled “Upgrade” button repeatedly. No plan is preselected and nothing explains why the button is inactive, so the intent to pay was abandoned.",
    currentMockup: "upgrade-modal-current",
    currentCaption: "No selection state; CTA disabled with no explanation.",
    evidence: { metric: "14 rage clicks", timeRange: "02:41–03:07" },
    options: [
      {
        id: "a",
        label: "Option A",
        mockup: "upgrade-modal-preselect",
        rationale:
          "Preselect the popular plan so the CTA is always actionable, and price the button to remove cost ambiguity.",
      },
      {
        id: "b",
        label: "Option B",
        mockup: "upgrade-modal-compare",
        rationale:
          "Replace cards with a feature comparison — users hesitating at the paywall need to see what changes.",
      },
      {
        id: "c",
        label: "Option C",
        mockup: "upgrade-modal-recommended",
        rationale:
          "Cut choice overload: recommend one plan, keep the full comparison one click away.",
      },
    ],
  },
  {
    id: "f2",
    severity: "high",
    title: "Onboarding form is too long to finish",
    description:
      "The workspace setup form presents nine fields on one page. The user scrolled to the bottom, hesitated for 40 seconds at the team-invite fields, and abandoned before submitting.",
    currentMockup: "onboarding-current",
    currentCaption: "Nine required-looking fields on a single page.",
    evidence: { metric: "38% drop-off", timeRange: "04:12–06:55" },
    options: [
      {
        id: "a",
        label: "Option A",
        mockup: "onboarding-steps",
        rationale:
          "Chunk the form into three short steps with visible progress — perceived effort drops sharply.",
      },
      {
        id: "b",
        label: "Option B",
        mockup: "onboarding-essentials",
        rationale:
          "Keep one page but cut to three essentials; defer invites and preferences to after first value.",
      },
    ],
  },
  {
    id: "f3",
    severity: "medium",
    title: "Table filters are undiscoverable",
    description:
      "Filtering is hidden behind the search box. The user re-typed similar queries four times to narrow the projects table instead of filtering by status and owner, which the UI supports but never surfaces.",
    currentMockup: "table-current",
    currentCaption: "Search is the only visible way to narrow the table.",
    evidence: { metric: "4.2 searches/visit", timeRange: "07:18–09:02" },
    options: [
      {
        id: "a",
        label: "Option A",
        mockup: "table-chips",
        rationale:
          "Promote filters to a chip row above the table — the pattern users already know from Linear-style tools.",
      },
      {
        id: "b",
        label: "Option B",
        mockup: "table-facets",
        rationale:
          "A persistent facet rail with counts — heavier, but best if filtering is the primary workflow.",
      },
      {
        id: "c",
        label: "Option C",
        mockup: "table-query",
        rationale:
          "Upgrade search into a query builder with typed suggestions — powerful, but a steeper habit change.",
      },
    ],
  },
  {
    id: "f4",
    severity: "low",
    title: "Empty dashboard offers no next step",
    description:
      "On first login the dashboard shows only “No data yet.” The user idled for 40 seconds, moved the cursor across the empty panel, then left the page without connecting a data source.",
    currentMockup: "empty-current",
    currentCaption: "A dead end with no action or explanation.",
    evidence: { metric: "40s idle", timeRange: "00:12–00:52" },
    options: [
      {
        id: "a",
        label: "Option A",
        mockup: "empty-checklist",
        rationale:
          "Replace the dead end with a setup checklist — one clear next action with time expectations.",
      },
      {
        id: "b",
        label: "Option B",
        mockup: "empty-sample",
        rationale:
          "Show the dashboard populated with sample data so the value is visible before any setup work.",
      },
    ],
  },
];

const emptyState = (findings: Finding[]): Record<string, FindingState> =>
  Object.fromEntries(findings.map((f) => [f.id, { chosenOptionId: null, dismissedOptionIds: [] }]));

const SEED_JOBS: Job[] = [
  {
    id: "142",
    sessionCode: "8f3a41c2",
    source: "PostHog · web",
    durationLabel: "12m 04s",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    completedAtLabel: "completed 2h ago",
    status: "completed",
    findings: SEED_FINDINGS,
    state: emptyState(SEED_FINDINGS),
  },
];

type Store = { jobs: Map<string, Job> };

const globalForStore = globalThis as unknown as { __iteraStore?: Store };

function getStore(): Store {
  if (!globalForStore.__iteraStore) {
    globalForStore.__iteraStore = {
      jobs: new Map(SEED_JOBS.map((j) => [j.id, j])),
    };
  }
  return globalForStore.__iteraStore;
}

export function listJobs(): JobSummary[] {
  return Array.from(getStore().jobs.values())
    .map((j) => ({
      id: j.id,
      sessionCode: j.sessionCode,
      source: j.source,
      status: j.status,
      createdAt: j.createdAt,
      findingCount: j.findings.length,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJob(id: string): Job | null {
  return getStore().jobs.get(id) ?? null;
}

export function createJob(input: { source: string; sessionCode: string }): Job {
  const store = getStore();
  const nextId = String(Math.max(0, ...Array.from(store.jobs.keys()).map((k) => Number(k) || 0)) + 1);
  const job: Job = {
    id: nextId,
    sessionCode: input.sessionCode,
    source: input.source,
    durationLabel: "12m 04s",
    createdAt: new Date().toISOString(),
    completedAtLabel: "just now",
    status: "completed",
    findings: SEED_FINDINGS,
    state: emptyState(SEED_FINDINGS),
  };
  store.jobs.set(nextId, job);
  return job;
}

export function applyChoice(
  jobId: string,
  findingId: string,
  action: ChoiceAction,
): Job | null {
  const job = getJob(jobId);
  if (!job) return null;
  const current = job.state[findingId] ?? { chosenOptionId: null, dismissedOptionIds: [] };
  let next: FindingState = current;

  switch (action.type) {
    case "select":
      next = {
        ...current,
        chosenOptionId: current.chosenOptionId === action.optionId ? null : action.optionId,
      };
      break;
    case "unselect":
      next = { ...current, chosenOptionId: null };
      break;
    case "dismiss": {
      const dismissed = current.dismissedOptionIds.includes(action.optionId)
        ? current.dismissedOptionIds
        : [...current.dismissedOptionIds, action.optionId];
      next = {
        chosenOptionId: current.chosenOptionId === action.optionId ? null : current.chosenOptionId,
        dismissedOptionIds: dismissed,
      };
      break;
    }
    case "undo-dismissals":
      next = { ...current, dismissedOptionIds: [] };
      break;
  }

  job.state = { ...job.state, [findingId]: next };
  return job;
}
