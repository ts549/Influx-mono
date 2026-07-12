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

export interface TriagedAoi {
  frameIndex: number;
  issue: string;
  solution: string;
  featureSpecs: string;
}

export interface GeneratedVariant {
  rationale: string;
  html: string;
}

export interface GeneratedAoi extends TriagedAoi {
  variants: GeneratedVariant[];
}

export interface RenderedVariant {
  rationale: string;
  screenshotBase64: string;
}

export interface RenderedAoi {
  issue: string;
  solution: string;
  featureSpecs: string;
  frameIndex: number;
  variants: RenderedVariant[];
}

export interface Logger {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  flush: () => Promise<void>;
}
