/**
 * Live Market Intelligence for the Opportunities surface.
 * Computed on every request from Opportunity + MatchingOutput.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Insight = {
  id: number;
  insightType: string;
  title: string;
  description: string;
  score: number;
  createdAt: string;
  source: "live_matching_engine";
};

type CategoryMap = Record<string, Insight[]>;

const CACHE_MS = 60 * 1000;
let cache: { at: number; data: CategoryMap } | null = null;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function insight(
  id: number,
  type: string,
  title: string,
  description: string,
  score: number,
  createdAt: string
): Insight {
  return {
    id,
    insightType: type,
    title,
    description,
    score: clamp01(score),
    createdAt,
    source: "live_matching_engine",
  };
}

export async function getPageAIDataForOpportunity() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const now = new Date().toISOString();

  const [
    oppTotal,
    matchTotal,
    pursueTotal,
    excellentTotal,
    sectorOppRows,
    sectorPursueRows,
    topOppRows,
    bucketRows,
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.matchingOutput.count(),
    prisma.matchingOutput.count({
      where: {
        OR: [
          { decision_tier: { contains: "Excellent", mode: "insensitive" } },
          { decision_tier: { contains: "Strong", mode: "insensitive" } },
          { decision_tier: { contains: "Good", mode: "insensitive" } },
        ],
      },
    }),
    prisma.matchingOutput.count({
      where: { decision_tier: { equals: "Excellent Match" } },
    }),
    prisma.opportunity.groupBy({
      by: ["sector"],
      _count: { _all: true },
      orderBy: { _count: { sector: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw<{ sector: string; pursue: bigint; total: bigint }[]>`
      SELECT COALESCE(NULLIF(TRIM(opportunity_sector), ''), 'Unknown') AS sector,
             COUNT(*) FILTER (
               WHERE decision_tier ILIKE '%Excellent%'
                  OR decision_tier ILIKE '%Strong%'
                  OR decision_tier ILIKE '%Good%'
             ) AS pursue,
             COUNT(*) AS total
      FROM "MatchingOutput"
      GROUP BY 1
      ORDER BY pursue DESC NULLS LAST
      LIMIT 8
    `,
    prisma.$queryRaw<
      { opportunity: string; sector: string; pursue: bigint; avg_score: number }[]
    >`
      SELECT o.opportunity_name AS opportunity,
             COALESCE(NULLIF(TRIM(o.sector), ''), 'Unknown') AS sector,
             COUNT(*) FILTER (
               WHERE m.decision_tier ILIKE '%Excellent%'
                  OR m.decision_tier ILIKE '%Strong%'
                  OR m.decision_tier ILIKE '%Good%'
             ) AS pursue,
             COALESCE(AVG(m.final_score), 0) AS avg_score
      FROM "MatchingOutput" m
      JOIN "Opportunity" o ON o.id = m."opportunityId"
      GROUP BY o.id, o.opportunity_name, o.sector
      HAVING COUNT(*) FILTER (
               WHERE m.decision_tier ILIKE '%Excellent%'
                  OR m.decision_tier ILIKE '%Strong%'
                  OR m.decision_tier ILIKE '%Good%'
             ) > 0
      ORDER BY pursue DESC, avg_score DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ bucket: string; n: bigint }[]>`
      SELECT COALESCE(NULLIF(TRIM(investment_range), ''), 'Unspecified') AS bucket,
             COUNT(*)::bigint AS n
      FROM "Opportunity"
      GROUP BY 1
      ORDER BY n DESC
      LIMIT 6
    `,
  ]);

  const pursueShare = matchTotal ? pursueTotal / matchTotal : 0;
  const topSector = sectorPursueRows[0]?.sector || sectorOppRows[0]?.sector || "Unknown";
  const topSectorPursue = Number(sectorPursueRows[0]?.pursue || 0);
  const topOpp = topOppRows[0];
  const topBucket = bucketRows[0];

  let id = 1;
  const nextId = () => id++;

  const sector: Insight[] = [
    insight(
      nextId(),
      "Lead_Sector",
      "Lead opportunity sector",
      `${topSector} leads with ${topSectorPursue.toLocaleString()} pursue-grade pairs. Concentrate facilitation capacity here before thinning into weaker verticals.`,
      clamp01(0.55 + Math.min(topSectorPursue / 180, 0.4)),
      now
    ),
    ...sectorPursueRows.slice(0, 3).map((row, idx) => {
      const pursue = Number(row.pursue);
      const total = Number(row.total) || 1;
      return insight(
        nextId(),
        `Opp_Sector_${idx + 1}`,
        `${row.sector}`,
        `${pursue.toLocaleString()} pursue of ${total.toLocaleString()} pairs (${Math.round(
          (pursue / total) * 100
        )}% pursue rate). Keep this sector on the officer weekly brief.`,
        clamp01(0.4 + (pursue / total) * 0.55),
        now
      );
    }),
  ].slice(0, 4);

  const region: Insight[] = [
    insight(
      nextId(),
      "National_Focus",
      "National opportunity focus",
      `${oppTotal.toLocaleString()} opportunities are live in the book with ${pursueTotal.toLocaleString()} pursue-grade company pairings. Treat KSA national programmes as the default geographic frame.`,
      clamp01(0.55 + pursueShare * 0.4),
      now
    ),
    insight(
      nextId(),
      "Pursue_Coverage",
      "Pursue coverage",
      `${Math.round(pursueShare * 100)}% of scored pairs are pursue-grade across ${matchTotal.toLocaleString()} matches. Use Explore filters to drill region and bucket.`,
      clamp01(0.5 + pursueShare),
      now
    ),
    insight(
      nextId(),
      "Excellent_Geo",
      "Excellent geographic demand",
      `${excellentTotal.toLocaleString()} Excellent matches signal where demand is hottest. Open Match Cases before Pursuit Engage.`,
      clamp01(0.5 + Math.min(excellentTotal / 150, 0.45)),
      now
    ),
    insight(
      nextId(),
      "Sector_Region_Align",
      "Sector-region alignment",
      `${topSector} is the densest pursue sector. Align regional officers and incentive packaging to that vertical first.`,
      clamp01(0.55 + Math.min(topSectorPursue / 200, 0.4)),
      now
    ),
  ];

  const revenue: Insight[] = [
    insight(
      nextId(),
      "Top_Bucket",
      "Leading investment bucket",
      topBucket
        ? `${topBucket.bucket} holds ${Number(
            topBucket.n
          ).toLocaleString()} opportunities - the densest capital band in the live book.`
        : "Investment ranges are sparse - enrich opportunity records to unlock bucket intelligence.",
      topBucket ? clamp01(0.5 + Math.min(Number(topBucket.n) / 80, 0.4)) : 0.4,
      now
    ),
    ...bucketRows.slice(1, 4).map((row, idx) =>
      insight(
        nextId(),
        `Bucket_${idx + 1}`,
        String(row.bucket),
        `${Number(row.n).toLocaleString()} opportunities sit in this investment band. Match capital-ready companies into this bucket first.`,
        clamp01(0.4 + Math.min(Number(row.n) / 100, 0.45)),
        now
      )
    ),
  ];

  while (revenue.length < 4) {
    revenue.push(
      insight(
        nextId(),
        "Bucket_Coverage",
        "Bucket coverage",
        `${oppTotal.toLocaleString()} opportunities are available for capital mapping. Rematch companies after profile upgrades to refresh fit.`,
        0.55,
        now
      )
    );
  }

  const growth: Insight[] = [
    insight(
      nextId(),
      "Flagship_Opportunity",
      "Flagship opportunity",
      topOpp
        ? `${topOpp.opportunity} leads with ${Number(
            topOpp.pursue
          ).toLocaleString()} pursue-grade company fits (avg ${Math.round(
            Number(topOpp.avg_score) * 100
          )}%) in ${topOpp.sector}.`
        : "No flagship opportunity yet - rematch to surface leaders.",
      topOpp ? 0.9 : 0.4,
      now
    ),
    ...topOppRows.slice(1, 4).map((row, idx) =>
      insight(
        nextId(),
        `Growth_Opp_${idx + 1}`,
        row.opportunity,
        `${Number(row.pursue).toLocaleString()} pursue matches in ${
          row.sector
        } at ${Math.round(Number(row.avg_score) * 100)}% average score.`,
        clamp01(0.5 + Math.min(Number(row.pursue) / 30, 0.4)),
        now
      )
    ),
  ];

  while (growth.length < 4) {
    growth.push(
      insight(
        nextId(),
        "Growth_Watch",
        "Growth watch",
        "Continue enriching opportunity narratives so the engine can surface sharper growth leaders.",
        0.5,
        now
      )
    );
  }

  const data: CategoryMap = {
    "Sector Focus": sector,
    "Geographic Focus": region,
    "Investment Buckets": revenue,
    "Growth Leaders": growth,
  };

  (data as any)._meta = {
    engine: "live_matching_engine",
    generatedAt: now,
    opportunities: oppTotal,
    matches: matchTotal,
    pursue: pursueTotal,
  };

  cache = { at: Date.now(), data };
  return data;
}
