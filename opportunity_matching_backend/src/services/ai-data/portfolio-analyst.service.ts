/**
 * Portfolio Analyst Engine
 * Builds leadership briefs from live MatchingOutput evidence.
 * Optionally elevates prose via Azure OpenAI when configured.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type AnalystBrief = {
  insightType: string;
  description: string;
  score: number;
  createdAt: string;
  source: "live_matching_engine" | "azure_analyst";
};

export type AnalystFinding = {
  title: string;
  detail: string;
  additionalData: { section: string; engine: string };
  createdAt: string;
};

type EvidencePack = {
  totals: {
    matches: number;
    companies: number;
    opportunities: number;
    excellent: number;
    strong: number;
    good: number;
    pursue: number;
    highConfidence: number;
  };
  tierBreakdown: { tier: string; count: number }[];
  sectorPursue: { sector: string; pursue: number; total: number }[];
  topMatches: {
    company: string;
    opportunity: string;
    tier: string;
    confidence: string | null;
    score: number | null;
    strength: string;
    risk: string;
  }[];
  generatedAt: string;
};

let cache: {
  at: number;
  briefs: AnalystBrief[];
  findings: AnalystFinding[];
  engine: string;
  pulse: EvidencePack["totals"] & {
    topSector: string | null;
    topSectorPursue: number;
    generatedAt: string;
  };
} | null = null;

const CACHE_MS = 10 * 60 * 1000;

function truncate(s: string | null | undefined, n = 160): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "") + "…";
}

function isPursueTier(tier?: string | null): boolean {
  if (!tier) return false;
  return /excellent|strong|good/i.test(tier);
}

async function buildEvidencePack(): Promise<EvidencePack> {
  const [totalMatches, tierGroups, sectorRows, topRows, companyCount, oppCount] =
    await Promise.all([
      prisma.matchingOutput.count(),
      prisma.matchingOutput.groupBy({
        by: ["decision_tier"],
        _count: { _all: true },
      }),
      prisma.$queryRaw<
        { sector: string; pursue: bigint; total: bigint }[]
      >`
        SELECT COALESCE(company_sector, 'Unknown') AS sector,
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
      prisma.matchingOutput.findMany({
        where: {
          OR: [
            { decision_tier: { contains: "Excellent", mode: "insensitive" } },
            { decision_tier: { contains: "Strong", mode: "insensitive" } },
          ],
        },
        include: { company: true, opportunity: true },
        orderBy: { final_score: "desc" },
        take: 8,
      }),
      prisma.matchingOutput.findMany({
        distinct: ["companyId"],
        select: { companyId: true },
      }),
      prisma.matchingOutput.findMany({
        distinct: ["opportunityId"],
        select: { opportunityId: true },
      }),
    ]);

  const tierBreakdown = tierGroups
    .map((g) => ({
      tier: g.decision_tier || "Unspecified",
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const countTier = (...needles: string[]) =>
    tierBreakdown
      .filter((t) => needles.some((n) => t.tier.toLowerCase().includes(n)))
      .reduce((s, t) => s + t.count, 0);

  const excellent = countTier("excellent");
  const strong = countTier("strong");
  const good = countTier("good");
  const pursue = excellent + strong + good;

  const highConfidence = await prisma.matchingOutput.count({
    where: {
      OR: [
        { confidence_label: { equals: "High", mode: "insensitive" } },
        { confidence_score: { gte: 80 } },
      ],
    },
  });

  return {
    totals: {
      matches: totalMatches,
      companies: companyCount.length,
      opportunities: oppCount.length,
      excellent,
      strong,
      good,
      pursue,
      highConfidence,
    },
    tierBreakdown,
    sectorPursue: sectorRows.map((r) => ({
      sector: r.sector,
      pursue: Number(r.pursue),
      total: Number(r.total),
    })),
    topMatches: topRows.map((m) => ({
      company: m.company?.company_name || "Unknown company",
      opportunity: m.opportunity?.opportunity_name || "Unknown opportunity",
      tier: m.decision_tier || "-",
      confidence: m.confidence_label,
      score: m.final_score,
      strength: truncate(m.strengths, 180),
      risk: truncate(m.risks, 180),
    })),
    generatedAt: new Date().toISOString(),
  };
}

function deterministicBriefs(pack: EvidencePack): AnalystBrief[] {
  const now = pack.generatedAt;
  const t = pack.totals;
  const topSector = pack.sectorPursue[0];
  const top = pack.topMatches[0];
  const second = pack.topMatches[1];

  const briefs: AnalystBrief[] = [
    {
      insightType: "Pursue_Now",
      score: t.matches ? Math.min(0.99, t.pursue / Math.max(t.matches * 0.25, 1)) : 0.7,
      createdAt: now,
      source: "live_matching_engine",
      description: `Open ${t.pursue} pursue-grade matches now (${t.excellent} Excellent, ${t.strong} Strong, ${t.good} Good) across ${t.companies} companies and ${t.opportunities} opportunities. ${t.highConfidence} carry High confidence - prioritize those for officer outreach this week.`,
    },
  ];

  if (top) {
    briefs.push({
      insightType: "Flagship_Pairing",
      score: top.score ?? 0.9,
      createdAt: now,
      source: "live_matching_engine",
      description: `${top.company} × ${top.opportunity} leads the queue (${top.tier}${top.confidence ? `, ${top.confidence} confidence` : ""}). Strength: ${top.strength || "capability alignment evidenced in match narratives."} Risk to pressure-test: ${top.risk || "localization / regulatory footprint."}`,
    });
  }

  if (topSector) {
    briefs.push({
      insightType: "Sector_Focus",
      score: 0.82,
      createdAt: now,
      source: "live_matching_engine",
      description: `${topSector.sector} concentrates pursue activity (${topSector.pursue} of ${topSector.total} matches in-sector). Staff sector desks here first; thinner pursue density in other sectors should not block Excellent outliers elsewhere.`,
    });
  }

  if (second) {
    briefs.push({
      insightType: "Second_Wave",
      score: second.score ?? 0.78,
      createdAt: now,
      source: "live_matching_engine",
      description: `Next in line: ${second.company} × ${second.opportunity} (${second.tier}). Use Match Case to confirm localization model before Pursuit Engage - do not batch-email without case review.`,
    });
  }

  briefs.push({
    insightType: "Operating_Cadence",
    score: 0.75,
    createdAt: now,
    source: "live_matching_engine",
    description: `Recommended IPA cadence: Portfolio Monday for leadership, Match Workbench daily for officers (Excellent/Strong only), Match Case for evidence, Pursuit Pipeline for Engage → Plan → MoU → Landed. Reject weak pairs early to protect officer bandwidth.`,
  });

  return briefs.slice(0, 5);
}

function deterministicFindings(pack: EvidencePack): AnalystFinding[] {
  const now = pack.generatedAt;
  const t = pack.totals;
  const top3 = pack.topMatches.slice(0, 3);
  const sectors = pack.sectorPursue
    .slice(0, 3)
    .map((s) => `${s.sector} (${s.pursue} pursue)`)
    .join("; ");

  const summaryLines = [
    `Matching engine v3 surfaces ${t.matches} scored pairings. Pursue pocket: ${t.excellent} Excellent + ${t.strong} Strong + ${t.good} Good (${t.pursue} total).`,
    top3.length
      ? `Immediate shortlist: ${top3
          .map((m) => `${m.company} → ${m.opportunity} (${m.tier})`)
          .join("; ")}.`
      : "",
    sectors ? `Sector pressure: ${sectors}.` : "",
    `${t.highConfidence} matches are High-confidence - treat Low-confidence pursues as Hold until evidence improves.`,
  ]
    .filter(Boolean)
    .join(" ");

  const findings: AnalystFinding[] = [
    {
      title: "Executive match brief",
      detail: summaryLines,
      additionalData: { section: "summary", engine: "live_matching_engine" },
      createdAt: now,
    },
    {
      title: "Where to staff officers",
      detail: pack.sectorPursue[0]
        ? `${pack.sectorPursue[0].sector} holds the densest pursue set (${pack.sectorPursue[0].pursue}). Assign senior sector coverage there; use Explore to fill thin sectors rather than forcing weak matches.`
        : "Sector staffing signal unavailable.",
      additionalData: { section: "staffing", engine: "live_matching_engine" },
      createdAt: now,
    },
    {
      title: "Evidence quality gate",
      detail: `Every pursue recommendation is backed by strengths/risks narratives on MatchingOutput. Officers should open Match Case before Pursuit Engage - thumbs-up alone is not facilitation.`,
      additionalData: { section: "quality", engine: "live_matching_engine" },
      createdAt: now,
    },
    {
      title: "Pipeline conversion focus",
      detail: `Convert the top ${Math.min(10, t.excellent || 5)} Excellent matches into Engage this sprint. Target: at least 3 Plan-shared and 1 MoU conversation opened from that cohort.`,
      additionalData: { section: "pipeline", engine: "live_matching_engine" },
      createdAt: now,
    },
  ];

  return findings;
}

async function azureElevate(
  pack: EvidencePack,
  baseBriefs: AnalystBrief[],
  baseFindings: AnalystFinding[]
): Promise<{ briefs: AnalystBrief[]; findings: AnalystFinding[] } | null> {
  const useFlag = String(process.env.MISA_USE_AZURE_OPENAI || "").toLowerCase() === "true";
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "");
  const key = process.env.AZURE_OPENAI_API_KEY || "";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

  // Use Azure whenever credentials exist (flag preferred but not required)
  if ((!useFlag && !(endpoint && key && deployment)) || !endpoint || !key || !deployment) {
    return null;
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const system = `You are the chief investment promotion analyst for a Ministry of Investment.
Write decision-ready briefs for leadership and officers.
Rules:
- No raw HHI/entropy/nan/statistical dumps.
- No invented companies or opportunities - use only the evidence pack.
- Be specific, actionable, concise.
- Return STRICT JSON only with shape:
{
  "briefs": [{"insightType":"string","description":"2-3 sentences","score":0.0-1.0}],
  "findings": [{"title":"string","detail":"3-5 sentences"}]
}
Provide exactly 5 briefs and 4 findings.`;

  const user = JSON.stringify({
    role: "portfolio_analyst_input",
    evidence: pack,
    draft_briefs: baseBriefs,
    draft_findings: baseFindings,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": key,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        max_tokens: 1800,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[portfolio-analyst] Azure error", res.status, errText.slice(0, 300));
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const now = new Date().toISOString();

    const briefs: AnalystBrief[] = (parsed.briefs || [])
      .slice(0, 5)
      .map((b: any) => ({
        insightType: String(b.insightType || "Brief").replace(/\s+/g, "_"),
        description: String(b.description || "").trim(),
        score: typeof b.score === "number" ? b.score : 0.8,
        createdAt: now,
        source: "azure_analyst" as const,
      }))
      .filter((b: AnalystBrief) => b.description.length > 40);

    const findings: AnalystFinding[] = (parsed.findings || [])
      .slice(0, 4)
      .map((f: any) => ({
        title: String(f.title || "Finding").trim(),
        detail: String(f.detail || "").trim(),
        additionalData: { section: "azure", engine: "azure_analyst" },
        createdAt: now,
      }))
      .filter((f: AnalystFinding) => f.detail.length > 40);

    if (briefs.length < 3 || findings.length < 2) return null;
    return { briefs, findings };
  } catch (err) {
    console.error("[portfolio-analyst] Azure elevate failed", err);
    return null;
  }
}

export async function generatePortfolioAnalyst() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache;
  }

  const pack = await buildEvidencePack();
  const baseBriefs = deterministicBriefs(pack);
  const baseFindings = deterministicFindings(pack);

  const elevated = await azureElevate(pack, baseBriefs, baseFindings);
  const result = {
    at: Date.now(),
    briefs: elevated?.briefs || baseBriefs,
    findings: elevated?.findings || baseFindings,
    engine: elevated ? "azure_analyst+live_matching" : "live_matching_engine",
    pulse: {
      ...pack.totals,
      topSector: pack.sectorPursue[0]?.sector || null,
      topSectorPursue: pack.sectorPursue[0]?.pursue || 0,
      generatedAt: pack.generatedAt,
    },
  };
  cache = result;
  return result;
}

/** Force refresh (e.g. after new matching run). */
export function invalidatePortfolioAnalystCache() {
  cache = null;
}
