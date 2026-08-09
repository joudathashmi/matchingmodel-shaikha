import { Prisma } from "@prisma/client";
import { parseAiExplanation, parseAiExplanationNew } from "../../utils/stringUtils";
import { safeParseJsonArray } from "../../utils/jsonUtils";
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
    where.ai_decision = {
      equals: ai_decision,
      mode: Prisma.QueryMode.insensitive,
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

export async function getTopMatchOpportunities(
  sectors?: string[],
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  let sourceSectors: string[] | undefined = undefined;

  if (sectors && sectors.length > 0 && !sectors.includes("All")) {
    const mappings = await prisma.sectorsMapping.findMany({
      where: { target_sector: { in: sectors } },
      select: { source_sector: true },
    });

    sourceSectors = mappings.map((m) => m.source_sector);
  }

  const where: Prisma.MatchingOutputWhereInput = {
    ai_decision: { equals: "Yes", mode: Prisma.QueryMode.insensitive },
    rank: 1,
    OR: [
      { decision_tier: { in: ["Excellent", "Strong", "Good"], mode: Prisma.QueryMode.insensitive } },
      { decision_tier: null },
      { final_score: { gte: 0.7 } },
    ],
    ...(sourceSectors && sourceSectors.length > 0
      ? { opportunity_sector: { in: sourceSectors, mode: Prisma.QueryMode.insensitive } }
      : {}),
  };

  const [matches, total] = await Promise.all([
    prisma.matchingOutput.findMany({
      skip,
      take: limit,
      where,
      include: {
        opportunity: true,
        company: true,
      },
      orderBy: { final_score: "desc" }, // or by score
    }),
    prisma.matchingOutput.count({ where }),
  ]);

  return {
    data: matches.map((m) => ({
      id: m.id,
      companyId: m.companyId,
      companyName: m.company?.company_name,
      companySector: m.company?.company_sector,
      companyWebsite: m.company?.website_url,
      opportunityId: m.opportunityId,
      opportunityName: m.opportunity?.opportunity_name,
      opportunitySector: m.opportunity?.sector,
      opportunityUrl: m.opportunity?.url,
      sectorSimilarity: m.sector_similarity,
      profileSimilarity: m.profile_similarity,
      productSimilarity: m.product_similarity,
      aiScore: m.ai_score,
      rank: m.rank,
      aiDecision: m.ai_decision,
      finalScore: m.final_score,
      aiExplanation: parseAiExplanation(m.ai_explanation),
      aiExplanationWOParse: m.ai_explanation,
      aiInsight: m.ai_insight,
      suggestedPlan: safeParseJsonArray(m.suggested_plan),
      matchReason: (() => {
        const fromReason = safeParseJsonArray(m.match_reason);
        if (fromReason.length) return fromReason;
        if (typeof m.match_reason === "string" && m.match_reason.trim()) {
          return [m.match_reason.trim()];
        }
        if (typeof m.ai_insight === "string" && m.ai_insight.trim()) {
          return [m.ai_insight.trim()];
        }
        const fromExpl = parseAiExplanation(m.ai_explanation);
        return fromExpl.length ? [fromExpl[0]] : [];
      })(),
      decisionTier: m.decision_tier,
      confidenceScore: m.confidence_score,
      confidenceLabel: m.confidence_label,
      evidenceFlag: m.evidence_flag,
      valueChainPosition: m.value_chain_position,
      strengths: m.strengths,
      risks: m.risks,
      recommendedEngagement: m.recommended_engagement,
      localizationModel: m.suggested_localization_model,
      modelVersion: m.model_version,
      investmentRange: m.opportunity.investment_range,
      projectDuration: m.opportunity.project_duration,
      keyDemandDrivers: m.opportunity.key_demand_drivers,
      strategicPriority: m.opportunity.strategic_priority,
      marketSize: m.opportunity.market_size,
      location: m.opportunity.location,
      region: m.opportunity.region,
    })),
    
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      sectors: sectors?.length ? sectors : ["All"],
    },
  };
}