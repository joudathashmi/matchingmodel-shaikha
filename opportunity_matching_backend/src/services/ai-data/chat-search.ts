/**
 * Robust entity search for the AI Matchmaking chat.
 * Handles spaces, punctuation, quotes, multi-word legal names, and sectors.
 */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Space/punctuation-insensitive id lookup (avoids nested Prisma.sql template issues). */
async function findIdsByCompact(
  table: "Company" | "Opportunity",
  nameColumn: "company_name" | "opportunity_name",
  compacts: string[]
): Promise<number[]> {
  const uniq = Array.from(new Set(compacts.filter((c) => c.length >= 4))).slice(0, 4);
  if (!uniq.length) return [];
  const conds = uniq
    .map((_, i) => {
      const n = i + 1;
      return (
        "regexp_replace(lower(coalesce(\"" +
        nameColumn +
        "\",'')), '[^a-z0-9]', '', 'g') LIKE $" +
        n
      );
    })
    .join(" OR ");
  const params = uniq.map((c) => "%" + c + "%");
  const sql = 'SELECT id FROM "' + table + '" WHERE (' + conds + ") LIMIT 60";
  const rows = await prisma.$queryRawUnsafe<{ id: number }[]>(sql, ...params);
  return rows.map((r) => r.id);
}

const FILLER =
  /\b(what|which|who|where|how|about|tell|me|show|find|list|give|the|a|an|is|are|of|on|to|with|for|please|can|you|our|some|any|top|best|this|that|those|these|case|tier|score|info|information|details|profile|data|known|know|regarding|concerning|and|or|in|from|into)\b/gi;

const LEGAL_SUFFIX = new Set(
  [
    "ltd",
    "limited",
    "inc",
    "corp",
    "corporation",
    "co",
    "llc",
    "gmbh",
    "plc",
    "sa",
    "ag",
    "bv",
    "nv",
    "pty",
    "pvt",
    "private",
    "public",
    "company",
    "companies",
    "group",
    "holdings",
    "holding",
    "international",
    "industries",
    "industry",
    "opportunity",
    "opportunities",
    "match",
    "matches",
    "investment",
    "investments",
    "sector",
    "sectors",
  ].map((s) => s.toLowerCase())
);

/** Common sector/domain words - must not alone expand a named-entity search. */
const WEAK_ENTITY_TOKENS = new Set(
  [
    "pharma",
    "pharmaceutical",
    "pharmaceuticals",
    "healthcare",
    "health",
    "life",
    "sciences",
    "science",
    "energy",
    "water",
    "oil",
    "gas",
    "finance",
    "financial",
    "services",
    "technology",
    "tech",
    "digital",
    "industrial",
    "manufacturing",
    "drugs",
    "drug",
    "generic",
    "generics",
    "biotech",
    "bio",
    "medical",
    "medicine",
    "chemical",
    "chemicals",
    "engineering",
    "construction",
    "logistics",
    "tourism",
    "hospitality",
    "does",
    "have",
    "has",
    "had",
    "factory",
    "plant",
    "solutions",
    "systems",
    "excellent",
    "strong",
    "potential",
    "moderate",
    "pursue",
    "pairing",
    "pair",
    "ranked",
  ].map((s) => s.toLowerCase())
);

export function distinctiveTokens(tokens: string[]): string[] {
  return tokens.filter((t) => {
    const low = t.toLowerCase();
    if (WEAK_ENTITY_TOKENS.has(low)) return false;
    if (low.length < 4) return false;
    return true;
  });
}

function isWeakPhrase(p: string): boolean {
  const parts = collapseSpaces(p)
    .split(" ")
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  if (!parts.length) return true;
  return parts.every(
    (w) => WEAK_ENTITY_TOKENS.has(w) || LEGAL_SUFFIX.has(w) || w.length < 3
  );
}

function nameHasDistinctive(name: string, distinctive: string[]): boolean {
  if (!distinctive.length) return true;
  const n = (name || "").toLowerCase();
  const nc = normalizeCompact(name);
  return distinctive.some(
    (t) => n.includes(t.toLowerCase()) || nc.includes(normalizeCompact(t))
  );
}

