import { z } from "zod";

export const MockupSchema = z.object({
  rationale: z.string().min(1),
  html: z.string().min(1),
});

export const AoiEvidenceSchema = z.object({
  frameIndex: z.number().int().nonnegative(),
  tSeconds: z.number().nonnegative(),
  issueDuration: z.number().nonnegative(),
});

export const AoiSolutionSchema = z.object({
  solution: z.string().min(1),
  featureSpecs: z.string().min(1),
});

export const TriagedAoiSchema = z.object({
  issue: z.string().min(1),
  summarizedEvidence: z.string().min(1),
  evidence: z.array(AoiEvidenceSchema).min(1),
  solutions: z.array(AoiSolutionSchema).min(1).max(3),
});

export const TriageResponseSchema = z.object({
  aois: z.array(TriagedAoiSchema).max(3),
});

export const GenerateUiResponseSchema = MockupSchema;
