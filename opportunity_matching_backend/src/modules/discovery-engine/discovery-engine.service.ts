import { PrismaClient, Prisma } from "@prisma/client";
import { DiscoveryEngineDTO } from "../../validations/discovery-engine.schema";

const prisma = new PrismaClient();

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

export async function getDiscoveryEngine(filters: DiscoveryEngineDTO, userId: string) {
  const { sectors, match_score, ai_decision, location, investment_range, page, limit } = filters;
  const skip = (page - 1) * limit;

  let sourceSectors: string[] | undefined = undefined;

  if (sectors && sectors.length > 0 && !sectors.includes("All")) {
    const mappings = await prisma.sectorsMapping.findMany({
      where: { target_sector: { in: sectors } },
      select: { source_sector: true },
    });

    sourceSectors = mappings.map((m) => m.source_sector);
  }

  const totalOpportunities = await prisma.matchingOutput.findMany({
    where: {
      ...(sourceSectors && sourceSectors.length > 0
        ? { opportunity_sector: { in: sourceSectors, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(ai_decision
        ? { ai_decision: { equals: ai_decision, mode: Prisma.QueryMode.insensitive } }
        : {}),
    },
    select: { opportunityId: true },
    distinct: ["opportunityId"],
  });
  const total = totalOpportunities.length;

  const grouped = await prisma.matchingOutput.groupBy({
    by: ["opportunityId"],
    where: {
      ...(sourceSectors && sourceSectors.length > 0
        ? { opportunity_sector: { in: sourceSectors, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(ai_decision
        ? { ai_decision: { equals: ai_decision, mode: Prisma.QueryMode.insensitive } }
        : {}),
    },
    _avg: {
      sector_similarity: true,
      profile_similarity: true,
      product_similarity: true,
      ai_score: true,
      final_score: true,
    },
    _max: {
      sector_similarity: true,
      profile_similarity: true,
      product_similarity: true,
      ai_score: true,
      final_score: true,
    },
    _count: { companyId: true },
    orderBy: { _avg: { final_score: "desc" } },
    skip,
    take: limit,
  });

  const opportunityIds = grouped.map((g) => g.opportunityId);
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
  });

  const sectorMappings = await prisma.sectorsMapping.findMany({
    select: { source_sector: true, target_sector: true },
  });

  const sourceToTarget: Record<string, string> = {};
  const targetToSources: Record<string, string[]> = {};

  for (const sectorMapping of sectorMappings) {
    sourceToTarget[sectorMapping.source_sector] = sectorMapping.target_sector;

    if (!targetToSources[sectorMapping.target_sector]) {
      targetToSources[sectorMapping.target_sector] = [];
    }
    targetToSources[sectorMapping.target_sector].push(sectorMapping.source_sector);
  }

  const topCompanies = await prisma.matchingOutput.findMany({
    where: {
      opportunityId: { in: opportunityIds },
    },
    orderBy: { final_score: "desc" },
    include: { company: true },
  });

  const topCompanyMap: Record<
    number,
    {
      id: number;
      name: string;
      company_sector: string;
      score: number;
      ai_insight: string | null;
      decisionTier: string | null;
      confidenceScore: number | null;
      confidenceLabel: string | null;
      strengths: string | null;
      risks: string | null;
      valueChainPosition: string | null;
      modelVersion: string | null;
    }
  > = {};
  for (const oppId of opportunityIds) {
    const top = topCompanies.find((m) => m.opportunityId === oppId);
    if (top) {
      topCompanyMap[oppId] = {
        id: top.companyId,
        name: top.company?.company_name ?? "Unknown",
        company_sector: top.company?.company_sector ?? "Unknown",
        score: top.final_score ?? 0,
        ai_insight: top.ai_insight ?? null,
        decisionTier: top.decision_tier ?? null,
        confidenceScore: top.confidence_score ?? null,
        confidenceLabel: top.confidence_label ?? null,
        strengths: top.strengths ?? null,
        risks: top.risks ?? null,
        valueChainPosition: top.value_chain_position ?? null,
        modelVersion: top.model_version ?? null,
      };
    }
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      entityType: "opportunity",
      entityId: { in: opportunityIds },
    },
    select: { entityId: true },
  });
  const bookmarkedSet = new Set(bookmarks.map((b) => b.entityId));

  const data = opportunities.map((opp) => {
    const g = grouped.find((x) => x.opportunityId === opp.id);

    const countCompanies = g?._count.companyId ?? 0;
    let competitionLevel = `Low (${countCompanies} bidders)`;
    if (countCompanies >= 10 && countCompanies <= 20) {
      competitionLevel = `Moderate (${countCompanies} bidders)`;
    } else if (countCompanies > 20) {
      competitionLevel = `High (${countCompanies} bidders)`;
    }

    const sourceSector = opp.sector;
    const relatedTargetSector = sourceSector ? sourceToTarget[sourceSector] : null;

    return {
      id: opp.id,
      opportunityName: opp.opportunity_name,
      opportunitySector: opp.sector,
      relatedTargetSector, 
      relatedSourceSectors: relatedTargetSector ? targetToSources[relatedTargetSector] ?? [] : [],
      opportunityUrl: opp.url,
      location: opp.location,
      investmentRange: opp.investment_range,
      
      topCompany: topCompanyMap[opp.id] ?? null,
      // aiInsight: topCompanyMap[opp.id]?.ai_insight ?? null,

      avgSectorSimilarity: g?._avg.sector_similarity ?? 0,
      avgProfileSimilarity: g?._avg.profile_similarity ?? 0,
      avgProductSimilarity: g?._avg.product_similarity ?? 0,
      avgAiScore: g?._avg.ai_score ?? 0,
      avgFinalScore: g?._avg.final_score ?? 0,

      maxSectorSimilarity: g?._max.sector_similarity ?? 0,
      maxProfileSimilarity: g?._max.profile_similarity ?? 0,
      maxProductSimilarity: g?._max.product_similarity ?? 0,
      maxAiScore: g?._max.ai_score ?? 0,
      maxFinalScore: g?._max.final_score ?? 0,
      competitionLevel,
      isBookmarked: bookmarkedSet.has(opp.id),
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
    },
  };
}