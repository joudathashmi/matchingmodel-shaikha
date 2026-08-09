/**
 * In-app assistant chat - grounded on live companies, opportunities, and matches.
 * Returns structured actions the UI can render as clickable buttons.
 */
import { generatePortfolioAnalyst } from "./portfolio-analyst.service";
import { prisma } from "./../../lib/prisma";
import {
  distinctiveTokens,
  intentOf,
  parseQuery,
  resolveReferentialMessage,
  searchCompaniesRobust,
  searchMatchesRobust,
  searchOpportunitiesRobust,
  significantTokens,
  type CompanyHit,
  type MatchHit,
  type OpportunityHit,
} from "./chat-search";


export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatAction = {
  type: "open_match" | "browse_companies" | "browse_opportunities" | "open_pursuit";
  label: string;
  href: string;
  subtitle?: string;
  matchId?: number;
  companyId?: number;
  opportunityId?: number;
};

export type ChatRequest = {
  message: string;
  matchId?: number | null;
  page?: string | null;
  history?: ChatMessage[];
};

function truncate(s: string | null | undefined, n = 280): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "") + "…";
}

function azureConfigured(): { url: string; key: string } | null {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "");
  const key = process.env.AZURE_OPENAI_API_KEY || "";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  if (!endpoint || !key || !deployment) return null;
  return {
    url: `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    key,
  };
}

async function buildMatchContext(matchId: number) {
  const m = await prisma.matchingOutput.findUnique({
    where: { id: matchId },
    include: { company: true, opportunity: true },
  });
  if (!m) return null;

  const [agreement, comments] = await Promise.all([
    prisma.matchAgreement.findFirst({
      where: { matchId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.matchComment.findMany({
      where: { matchId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    matchId: m.id,
    companyId: m.companyId,
    opportunityId: m.opportunityId,
    company: m.company?.company_name || "Unknown company",
    opportunity: m.opportunity?.opportunity_name || "Unknown opportunity",
    companySector: m.company?.company_sector || m.company_sector || null,
    opportunitySector: m.opportunity?.sector || m.opportunity_sector || null,
    tier: m.decision_tier,
    confidence: m.confidence_label,
    score: m.final_score,
    strengths: truncate(m.strengths, 400),
    risks: truncate(m.risks, 400),
    companyProfile: truncate(m.company?.company_profile, 260),
    opportunityDescription: truncate(m.opportunity?.opportunity_description, 260),
    investmentRange: truncate(m.opportunity?.investment_range, 100),
    marketSize: truncate(m.opportunity?.market_size, 100),
    region: truncate(m.opportunity?.region || m.opportunity?.location, 100),
    recommendedEngagement: truncate(m.recommended_engagement, 300),
    localizationModel: truncate(m.suggested_localization_model, 200),
    matchReason: truncate(m.match_reason, 300),
    aiInsight: truncate(m.ai_insight, 300),
    pursuitStatus: agreement?.status || null,
    notes: comments.map((c) => ({
      author: c.user.name || c.user.email.split("@")[0],
      body: truncate(c.body, 220),
    })),
  };
}

type EnrichedCompany = CompanyHit & {
  profile: string;
  products: string;
  topMatch: {
    matchId: number;
    opportunityId: number;
    opportunity: string | null;
    tier: string | null;
    score: number | null;
  } | null;
};

type EnrichedOpportunity = OpportunityHit & {
  description: string;
  highlights: string;
  topMatch: {
    matchId: number;
    companyId: number;
    company: string | null;
    tier: string | null;
    score: number | null;
  } | null;
};

async function enrichCompanies(hits: CompanyHit[]): Promise<EnrichedCompany[]> {
  return Promise.all(
    hits.map(async (c) => {
      const topMatch = await prisma.matchingOutput.findFirst({
        where: { companyId: c.companyId },
        include: { opportunity: true },
        orderBy: { final_score: "desc" },
      });
      return {
        ...c,
        profile: truncate(c.profile, 260),
        products: truncate(c.products, 160),
        topMatch: topMatch
          ? {
              matchId: topMatch.id,
              opportunityId: topMatch.opportunityId,
              opportunity: topMatch.opportunity?.opportunity_name || null,
              tier: topMatch.decision_tier,
              score: topMatch.final_score,
            }
          : null,
      };
    })
  );
}

async function enrichOpportunities(
  hits: OpportunityHit[]
): Promise<EnrichedOpportunity[]> {
  return Promise.all(
    hits.map(async (o) => {
      const topMatch = await prisma.matchingOutput.findFirst({
        where: { opportunityId: o.opportunityId },
        include: { company: true },
        orderBy: { final_score: "desc" },
      });
      return {
        ...o,
        description: truncate(o.description, 260),
        highlights: truncate(o.highlights, 160),
        topMatch: topMatch
          ? {
              matchId: topMatch.id,
              companyId: topMatch.companyId,
              company: topMatch.company?.company_name || null,
              tier: topMatch.decision_tier,
              score: topMatch.final_score,
            }
          : null,
      };
    })
  );
}

function slimMatches(hits: MatchHit[]) {
  return hits.map((m) => ({
    matchId: m.matchId,
    companyId: m.companyId,
    opportunityId: m.opportunityId,
    company: m.company,
    opportunity: m.opportunity,
    companySector: m.companySector,
    opportunitySector: m.opportunitySector,
    tier: m.tier,
    confidence: m.confidence,
    score: m.score,
    strengths: truncate(m.strengths, 180),
    risks: truncate(m.risks, 180),
    companyProfile: truncate(m.companyProfile, 220),
    opportunityDescription: truncate(m.opportunityDescription, 220),
    investmentRange: truncate(m.investmentRange, 80),
    marketSize: truncate(m.marketSize, 80),
    region: truncate(m.region, 80),
  }));
}

async function lightPortfolio(needAnalyst: boolean) {
  if (!needAnalyst) {
    return {
      engine: "live_matching_engine",
      pulse: { matches: 0, companies: 0, opportunities: 0 },
      topFindings: [] as { title: string; detail: string }[],
      topBriefs: [] as { type: string; description: string }[],
    };
  }
  const analyst = await generatePortfolioAnalyst();
  return {
    engine: analyst.engine,
    pulse: analyst.pulse,
    topFindings: analyst.findings.slice(0, 3).map((f) => ({
      title: f.title,
      detail: truncate(f.detail, 320),
    })),
    topBriefs: analyst.briefs.slice(0, 3).map((b) => ({
      type: b.insightType,
      description: truncate(b.description, 280),
    })),
  };
}

async function buildGrounding(
  message: string,
  matchId?: number | null,
  page?: string | null,
  history: ChatMessage[] = []
) {
  const { resolved, hints, referential } = resolveReferentialMessage(
    message,
    history
  );
  const searchMessage = resolved;
  const intent = intentOf(searchMessage);
  const { quoted, freeText } = parseQuery(searchMessage);
  const tokens = significantTokens([...quoted, freeText].join(" "));
  const distinctive = distinctiveTokens(tokens);
  const hasQuery = quoted.length > 0 || tokens.length > 0;
  const entityLookup = quoted.length > 0 || distinctive.length > 0 || referential;

  const focused =
    typeof matchId === "number" && matchId > 0
      ? await buildMatchContext(matchId)
      : null;

  // Skip heavy portfolio analyst on named-entity lookups (major latency win)
  const needAnalyst =
    !entityLookup &&
    !focused &&
    (intent.wantsMatchesExplicit ||
      (!hasQuery && !intent.wantsCompanies && !intent.wantsOpportunities));

  const companyLimit = entityLookup ? 4 : 8;
  const oppLimit = entityLookup ? 4 : 8;
  const matchLimit = focused ? 4 : entityLookup ? 5 : 8;

  const [portfolio, rawMatches, rawCompanies, rawOpps] = await Promise.all([
    lightPortfolio(needAnalyst),
    searchMatchesRobust(searchMessage, matchLimit),
    hasQuery || intent.wantsCompanies || referential
      ? searchCompaniesRobust(searchMessage, companyLimit)
      : Promise.resolve([] as CompanyHit[]),
    hasQuery || intent.wantsOpportunities
      ? searchOpportunitiesRobust(searchMessage, oppLimit)
      : Promise.resolve([] as OpportunityHit[]),
  ]);

  const [companies, opportunities] = await Promise.all([
    enrichCompanies(rawCompanies.slice(0, companyLimit)),
    enrichOpportunities(rawOpps.slice(0, oppLimit)),
  ]);

  return {
    page: page || null,
    intent,
    query: { quoted, tokens, freeText, hints, referential, resolved: searchMessage },
    portfolio,
    match: focused,
    relatedMatches: slimMatches(rawMatches),
    companies,
    opportunities,
  };
}

type Grounding = Awaited<ReturnType<typeof buildGrounding>>;

function actionsFromGrounding(grounding: Grounding): ChatAction[] {
  const actions: ChatAction[] = [];
  const seen = new Set<string>();
  const seenCompanies = new Set<number>();

  const topCoRel = grounding.companies[0]?.relevance || 0;
  const topOppRel = grounding.opportunities[0]?.relevance || 0;
  const strongCompany = topCoRel >= 80;
  const strongOpp = topOppRel >= 80;

  const push = (a: ChatAction) => {
    const key = `${a.type}:${a.href}`;
    if (seen.has(key)) return;
    // For strong company lookups, one Open button per company is enough
    if (
      strongCompany &&
      a.type === "open_match" &&
      typeof a.companyId === "number" &&
      seenCompanies.has(a.companyId)
    ) {
      return;
    }
    seen.add(key);
    if (typeof a.companyId === "number") seenCompanies.add(a.companyId);
    actions.push(a);
  };

  // Only surface near-top entities (kills noisy secondary browse chips)
  const companies = grounding.companies.filter(
    (c) =>
      !strongCompany ||
      (c.relevance || 0) >= topCoRel * 0.55 ||
      (c.relevance || 0) >= 120
  );
  const opportunities = grounding.opportunities.filter(
    (o) =>
      !strongOpp ||
      (o.relevance || 0) >= topOppRel * 0.55 ||
      (o.relevance || 0) >= 120
  );

  const companyCap = strongCompany ? 2 : 4;
  const oppCap = strongOpp ? 2 : 4;

  for (const c of companies.slice(0, companyCap)) {
    if (c.topMatch?.matchId) {
      push({
        type: "open_match",
        label: `Open · ${c.name}`,
        subtitle: c.topMatch.opportunity
          ? `Best match: ${c.topMatch.opportunity}`
          : c.sector || "Company match",
        href: `/matches/${c.topMatch.matchId}`,
        matchId: c.topMatch.matchId,
        companyId: c.companyId,
        opportunityId: c.topMatch.opportunityId,
      });
    } else {
      // Still actionable when the company has no scored match yet
      push({
        type: "browse_companies",
        label: `View · ${c.name}`,
        subtitle: c.sector || "Company catalog",
        href: `/companyProfile`,
        companyId: c.companyId,
      });
    }
  }

  for (const o of opportunities.slice(0, oppCap)) {
    if (o.topMatch?.matchId) {
      push({
        type: "open_match",
        label: `Open · ${o.name}`,
        subtitle: o.topMatch.company
          ? `Top company: ${o.topMatch.company}`
          : o.sector || "Opportunity match",
        href: `/matches/${o.topMatch.matchId}`,
        matchId: o.topMatch.matchId,
        companyId: o.topMatch.companyId,
        opportunityId: o.opportunityId,
      });
    } else {
      push({
        type: "browse_opportunities",
        label: `View · ${o.name}`,
        subtitle: o.sector || "Opportunity catalog",
        href: `/investmentOpportunities`,
        opportunityId: o.opportunityId,
      });
    }
  }

  if (grounding.match) {
    push({
      type: "open_match",
      label: `Open Match Case · ${grounding.match.company}`,
      subtitle: grounding.match.opportunity,
      href: `/matches/${grounding.match.matchId}`,
      matchId: grounding.match.matchId,
      companyId: grounding.match.companyId,
      opportunityId: grounding.match.opportunityId,
    });
  }

  const matchLimit = strongCompany || strongOpp ? 3 : 5;
  for (const m of grounding.relatedMatches.slice(0, matchLimit)) {
    push({
      type: "open_match",
      label: `Open · ${m.company}`,
      subtitle: `${m.opportunity}${m.tier ? ` · ${m.tier}` : ""}`,
      href: `/matches/${m.matchId}`,
      matchId: m.matchId,
      companyId: m.companyId,
      opportunityId: m.opportunityId,
    });
  }

  if (!actions.length) {
    push({
      type: "browse_companies",
      label: "Browse companies",
      href: "/companyProfile",
    });
    push({
      type: "browse_opportunities",
      label: "Browse opportunities",
      href: "/investmentOpportunities",
    });
  }

  return actions.slice(0, 6);
}

function formatScore(score: number | null | undefined) {
  if (typeof score !== "number" || Number.isNaN(score)) return "";
  return `${Math.round(score * 100)}%`;
}

function strongEntityHits(grounding: Grounding) {
  const companies = grounding.companies.filter((c) => (c.relevance || 0) >= 80);
  const opportunities = grounding.opportunities.filter(
    (o) => (o.relevance || 0) >= 80
  );
  return { companies, opportunities };
}

function replyMentionsGrounding(reply: string, grounding: Grounding): boolean {
  const candidates = [
    ...grounding.companies.slice(0, 3).map((c) => c.name),
    ...grounding.opportunities.slice(0, 3).map((o) => o.name),
    ...grounding.relatedMatches.slice(0, 3).map((m) => m.company),
  ].filter(Boolean);
  if (!candidates.length) return true;
  const r = reply.toLowerCase();
  return candidates.some((name) => {
    const first = String(name).toLowerCase().split(/[\s,/&.-]+/)[0];
    return first.length >= 4 && r.includes(first);
  });
}

function fallbackReply(message: string, grounding: Grounding): string {
  const q = message.toLowerCase();
  const m = grounding.match;
  const related = grounding.relatedMatches || [];
  const { companies: strongCos, opportunities: strongOpps } =
    strongEntityHits(grounding);

  if (
    m &&
    /(this match|this case|risk|strength|pursue|engage)/i.test(q)
  ) {
    return (
      `**${m.company}** × **${m.opportunity}** - ${m.tier || "unrated"}` +
      (m.confidence ? ` (${m.confidence})` : "") +
      (m.score != null ? ` · ${formatScore(m.score)}` : "") +
      `.\n` +
      (m.companyProfile ? `Company: ${m.companyProfile}\n` : "") +
      (m.opportunityDescription
        ? `Opportunity: ${m.opportunityDescription}\n`
        : "") +
      (m.investmentRange ? `Investment range: ${m.investmentRange}\n` : "") +
      (m.strengths ? `Strengths: ${m.strengths}\n` : "") +
      (m.risks ? `Risks: ${m.risks}` : "")
    );
  }

  // Prefer concrete company hits whenever relevance is strong (even without "company" keyword)
  if (strongCos.length || (grounding.companies.length && /\b(compan|investor|firm|who is|what is)\b/i.test(q))) {
    const list = (strongCos.length ? strongCos : grounding.companies).slice(0, 6);
    const lines = list.map((c, i) => {
      const matchBit = c.topMatch
        ? ` → best match: ${c.topMatch.opportunity} (${c.topMatch.tier || "rated"}${
            c.topMatch.score != null ? `, ${formatScore(c.topMatch.score)}` : ""
          })`
        : "";
      return (
        `${i + 1}. **${c.name}**${c.sector ? ` · ${c.sector}` : ""}${matchBit}` +
        (c.profile ? `\n   ${c.profile}` : "")
      );
    });
    return `Companies in the book:\n${lines.join("\n")}\n\nUse the buttons below to open a Match Case.`;
  }

  if (
    strongOpps.length ||
    (grounding.opportunities.length &&
      /\b(opportunit|investment|project)\b/i.test(q))
  ) {
    const list = (strongOpps.length ? strongOpps : grounding.opportunities).slice(0, 6);
    const lines = list.map((o, i) => {
      const matchBit = o.topMatch
        ? ` → top company: ${o.topMatch.company} (${o.topMatch.tier || "rated"})`
        : "";
      return (
        `${i + 1}. **${o.name}**${o.sector ? ` · ${o.sector}` : ""}` +
        (o.investmentRange ? ` · ${o.investmentRange}` : "") +
        `${matchBit}` +
        (o.description ? `\n   ${o.description}` : "")
      );
    });
    return `Investment opportunities:\n${lines.join("\n")}\n\nUse the buttons below to open the related Match Case.`;
  }

  if (related.length) {
    const named = grounding.query.tokens.length > 0 || grounding.query.quoted.length > 0;
    const lines = related.map(
      (hit, i) =>
        `${i + 1}. **${hit.company}** × ${hit.opportunity}` +
        (hit.tier ? ` - ${hit.tier}` : "") +
        (hit.score != null ? ` (${formatScore(hit.score)})` : "") +
        (hit.companyProfile ? `\n   Company: ${hit.companyProfile}` : "") +
        (hit.opportunityDescription
          ? `\n   Opportunity: ${hit.opportunityDescription}`
          : "")
    );
    return (
      (named ? "Here’s what I found:\n" : "Top pursue-tier matches:\n") +
      lines.join("\n") +
      "\n\nOpen a Match Case with the buttons below."
    );
  }

  const finding = grounding.portfolio.topFindings[0];
  return (
    (finding
      ? `${finding.title}: ${finding.detail} `
      : `Live matching has ${grounding.portfolio.pulse.matches} scored pairings. `) +
    `Ask about a company (e.g. EastPharma), an opportunity, or “top Excellent matches”.`
  );
}

async function azureChat(
  message: string,
  history: ChatMessage[],
  grounding: Grounding
): Promise<string | null> {
  const cfg = azureConfigured();
  if (!cfg) return null;

  const system = `You are the AI Matchmaking Engine for a Ministry of Investment.
Answer using ONLY the grounding JSON (companies, opportunities, matches). Never invent names or scores.

Rules:
- Prefer concrete company names, opportunity names, sectors, tiers, scores, investment ranges, and short profile/description snippets from grounding.
- When the user asks about a specific company/opportunity and it is in grounding, lead with that entity and include its sector.
- When listing, keep bullets short (1-2 lines each).
- Do NOT tell users to type URLs. The UI shows Open buttons separately.
- If grounding is empty for the ask, say clearly that nothing matched in the connected database.
- Plain text with light markdown (**bold**, bullets). No JSON. No model/vendor names.`;

  const slimGrounding = {
    page: grounding.page,
    intent: grounding.intent,
    query: grounding.query,
    focusedMatch: grounding.match,
    relatedMatches: grounding.relatedMatches,
    companies: grounding.companies.map((c) => ({
      companyId: c.companyId,
      name: c.name,
      sector: c.sector,
      profile: c.profile,
      products: c.products,
      hq: c.hq,
      employees: c.employees,
      revenueUsd: c.revenueUsd,
      topMatch: c.topMatch,
    })),
    opportunities: grounding.opportunities.map((o) => ({
      opportunityId: o.opportunityId,
      name: o.name,
      sector: o.sector,
      description: o.description,
      investmentRange: o.investmentRange,
      marketSize: o.marketSize,
      region: o.region,
      topMatch: o.topMatch,
    })),
    portfolioPulse: grounding.portfolio.pulse,
  };

  const messages: { role: string; content: string }[] = [
    { role: "system", content: system },
  ];

  for (const h of history.slice(-6)) {
    if (!h.content?.trim()) continue;
    messages.push({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content.slice(0, 1200),
    });
  }

  messages.push({
    role: "user",
    content: `GROUNDING:\n${JSON.stringify(slimGrounding)}\n\nOfficer question: ${message}`,
  });

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": cfg.key,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.2,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[ipa-chat] Azure error", res.status, errText.slice(0, 300));
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch (err) {
    console.error("[ipa-chat] Azure chat failed", err);
    return null;
  }
}

function shouldSkipAzure(message: string, grounding: Grounding): boolean {
  const topCo = grounding.companies[0]?.relevance || 0;
  const topOpp = grounding.opportunities[0]?.relevance || 0;
  // Strong named entity - deterministic reply is accurate and much faster
  if (topCo >= 100 || topOpp >= 100) return true;
  if (
    grounding.match &&
    /\b(risk|strength|score|tier|pursue|engage|this match|this case)\b/i.test(
      message
    )
  ) {
    return true;
  }
  // Pronoun follow-up already resolved into grounding
  if (grounding.query?.referential && (topCo >= 80 || grounding.relatedMatches.length > 0)) {
    return true;
  }
  return false;
}

export async function chat(req: ChatRequest) {
  const message = (req.message || "").trim();
  if (!message) throw new Error("Message is required");
  if (message.length > 2000) throw new Error("Message must be at most 2000 characters");

  const history = Array.isArray(req.history) ? req.history.slice(-8) : [];
  const grounding = await buildGrounding(message, req.matchId, req.page, history);

  const skipAzure = shouldSkipAzure(message, grounding);
  const elevated = skipAzure
    ? null
    : await azureChat(message, history, grounding);
  const hasHits =
    grounding.companies.length > 0 ||
    grounding.opportunities.length > 0 ||
    grounding.relatedMatches.length > 0;
  const elevatedOk =
    !!elevated && (!hasHits || replyMentionsGrounding(elevated, grounding));
  const reply = elevatedOk
    ? elevated!
    : fallbackReply(message, grounding);
  const actions = actionsFromGrounding(grounding);

  return {
    reply,
    actions,
    engine: elevatedOk ? "azure_analyst" : "live_matching_engine",
    context: {
      matchId: grounding.match?.matchId ?? null,
      page: grounding.page,
      hasMatch: !!grounding.match,
      companyCount: grounding.companies.length,
      opportunityCount: grounding.opportunities.length,
      matchCount: grounding.relatedMatches.length,
      query: grounding.query,
    },
  };
}
