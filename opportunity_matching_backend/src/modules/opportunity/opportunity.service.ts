import { Prisma } from "@prisma/client";
import { OpportunityDTO } from "../../validations/opportunity.schema";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { parseAiExplanationNew, normalizeArrayString } from "../../utils/stringUtils";
import { prisma } from "./../../lib/prisma";



function normalizeSector(raw: string | null | undefined): string { 
  if (!raw) return ""; 
  let s = raw.toLowerCase(); 
  return s; 
}

export async function getMappedSectorsWithCount(ai_decision?: string, topRank?: number) {
  const mappings = await prisma.sectorsMapping.findMany({
    select: { target_sector: true, source_sector: true },
  });

  const mappingDict: Record<string, string> = {};
  for (const m of mappings) {
    mappingDict[normalizeSector(m.source_sector)] = m.target_sector;
  }

  let where: Prisma.MatchingOutputWhereInput = {};

  if (ai_decision && ["yes", "no"].includes(ai_decision.toLowerCase())) {
    where = {
      ai_decision: {
        equals: ai_decision,
        mode: Prisma.QueryMode.insensitive,
      },
    };
  }

  if (typeof topRank === "number") {
    where.rank = topRank;
  }

  const grouped = await prisma.matchingOutput.groupBy({
    by: ["opportunity_sector"],
    _count: { id: true },
    where,
  });

  const sectorCounts: Record<string, number> = {};
  const unmapped: { sector: string; count: number }[] = [];

  for (const g of grouped) {
    const normalized = normalizeSector(g.opportunity_sector ?? "");
    const target = mappingDict[normalized];

    if (target) {
      sectorCounts[target] = (sectorCounts[target] || 0) + g._count.id;
    } else {
      unmapped.push({
        sector: g.opportunity_sector ?? "Unknown",
        count: g._count.id,
      });
    }
  }

  if (unmapped.length > 0) {
    console.warn("⚠️ Unmapped opportunity sectors:", unmapped);
  }

  return Object.entries(sectorCounts)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getOpportunities(body: OpportunityDTO, userId: string) {
  const sectors = body.sectors;
  const ai_score = body.ai_score;
  const investment_range = body.investment_range;
  const sort_by = body.sort_by || "score";
  const sort_order = body.sort_order || "desc";
  const search = body.search;
  const page = body.page || 1;
  const limit = body.limit || 10;
  const skip = (page - 1) * limit;
  const q = (search || "").trim();

  // -------------------------------
  // 1. Sector mappings
  // -------------------------------
  let sourceSectors: string[] | undefined = undefined;

  if (sectors && sectors.length > 0 && !sectors.includes("All")) {
    const mappings = await prisma.sectorsMapping.findMany({
      where: { target_sector: { in: sectors } },
      select: { source_sector: true },
    });

    sourceSectors = mappings.map((m) => m.source_sector);
  }

  // -------------------------------
  // 2. Common where filter
  // -------------------------------
  const opportunityNameFilter = q
    ? {
        OR: [
          { opportunity_name: { contains: q, mode: "insensitive" as const } },
          { sector: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const where: Prisma.MatchingOutputWhereInput = {
    ...(sourceSectors && sourceSectors.length > 0
      ? { opportunity_sector: { in: sourceSectors, mode: Prisma.QueryMode.insensitive } }
      : {}),
    ...(ai_score
      ? {
          final_score: {
            ...(ai_score.min !== undefined ? { gte: ai_score.min } : {}),
            ...(ai_score.max !== undefined ? { lte: ai_score.max } : {}),
          },
        }
      : {}),
    ...(investment_range || opportunityNameFilter
      ? {
          opportunity: {
            ...(investment_range
              ? { investment_highlights: { not: null } }
              : {}),
            ...(opportunityNameFilter || {}),
          },
        }
      : {}),
  };

  // -------------------------------
  // 3. Sorting by NAME / text search (Opportunity-level)
  // -------------------------------
  if (sort_by === "name" || q) {
    const opportunityWhere: Prisma.OpportunityWhereInput = {
      ...(sourceSectors && sourceSectors.length > 0
        ? { sector: { in: sourceSectors, mode: "insensitive" as const } }
        : {}),
      ...(ai_score
        ? {
            matching_outputs: {
              some: {
                final_score: {
                  ...(ai_score.min !== undefined ? { gte: ai_score.min } : {}),
                  ...(ai_score.max !== undefined ? { lte: ai_score.max } : {}),
                },
              },
            },
          }
        : {}),
      ...(opportunityNameFilter || {}),
    };

    const [opportunities, total, bookmarks] = await Promise.all([
      prisma.opportunity.findMany({
        skip,
        take: limit,
        orderBy: { opportunity_name: sort_order },
        where: opportunityWhere,
        include: {
          matching_outputs: {
            select: {
              companyId: true,
              sector_similarity: true,
              profile_similarity: true,
              product_similarity: true,
              ai_score: true,
              final_score: true,
            },
          },
        },
      }),
      prisma.opportunity.count({ where: opportunityWhere }),
      prisma.bookmark.findMany({
        where: { userId, entityType: "opportunity" },
        select: { entityId: true },
      }),
    ]);

    const bookmarkedIds = new Set(bookmarks.map((b) => b.entityId));

    const data = opportunities.map((opp) => {
      const matches = opp.matching_outputs ?? [];

      const avg = (arr: (number | null | undefined)[]) => {
        const clean = arr.filter((x): x is number => x !== null && x !== undefined);
        return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
      };

      return {
        id: opp.id,
        opportunityName: opp.opportunity_name,
        opportunitySector: opp.sector,
        opportunityUrl: opp.url,

        investmentRange: opp.investment_range,
        jobsCreated: opp.jobs_created,
        matchQualityRange: opp.match_quality_range,
        keyDemandDrivers: opp.key_demand_drivers,
        gdpImpact: opp.gdp_impact,

        investmentAppeal: opp.investment_appeal,
        economicImpact: opp.economic_impact,
        marketReadiness: opp.market_readiness,
        innovationIndex: opp.innovation_index,
        valueProposition: opp.value_proposition,
        
        location: opp.location,
        region: opp.region,

        avgSectorSimilarity: avg(matches.map((m) => m.sector_similarity)),
        avgProfileSimilarity: avg(matches.map((m) => m.profile_similarity)),
        avgProductSimilarity: avg(matches.map((m) => m.product_similarity)),
        avgAiScore: avg(matches.map((m) => m.ai_score)),
        avgFinalScore: avg(matches.map((m) => m.final_score)),

        totalCompaniesMatched: matches.length,
        isBookmarked: bookmarkedIds.has(opp.id),
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sectors: sectors?.length ? sectors : ["All"],
        sort_by,
        sort_order,
      },
    };
  }

  // -------------------------------
  // 4. Sorting by SCORE / SECTOR (aggregate-level)
  // -------------------------------

  const totalOpportunities = await prisma.matchingOutput.findMany({
    where,
    select: { opportunityId: true },
    distinct: ["opportunityId"],
  });
  const total = totalOpportunities.length;
    
  // Always set an aggregate orderBy - Prisma pagination on groupBy
  // otherwise falls back to `id`, which is not in `by` and throws P2019.
  const grouped = await prisma.matchingOutput.groupBy({
    by: ["opportunityId"],
    where,
    _avg: {
      ai_score: true,
      final_score: true,
      sector_similarity: true,
      profile_similarity: true,
      product_similarity: true,
    },
    _count: { companyId: true },
    orderBy:
      sort_by === "sector"
        ? { _avg: { sector_similarity: sort_order } }
        : { _avg: { final_score: sort_order } },
    skip,
    take: limit,
  });

  const opportunityIds = grouped.map((g) => g.opportunityId);

  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
  });

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      entityType: "opportunity", 
      entityId: { in: opportunityIds },
    },
    select: { entityId: true },
  });

  const bookmarkedIds = new Set(bookmarks.map((b) => b.entityId));

  const data = opportunities.map((opp) => {
    const g = grouped.find((x) => x.opportunityId === opp.id);
    return {
      id: opp.id,
      opportunityName: opp.opportunity_name,
      opportunitySector: opp.sector,
      opportunityUrl: opp.url,

      investmentRange: opp.investment_range,
      jobsCreated: opp.jobs_created,
      matchQualityRange: opp.match_quality_range,
      keyDemandDrivers: opp.key_demand_drivers,
      gdpImpact: opp.gdp_impact,

      investmentAppeal: opp.investment_appeal,
      economicImpact: opp.economic_impact,
      marketReadiness: opp.market_readiness,
      innovationIndex: opp.innovation_index,
      valueProposition: opp.value_proposition,

      location: opp.location,
      region: opp.region,

      avgSectorSimilarity: g?._avg.sector_similarity ?? 0,
      avgProfileSimilarity: g?._avg.profile_similarity ?? 0,
      avgProductSimilarity: g?._avg.product_similarity ?? 0,
      avgAiScore: g?._avg.ai_score ?? 0,
      avgFinalScore: g?._avg.final_score ?? 0,

      totalCompaniesMatched: g?._count.companyId ?? 0,
      isBookmarked: bookmarkedIds.has(opp.id),
    };
  });

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      sectors: sectors?.length ? sectors : ["All"],
      sort_by,
      sort_order,
    },
  };
}

export async function getOpportunityById(id: number, userId: string, ai_decision?: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      matching_outputs: {
        where: ai_decision
          ? { ai_decision: { equals: ai_decision, mode: "insensitive" } }
          : undefined,
        include: {
          company: true,
        },
      },
    },
  });

  if (!opportunity) return null;

  const bookmark = await prisma.bookmark.findFirst({
    where: {
      userId,
      entityId: id,
      entityType: "opportunity",
    },
  });

  return {
    ...opportunity,
    key_players: normalizeArrayString(opportunity.key_players),
    materials_required: normalizeArrayString(opportunity.materials_required),
    isBookmarked: !!bookmark,
  };
}
