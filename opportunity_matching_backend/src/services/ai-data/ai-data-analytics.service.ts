/**
 * Live Analytics portal.
 * Every KPI, chart series and insight is computed from Company + Opportunity + MatchingOutput.
 * No DashboardKPI / AIInsight tables. No cosmetic score offsets.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CACHE_MS = 60 * 1000;
let cache: { at: number; data: any } | null = null;

const PURSUE_TIERS = ["Excellent Match", "Strong Match", "Good Match"];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function kpi(
  name: string,
  value: number,
  unit: string,
  calculatedAt: string
) {
  return { name, value, unit, calculatedAt };
}

function metric(
  name: string,
  value: number,
  unit: string,
  calculatedAt: string
) {
  return { name, value, unit, calculatedAt };
}

function tierBoardLabel(score: number, decisionTier?: string | null): string {
  const tier = (decisionTier || "").toLowerCase();
  if (tier.includes("excellent") || score >= 0.85) return "Excellent";
  if (tier.includes("strong") || score >= 0.75) return "Strong";
  if (tier.includes("good") || score >= 0.65) return "Good";
  return "Watch";
}

/**
 * Insight score = the measured rate (0-1), never a vanity offset.
 */
function insight(
  insightType: string,
  description: string,
  measuredRate01: number,
  calculatedAt: string
) {
  return {
    insightType,
    description,
    score: clamp01(measuredRate01),
    createdAt: calculatedAt,
    source: "live_matching_engine",
  };
}

