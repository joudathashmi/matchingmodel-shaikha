import { prisma } from "./../../lib/prisma";
/**
 * Live Market Intelligence for the Companies surface.
 * Computed on every request from Company + MatchingOutput (not stale AIInsight rows).
 */


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

const PURSUE = ["Excellent Match", "Strong Match", "Good Match"];
const CACHE_MS = 60 * 1000;
let cache: { at: number; data: CategoryMap & { _meta?: any } } | null = null;

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

export async function getPageAIDataForCompany() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const now = new Date().toISOString();

  const [
    companyTotal,
    geoCounts,
    readyCompanies,
    sectorCompanyRows,
    matchTotal,
    pursueTotal,
    excellentTotal,
    highConfTotal,
    sectorPursueRows,
    avgFinal,
    topCompanyRows,
  ] = await Promise.all([
    prisma.company.count(),
    // Empty strings are common in this dataset; treat only non-blank text as presence.
    prisma.$queryRaw<
      { mena: number; saudi: number; rhq: number; mena_no_rhq: number }[]
    >`
      SELECT
        COUNT(*) FILTER (
          WHERE presence_of_company_in_mena IS TRUE
             OR presence_of_parent_company_in_mena IS TRUE
             OR rhq_in_mena IS TRUE
             OR NULLIF(TRIM(mena_locations), '') IS NOT NULL
             OR NULLIF(TRIM(companies_name_in_mena), '') IS NOT NULL
             OR NULLIF(TRIM(history_in_mena), '') IS NOT NULL
        )::int AS mena,
        COUNT(*) FILTER (
          WHERE presence_in_saudi IS TRUE
             OR NULLIF(TRIM(companies_name_in_ksa), '') IS NOT NULL
             OR NULLIF(TRIM(type_of_presence_saudi), '') IS NOT NULL
             OR COALESCE(number_of_employees_ksa, 0) > 0
             OR COALESCE(ksa_revenue_local_currency, 0) > 0
             OR mena_locations ILIKE '%saudi%'
             OR mena_locations ILIKE '%riyadh%'
             OR mena_locations ILIKE '%ksa%'
        )::int AS saudi,
        COUNT(*) FILTER (
          WHERE rhq_in_mena IS TRUE
             OR NULLIF(TRIM(rhq_entity_name), '') IS NOT NULL
             OR (
               NULLIF(TRIM(rhq_status), '') IS NOT NULL
               AND rhq_status !~* '^(no|none|n/?a|not\\s*applicable|false|0|-)$'
             )
             OR (
               NULLIF(TRIM(rhq_license_status), '') IS NOT NULL
               AND rhq_license_status !~* '^(no|none|n/?a|not\\s*applicable|false|0|-)$'
             )
        )::int AS rhq,
        COUNT(*) FILTER (
          WHERE (
              presence_of_company_in_mena IS TRUE
              OR presence_of_parent_company_in_mena IS TRUE
              OR rhq_in_mena IS TRUE
              OR NULLIF(TRIM(mena_locations), '') IS NOT NULL
              OR NULLIF(TRIM(companies_name_in_mena), '') IS NOT NULL
              OR NULLIF(TRIM(history_in_mena), '') IS NOT NULL
            )
            AND COALESCE(rhq_in_mena, FALSE) = FALSE
            AND NULLIF(TRIM(rhq_entity_name), '') IS NULL
            AND (
              NULLIF(TRIM(rhq_status), '') IS NULL
              OR rhq_status ~* '^(no|none|n/?a|not\\s*applicable|false|0|-)$'
            )
            AND (
              NULLIF(TRIM(rhq_license_status), '') IS NULL
              OR rhq_license_status ~* '^(no|none|n/?a|not\\s*applicable|false|0|-)$'
            )
        )::int AS mena_no_rhq
      FROM "Company"
    `,
    prisma.company.count({
      where: {
        AND: [
          { revenue_usd: { gte: 50_000_000 } },
          { number_of_employees: { gte: 200 } },
        ],
      },
    }),
    prisma.company.groupBy({
      by: ["company_sector"],
      _count: { _all: true },
      orderBy: { _count: { company_sector: "desc" } },
      take: 8,
    }),
    prisma.matchingOutput.count(),
    prisma.matchingOutput.count({
      where: { decision_tier: { in: PURSUE } },
    }),
    prisma.matchingOutput.count({
      where: { decision_tier: { equals: "Excellent Match" } },
    }),
    prisma.matchingOutput.count({
      where: { confidence_label: { equals: "High", mode: "insensitive" } },
    }),
    prisma.$queryRaw<{ sector: string; pursue: bigint; total: bigint }[]>`
      SELECT COALESCE(NULLIF(TRIM(company_sector), ''), 'Unknown') AS sector,
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
    prisma.matchingOutput.aggregate({ _avg: { final_score: true } }),
    prisma.$queryRaw<
      { company: string; sector: string; pursue: bigint; avg_score: number }[]
    >`
      SELECT c.company_name AS company,
             COALESCE(NULLIF(TRIM(c.company_sector), ''), 'Unknown') AS sector,
             COUNT(*) FILTER (
               WHERE m.decision_tier ILIKE '%Excellent%'
                  OR m.decision_tier ILIKE '%Strong%'
                  OR m.decision_tier ILIKE '%Good%'
             ) AS pursue,
             COALESCE(AVG(m.final_score), 0) AS avg_score
      FROM "MatchingOutput" m
      JOIN "Company" c ON c.id = m."companyId"
      GROUP BY c.id, c.company_name, c.company_sector
      HAVING COUNT(*) FILTER (
               WHERE m.decision_tier ILIKE '%Excellent%'
                  OR m.decision_tier ILIKE '%Strong%'
                  OR m.decision_tier ILIKE '%Good%'
             ) > 0
      ORDER BY pursue DESC, avg_score DESC
      LIMIT 5
    `,
  ]);

  const menaPresence = Number(geoCounts[0]?.mena || 0);
  const saudiPresence = Number(geoCounts[0]?.saudi || 0);
  const rhqCount = Number(geoCounts[0]?.rhq || 0);
  const menaNoRhqCount = Number(geoCounts[0]?.mena_no_rhq || 0);

  const menaShare = companyTotal ? menaPresence / companyTotal : 0;
  const saudiShare = companyTotal ? saudiPresence / companyTotal : 0;
  const rhqShare = companyTotal ? rhqCount / companyTotal : 0;
  const readyShare = companyTotal ? readyCompanies / companyTotal : 0;
  const pursueShare = matchTotal ? pursueTotal / matchTotal : 0;
  const excellentShare = matchTotal ? excellentTotal / matchTotal : 0;
  const highConfShare = matchTotal ? highConfTotal / matchTotal : 0;
  const avgScore = avgFinal._avg.final_score ?? 0;

  const topSector =
    sectorPursueRows[0]?.sector ||
    sectorCompanyRows[0]?.company_sector ||
    "Unknown";
  const topSectorPursue = Number(sectorPursueRows[0]?.pursue || 0);
  const topSectorCompanies =
    sectorCompanyRows.find((s) => s.company_sector === topSector)?._count
      ._all ||
    sectorCompanyRows[0]?._count._all ||
    0;

  const menaNoRhq = menaNoRhqCount;
  const topCompany = topCompanyRows[0];

  let id = 1;
  const nextId = () => id++;

  const marketOpportunity: Insight[] = [
    insight(
      nextId(),
      "Pursue_Density",
      "Pursue-grade density",
      `${pursueTotal.toLocaleString()} of ${matchTotal.toLocaleString()} scored pairs (${Math.round(
        pursueShare * 100
      )}%) are Excellent, Strong or Good. Average final score is ${Math.round(
        avgScore * 100
      )}%. Prioritize the pursue pocket for officer outreach this week.`,
      clamp01(0.55 + pursueShare * 0.45),
      now
    ),
    insight(
      nextId(),
      "Excellent_Tier",
      "Excellent-tier pulse",
      `${excellentTotal.toLocaleString()} Excellent matches are live in MatchingOutput (${Math.round(
        excellentShare * 100
      )}% of all pairs). These should receive dedicated relationship owners and fast-track case review.`,
      clamp01(0.5 + excellentShare * 2.5),
      now
    ),
    insight(
      nextId(),
      "High_Confidence",
      "Evidence-backed outreach",
      `${highConfTotal.toLocaleString()} matches carry High confidence (${Math.round(
        highConfShare * 100
      )}%). Treat Low-confidence pursues as Hold until Match Case evidence improves.`,
      clamp01(0.5 + highConfShare * 1.2),
      now
    ),
    insight(
      nextId(),
      "Investment_Ready",
      "Investment-ready universe",
      `${readyCompanies.toLocaleString()} companies meet readiness thresholds (>$50M revenue and >200 employees) - ${Math.round(
        readyShare * 100
      )}% of the company book. Route these first into JV and industrial-land conversations.`,
      clamp01(0.4 + readyShare * 1.5),
      now
    ),
  ];

  const financialIntelligence: Insight[] = [
    insight(
      nextId(),
      "Ready_Pipeline",
      "Capital-ready pipeline",
      `${readyCompanies.toLocaleString()} companies clear the $50M / 200-employee bar. Pair them with pursue-grade opportunities before expanding to thinner profiles.`,
      clamp01(0.45 + readyShare * 1.4),
      now
    ),
    insight(
      nextId(),
      "Score_Quality",
      "Match score quality",
      `Mean final score across ${matchTotal.toLocaleString()} pairs is ${Math.round(
        avgScore * 100
      )}%. Use scores above ${Math.round(
        Math.max(avgScore, 0.7) * 100
      )}% as the default workbench cut for this run.`,
      clamp01(avgScore),
      now
    ),
    insight(
      nextId(),
      "Pursue_Conversion",
      "Pursue conversion headroom",
      `${pursueTotal.toLocaleString()} pursue-grade pairs are available against ${companyTotal.toLocaleString()} companies. Concentration in the top sectors means capital facilitation should be sector-batched, not sprayed.`,
      clamp01(0.5 + pursueShare),
      now
    ),
    insight(
      nextId(),
      "RHQ_Economics",
      "RHQ economics signal",
      `${rhqCount.toLocaleString()} companies already show RHQ footprint (${Math.round(
        rhqShare * 100
      )}%). ${menaNoRhq.toLocaleString()} MENA-present firms still lack RHQ status - a conversion programme target.`,
      clamp01(0.4 + rhqShare * 2),
      now
    ),
  ];

  const growthSignals: Insight[] = [
    insight(
      nextId(),
      "Top_Company_Momentum",
      "Top company momentum",
      topCompany
        ? `${topCompany.company} leads with ${Number(
            topCompany.pursue
          ).toLocaleString()} pursue-grade matches (avg score ${Math.round(
            Number(topCompany.avg_score) * 100
          )}%) in ${topCompany.sector}. Open Match Cases for its top pairs first.`
        : "No pursue-grade company leaders yet in this matching run.",
      topCompany
        ? clamp01(0.55 + Math.min(Number(topCompany.pursue) / 40, 0.4))
        : 0.35,
      now
    ),
    insight(
      nextId(),
      "Sector_Surge",
      "Sector surge",
      `${topSector} holds ${topSectorPursue.toLocaleString()} pursue matches across the live engine${
        topSectorCompanies
          ? ` and ${topSectorCompanies.toLocaleString()} companies in the book`
          : ""
      }. Assign senior officers to this vertical.`,
      clamp01(0.5 + Math.min(topSectorPursue / 200, 0.45)),
      now
    ),
    insight(
      nextId(),
      "Excellent_Growth",
      "Excellent-tier growth pocket",
      `${excellentTotal.toLocaleString()} Excellent matches are ready for facilitation. Convert the top 10 into active Pursuit Engage this sprint.`,
      clamp01(0.5 + Math.min(excellentTotal / 150, 0.45)),
      now
    ),
    insight(
      nextId(),
      "Coverage_Expansion",
      "Coverage expansion",
      `${matchTotal.toLocaleString()} scored pairs cover ${companyTotal.toLocaleString()} companies. Keep rematching high-priority names on demand as profiles enrich.`,
      clamp01(0.45 + Math.min(matchTotal / 5000, 0.4)),
      now
    ),
  ];

  const geographicIntelligence: Insight[] = [
    insight(
      nextId(),
      "MENA_Presence",
      "MENA presence",
      `${menaPresence.toLocaleString()} companies (${Math.round(
        menaShare * 100
      )}%) report MENA presence. Use this cohort for RHQ and regional-platform pitches.`,
      clamp01(0.4 + menaShare),
      now
    ),
    insight(
      nextId(),
      "KSA_Footprint",
      "KSA footprint",
      `${saudiPresence.toLocaleString()} companies (${Math.round(
        saudiShare * 100
      )}%) already have Saudi presence - strongest candidates for expansion and localization models.`,
      clamp01(0.4 + saudiShare * 1.2),
      now
    ),
    insight(
      nextId(),
      "RHQ_Gap",
      "RHQ conversion gap",
      `${menaNoRhq.toLocaleString()} MENA-present companies lack RHQ status. A focused conversion track could unlock new RHQ filings within 12-18 months.`,
      clamp01(0.45 + Math.min(menaNoRhq / 500, 0.4)),
      now
    ),
    insight(
      nextId(),
      "Geo_Pursue_Align",
      "Geo-pursue alignment",
      `${pursueTotal.toLocaleString()} pursue matches sit on a book where ${Math.round(
        menaShare * 100
      )}% already operate in MENA. Lead with companies that combine pursue grade and regional presence.`,
      clamp01(0.5 + pursueShare * 0.5 + menaShare * 0.3),
      now
    ),
  ];

  const sectorIntelligence: Insight[] = [
    insight(
      nextId(),
      "Leading_Sector",
      "Leading pursue sector",
      `${topSector} is the densest pursue sector with ${topSectorPursue.toLocaleString()} pursue-grade pairs. Staff sector desks accordingly.`,
      clamp01(0.55 + Math.min(topSectorPursue / 180, 0.4)),
      now
    ),
    ...sectorPursueRows.slice(0, 3).map((row, idx) => {
      const pursue = Number(row.pursue);
      const total = Number(row.total) || 1;
      return insight(
        nextId(),
        `Sector_${idx + 1}`,
        `${row.sector} depth`,
        `${pursue.toLocaleString()} pursue of ${total.toLocaleString()} pairs (${Math.round(
          (pursue / total) * 100
        )}% pursue rate) in ${row.sector}. Keep this vertical on the weekly leadership brief.`,
        clamp01(0.4 + pursue / total * 0.55),
        now
      );
    }),
  ].slice(0, 4);

  while (sectorIntelligence.length < 4) {
    sectorIntelligence.push(
      insight(
        nextId(),
        "Sector_Coverage",
        "Sector coverage",
        `${sectorCompanyRows.length} sectors are active in the company book. Broaden exploration outside ${topSector} only after pursue clearance there.`,
        0.55,
        now
      )
    );
  }

  const competitiveIntelligence: Insight[] = [
    insight(
      nextId(),
      "Flagship_Company",
      "Flagship company",
      topCompany
        ? `${topCompany.company} is the competitive flagship with ${Number(
            topCompany.pursue
          ).toLocaleString()} pursue matches at ${Math.round(
            Number(topCompany.avg_score) * 100
          )}% average score.`
        : "No flagship company yet - rematch priority names to surface leaders.",
      topCompany ? 0.9 : 0.4,
      now
    ),
    ...topCompanyRows.slice(1, 4).map((row, idx) =>
      insight(
        nextId(),
        `Competitor_${idx + 1}`,
        row.company,
        `${Number(row.pursue).toLocaleString()} pursue-grade matches in ${
          row.sector
        } (avg ${Math.round(Number(row.avg_score) * 100)}%). Watch for overlap before parallel outreach.`,
        clamp01(0.5 + Math.min(Number(row.pursue) / 30, 0.4)),
        now
      )
    ),
  ];

  while (competitiveIntelligence.length < 4) {
    competitiveIntelligence.push(
      insight(
        nextId(),
        "Compete_Watch",
        "Competitive watch",
        "Continue scoring new company profiles to widen the competitive set beyond the current pursue leaders.",
        0.5,
        now
      )
    );
  }

  // Desk order: locate → classify → size market → momentum → capital → competition
  const data: CategoryMap = {
    "Geographic Intelligence": geographicIntelligence,
    "Sector Intelligence": sectorIntelligence,
    "Market Opportunity": marketOpportunity,
    "Growth Signals": growthSignals,
    "Financial Intelligence": financialIntelligence,
    "Competitive Intelligence": competitiveIntelligence,
  };

  // Attach meta without breaking category iteration on older clients
  (data as any)._meta = {
    engine: "live_matching_engine",
    generatedAt: now,
    companies: companyTotal,
    matches: matchTotal,
    pursue: pursueTotal,
  };

  cache = { at: Date.now(), data };
  return data;
}
