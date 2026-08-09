import { OfficeChartSpec } from "./officeChartExport";

type NamedValue = { name: string; value: number; unit?: string };

/** Assemble every analytics chart into one Office pack. */
export function buildAnalyticsOfficeCharts(input: {
  kpis?: NamedValue[] | null;
  growthRates?: NamedValue[] | null;
  performance?: NamedValue[] | null;
  scoreDistribution?: NamedValue[] | null;
  heatmap?: NamedValue[] | null;
  decisionTiers?: NamedValue[] | null;
}): OfficeChartSpec[] {
  const charts: OfficeChartSpec[] = [];

  if (input.kpis?.length) {
    charts.push({
      title: "Key figures",
      kind: "bar",
      labels: input.kpis.map((k) => k.name),
      values: input.kpis.map((k) => Number(k.value) || 0),
      seriesName: "Value",
    });
  }

  const sectors = (input.growthRates || []).slice(0, 8);
  if (sectors.length) {
    charts.push({
      title: "Pursue density by sector",
      kind: "bar",
      labels: sectors.map((g) => g.name),
      values: sectors.map((g) => Number(g.value) || 0),
      seriesName: "Pursue share",
      unit: "%",
    });
  }

  const perf = (input.performance || [])
    .filter((p) => p.unit === "%")
    .slice(0, 8);
  if (perf.length) {
    charts.push({
      title: "Decision quality",
      kind: "bar-horizontal",
      labels: perf.map((p) => p.name),
      values: perf.map((p) => Number(p.value) || 0),
      seriesName: "Rate",
      unit: "%",
    });
  }

  if (input.scoreDistribution?.length) {
    charts.push({
      title: "Score distribution",
      kind: "bar",
      labels: input.scoreDistribution.map((s) => s.name),
      values: input.scoreDistribution.map((s) => Number(s.value) || 0),
      seriesName: "Pairs",
    });
  }

  if (input.heatmap?.length) {
    charts.push({
      title: "Sector pursue counts",
      kind: "bar",
      labels: input.heatmap.map((s) =>
        String(s.name || "").replace(/ Sector$/i, "")
      ),
      values: input.heatmap.map((s) => Number(s.value) || 0),
      seriesName: "Pursue pairs",
    });
  }

  const tiers = (input.decisionTiers || []).filter((t) => t.value > 0).slice(0, 6);
  if (tiers.length) {
    charts.push({
      title: "Decision tier mix",
      kind: "doughnut",
      labels: tiers.map((t) => t.name),
      values: tiers.map((t) => Number(t.value) || 0),
      seriesName: "Pairs",
    });
  }

  return charts;
}