export async function getPageAIDataForAnalytics() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const now = new Date().toISOString();

  const [
    opportunityTotal,
    companyTotal,
    matchTotal,
    pursueTotal,
    excellentTotal,
    strongTotal,
    goodTotal,
    highConfTotal,
    highConfPursueTotal,
    companyCoveredRows,
    companyPursueRows,
    opportunityPursueRows,
    opportunityExcellentRows,
    scoreStats,
    tierRows,
    sectorPursueRows,
    sectorOppRows,
    scoreBuckets,
    topMatchRows,
    topCompanyConcentration,
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.company.count(),
    prisma.matchingOutput.count(),
    prisma.matchingOutput.count({
      where: { decision_tier: { in: PURSUE_TIERS } },
    }),
    prisma.matchingOutput.count({
      where: { decision_tier: { equals: "Excellent Match" } },
    }),
    prisma.matchingOutput.count({
      where: { decision_tier: { equals: "Strong Match" } },
    }),
    prisma.matchingOutput.count({
      where: { decision_tier: { equals: "Good Match" } },
    }),
    prisma.matchingOutput.count({
      where: { confidence_label: { equals: "High", mode: "insensitive" } },
    }),
    prisma.matchingOutput.count({
      where: {
        decision_tier: { in: PURSUE_TIERS },
        confidence_label: { equals: "High", mode: "insensitive" },
      },
    }),
    prisma.matchingOutput.findMany({
      distinct: ["companyId"],
      select: { companyId: true },
    }),
    prisma.matchingOutput.findMany({
      distinct: ["companyId"],
      where: { decision_tier: { in: PURSUE_TIERS } },
      select: { companyId: true },
    }),
    prisma.matchingOutput.findMany({
      distinct: ["opportunityId"],
      where: { decision_tier: { in: PURSUE_TIERS } },
      select: { opportunityId: true },
    }),
    prisma.matchingOutput.findMany({
      distinct: ["opportunityId"],
      where: { decision_tier: { equals: "Excellent Match" } },
      select: { opportunityId: true },
    }),
    prisma.$queryRaw<
      {
        avg_all: number | null;
        median_pursue: number | null;
        p75_pursue: number | null;
        avg_pursue: number | null;
      }[]
    >`
      SELECT
        (SELECT AVG(final_score) FROM "MatchingOutput") AS avg_all,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY final_score)
           FROM "MatchingOutput"
          WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')
            AND final_score IS NOT NULL) AS median_pursue,
        (SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY final_score)
           FROM "MatchingOutput"
          WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')
            AND final_score IS NOT NULL) AS p75_pursue,
        (SELECT AVG(final_score)
           FROM "MatchingOutput"
          WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')) AS avg_pursue
    `,
    prisma.$queryRaw<{ decision_tier: string | null; n: bigint }[]>`
      SELECT COALESCE(NULLIF(TRIM(decision_tier), ''), 'Unscored') AS decision_tier,
             COUNT(*)::bigint AS n
      FROM "MatchingOutput"
      GROUP BY 1
      ORDER BY n DESC
    `,
    prisma.$queryRaw<
      {
        sector: string;
        pursue: bigint;
        excellent: bigint;
        total: bigint;
        avg_score: number | null;
      }[]
    >`
      SELECT COALESCE(NULLIF(TRIM(company_sector), ''), 'Unknown') AS sector,
             COUNT(*) FILTER (
               WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')
             )::bigint AS pursue,
             COUNT(*) FILTER (
               WHERE decision_tier = 'Excellent Match'
             )::bigint AS excellent,
             COUNT(*)::bigint AS total,
             AVG(final_score) FILTER (
               WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')
             ) AS avg_score
      FROM "MatchingOutput"
      GROUP BY 1
      HAVING COUNT(*) FILTER (
        WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')
      ) > 0
      ORDER BY pursue DESC NULLS LAST
      LIMIT 12
    `,
    prisma.opportunity.groupBy({
      by: ["sector"],
      _count: { _all: true },
      orderBy: { _count: { sector: "desc" } },
    }),
    prisma.$queryRaw<{ bucket: string; n: bigint }[]>`
      SELECT bucket, COUNT(*)::bigint AS n
      FROM (
        SELECT CASE
          WHEN final_score IS NULL THEN 'Unscored'
          WHEN final_score >= 0.85 THEN '0.85-1.00'
          WHEN final_score >= 0.75 THEN '0.75-0.84'
          WHEN final_score >= 0.65 THEN '0.65-0.74'
          WHEN final_score >= 0.50 THEN '0.50-0.64'
          ELSE '<0.50'
        END AS bucket,
        CASE
          WHEN final_score IS NULL THEN 0
          WHEN final_score >= 0.85 THEN 5
          WHEN final_score >= 0.75 THEN 4
          WHEN final_score >= 0.65 THEN 3
          WHEN final_score >= 0.50 THEN 2
          ELSE 1
        END AS ord
        FROM "MatchingOutput"
      ) t
      GROUP BY bucket, ord
      ORDER BY ord DESC
    `,
    prisma.$queryRaw<
      {
        company: string;
        opportunity: string;
        sector: string;
        final_score: number;
        decision_tier: string | null;
        confidence_label: string | null;
        evidence_flag: string | null;
      }[]
    >`
      SELECT c.company_name AS company,
             o.opportunity_name AS opportunity,
             COALESCE(
               NULLIF(TRIM(c.company_sector), ''),
               NULLIF(TRIM(o.sector), ''),
               'Unknown'
             ) AS sector,
             COALESCE(m.final_score, 0) AS final_score,
             m.decision_tier,
             m.confidence_label,
             m.evidence_flag
      FROM "MatchingOutput" m
      JOIN "Company" c ON c.id = m."companyId"
      JOIN "Opportunity" o ON o.id = m."opportunityId"
      WHERE m.decision_tier IN ('Excellent Match', 'Strong Match')
         OR COALESCE(m.final_score, 0) >= 0.8
      ORDER BY m.final_score DESC NULLS LAST, m.decision_tier ASC
      LIMIT 10
    `,
    prisma.$queryRaw<{ company_id: number; pursue: bigint }[]>`
      SELECT "companyId" AS company_id,
             COUNT(*)::bigint AS pursue
      FROM "MatchingOutput"
      WHERE decision_tier IN ('Excellent Match', 'Strong Match', 'Good Match')
      GROUP BY "companyId"
      ORDER BY pursue DESC
      LIMIT 20
    `,
  ]);

  const stats = scoreStats[0] || {
    avg_all: 0,
    median_pursue: 0,
    p75_pursue: 0,
    avg_pursue: 0,
  };

  const companiesCovered = companyCoveredRows.length;
  const companiesWithPursue = companyPursueRows.length;
  const opportunitiesWithPursue = opportunityPursueRows.length;
  const opportunitiesWithExcellent = opportunityExcellentRows.length;
  const coldCompanies = Math.max(companyTotal - companiesWithPursue, 0);

  const pursueYield = pct(pursueTotal, matchTotal);
  const excellentRate = pct(excellentTotal, matchTotal);
  const companyCoverage = pct(companiesCovered, companyTotal);
  const companyPursueCoverage = pct(companiesWithPursue, companyTotal);
  const opportunityFill = pct(opportunitiesWithPursue, opportunityTotal);
  const excellentOppFill = pct(opportunitiesWithExcellent, opportunityTotal);
  const highConfShare = pct(highConfTotal, matchTotal);
  const highConfPursueShare = pct(highConfPursueTotal, pursueTotal || 1);
  const coldCompanyRate = pct(coldCompanies, companyTotal);
  const actionableBacklog = highConfPursueTotal;

  const medianPursuePct = round1(Number(stats.median_pursue || 0) * 100);
  const p75PursuePct = round1(Number(stats.p75_pursue || 0) * 100);
  const avgPursuePct = round1(Number(stats.avg_pursue || 0) * 100);

  // Pursue concentration: share of pursue pairs held by top 10% of pursuing companies
  const pursueByCompany = topCompanyConcentration.map((r) =>
    Number(r.pursue || 0)
  );
  const pursueSumTop = pursueByCompany.reduce((a, b) => a + b, 0);
  const topCompanyPursueShare = pct(pursueSumTop, pursueTotal || 1);

  // ---- KPIs: decision metrics first, inventory only as context ----
  const kpis = [
    kpi("Pursue yield", pursueYield, "%", now),
    kpi("Excellent-ready pool", excellentTotal, "", now),
    kpi("Actionable backlog", actionableBacklog, "", now),
    kpi("Company pursue coverage", companyPursueCoverage, "%", now),
    kpi("Opportunity fill rate", opportunityFill, "%", now),
    kpi("Median pursue score", medianPursuePct, "%", now),
    kpi("High-confidence pursues", highConfPursueShare, "%", now),
    kpi("Cold companies", coldCompanies, "", now),
  ];

  // ---- Chart A: pursue density by sector (not vanity opportunity inventory) ----
  const growthRates = sectorPursueRows.slice(0, 8).map((row) => {
    const pursue = Number(row.pursue || 0);
    return metric(
      row.sector || "Unknown",
      pct(pursue, pursueTotal || 1),
      "%",
      now
    );
  });

  // ---- Chart B: decision quality (all % / rates officers act on) ----
  const performanceAnalytics = [
    metric("Pursue yield", pursueYield, "%", now),
    metric("Excellent rate", excellentRate, "%", now),
    metric("High-conf among pursues", highConfPursueShare, "%", now),
    metric("Company pursue coverage", companyPursueCoverage, "%", now),
    metric("Opportunity fill rate", opportunityFill, "%", now),
    metric("Excellent opportunity fill", excellentOppFill, "%", now),
    metric("Cold company rate", coldCompanyRate, "%", now),
    metric("Top-20 company pursue share", topCompanyPursueShare, "%", now),
  ];

  // ---- Heatmap: pursue pair volume by sector ----
  const heatmapValues = sectorPursueRows.slice(0, 14).map((row) => ({
    name: row.sector || "Unknown",
    value: Number(row.pursue || 0),
    unit: "pursue",
    calculatedAt: now,
  }));

  // Fallback if matching empty but opportunities exist
  const heatmapFallback =
    heatmapValues.length > 0
      ? heatmapValues
      : sectorOppRows.slice(0, 14).map((row) => ({
          name: row.sector || "Unknown",
          value: Number(row._count._all || 0),
          unit: "ops",
          calculatedAt: now,
        }));

  const topMatches = topMatchRows.map((row) => {
    const score = Number(row.final_score || 0);
    const insightType = tierBoardLabel(score, row.decision_tier);
    const conf = row.confidence_label || "n/a";
    return {
      insightType,
      companyName: row.company,
      sector: row.sector || "Unknown",
      description: `${row.company} × ${row.opportunity}. Score ${Math.round(
        score * 100
      )}% · ${row.decision_tier || "Unscored"} · confidence ${conf}${
        row.evidence_flag ? ` · evidence ${row.evidence_flag}` : ""
      }.`,
      aiDecision:
        insightType === "Excellent" || insightType === "Strong"
          ? "Pursue"
          : "Review",
      score,
      createdAt: now,
      source: "live_matching_engine",
    };
  });

  const decisionTiers = tierRows.map((r) => ({
    name: r.decision_tier || "Unscored",
    value: Number(r.n || 0),
  }));

  const scoreDistribution = scoreBuckets.map((r) => ({
    name: r.bucket,
    value: Number(r.n || 0),
  }));

  const topSector = sectorPursueRows[0];
  const topSectorPursue = Number(topSector?.pursue || 0);
  const topSectorExcellent = Number(topSector?.excellent || 0);
  const topSectorAvg = round1(Number(topSector?.avg_score || 0) * 100);
  const flagship = topMatchRows[0];

  // ---- Brief items: measured rates only, plain officer language ----
  const marketPredictions = [
    insight(
      "Pursue yield",
      `${pursueTotal.toLocaleString()} of ${matchTotal.toLocaleString()} scored pairs (${pursueYield}%) are Excellent, Strong or Good.`,
      pursueYield / 100,
      now
    ),
    insight(
      "Actionable backlog",
      `${actionableBacklog.toLocaleString()} pursue pairs are High confidence (${highConfPursueShare}% of pursues).`,
      highConfPursueShare / 100,
      now
    ),
    insight(
      "Excellent pool",
      `${excellentTotal.toLocaleString()} Excellent matches (${excellentRate}%) cover ${opportunitiesWithExcellent.toLocaleString()} opportunities (${excellentOppFill}%).`,
      clamp01(excellentRate / 100),
      now
    ),
    insight(
      "Company pursue coverage",
      `${companiesWithPursue.toLocaleString()} of ${companyTotal.toLocaleString()} companies (${companyPursueCoverage}%) have a pursue pair. ${coldCompanies.toLocaleString()} companies have none (${coldCompanyRate}%).`,
      companyPursueCoverage / 100,
      now
    ),
    insight(
      "Opportunity fill",
      `${opportunitiesWithPursue.toLocaleString()} of ${opportunityTotal.toLocaleString()} opportunities (${opportunityFill}%) have a pursue-grade company. Median pursue score ${medianPursuePct}% (P75 ${p75PursuePct}%).`,
      opportunityFill / 100,
      now
    ),
    insight(
      "Leading sector",
      topSector
        ? `${topSector.sector}: ${topSectorPursue.toLocaleString()} pursue pairs (${pct(
            topSectorPursue,
            pursueTotal || 1
          )}%), ${topSectorExcellent.toLocaleString()} Excellent, average pursue score ${topSectorAvg}%.`
        : "No pursue pairs by sector yet.",
      topSector ? pct(topSectorPursue, pursueTotal || 1) / 100 : 0,
      now
    ),
    insight(
      "Top pair",
      flagship
        ? `${flagship.company} × ${flagship.opportunity}: ${Math.round(
            Number(flagship.final_score) * 100
          )}% (${flagship.decision_tier || "Unscored"}, ${
            flagship.confidence_label || "n/a"
          } confidence).`
        : "No top pair available yet.",
      flagship ? clamp01(Number(flagship.final_score)) : 0,
      now
    ),
    insight(
      "Pursue concentration",
      `Top 20 companies hold ${topCompanyPursueShare}% of pursue pairs.`,
      clamp01(1 - topCompanyPursueShare / 100),
      now
    ),
  ];

  const data = {
    kpis,
    growthRates,
    performanceAnalytics,
    heatmapValues: heatmapFallback,
    topMatches,
    marketPredictions,
    scoreDistribution,
    decisionTiers,
    _meta: {
      engine: "live_matching_engine",
      generatedAt: now,
      companies: companyTotal,
      opportunities: opportunityTotal,
      matches: matchTotal,
      pursue: pursueTotal,
      excellent: excellentTotal,
      strong: strongTotal,
      good: goodTotal,
      highConfidence: highConfTotal,
      highConfidencePursue: highConfPursueTotal,
      companiesCovered,
      companiesWithPursue,
      coldCompanies,
      opportunitiesWithPursue,
      medianPursueScore: medianPursuePct,
      p75PursueScore: p75PursuePct,
      avgPursueScore: avgPursuePct,
      companyCoverage,
      highConfShare,
    },
  };

  cache = { at: Date.now(), data };
  return data;
}
