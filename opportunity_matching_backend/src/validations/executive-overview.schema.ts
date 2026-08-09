// src/validations/executive-overview.schema.ts
import { z } from "zod";

export const topOpportunitiesSchema = z.object({
  sectors: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type TopOpportunitiesDTO = z.infer<typeof topOpportunitiesSchema>;