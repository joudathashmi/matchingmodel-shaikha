/**
 * End-to-end chat search scenarios against the live DB + /api/ai-data/chat.
 * Exit 1 if any required assertion fails.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const API = process.env.CHAT_TEST_API || "http://localhost:4000/api";
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? " — " + detail : ""}`);
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
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

async function chat(token, message) {
  const res = await fetch(`${API}/ai-data/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, page: "portfolio" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`chat ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function replyHas(data, needle) {
  return (data.reply || "").toLowerCase().includes(String(needle).toLowerCase());
}

function actionOpensCompany(data, companyPart) {
  const part = companyPart.toLowerCase();
  return (data.actions || []).some(
    (a) =>
      (a.label || "").toLowerCase().includes(part) ||
      (a.subtitle || "").toLowerCase().includes(part)
  );
}

async function main() {
  console.log("\n=== Chat scenario suite ===\n");
  const token = await login();

  // Pick live fixtures from DB
  const hayat = await prisma.company.findFirst({
    where: { company_name: { contains: "Hayat Pharmaceutical", mode: "insensitive" } },
  });
  const east = await prisma.company.findFirst({
    where: { company_name: { equals: "EastPharma Ltd" } },
  });
  const veolia = await prisma.company.findFirst({
    where: { company_name: { contains: "Veolia", mode: "insensitive" } },
  });
  const amp = await prisma.company.findFirst({
    where: { company_name: { contains: "Gallagher", mode: "insensitive" } },
  });
  const genericOpp = await prisma.opportunity.findFirst({
    where: { opportunity_name: { contains: "Generic Drugs", mode: "insensitive" } },
  });
  const vaccine = await prisma.opportunity.findFirst({
    where: { opportunity_name: { contains: "Vaccine", mode: "insensitive" } },
  });
  const hayatMatch = hayat
    ? await prisma.matchingOutput.findFirst({
        where: { companyId: hayat.id },
        orderBy: { final_score: "desc" },
      })
    : null;

  ok("fixture Hayat exists", !!hayat, String(hayat?.company_name));
  ok("fixture EastPharma exists", !!east);
  ok("fixture Generic Drugs opp exists", !!genericOpp);
  ok("fixture Hayat has match", !!hayatMatch, String(hayatMatch?.id));

  // --- Company lookups (spaces / quotes / punctuation) ---
  console.log("\n[Company lookups]");
  {
    const d = await chat(
      token,
      "what is this company 'Hayat Pharmaceutical Industries Co. Ltd.'"
    );
    ok("quoted Hayat in reply", replyHas(d, "Hayat"));
    ok(
      "quoted Hayat sector/domain mentioned",
      replyHas(d, "Healthcare") ||
        replyHas(d, "Life Sciences") ||
        replyHas(d, "Pharma") ||
        replyHas(d, "pharmaceutical")
    );
    ok("quoted Hayat has Open action", actionOpensCompany(d, "Hayat"));
    ok("quoted Hayat companyCount>0", (d.context?.companyCount || 0) > 0);
  }
  {
    const d = await chat(
      token,
      "what is this company Hayat Pharmaceutical Industries Co. Ltd."
    );
    ok("unquoted full Hayat legal name", replyHas(d, "Hayat"));
    ok("unquoted Hayat action", actionOpensCompany(d, "Hayat"));
  }
  {
    const d = await chat(token, "Tell me about Hayat");
    ok("short name Hayat", replyHas(d, "Hayat"));
  }
  {
    const d = await chat(token, "EastPharma Ltd");
    ok("EastPharma bare name", replyHas(d, "EastPharma"));
    ok("EastPharma action", actionOpensCompany(d, "EastPharma"));
  }
  {
    const d = await chat(token, "hameln pharma");
    ok("lowercase multi-word hameln", replyHas(d, "hameln"));
  }
  if (amp) {
    const d = await chat(token, "Arthur J. Gallagher & Co.");
    ok("ampersand + dots company", replyHas(d, "Gallagher"));
  }
  if (veolia) {
    const d = await chat(token, "Veolia Environnement");
    ok("Veolia with space", replyHas(d, "Veolia"));
  }

  // --- Sector queries ---
  console.log("\n[Sectors]");
  {
    const d = await chat(token, "Companies in Healthcare and Life Sciences");
    ok(
      "Healthcare sector returns companies",
      (d.context?.companyCount || 0) > 0 || replyHas(d, "Healthcare")
    );
    ok(
      "Healthcare sector has actions",
      (d.actions || []).some((a) => a.type === "open_match")
    );
  }
  {
    const d = await chat(token, "Healthcare & Life Sciences companies");
    ok(
      "ampersand sector variant",
      (d.context?.companyCount || 0) > 0 ||
        (d.context?.matchCount || 0) > 0 ||
        replyHas(d, "Healthcare")
    );
  }

  // --- Opportunities ---
  console.log("\n[Opportunities]");
  {
    const d = await chat(token, "Investment opportunities in Pharma");
    ok(
      "Pharma opportunities",
      (d.context?.opportunityCount || 0) > 0 || replyHas(d, "Pharma") || replyHas(d, "Generic")
    );
    ok("Pharma has open actions", (d.actions || []).length > 0);
  }
  {
    const d = await chat(token, "Generic Drugs Manufacturing");
    ok("exact opportunity name", replyHas(d, "Generic") || (d.context?.opportunityCount || 0) > 0 || (d.context?.matchCount || 0) > 0);
  }
  if (vaccine) {
    const d = await chat(token, "Vaccine Manufacturing opportunity");
    ok("Vaccine opportunity", replyHas(d, "Vaccine") || (d.context?.opportunityCount || 0) > 0);
  }

  // --- Matches / tiers ---
  console.log("\n[Matches]");
  {
    const d = await chat(token, "Show top Excellent matches");
    ok("Excellent matches count", (d.context?.matchCount || 0) > 0);
    ok("Excellent has actions", (d.actions || []).length > 0);
    ok("Excellent reply non-empty", (d.reply || "").length > 40);
  }
  {
    const d = await chat(token, "Matches for EastPharma");
    ok("Matches for EastPharma", replyHas(d, "EastPharma") || actionOpensCompany(d, "EastPharma"));
  }
  {
    const d = await chat(token, "matches for Hayat Pharmaceutical");
    ok("Matches for Hayat Pharmaceutical", replyHas(d, "Hayat") || actionOpensCompany(d, "Hayat"));
  }

  // --- Actions must point at real match routes ---
  console.log("\n[Actions integrity]");
  {
    const d = await chat(token, "Hayat Pharmaceutical Industries");
    const hrefs = (d.actions || [])
      .map((a) => a.href)
      .filter((h) => /^\/matches\/\d+$/.test(h));
    ok("has /matches/:id actions", hrefs.length > 0, JSON.stringify(hrefs.slice(0, 3)));
    if (hrefs[0]) {
      const id = Number(hrefs[0].split("/").pop());
      const m = await prisma.matchingOutput.findUnique({ where: { id } });
      ok("action match id exists in DB", !!m, String(id));
    }
  }

  // --- Negative / nonsense should not crash ---
  console.log("\n[Resilience]");
  {
    const d = await chat(token, "asdfqwerzxcvnotacompany999");
    ok("nonsense returns gracefully", typeof d.reply === "string" && d.reply.length > 0);
    ok("nonsense engine set", !!d.engine);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failures.length) {
    console.log("Failures:");
    failures.forEach((f) => console.log(" -", f));
  }
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
