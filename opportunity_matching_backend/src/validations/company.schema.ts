// src\validations\company.schema.ts
import { z } from "zod";

const rangeRegex = /^\d+-\d+$/; // e.g. "1000000-10000000"

export const listCompaniesSchema = z.object({
    sectors: z.array(z.string()).optional(),
    company_size: z.object({
        min: z.number().min(0).max(100000000).optional(),
        max: z.number().min(0).max(100000000).optional(),
      }).optional(),
    revenue: z.object({
        min: z.number().min(0).max(100000000000000000000).optional(),
        max: z.number().min(0).max(100000000000000000000).optional(),
      }).optional(),

    presence_of_company_in_mena: z.boolean().optional(),
    presence_in_saudi: z.boolean().optional(),
    rhq_status: z.string().optional(),
    search: z.string().trim().max(200).optional(),

    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

export type ListCompaniesDTO = z.infer<typeof listCompaniesSchema>;

export const getCompanyDetailsSchema = z.object({
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

export const rematchCompanySchema = z
  .object({
    companyId: z.number().int().positive().optional(),
    companyName: z.string().trim().min(1).max(300).optional(),
    fast: z.boolean().optional().default(false),
    topN: z.number().int().min(1).max(20).optional().default(8),
  })
  .refine((v) => v.companyId != null || !!v.companyName, {
    message: "companyId or companyName is required",
  });

export type RematchCompanyDTO = z.infer<typeof rematchCompanySchema>;
