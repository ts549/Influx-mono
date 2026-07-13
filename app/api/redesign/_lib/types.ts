export interface CondensedEvent {
  tSeconds: number;
  kind: "click" | "input" | "mutation" | "scroll";
  description: string;
}

export interface Frame {
  base64: string;
  mediaType: "image/jpeg";
  tSeconds: number;
  description: string;
}

export interface AoiEvidence {
  frameIndex: number;
  tSeconds: number;
  issueDuration: number;
}

export interface AoiSolution {
  solution: string;
  featureSpecs: string;
}

export interface TriagedAoi {
  issue: string;
  summarizedEvidence: string;
  evidence: AoiEvidence[];
  solutions: AoiSolution[];
}

export interface RankedAoi extends TriagedAoi {
  timeCost: number;
  recurrence: number;
  score: number;
}

export interface GeneratedMockup {
  rationale: string;
  html: string;
}

export interface GeneratedSolution extends AoiSolution {
  mockup: GeneratedMockup;
}

export interface GeneratedAoi {
  issue: string;
  summarizedEvidence: string;
  evidence: AoiEvidence[];
  solutions: GeneratedSolution[];
}

export interface RenderedMockup {
  rationale: string;
  screenshotBase64: string;
}

export interface RenderedSolution extends AoiSolution {
  mockup: RenderedMockup;
}

export interface RenderedAoi {
  issue: string;
  summarizedEvidence: string;
  evidence: AoiEvidence[];
  frameIndex: number;
  solutions: RenderedSolution[];
}

export interface Logger {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  flush: () => Promise<void>;
}
