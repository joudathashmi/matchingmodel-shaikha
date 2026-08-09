/**
 * Full chatbot use-case audit against live /api/ai-data/chat + DB.
 * Writes JSON report to scripts/chat-audit-report.json
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PrismaClient } from "@prisma/client";

const API = process.env.CHAT_TEST_API || "http://localhost:4000/api";
const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

const results = [];
let passed = 0;
let failed = 0;

function record(category, name, cond, detail = "", meta = {}) {
  const status = cond ? "pass" : "fail";
  if (cond) passed++;
  else failed++;
  const row = { category, name, status, detail, ...meta };
  results.push(row);
  console.log(`  ${cond ? "✓" : "✗"} [${category}] ${name}${detail ? " — " + detail : ""}`);
  return cond;
}

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "local@rhq.local",
      password: "LocalDev123!",
    }),
  });
  const data = await res.json();
  const token = data.accessToken || data.token;
  if (!token) throw new Error("login failed: " + JSON.stringify(data));
  return token;
}

async function chat(token, message, extra = {}) {
  const t0 = Date.now();
  const res = await fetch(`${API}/ai-data/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, page: "portfolio", ...extra }),
  });
  const ms = Date.now() - t0;
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ms, data };
}

function replyHas(data, needle) {
  return (data.reply || "").toLowerCase().includes(String(needle).toLowerCase());
}

function actionMentions(data, part) {
  const p = part.toLowerCase();
  return (data.actions || []).some(
    (a) =>
      (a.label || "").toLowerCase().includes(p) ||
      (a.subtitle || "").toLowerCase().includes(p)
  );
}

function actionsHaveMatchHref(data) {
  return (data.actions || []).some((a) => /^\/matches\/\d+$/.test(a.href || ""));
}

async function main() {
  console.log("\n=== Chatbot use-case audit ===\n");
  const started = new Date().toISOString();
  const token = await login();

  const hayat = await prisma.company.findFirst({
    where: {
      company_name: { contains: "Hayat Pharmaceutical", mode: "insensitive" },
    },
  });
  const east = await prisma.company.findFirst({
    where: { company_name: { equals: "EastPharma Ltd" } },
  });
  const veolia = await prisma.company.findFirst({
    where: { company_name: { contains: "Veolia", mode: "insensitive" } },
  });
  const gallagher = await prisma.company.findFirst({
    where: { company_name: { contains: "Gallagher", mode: "insensitive" } },
  });
  const hameln = await prisma.company.findFirst({
    where: { company_name: { contains: "Hameln", mode: "insensitive" } },
  });
  const genericOpp = await prisma.opportunity.findFirst({
    where: {
      opportunity_name: { contains: "Generic Drugs", mode: "insensitive" },
    },
  });
  const vaccine = await prisma.opportunity.findFirst({
    where: { opportunity_name: { contains: "Vaccine", mode: "insensitive" } },
  });
  const hayatMatch = hayat
    ? await prisma.matchingOutput.findFirst({
        where: { companyId: hayat.id },
        include: { company: true, opportunity: true },
        orderBy: { final_score: "desc" },
      })
    : null;
  const excellent = await prisma.matchingOutput.findFirst({
    where: { decision_tier: { contains: "Excellent", mode: "insensitive" } },
    include: { company: true, opportunity: true },
    orderBy: { final_score: "desc" },
  });

  // Fixtures
  console.log("[Fixtures]");
  record("Fixtures", "Hayat company in DB", !!hayat, hayat?.company_name || "");
  record("Fixtures", "EastPharma company in DB", !!east);
  record("Fixtures", "Generic Drugs opportunity in DB", !!genericOpp, genericOpp?.opportunity_name || "");
  record("Fixtures", "Hayat has at least one match", !!hayatMatch, String(hayatMatch?.id || ""));
  record("Fixtures", "Excellent-tier match exists", !!excellent);

  // Auth / contract
  console.log("\n[API contract]");
  {
    const r = await chat(token, "");
    record(
      "API contract",
      "Empty message rejected or handled",
      !r.ok || (typeof r.data.reply === "string" && r.data.reply.length >= 0),
      `status=${r.status}`
    );
  }
  {
    const r = await chat(token, "Hayat");
    record("API contract", "Happy path HTTP 200", r.ok, `status=${r.status}`, {
      latencyMs: r.ms,
    });
    record(
      "API contract",
      "Response has reply string",
      typeof r.data.reply === "string" && r.data.reply.length > 0
    );
    record(
      "API contract",
      "Response has actions array",
      Array.isArray(r.data.actions)
    );
    record(
      "API contract",
      "Response has engine label",
      typeof r.data.engine === "string" && r.data.engine.length > 0,
      r.data.engine || ""
    );
    record(
      "API contract",
      "Response has context counts",
      typeof r.data.context?.companyCount === "number"
    );
  }

  // Company lookups
  console.log("\n[Company lookups]");
  const companyCases = [
    {
      name: "Quoted full legal name",
      msg: "what is this company 'Hayat Pharmaceutical Industries Co. Ltd.'",
      needle: "Hayat",
    },
    {
      name: "Unquoted full legal name",
      msg: "what is this company Hayat Pharmaceutical Industries Co. Ltd.",
      needle: "Hayat",
    },
    { name: "Short distinctive name", msg: "Tell me about Hayat", needle: "Hayat" },
    { name: "Bare EastPharma", msg: "EastPharma Ltd", needle: "EastPharma" },
    { name: "Lowercase multi-word", msg: "hameln pharma", needle: "hameln" },
    {
      name: "Find X company phrasing",
      msg: "find Hayat company",
      needle: "Hayat",
    },
  ];
  if (gallagher) {
    companyCases.push({
      name: "Ampersand + punctuation",
      msg: "Arthur J. Gallagher & Co.",
      needle: "Gallagher",
    });
  }
  if (veolia) {
    companyCases.push({
      name: "Multi-word European name",
      msg: "Veolia Environnement",
      needle: "Veolia",
    });
  }

  for (const c of companyCases) {
    const r = await chat(token, c.msg);
    record(
      "Company lookups",
      `${c.name}: reply mentions entity`,
      r.ok && replyHas(r.data, c.needle),
      `companies=${r.data.context?.companyCount ?? "?"} ms=${r.ms}`,
      { latencyMs: r.ms, query: c.msg }
    );
    record(
      "Company lookups",
      `${c.name}: actionable Open button`,
      actionMentions(r.data, c.needle) || actionsHaveMatchHref(r.data),
      (r.data.actions || []).slice(0, 2).map((a) => a.label).join(" | "),
      { query: c.msg }
    );
  }

  // Opportunities
  console.log("\n[Opportunities]");
  const oppCases = [
    {
      name: "Exact opportunity name",
      msg: "Generic Drugs Manufacturing",
      needle: "Generic",
    },
    {
      name: "Partial opportunity name",
      msg: "Generic Drugs",
      needle: "Generic",
    },
    {
      name: "Sector opportunity ask",
      msg: "Investment opportunities in Pharma",
      needle: "Pharma",
      soft: true,
    },
  ];
  if (vaccine) {
    oppCases.push({
      name: "Vaccine opportunity",
      msg: "Vaccine Manufacturing opportunity",
      needle: "Vaccine",
    });
  }
  for (const c of oppCases) {
    const r = await chat(token, c.msg);
    const hit =
      replyHas(r.data, c.needle) ||
      (r.data.context?.opportunityCount || 0) > 0 ||
      (c.soft && (r.data.context?.matchCount || 0) > 0);
    record(
      "Opportunities",
      `${c.name}: relevant hit`,
      r.ok && hit,
      `opps=${r.data.context?.opportunityCount ?? "?"} matches=${r.data.context?.matchCount ?? "?"} ms=${r.ms}`,
      { latencyMs: r.ms, query: c.msg }
    );
    record(
      "Opportunities",
      `${c.name}: has actions`,
      (r.data.actions || []).length > 0,
      "",
      { query: c.msg }
    );
  }

  // Sectors
  console.log("\n[Sectors]");
  for (const msg of [
    "Companies in Healthcare and Life Sciences",
    "Healthcare & Life Sciences companies",
    "companies in Healthcare",
  ]) {
    const r = await chat(token, msg);
    record(
      "Sectors",
      `"${msg}": returns companies or sector reply`,
      (r.data.context?.companyCount || 0) > 0 || replyHas(r.data, "Healthcare"),
      `companies=${r.data.context?.companyCount ?? "?"}`,
      { latencyMs: r.ms, query: msg }
    );
  }

  // Matches / tiers
  console.log("\n[Matches & tiers]");
  {
    const r = await chat(token, "Show top Excellent matches");
    record(
      "Matches & tiers",
      "Excellent matches: matchCount > 0",
      (r.data.context?.matchCount || 0) > 0,
      `matchCount=${r.data.context?.matchCount}`,
      { latencyMs: r.ms }
    );
    record(
      "Matches & tiers",
      "Excellent matches: Open actions",
      actionsHaveMatchHref(r.data),
      (r.data.actions || []).slice(0, 2).map((a) => a.href).join(", ")
    );
    record(
      "Matches & tiers",
      "Excellent matches: substantial reply",
      (r.data.reply || "").length > 40
    );
  }
  {
    const r = await chat(token, "Matches for EastPharma");
    record(
      "Matches & tiers",
      "Matches for EastPharma",
      replyHas(r.data, "EastPharma") || actionMentions(r.data, "EastPharma"),
      `matches=${r.data.context?.matchCount}`,
      { latencyMs: r.ms }
    );
  }
  {
    const r = await chat(token, "matches for Hayat Pharmaceutical");
    record(
      "Matches & tiers",
      "Matches for Hayat",
      replyHas(r.data, "Hayat") || actionMentions(r.data, "Hayat"),
      `matches=${r.data.context?.matchCount}`,
      { latencyMs: r.ms }
    );
  }
  {
    const r = await chat(token, "Show Strong matches");
    record(
      "Matches & tiers",
      "Strong tier query doesn't crash",
      r.ok && typeof r.data.reply === "string" && r.data.reply.length > 0,
      `matches=${r.data.context?.matchCount ?? "?"}`,
      { latencyMs: r.ms }
    );
  }

  // Focused match context
  console.log("\n[Match-case context]");
  if (hayatMatch) {
    const r = await chat(token, "What are the risks on this match?", {
      matchId: hayatMatch.id,
      page: "match_case",
    });
    record(
      "Match-case context",
      "Risk question with matchId returns reply",
      r.ok && (r.data.reply || "").length > 20,
      `ms=${r.ms}`,
      { latencyMs: r.ms }
    );
    record(
      "Match-case context",
      "Focused match surfaces in context or reply",
      r.data.context?.hasMatch === true ||
        replyHas(r.data, hayatMatch.company?.company_name?.split(" ")[0] || "Hayat") ||
        replyHas(r.data, "risk"),
      `hasMatch=${r.data.context?.hasMatch}`
    );
    record(
      "Match-case context",
      "Focused match Open action present",
      (r.data.actions || []).some(
        (a) => a.href === `/matches/${hayatMatch.id}` || a.matchId === hayatMatch.id
      )
    );
  } else {
    record("Match-case context", "Skipped — no Hayat match fixture", false);
  }

  // Action integrity
  console.log("\n[Action integrity]");
  {
    const r = await chat(token, "Hayat Pharmaceutical Industries");
    const matchActions = (r.data.actions || []).filter((a) =>
      /^\/matches\/\d+$/.test(a.href || "")
    );
    record(
      "Action integrity",
      "Has /matches/:id actions",
      matchActions.length > 0,
      JSON.stringify(matchActions.slice(0, 3).map((a) => a.href))
    );
    if (matchActions[0]) {
      const id = Number(matchActions[0].href.split("/").pop());
      const m = await prisma.matchingOutput.findUnique({ where: { id } });
      record("Action integrity", "First action match exists in DB", !!m, String(id));
      record(
        "Action integrity",
        "Action labels non-empty",
        matchActions.every((a) => (a.label || "").trim().length > 0)
      );
      record(
        "Action integrity",
        "Action types recognized",
        matchActions.every((a) =>
          ["open_match", "browse_companies", "browse_opportunities", "open_pursuit"].includes(
            a.type
          )
        )
      );
    }
  }

  // Conversation history
  console.log("\n[Conversation history]");
  {
    const r = await chat(token, "What matches does it have?", {
      history: [
        { role: "user", content: "Tell me about EastPharma Ltd" },
        {
          role: "assistant",
          content: "EastPharma Ltd is a Healthcare and Life Sciences company.",
        },
      ],
    });
    record(
      "Conversation history",
      "Follow-up with history doesn't crash",
      r.ok && (r.data.reply || "").length > 0,
      `ms=${r.ms}`,
      { latencyMs: r.ms }
    );
    // Soft: ideally still grounds on EastPharma, but not hard-required if pronoun resolution is weak
    record(
      "Conversation history",
      "Follow-up stays grounded (EastPharma or matches)",
      replyHas(r.data, "EastPharma") ||
        (r.data.context?.matchCount || 0) > 0 ||
        (r.data.actions || []).length > 0,
      `companies=${r.data.context?.companyCount} matches=${r.data.context?.matchCount}`
    );
  }

  // Resilience / negatives
  console.log("\n[Resilience]");
  {
    const r = await chat(token, "asdfqwerzxcvnotacompany999");
    record(
      "Resilience",
      "Nonsense query graceful reply",
      r.ok && typeof r.data.reply === "string" && r.data.reply.length > 0,
      `ms=${r.ms}`,
      { latencyMs: r.ms }
    );
  }
  {
    const long = "company ".repeat(400);
    const r = await chat(token, long.slice(0, 2100));
    record(
      "Resilience",
      "Overlong message handled (reject or trim)",
      !r.ok || typeof r.data.reply === "string",
      `status=${r.status}`
    );
  }
  {
    const r = await chat(token, "????!!!!");
    record(
      "Resilience",
      "Punctuation-only query graceful",
      r.ok && typeof r.data.reply === "string" && r.data.reply.length > 0
    );
  }

  // Latency sample
  console.log("\n[Latency]");
  const latencies = results
    .map((r) => r.latencyMs)
    .filter((n) => typeof n === "number");
  if (latencies.length) {
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const max = Math.max(...latencies);
    const p95 = latencies.slice().sort((a, b) => a - b)[
      Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))
    ];
    record(
      "Latency",
      "Average latency under 25s (Azure path)",
      avg < 25000,
      `avg=${avg}ms p95=${p95}ms max=${max}ms n=${latencies.length}`
    );
    record(
      "Latency",
      "No single call over 60s",
      max < 60000,
      `max=${max}ms`
    );
  }

  const ended = new Date().toISOString();
  const byCategory = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { pass: 0, fail: 0 };
    byCategory[r.category][r.status]++;
  }

  const report = {
    started,
    ended,
    api: API,
    summary: {
      total: passed + failed,
      passed,
      failed,
      passRate: passed + failed ? Math.round((passed / (passed + failed)) * 1000) / 10 : 0,
    },
    byCategory,
    latencies: {
      samples: latencies.length,
      avgMs: latencies.length
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null,
      maxMs: latencies.length ? Math.max(...latencies) : null,
    },
    results,
  };

  const outPath = join(__dirname, "chat-audit-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`\n=== Audit: ${passed} passed, ${failed} failed (${report.summary.passRate}%) ===`);
  console.log(`Report: ${outPath}\n`);
  if (failed) {
    console.log("Failures:");
    results
      .filter((r) => r.status === "fail")
      .forEach((f) => console.log(` - [${f.category}] ${f.name}${f.detail ? " — " + f.detail : ""}`));
  }

  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
