// src\services\ai-data\ai-data-executive.service.ts
import { generatePortfolioAnalyst } from "./portfolio-analyst.service";
import { buildLivePursueHeatmap } from "./heatmap-live.service";

export async function getPageAIDataForExecutiveOverview() {
  const [analyst, liveHeatmap] = await Promise.all([
    generatePortfolioAnalyst(),
    buildLivePursueHeatmap(),
  ]);

  const p = analyst.pulse;
  const now = p.generatedAt;

  // Decision-first pulse metrics (live MatchingOutput) - replaces stale DashboardKPI dump
  const kpis = [
    {
      name: "Pursue queue",
      subTitle: "Excellent · Strong · Good ready for officers",
      value: p.pursue,
      unit: "matches",
      calculatedAt: now,
      kind: "primary",
      accent: "pursue",
    },
    {
      name: "Excellent matches",
      subTitle: "Highest-tier pairings to open first",
      value: p.excellent,
      unit: "matches",
      calculatedAt: now,
      kind: "primary",
      accent: "excellent",
    },
    {
      name: "High confidence",
      subTitle: "Evidence-backed for outreach this week",
      value: p.highConfidence,
      unit: "matches",
      calculatedAt: now,
      kind: "primary",
      accent: "confidence",
    },
    {
      name: "Scored matches",
      subTitle: "Current matching run",
      value: p.matches,
      unit: "matches",
      calculatedAt: now,
      kind: "secondary",
      accent: "neutral",
    },
    {
      name: "Companies in run",
      subTitle: "Distinct company profiles scored",
      value: p.companies,
      unit: "companies",
      calculatedAt: now,
      kind: "secondary",
      accent: "neutral",
    },
    {
      name: "Opportunities",
      subTitle: "Distinct opportunities in match set",
      value: p.opportunities,
      unit: "opportunities",
      calculatedAt: now,
      kind: "secondary",
      accent: "neutral",
    },
    {
      name: p.topSector ? `Focus · ${p.topSector}` : "Sector focus",
      subTitle: "Top sector by pursue-grade density",
      value: p.topSectorPursue,
      unit: "pursue",
      calculatedAt: now,
      kind: "secondary",
      accent: "sector",
    },
  ];

  return {
    kpis,
    pulse: p,
    keyFindings: analyst.findings,
    aiInsights: analyst.briefs,
    analystEngine: analyst.engine,
    heatmap: liveHeatmap.heatmap,
    heatmapMeta: liveHeatmap.meta,
  };
}
