// src/validations/discovery-engine.schema.ts
import { z } from "zod";

export const discoveryEngineSchema = z.object({
  sectors: z.array(z.string()).optional(),
  match_score: z.object({
      min: z.number().min(0).max(1).optional(),
      max: z.number().min(0).max(1).optional(),
    }).optional(),
  ai_decision: z.enum(["Yes", "No"]).optional(),
  location: z.array(z.string()).optional(),
  investment_range: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type DiscoveryEngineDTO = z.infer<typeof discoveryEngineSchema>;