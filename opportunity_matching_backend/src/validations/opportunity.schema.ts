// src/validations/opportunity.schema.ts
import { z } from "zod";

export const opportunitySchema = z.object({
  sectors: z.array(z.string()).optional(),
  ai_score: z.object({
    min: z.number().min(0).max(1).optional(),
    max: z.number().min(0).max(1).optional(),
  }).optional(),
  investment_range: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  sort_by: z.enum(["score", "name", "sector"]).default("score").optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc").optional(),
  search: z.string().trim().max(200).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type OpportunityDTO = z.infer<typeof opportunitySchema>;

export const getOpportunityDetailsSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, { message: "ID must be a number" })
      .transform(Number),
  }),
  query: z.object({
    ai_decision: z.enum(["Yes", "No"]).optional(),
  }),
});