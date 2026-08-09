/**
 * Live Investment Opportunity Heat Map
 * Sector × ticket-size matrix from Opportunity + MatchingOutput (pursue coverage).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const INVESTMENT_BUCKETS = [
  "$1-10M",
  "$10-50M",
  "$50-100M",
  "$100M-1B",
  "$1B+",
] as const;

export type InvestmentBucket = (typeof INVESTMENT_BUCKETS)[number];

export type HeatmapCell = {
  opportunityCount: number;
  pursueMatchCount: number;
  coveredOpportunities: number;
  coverageRate: number | null;
  avgPursueScore: number | null;
  totalValueUsd: number;
  /** Honest display unit for value - millions USD */
  totalValueMillionUsd: number;
  density: number;
  tooltip: string;
};

export type LiveHeatmap = {
  [sector: string]: {
    [bucket: string]: HeatmapCell;
  };
};

export type LiveHeatmapResult = {
  heatmap: LiveHeatmap;
  meta: {
    engine: "live_pursue_coverage";
    opportunityTotal: number;
    bucketed: number;
    unspecified: number;
    buckets: string[];
    generatedAt: string;
  };
};

const SAR_PER_USD = 3.75;

/** Parse messy investment_range text → approximate midpoint USD. */
export function parseInvestmentUsd(raw?: string | null): number | null {
  if (!raw) return null;
  const t = String(raw).toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();
  if (!t || /tbd|not specified|n\/a|na\b|unknown/.test(t)) return null;

  const isSar = /\bsar\b|\briyal/.test(t);

  type Hit = { value: number; unit: "b" | "m" | "raw" };
  const hits: Hit[] = [];

  const re =
    /(\d+(?:\.\d+)?)\s*(billion|bn|b\.?|million|mn|m\.?)?(?:\s*usd)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n)) continue;
    const u = (m[2] || "").toLowerCase().replace(/\./g, "");
    if (["billion", "bn", "b"].includes(u)) hits.push({ value: n * 1e9, unit: "b" });
    else if (["million", "mn", "m"].includes(u)) hits.push({ value: n * 1e6, unit: "m" });
    else hits.push({ value: n, unit: "raw" });
  }

  if (!hits.length) return null;

  // Promote bare numbers that are clearly millions in context ("5.33M USD" already caught;
  // "Expected Investment size: 1.7M USD" caught; bare "195" with million nearby handled)
  let values = hits.map((h) => {
    if (h.unit === "raw") {
      // Common pattern: "SAR 195 million" already unit m; if raw and text has million later, skip
      if (/\bmillion\b|\bmn\b|\bm usd\b|\busd m\b/.test(t) && h.value < 1e5) {
        return h.value * 1e6;
      }
      // Bare "1.7" with "m usd" style already handled by regex; leave small raw as millions if 1..999 and M implied
      if (/\d\s*[-–]\s*\d/.test(t) && h.value < 1000 && /m\b|million/.test(t)) {
        return h.value * 1e6;
      }
      // Values like 140-160 with million in string
      if (h.value >= 1 && h.value < 5000 && /million|mn|\bm\b/.test(t) && !/billion|bn/.test(t)) {
        return h.value * 1e6;
      }
      // Billion without unit word but "billion" in string
      if (h.value < 100 && /billion|bn/.test(t)) return h.value * 1e9;
      return h.value;
    }
    return h.value;
  });

  // Drop absurd outliers (> $5T) from bad parses
  values = values.filter((v) => v > 0 && v < 5e12);
  if (!values.length) return null;

  let mid = (Math.min(...values) + Math.max(...values)) / 2;
  if (isSar) mid = mid / SAR_PER_USD;

  // If still tiny (< $100k) after parse, treat as unusable
  if (mid < 1e5) return null;
  // Cap display contribution at $50B per opportunity to protect matrix
  if (mid > 5e10) mid = 5e10;

  return mid;
}

export function bucketInvestmentUsd(usd: number | null): InvestmentBucket | "Unspecified" {
  if (usd == null) return "Unspecified";
  if (usd < 10e6) return "$1-10M";
  if (usd < 50e6) return "$10-50M";
  if (usd < 100e6) return "$50-100M";
  if (usd < 1e9) return "$100M-1B";
  return "$1B+";
}

function emptyCell(): HeatmapCell {
  return {
    opportunityCount: 0,
    pursueMatchCount: 0,
    coveredOpportunities: 0,
    coverageRate: null,
    avgPursueScore: null,
    totalValueUsd: 0,
    totalValueMillionUsd: 0,
    density: 0,
    tooltip: "",
  };
}

function isPursueTier(tier?: string | null): boolean {
  if (!tier) return false;
  return /excellent|strong|good/i.test(tier);
}

let cache: { at: number; result: LiveHeatmapResult } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export function invalidateLiveHeatmapCache() {
  cache = null;
}

