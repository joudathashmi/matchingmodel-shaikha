// src\modules\companies\company.service.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { ListCompaniesDTO } from "../../validations/company.schema";
import { parseProductServices } from "../../utils/stringUtils";

const prisma = new PrismaClient();

export async function getCompanyStats() {
  const totalCompanies = await prisma.company.count();

  const meenaPresence = await prisma.company.count({
    where: { presence_of_company_in_mena: true }, 
  });

  const saudiActive = await prisma.company.count({
    where: { presence_in_saudi: true},
  });

  const rhqEntities = await prisma.company.count({
    where: { rhq_license_status: "True" },
  });

  const avgRevenue = await prisma.company.aggregate({
    _avg: { revenue_usd: true },
  });

  return {
    totalCompanies,
    meenaPresence,
    saudiActive,
    rhqEntities,
    averageRevenue: avgRevenue._avg.revenue_usd ?? 0,
  };
}

export async function getMappedSectorsWithCount(status?: string) {
  let where: Prisma.CompanyWhereInput = {};

  if (status && ["completed"].includes(status.toLowerCase())) {
    where = {
      status: {
        equals: status,
        mode: Prisma.QueryMode.insensitive,
      },
    };
  }

  const grouped = await prisma.company.groupBy({
    by: ["company_sector"],
    _count: { id: true },
    where,
    orderBy: {  _count: { id: "asc" }, },
  });

  return grouped
    .map((g) => ({
      sector: g.company_sector ?? "Unknown",
      count: g._count.id,
    }))
    .sort((a, b) => a.sector.localeCompare(b.sector));
}

export async function getCompanies(filters: ListCompaniesDTO) {
  const { sectors, company_size, revenue, presence_of_company_in_mena, presence_in_saudi, rhq_status, search, page, limit } = filters;
  const skip = (page - 1) * limit;
  const q = (search || "").trim();

  let sourceSectors: string[] | undefined = undefined;

  if (sectors && sectors.length > 0 && !sectors.includes("All")) {
    const mappings = await prisma.sectorsMapping.findMany({
      where: { target_sector: { in: sectors } },
      select: { source_sector: true },
    });

    sourceSectors = mappings.map((m) => m.source_sector);
  }

  const where: Prisma.CompanyWhereInput = {
    ...(sectors && sectors.length > 0
      ? { company_sector: { in: sectors, mode: Prisma.QueryMode.insensitive } }
      : {}),
    ...(company_size
      ? {
          number_of_employees: {
            ...(company_size.min !== undefined ? { gte: company_size.min } : {}),
            ...(company_size.max !== undefined ? { lte: company_size.max } : {}),
          },
        }
      : {}),
    ...(revenue
      ? {
          revenue_usd: {
            ...(revenue.min !== undefined ? { gte: revenue.min } : {}),
            ...(revenue.max !== undefined ? { lte: revenue.max } : {}),
          },
        }
      : {}),
    ...(presence_of_company_in_mena !== undefined
      ? { presence_of_company_in_mena }
      : {}),

    ...(presence_in_saudi !== undefined
      ? { presence_in_saudi }
      : {}),

    ...(rhq_status !== undefined
      ? { rhq_status: { equals: rhq_status ? "True" : "False", mode: "insensitive" } }
      : {}),
    ...(q
      ? {
          OR: [
            { company_name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { company_sector: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      skip,
      take: limit,
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        company_name: true,
        company_sector: true,
        product_services: true,
        year_founded: true,
        global_headquarters: true,
        number_of_employees: true,
        revenue_local_currency: true,
        currency: true,
        revenue_usd: true,
        number_of_employees_parent: true,
        website_url: true,
      },
    }),
    prisma.company.count({ where }),
  ]);

  return {
    data: companies,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters,
    },
  };
}

export async function getCompanyById(id: number, userId: string, ai_decision?: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      matching_outputs: {
        where: ai_decision
          ? { ai_decision: { equals: ai_decision, mode: "insensitive" } }
          : undefined,
        include: {
          opportunity: true,
        },
      },
    },
  });

  if (!company) return null;

  const bookmark = await prisma.bookmark.findFirst({
    where: {
      userId,
      entityId: id,
      entityType: "company",
    },
  });

  return {
    ...company,
    isBookmarked: !!bookmark,
    product_services_beautified: parseProductServices(company.product_services),
  };
}
