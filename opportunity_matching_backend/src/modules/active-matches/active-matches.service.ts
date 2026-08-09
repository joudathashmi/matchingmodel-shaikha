import { Prisma } from "@prisma/client";
import { ActiveMatchesDTO } from "../../validations/active-matches.schema";
import { parseAiExplanationNew, parseAiExplanation } from "../../utils/stringUtils";
import { safeParseJsonArray } from "../../utils/jsonUtils";
import { prisma } from "./../../lib/prisma";


export async function getCompanyList() {
  return prisma.company.findMany({
    select: {
      id: true,
      company_name: true,
    },
    orderBy: { company_name: "asc" },
  });
}

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

const PURSUE_TIERS = ["Excellent Match", "Strong Match", "Good Match"];

export async function getActiveMatches(filters: ActiveMatchesDTO, userId: string) {
  const {
    sectors,
    companies,
    ai_decision,
    decision_tier,
    pursue_only,
    final_score,
    page,
    limit,
  } = filters;
  const skip = (page - 1) * limit;

  let sourceSectors: string[] | undefined = undefined;

  if (sectors && sectors.length > 0 && !sectors.includes("All")) {
    const mappings = await prisma.sectorsMapping.findMany({
      where: { target_sector: { in: sectors } },
      select: { source_sector: true },
    });

    sourceSectors = mappings.map((m) => m.source_sector);
  }

  const tierFilter = pursue_only
    ? { decision_tier: { in: PURSUE_TIERS } }
    : decision_tier
      ? {
          decision_tier: {
            contains: decision_tier,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

  const where: Prisma.MatchingOutputWhereInput = {
    ...(ai_decision
      ? { ai_decision: { equals: ai_decision, mode: Prisma.QueryMode.insensitive } }
      : {}),
    ...(sourceSectors && sourceSectors.length > 0
      ? { opportunity_sector: { in: sourceSectors, mode: Prisma.QueryMode.insensitive } }
      : {}),
    ...(companies && companies.length > 0
      ? { company: { company_name: { in: companies, mode: Prisma.QueryMode.insensitive } } }
      : {}),
    ...tierFilter,
    ...(final_score
      ? {
          final_score: {
            ...(final_score.min !== undefined ? { gte: final_score.min } : {}),
            ...(final_score.max !== undefined ? { lte: final_score.max } : {}),
          },
        }
      : {}),
  };

  const [matches, total] = await Promise.all([
    prisma.matchingOutput.findMany({
      skip,
      take: limit,
      where,
      include: { opportunity: true, company: true },
      orderBy: { final_score: "desc" },
    }),
    prisma.matchingOutput.count({ where }),
  ]);

  const sectorMappings = await prisma.sectorsMapping.findMany({
    select: { source_sector: true, target_sector: true },
  });

  const sourceToTarget: Record<string, string> = {};
  const targetToSources: Record<string, string[]> = {};

  for (const m of sectorMappings) {
    sourceToTarget[m.source_sector] = m.target_sector;
    if (!targetToSources[m.target_sector]) {
      targetToSources[m.target_sector] = [];
    }
    targetToSources[m.target_sector].push(m.source_sector);
  }

  const matchIds = matches.map((m) => m.id).filter((id): id is number => !!id);

  const agreements = await prisma.matchAgreement.findMany({
    where: { userId, matchId: { in: matches.map((m) => m.id) } },
  });

  const agreementMap = agreements.reduce((acc, a) => {
    acc[a.matchId] = a.status;
    return acc;
  }, {} as Record<number, string>);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      entityType: "match", 
      entityId: { in: matchIds },
    },
    select: { entityId: true },
  });

  const bookmarkedIds = new Set(bookmarks.map((b) => b.entityId));

  return {
    data: matches.map((m) => {
      const sourceSector = m.opportunity?.sector ?? null;
      const relatedTargetSector = sourceSector ? sourceToTarget[sourceSector] : null;

      return {
        id: m.id,
        companyId: m.companyId,
        companyName: m.company?.company_name,
        companySector: m.company?.company_sector,
        companyWebsite: m.company?.website_url,
        opportunityId: m.opportunityId,
        opportunityName: m.opportunity?.opportunity_name,
        opportunitySector: sourceSector,
        opportunityUrl: m.opportunity?.url,
        relatedTargetSector,
        relatedSourceSectors: relatedTargetSector ? targetToSources[relatedTargetSector] ?? [] : [],
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
        isBookmarked: bookmarkedIds.has(m.id),
        userAgreement: agreementMap[m.id] ?? null,
      };
    }),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      sectors: sectors?.length ? sectors : ["All"],
      companies: companies?.length ? companies : ["All"],
    },
  };
}

export async function getMatchById(matchId: number, userId: string) {
  const m = await prisma.matchingOutput.findUnique({
    where: { id: matchId },
    include: { opportunity: true, company: true },
  });
  if (!m) return null;

  const sectorMappings = await prisma.sectorsMapping.findMany({
    select: { source_sector: true, target_sector: true },
  });
  const sourceToTarget: Record<string, string> = {};
  const targetToSources: Record<string, string[]> = {};
  for (const row of sectorMappings) {
    sourceToTarget[row.source_sector] = row.target_sector;
    if (!targetToSources[row.target_sector]) targetToSources[row.target_sector] = [];
    targetToSources[row.target_sector].push(row.source_sector);
  }

  const agreement = await prisma.matchAgreement.findFirst({
    where: { userId, matchId },
  });
  const bookmark = await prisma.bookmark.findFirst({
    where: { userId, entityType: "match", entityId: matchId },
  });

  const sourceSector = m.opportunity?.sector ?? null;
  const relatedTargetSector = sourceSector ? sourceToTarget[sourceSector] : null;

  return {
    id: m.id,
    companyId: m.companyId,
    companyName: m.company?.company_name,
    companySector: m.company?.company_sector,
    companyWebsite: m.company?.website_url,
    opportunityId: m.opportunityId,
    opportunityName: m.opportunity?.opportunity_name,
    opportunitySector: sourceSector,
    opportunityUrl: m.opportunity?.url,
    relatedTargetSector,
    relatedSourceSectors: relatedTargetSector ? targetToSources[relatedTargetSector] ?? [] : [],
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
    isBookmarked: !!bookmark,
    userAgreement: agreement?.status ?? null,
  };
}