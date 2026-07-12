export type Severity = "high" | "medium" | "low";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type MockupKind =
  | "upgrade-modal-current"
  | "upgrade-modal-preselect"
  | "upgrade-modal-compare"
  | "upgrade-modal-recommended"
  | "onboarding-current"
  | "onboarding-steps"
  | "onboarding-essentials"
  | "table-current"
  | "table-chips"
  | "table-facets"
  | "table-query"
  | "empty-current"
  | "empty-checklist"
  | "empty-sample";

export interface Evidence {
  metric: string;
  timeRange: string;
}

export interface Option {
  id: string;
  label: string;
  mockup: MockupKind;
  rationale: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  currentMockup: MockupKind;
  currentCaption: string;
  evidence: Evidence;
  options: Option[];
}

export interface FindingState {
  chosenOptionId: string | null;
  dismissedOptionIds: string[];
}

export interface Job {
  id: string;
  sessionCode: string;
  source: string;
  durationLabel: string;
  createdAt: string;
  completedAtLabel: string;
  status: JobStatus;
  findings: Finding[];
  state: Record<string, FindingState>;
}

export interface JobSummary {
  id: string;
  sessionCode: string;
  source: string;
  status: JobStatus;
  createdAt: string;
  findingCount: number;
}

export type ChoiceAction =
  | { type: "select"; optionId: string }
  | { type: "unselect" }
  | { type: "dismiss"; optionId: string }
  | { type: "undo-dismissals" };
