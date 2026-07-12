import { z } from "zod";

export const VariantSchema = z.object({
  rationale: z.string().min(1),
  html: z.string().min(1),
});

export const TriagedAoiSchema = z.object({
  frameIndex: z.number().int().nonnegative(),
  issue: z.string().min(1),
  solution: z.string().min(1),
  featureSpecs: z.string().min(1),
});

export const TriageResponseSchema = z.object({
  aois: z.array(TriagedAoiSchema).max(3),
});

export const GenerateUiResponseSchema = z.object({
  variants: z.array(VariantSchema).min(2).max(3),
});