export function normalizeCompact(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

export function collapseSpaces(s: string): string {
  return (s || "").replace(/\s+/g, " ").trim();
}

/** Extract quoted spans and the remaining free text. */
export function parseQuery(message: string): {
  quoted: string[];
  freeText: string;
  raw: string;
} {
  const raw = collapseSpaces(message || "");
  const quoted: string[] = [];
  const quoteRe = /['"“”‘’]([^'"“”‘’]{2,120})['"“”‘’]/g;
  let m: RegExpExecArray | null;
  let free = raw;
  while ((m = quoteRe.exec(raw)) !== null) {
    const q = collapseSpaces(m[1]);
    if (q) quoted.push(q);
  }
  free = collapseSpaces(raw.replace(quoteRe, " "));
  return { quoted, freeText: free, raw };
}

export function significantTokens(text: string): string[] {
  const cleaned = collapseSpaces(
    text
      .replace(FILLER, " ")
      .replace(/[?!,:;/\\|@#_~*]+/g, " ")
      .replace(/[.'’]/g, " ")
  );
  const out: string[] = [];
  for (const w of cleaned.split(" ")) {
    if (w.length < 2) continue;
    const low = w.toLowerCase();
    if (LEGAL_SUFFIX.has(low)) continue;
    if (!/[a-z0-9]/i.test(w)) continue;
    if (!out.some((x) => x.toLowerCase() === low)) out.push(w);
  }
  return out;
}

/** Progressive phrases: "Hayat Pharmaceutical", "Hayat Pharmaceutical Industries", … */
export function buildPhrases(tokens: string[], quoted: string[]): string[] {
  const phrases: string[] = [...quoted.map(collapseSpaces).filter(Boolean)];
  if (tokens.length >= 2) {
    for (let len = Math.min(6, tokens.length); len >= 2; len--) {
      for (let i = 0; i + len <= tokens.length; i++) {
        phrases.push(tokens.slice(i, i + len).join(" "));
      }
    }
  }
  // distinctive singles first (Hayat, EastPharma, Veolia)
  for (const t of tokens) {
    if (t.length >= 4) phrases.push(t);
  }
  // unique preserve order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of phrases) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out.slice(0, 16);
}

export type CompanyHit = {
  companyId: number;
  name: string;
  sector: string | null;
  profile: string | null;
  products: string | null;
  hq: string | null;
  employees: number | null;
  revenueUsd: number | null;
  rhqStatus: string | null;
  relevance: number;
};

export type OpportunityHit = {
  opportunityId: number;
  name: string;
  sector: string | null;
  description: string | null;
  highlights: string | null;
  investmentRange: string | null;
  marketSize: string | null;
  region: string | null;
  relevance: number;
};

export type MatchHit = {
  matchId: number;
  companyId: number;
  opportunityId: number;
  company: string;
  opportunity: string;
  companySector: string | null;
  opportunitySector: string | null;
  tier: string | null;
  confidence: string | null;
  score: number | null;
  strengths: string | null;
  risks: string | null;
  companyProfile: string | null;
  opportunityDescription: string | null;
  investmentRange: string | null;
  marketSize: string | null;
  region: string | null;
  relevance: number;
};

function scoreName(name: string, phrases: string[], tokens: string[]): number {
  const n = (name || "").toLowerCase();
  const compact = normalizeCompact(name);
  const distinctive = distinctiveTokens(tokens);
  let score = 0;
  for (const p of phrases) {
    const pl = p.toLowerCase();
    const pc = normalizeCompact(p);
    if (!pl) continue;
    const weak = isWeakPhrase(p);
    if (n === pl) score += weak ? 40 : 200;
    else if (n.startsWith(pl)) score += weak ? 25 : 120;
    else if (n.includes(pl)) score += weak ? 12 : 90;
    if (pc && compact.includes(pc)) {
      score += weak ? 8 : pc.length >= 8 ? 80 : 40;
    }
  }
  // Distinctive tokens in the name dominate ranking
  for (const t of distinctive) {
    const tl = t.toLowerCase();
    const tc = normalizeCompact(t);
    if (n === tl || compact === tc) score += 180;
    else if (n.startsWith(tl) || compact.startsWith(tc)) score += 140;
    else if (n.includes(tl) || compact.includes(tc)) score += 110;
  }
  if (distinctive.length >= 2) {
    const allIn = distinctive.every(
      (t) => n.includes(t.toLowerCase()) || compact.includes(normalizeCompact(t))
    );
    if (allIn) score += 90 + distinctive.length * 10;
  } else if (tokens.length >= 2 && !distinctive.length) {
    const allIn = tokens.every(
      (t) => n.includes(t.toLowerCase()) || compact.includes(normalizeCompact(t))
    );
    if (allIn) score += 40;
  }
  return score;
}

function scoreSector(sector: string | null, phrases: string[], tokens: string[]): number {
  const s = (sector || "").toLowerCase();
  if (!s) return 0;
  const sc = normalizeCompact(sector || "");
  let score = 0;
  for (const p of phrases) {
    const pl = p.toLowerCase();
    const pc = normalizeCompact(p);
    if (s === pl || sc === pc) score += 60;
    else if (s.includes(pl) || (pc.length >= 6 && sc.includes(pc))) score += 30;
  }
  // "Healthcare and Life Sciences" vs "Healthcare & Life Sciences"
  if (tokens.filter((t) => s.includes(t.toLowerCase())).length >= 2) score += 25;
  return score;
}

export async function searchCompaniesRobust(
  message: string,
  limit = 8
): Promise<CompanyHit[]> {
  const { quoted, freeText } = parseQuery(message);
  const tokens = significantTokens([...quoted, freeText].join(" "));
  const phrases = buildPhrases(tokens, quoted);
  const distinctive = distinctiveTokens(tokens);
  const entityLookup = quoted.length > 0 || distinctive.length > 0;

  if (!phrases.length && !tokens.length) {
    const rows = await prisma.company.findMany({
      take: limit,
      orderBy: { company_name: "asc" },
    });
    return rows.map((c) => ({
      companyId: c.id,
      name: c.company_name,
      sector: c.company_sector,
      profile: c.company_profile,
      products: c.product_services,
      hq: c.global_headquarters,
      employees: c.number_of_employees,
      revenueUsd: c.revenue_usd,
      rhqStatus: c.rhq_status,
      relevance: 0,
    }));
  }

  const or: Prisma.CompanyWhereInput[] = [];
  if (entityLookup) {
    // Named entity: search names only - never flood via sector keywords
    for (const q of quoted) {
      or.push({ company_name: { contains: q, mode: "insensitive" } });
    }
    for (const t of distinctive) {
      or.push({ company_name: { contains: t, mode: "insensitive" } });
    }
    for (const p of phrases.slice(0, 10)) {
      if (isWeakPhrase(p)) continue;
      if (
        distinctive.some((d) => p.toLowerCase().includes(d.toLowerCase())) ||
        quoted.some((q) => p.toLowerCase() === q.toLowerCase())
      ) {
        or.push({ company_name: { contains: p, mode: "insensitive" } });
      }
    }
  } else {
    for (const p of phrases.slice(0, 10)) {
      or.push({ company_name: { contains: p, mode: "insensitive" } });
      or.push({ company_sector: { contains: p, mode: "insensitive" } });
    }
    for (const t of tokens.slice(0, 6)) {
      or.push({ company_name: { contains: t, mode: "insensitive" } });
      or.push({ company_sector: { contains: t, mode: "insensitive" } });
    }
  }

  if (!or.length) {
    for (const t of tokens.slice(0, 4)) {
      or.push({ company_name: { contains: t, mode: "insensitive" } });
    }
  }

  const compactCandidates = [
    ...quoted.map(normalizeCompact),
    ...distinctive.map(normalizeCompact),
    normalizeCompact(distinctive.slice(0, 5).join("") || tokens.slice(0, 5).join("")),
  ].filter((c) => c.length >= 4);

  const sqlIds = await findIdsByCompact(
    "Company",
    "company_name",
    compactCandidates
  );

  const prismaRows = await prisma.company.findMany({
    where: { OR: or },
    take: entityLookup ? 40 : 80,
  });

  const byId = new Map<number, (typeof prismaRows)[0]>();
  for (const r of prismaRows) byId.set(r.id, r);
  if (sqlIds.length) {
    const extra = await prisma.company.findMany({ where: { id: { in: sqlIds } } });
    for (const r of extra) byId.set(r.id, r);
  }

  let ranked = Array.from(byId.values())
    .map((c) => {
      const nameScore = scoreName(c.company_name, phrases, tokens);
      const sectorScore = entityLookup
        ? 0
        : scoreSector(c.company_sector, phrases, tokens);
      const relevance = nameScore * 2 + sectorScore;
      return { c, relevance, nameScore, name: c.company_name };
    })
    .filter((x) => x.relevance > 0)
    .sort(
      (a, b) =>
        b.relevance - a.relevance || a.c.company_name.localeCompare(b.c.company_name)
    );

  if (entityLookup) {
    const tight = ranked.filter((x) => nameHasDistinctive(x.name, distinctive));
    if (tight.length) ranked = tight;
    if (ranked.length) {
      const top = ranked[0].relevance;
      ranked = ranked.filter(
        (x) => x.relevance >= top * 0.55 || x.nameScore >= ranked[0].nameScore * 0.7
      );
    }
  }

  return ranked.slice(0, limit).map(({ c, relevance }) => ({
    companyId: c.id,
    name: c.company_name,
    sector: c.company_sector,
    profile: c.company_profile,
    products: c.product_services,
    hq: c.global_headquarters,
    employees: c.number_of_employees,
    revenueUsd: c.revenue_usd,
    rhqStatus: c.rhq_status,
    relevance,
  }));
}

export async function searchOpportunitiesRobust(
  message: string,
  limit = 8
): Promise<OpportunityHit[]> {
  const { quoted, freeText } = parseQuery(message);
  const tokens = significantTokens([...quoted, freeText].join(" "));
  const phrases = buildPhrases(tokens, quoted);
  const distinctive = distinctiveTokens(tokens);
  const entityLookup = quoted.length > 0 || distinctive.length > 0;

  if (!phrases.length && !tokens.length) {
    const rows = await prisma.opportunity.findMany({
      take: limit,
      orderBy: { opportunity_name: "asc" },
    });
    return rows.map((o) => ({
      opportunityId: o.id,
      name: o.opportunity_name,
      sector: o.sector,
      description: o.opportunity_description,
      highlights: o.investment_highlights,
      investmentRange: o.investment_range,
      marketSize: o.market_size,
      region: o.region || o.location,
      relevance: 0,
    }));
  }

  const or: Prisma.OpportunityWhereInput[] = [];
  if (entityLookup) {
    for (const q of quoted) {
      or.push({ opportunity_name: { contains: q, mode: "insensitive" } });
    }
    for (const t of distinctive) {
      or.push({ opportunity_name: { contains: t, mode: "insensitive" } });
    }
    for (const p of phrases.slice(0, 10)) {
      if (isWeakPhrase(p)) continue;
      if (
        distinctive.some((d) => p.toLowerCase().includes(d.toLowerCase())) ||
        quoted.some((q) => p.toLowerCase() === q.toLowerCase())
      ) {
        or.push({ opportunity_name: { contains: p, mode: "insensitive" } });
      }
    }
  } else {
    for (const p of phrases.slice(0, 10)) {
      or.push({ opportunity_name: { contains: p, mode: "insensitive" } });
      or.push({ sector: { contains: p, mode: "insensitive" } });
    }
    for (const t of tokens.slice(0, 6)) {
      or.push({ opportunity_name: { contains: t, mode: "insensitive" } });
      or.push({ sector: { contains: t, mode: "insensitive" } });
    }
  }

  if (!or.length) {
    for (const t of tokens.slice(0, 4)) {
      or.push({ opportunity_name: { contains: t, mode: "insensitive" } });
    }
  }

  const compactCandidates = [
    ...quoted.map(normalizeCompact),
    ...distinctive.map(normalizeCompact),
    normalizeCompact(distinctive.slice(0, 5).join("") || tokens.slice(0, 5).join("")),
  ].filter((c) => c.length >= 4);

  const sqlIds = await findIdsByCompact(
    "Opportunity",
    "opportunity_name",
    compactCandidates
  );

  const prismaRows = await prisma.opportunity.findMany({
    where: { OR: or },
    take: entityLookup ? 40 : 80,
  });
  const byId = new Map<number, (typeof prismaRows)[0]>();
  for (const r of prismaRows) byId.set(r.id, r);
  if (sqlIds.length) {
    const extra = await prisma.opportunity.findMany({ where: { id: { in: sqlIds } } });
    for (const r of extra) byId.set(r.id, r);
  }

  let ranked = Array.from(byId.values())
    .map((o) => {
      const nameScore = scoreName(o.opportunity_name, phrases, tokens);
      const sectorScore = entityLookup
        ? 0
        : scoreSector(o.sector, phrases, tokens);
      const relevance = nameScore * 2 + sectorScore;
      return { o, relevance, nameScore, name: o.opportunity_name };
    })
    .filter((x) => x.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  if (entityLookup) {
    const tight = ranked.filter((x) => nameHasDistinctive(x.name, distinctive));
    if (tight.length) ranked = tight;
    if (ranked.length) {
      const top = ranked[0].relevance;
      ranked = ranked.filter(
        (x) => x.relevance >= top * 0.55 || x.nameScore >= ranked[0].nameScore * 0.7
      );
    }
  }

  return ranked.slice(0, limit).map(({ o, relevance }) => ({
    opportunityId: o.id,
    name: o.opportunity_name,
    sector: o.sector,
    description: o.opportunity_description,
    highlights: o.investment_highlights,
    investmentRange: o.investment_range,
    marketSize: o.market_size,
    region: o.region || o.location,
    relevance,
  }));
}

export async function searchMatchesRobust(
  message: string,
  limit = 8
): Promise<MatchHit[]> {
  const { quoted, freeText } = parseQuery(message);
  const tokens = significantTokens([...quoted, freeText].join(" "));
  const phrases = buildPhrases(tokens, quoted);
  const distinctive = distinctiveTokens(tokens);
  const entityLookup = quoted.length > 0 || distinctive.length > 0;
  const include = { company: true, opportunity: true } as const;

  if (!phrases.length && !tokens.length) {
    const top = await prisma.matchingOutput.findMany({
      where: {
        OR: [
          { decision_tier: { contains: "Excellent", mode: "insensitive" } },
          { decision_tier: { contains: "Strong", mode: "insensitive" } },
        ],
      },
      include,
      orderBy: { final_score: "desc" },
      take: limit,
    });
    return top.map((m) => mapMatch(m, 1));
  }

  const [cos, opps] = await Promise.all([
    searchCompaniesRobust(message, entityLookup ? 6 : 12),
    searchOpportunitiesRobust(message, entityLookup ? 6 : 12),
  ]);
  const strongCos = cos.filter((c) => (c.relevance || 0) >= 80);
  const strongOpps = opps.filter((o) => (o.relevance || 0) >= 80);
  const companyIds = (strongCos.length ? strongCos : cos).map((c) => c.companyId);
  const opportunityIds = (strongOpps.length ? strongOpps : opps).map(
    (o) => o.opportunityId
  );

  const or: Prisma.MatchingOutputWhereInput[] = [];
  if (companyIds.length) or.push({ companyId: { in: companyIds } });
  if (opportunityIds.length) or.push({ opportunityId: { in: opportunityIds } });

  if (!entityLookup) {
    for (const p of phrases.slice(0, 8)) {
      or.push({ company: { company_name: { contains: p, mode: "insensitive" } } });
      or.push({
        opportunity: { opportunity_name: { contains: p, mode: "insensitive" } },
      });
      or.push({
        company: { company_sector: { contains: p, mode: "insensitive" } },
      });
      or.push({ opportunity: { sector: { contains: p, mode: "insensitive" } } });
    }
  } else {
    for (const t of distinctive) {
      or.push({ company: { company_name: { contains: t, mode: "insensitive" } } });
      or.push({
        opportunity: { opportunity_name: { contains: t, mode: "insensitive" } },
      });
    }
  }

  const q = message.toLowerCase();
  if (/\bexcellent\b/.test(q)) {
    or.push({ decision_tier: { contains: "Excellent", mode: "insensitive" } });
  }
  if (/\bstrong\b/.test(q)) {
    or.push({ decision_tier: { contains: "Strong", mode: "insensitive" } });
  }

  if (!or.length) {
    return [];
  }

  const rows = await prisma.matchingOutput.findMany({
    where: { OR: or },
    include,
    orderBy: { final_score: "desc" },
    take: 60,
  });

  const companyRel = new Map(cos.map((c) => [c.companyId, c.relevance]));
  const oppRel = new Map(opps.map((o) => [o.opportunityId, o.relevance]));

  let ranked = rows
    .map((m) => {
      const base =
        (companyRel.get(m.companyId) || 0) +
        (oppRel.get(m.opportunityId) || 0) +
        scoreName(m.company?.company_name || "", phrases, tokens) +
        scoreName(m.opportunity?.opportunity_name || "", phrases, tokens) * 0.8;
      return mapMatch(m, base + (m.final_score || 0) * 10);
    })
    .sort((a, b) => b.relevance - a.relevance);

  if (entityLookup && distinctive.length) {
    const tight = ranked.filter(
      (m) =>
        nameHasDistinctive(m.company, distinctive) ||
        nameHasDistinctive(m.opportunity, distinctive)
    );
    if (tight.length) ranked = tight;
  }

  return ranked.slice(0, limit);
}

function mapMatch(m: any, relevance: number): MatchHit {
  return {
    matchId: m.id,
    companyId: m.companyId,
    opportunityId: m.opportunityId,
    company: m.company?.company_name || "Unknown company",
    opportunity: m.opportunity?.opportunity_name || "Unknown opportunity",
    companySector: m.company?.company_sector || m.company_sector || null,
    opportunitySector: m.opportunity?.sector || m.opportunity_sector || null,
    tier: m.decision_tier || null,
    confidence: m.confidence_label || null,
    score: m.final_score ?? null,
    strengths: m.strengths || null,
    risks: m.risks || null,
    companyProfile: m.company?.company_profile || null,
    opportunityDescription: m.opportunity?.opportunity_description || null,
    investmentRange: m.opportunity?.investment_range || null,
    marketSize: m.opportunity?.market_size || null,
    region: m.opportunity?.region || m.opportunity?.location || null,
    relevance,
  };
}

export function intentOf(message: string) {
  const q = message.toLowerCase();
  const wantsCompanies = /\b(compan(y|ies)|investor|firm|rhq|who is|what is)\b/.test(
    q
  );
  const wantsOpportunities = /\b(opportunit(y|ies)|investment|project|deal)\b/.test(
    q
  );
  const wantsMatchesExplicit =
    /\bmatch(es)?\b/.test(q) ||
    /\b(excellent|strong|pursue|pair|pairing)\b/.test(q);
  // Named entity lookups should not default to "matches only"
  const wantsMatches =
    wantsMatchesExplicit || (!wantsCompanies && !wantsOpportunities);
  return { wantsCompanies, wantsOpportunities, wantsMatches, wantsMatchesExplicit };
}

/** Pull distinctive entity hints from recent chat turns (for pronoun follow-ups). */
export function extractEntityHints(
  history: { role: string; content: string }[] = []
): string[] {
  for (const h of [...history].reverse()) {
    if (!h?.content?.trim()) continue;
    const bold = Array.from(h.content.matchAll(/\*\*([^*]{2,80})\*\*/g)).map(
      (m) => collapseSpaces(m[1])
    );
    const { quoted, freeText } = parseQuery(h.content);
    const tokens = significantTokens(
      [...quoted, freeText, ...bold].join(" ")
    );
    const dist = distinctiveTokens(tokens);
    const hints: string[] = [];
    const seen = new Set<string>();
    for (const x of [...quoted, ...bold, ...dist]) {
      if (!x || isWeakPhrase(x)) continue;
      const key = x.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hints.push(x);
    }
    if (hints.length) return hints.slice(0, 4);
  }
  return [];
}

/**
 * Expand pronoun / vague follow-ups ("what matches does it have?") with the
 * last concrete company/opportunity mentioned in history.
 */
export function resolveReferentialMessage(
  message: string,
  history: { role: string; content: string }[] = []
): { resolved: string; hints: string[]; referential: boolean } {
  const raw = collapseSpaces(message || "");
  const tokens = significantTokens(raw);
  const distinctive = distinctiveTokens(tokens);
  const referential =
    /\b(it|its|they|them|their|this company|that company|the company|the firm|this opportunity|the opportunity|this match|that match)\b/i.test(
      raw
    ) ||
    (distinctive.length === 0 &&
      /\b(match|matches|risk|risks|strength|strengths|score|tier)\b/i.test(raw));

  const hints = extractEntityHints(history);
  if (!referential || !hints.length) {
    return { resolved: raw, hints: [], referential: false };
  }
  return {
    resolved: `${raw} · ${hints.join(" ")}`,
    hints,
    referential: true,
  };
}
