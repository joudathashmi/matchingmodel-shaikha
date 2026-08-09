// src/validations/active-matches.schema.ts
import { z } from "zod";

export const activeMatchesSchema = z.object({
  sectors: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  ai_decision: z.enum(["Yes", "No"]).optional(),
  /** Partial match on decision_tier, e.g. "Excellent" → "Excellent Match" */
  decision_tier: z.string().trim().max(80).optional(),
  /** Excellent + Strong + Good pursue-grade pairs */
  pursue_only: z.boolean().optional(),
  final_score: z.object({
      min: z.number().min(0).max(1).optional(),
      max: z.number().min(0).max(1).optional(),
    }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type ActiveMatchesDTO = z.infer<typeof activeMatchesSchema>;