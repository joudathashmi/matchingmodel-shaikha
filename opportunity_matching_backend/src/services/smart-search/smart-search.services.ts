// src\services\smart-search\smart-search.services.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function compact(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function scoreName(name: string, q: string): number {
  const n = (name || "").toLowerCase();
  const ql = q.toLowerCase();
  const nc = compact(name);
  const qc = compact(q);
  if (!ql) return 0;
  if (n === ql) return 300;
  if (n.startsWith(ql)) return 220;
  if (n.includes(ql)) return 160;
  if (qc.length >= 3 && nc.startsWith(qc)) return 140;
  if (qc.length >= 3 && nc.includes(qc)) return 100;
  return 0;
}

function scoreExtra(extra: string | null | undefined, q: string): number {
  const e = (extra || "").toLowerCase();
  const ql = q.toLowerCase();
  if (!e || !ql) return 0;
  if (e === ql) return 80;
  if (e.includes(ql)) return 40;
  return 0;
}

export async function smartSearch(query: string) {
  if (!query || query.trim().length < 1) {
    return [];
  }

  let q = query.trim();
  let type: "company" | "opportunity" | "sector" | "all" = "all";

  if (q.toLowerCase().startsWith("company|")) {
    type = "company";
    q = q.replace(/^company\|/i, "").trim();
  } else if (q.toLowerCase().startsWith("opportunity|")) {
    type = "opportunity";
    q = q.replace(/^opportunity\|/i, "").trim();
  } else if (q.toLowerCase().startsWith("sector|")) {
    type = "sector";
    q = q.replace(/^sector\|/i, "").trim();
  }

  if (!q) return [];

  const tasks: Promise<
    { id: number; type: "company" | "opportunity"; name: string; extra: string; score: number }[]
  >[] = [];

  if (type === "company" || type === "all") {
    tasks.push(
      prisma.company
        .findMany({
          where: {
            OR: [
              { company_name: { contains: q, mode: "insensitive" } },
              { company_sector: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            company_name: true,
            company_sector: true,
          },
          take: 40,
        })
        .then((companies) =>
          companies
            .map((c) => {
              const nameScore = scoreName(c.company_name, q);
              const sectorScore = scoreExtra(c.company_sector, q);
              return {
                id: c.id,
                type: "company" as const,
                name: c.company_name,
                extra: c.company_sector || "",
                score: nameScore * 2 + sectorScore,
              };
            })
            .filter((r) => r.score > 0)
        )
    );
  }

  if (type === "opportunity" || type === "all") {
    tasks.push(
      prisma.opportunity
        .findMany({
          where: {
            OR: [
              { opportunity_name: { contains: q, mode: "insensitive" } },
              { sector: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            opportunity_name: true,
            sector: true,
          },
          take: 40,
        })
        .then((opps) =>
          opps
            .map((o) => {
              const nameScore = scoreName(o.opportunity_name, q);
              const sectorScore = scoreExtra(o.sector, q);
              return {
                id: o.id,
                type: "opportunity" as const,
                name: o.opportunity_name,
                extra: o.sector || "",
                score: nameScore * 2 + sectorScore,
              };
            })
            .filter((r) => r.score > 0)
        )
    );
  }

  const results = (await Promise.all(tasks)).flat();
  results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return results.slice(0, 16).map(({ id, type: t, name, extra }) => ({
    id,
    type: t,
    name,
    extra,
  }));
}