export async function buildLivePursueHeatmap(): Promise<LiveHeatmapResult> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.result;

  const [opportunities, pursueMatches] = await Promise.all([
    prisma.opportunity.findMany({
      select: {
        id: true,
        sector: true,
        investment_range: true,
        opportunity_name: true,
      },
    }),
    prisma.matchingOutput.findMany({
      where: {
        OR: [
          { decision_tier: { contains: "Excellent", mode: "insensitive" } },
          { decision_tier: { contains: "Strong", mode: "insensitive" } },
          { decision_tier: { contains: "Good", mode: "insensitive" } },
        ],
      },
      select: {
        opportunityId: true,
        final_score: true,
        decision_tier: true,
      },
    }),
  ]);

  const pursueByOpp = new Map<
    number,
    { count: number; scoreSum: number; tiers: number }
  >();
  for (const m of pursueMatches) {
    if (!isPursueTier(m.decision_tier)) continue;
    const cur = pursueByOpp.get(m.opportunityId) || { count: 0, scoreSum: 0, tiers: 0 };
    cur.count += 1;
    if (m.final_score != null) {
      cur.scoreSum += m.final_score;
      cur.tiers += 1;
    }
    pursueByOpp.set(m.opportunityId, cur);
  }

  type Acc = {
    opportunityCount: number;
    pursueMatchCount: number;
    coveredOpportunities: number;
    scoreSum: number;
    scoreN: number;
    totalValueUsd: number;
  };

  const grid = new Map<string, Map<string, Acc>>();
  let bucketed = 0;
  let unspecified = 0;

  const ensure = (sector: string, bucket: string): Acc => {
    if (!grid.has(sector)) grid.set(sector, new Map());
    const row = grid.get(sector)!;
    if (!row.has(bucket)) {
      row.set(bucket, {
        opportunityCount: 0,
        pursueMatchCount: 0,
        coveredOpportunities: 0,
        scoreSum: 0,
        scoreN: 0,
        totalValueUsd: 0,
      });
    }
    return row.get(bucket)!;
  };

  for (const opp of opportunities) {
    const sector = (opp.sector || "Unknown").trim() || "Unknown";
    const usd = parseInvestmentUsd(opp.investment_range);
    const bucket = bucketInvestmentUsd(usd);
    if (bucket === "Unspecified") {
      unspecified += 1;
      continue;
    }
    bucketed += 1;

    const cell = ensure(sector, bucket);
    cell.opportunityCount += 1;
    if (usd) cell.totalValueUsd += usd;

    const pursue = pursueByOpp.get(opp.id);
    if (pursue && pursue.count > 0) {
      cell.pursueMatchCount += pursue.count;
      cell.coveredOpportunities += 1;
      cell.scoreSum += pursue.scoreSum;
      cell.scoreN += pursue.scoreN;
    }
  }

  // Ensure all sectors have all buckets (incl. zeros)
  const sectors = [...grid.keys()].sort((a, b) => {
    const ta = [...(grid.get(a)?.values() || [])].reduce((s, c) => s + c.opportunityCount, 0);
    const tb = [...(grid.get(b)?.values() || [])].reduce((s, c) => s + c.opportunityCount, 0);
    return tb - ta;
  });

  const heatmap: LiveHeatmap = {};
  for (const sector of sectors) {
    heatmap[sector] = {};
    let maxPursueInSector = 1;
    for (const b of INVESTMENT_BUCKETS) {
      const acc = grid.get(sector)?.get(b);
      if (acc) maxPursueInSector = Math.max(maxPursueInSector, acc.pursueMatchCount);
    }
    for (const b of INVESTMENT_BUCKETS) {
      const acc = grid.get(sector)?.get(b);
      if (!acc) {
        const empty = emptyCell();
        empty.tooltip = `${sector} · ${b}: no bucketed opportunities`;
        heatmap[sector][b] = empty;
        continue;
      }
      const coverage =
        acc.opportunityCount > 0 ? acc.coveredOpportunities / acc.opportunityCount : null;
      const avgScore = acc.scoreN > 0 ? acc.scoreSum / acc.scoreN : null;
      const valueM = acc.totalValueUsd / 1e6;
      const density = acc.pursueMatchCount / maxPursueInSector;

      heatmap[sector][b] = {
        opportunityCount: acc.opportunityCount,
        pursueMatchCount: acc.pursueMatchCount,
        coveredOpportunities: acc.coveredOpportunities,
        coverageRate: coverage,
        avgPursueScore: avgScore,
        totalValueUsd: acc.totalValueUsd,
        totalValueMillionUsd: Math.round(valueM * 10) / 10,
        density,
        tooltip: [
          `${sector} · ${b}`,
          `${acc.opportunityCount} opportunities`,
          `${acc.pursueMatchCount} pursue-grade matches (Excellent/Strong/Good)`,
          `${acc.coveredOpportunities}/${acc.opportunityCount} opportunities covered (${coverage != null ? Math.round(coverage * 100) : 0}%)`,
          avgScore != null ? `Avg pursue score ${Math.round(avgScore * 100)}%` : null,
          valueM > 0 ? `Est. ticket mass ~$${Math.round(valueM).toLocaleString()}M USD` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    }
  }

  const result: LiveHeatmapResult = {
    heatmap,
    meta: {
      engine: "live_pursue_coverage",
      opportunityTotal: opportunities.length,
      bucketed,
      unspecified,
      buckets: [...INVESTMENT_BUCKETS],
      generatedAt: new Date().toISOString(),
    },
  };

  cache = { at: Date.now(), result };
  return result;
}
