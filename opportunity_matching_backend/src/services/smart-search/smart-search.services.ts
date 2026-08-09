import { prisma } from "./../../lib/prisma";
// src/services/smart-search/smart-search.services.ts


function compact(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function tokensOf(q: string): string[] {
  return (q || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreName(name: string, q: string, tokens: string[]): number {
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

  if (tokens.length > 1) {
    const hits = tokens.filter((t) => n.includes(t) || compact(name).includes(t)).length;
    if (hits === tokens.length) return 150;
    if (hits > 0) return 60 + hits * 20;
  }
  return 0;
}

function scoreExtra(extra: string | null | undefined, q: string, tokens: string[]): number {
  const e = (extra || "").toLowerCase();
  const ql = q.toLowerCase();
  if (!e || !ql) return 0;
  if (e === ql) return 80;
  if (e.includes(ql)) return 40;
  if (tokens.length) {
    const hits = tokens.filter((t) => e.includes(t)).length;
    if (hits === tokens.length) return 50;
    if (hits > 0) return 15 * hits;
  }
  return 0;
}

function companyTextFilter(q: string, tokens: string[]) {
  // Prefer phrase / all-token matches so broad tokens like "energy" do not
  // flood the candidate window before ranking.
  if (tokens.length > 1) {
    return {
      OR: [
        { company_name: { contains: q, mode: "insensitive" as const } },
        { company_sector: { contains: q, mode: "insensitive" as const } },
        {
          AND: tokens.map((t) => ({
            OR: [
              { company_name: { contains: t, mode: "insensitive" as const } },
              { company_sector: { contains: t, mode: "insensitive" as const } },
              { ultimate_parent_company: { contains: t, mode: "insensitive" as const } },
            ],
          })),
        },
      ],
    };
  }

  return {
    OR: [
      { company_name: { contains: q, mode: "insensitive" as const } },
      { company_sector: { contains: q, mode: "insensitive" as const } },
      { global_headquarters: { contains: q, mode: "insensitive" as const } },
      { ultimate_parent_company: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

function opportunityTextFilter(q: string, tokens: string[]) {
  if (tokens.length > 1) {
    return {
      OR: [
        { opportunity_name: { contains: q, mode: "insensitive" as const } },
        { sector: { contains: q, mode: "insensitive" as const } },
        {
          AND: tokens.map((t) => ({
            OR: [
              { opportunity_name: { contains: t, mode: "insensitive" as const } },
              { sector: { contains: t, mode: "insensitive" as const } },
            ],
          })),
        },
      ],
    };
  }

  return {
    OR: [
      { opportunity_name: { contains: q, mode: "insensitive" as const } },
      { sector: { contains: q, mode: "insensitive" as const } },
    ],
  };
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
  const tokens = tokensOf(q);

  type Hit = {
    id: number;
    type: "company" | "opportunity" | "sector";
    name: string;
    extra: string;
    score: number;
  };

  const tasks: Promise<Hit[]>[] = [];

  if (type === "company" || type === "all") {
    tasks.push(
      prisma.company
        .findMany({
          where: companyTextFilter(q, tokens),
          select: {
            id: true,
            company_name: true,
            company_sector: true,
            global_headquarters: true,
            ultimate_parent_company: true,
          },
          take: 80,
        })
        .then((companies) =>
          companies
            .map((c) => {
              const nameScore = scoreName(c.company_name, q, tokens);
              const sectorScore = scoreExtra(c.company_sector, q, tokens);
              const hqScore = scoreExtra(c.global_headquarters, q, tokens);
              const parentScore = scoreExtra(c.ultimate_parent_company, q, tokens);
              return {
                id: c.id,
                type: "company" as const,
                name: c.company_name,
                extra: c.company_sector || c.global_headquarters || "",
                score: nameScore * 2 + sectorScore + hqScore + parentScore,
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
          where: opportunityTextFilter(q, tokens),
          select: {
            id: true,
            opportunity_name: true,
            sector: true,
          },
          take: 80,
        })
        .then((opps) =>
          opps
            .map((o) => {
              const nameScore = scoreName(o.opportunity_name, q, tokens);
              const sectorScore = scoreExtra(o.sector, q, tokens);
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

  if (type === "sector" || type === "all") {
    tasks.push(
      (async () => {
        const [companySectors, oppSectors] = await Promise.all([
          prisma.company.groupBy({
            by: ["company_sector"],
            where: {
              company_sector: { contains: q, mode: "insensitive" },
            },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
          }),
          prisma.opportunity.groupBy({
            by: ["sector"],
            where: {
              sector: { contains: q, mode: "insensitive" },
            },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
          }),
        ]);

        const merged = new Map<string, number>();
        for (const row of companySectors) {
          const name = row.company_sector?.trim();
          if (!name) continue;
          merged.set(name, (merged.get(name) || 0) + row._count.id);
        }
        for (const row of oppSectors) {
          const name = row.sector?.trim();
          if (!name) continue;
          merged.set(name, (merged.get(name) || 0) + row._count.id);
        }

        return Array.from(merged.entries())
          .slice(0, 20)
          .map(([name, count], idx) => ({
            id: idx + 1,
            type: "sector" as const,
            name,
            extra: `${count.toLocaleString()} records`,
            score: scoreName(name, q, tokens) + Math.min(count, 40),
          }));
      })()
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
