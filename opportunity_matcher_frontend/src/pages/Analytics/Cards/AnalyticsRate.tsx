import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  selectAnalyticsGrowthRates,
  selectAnalyticsPerformance,
  selectAnalyticsScoreDistribution,
} from "../../../store/selectors/analyticsSelectors";
import ChartPanel, { ChartEmpty, TOOLTIP_STYLE } from "./ChartPanel";

const SECTOR_COLORS = [
  "#00ff88",
  "#00d4aa",
  "#00b4d8",
  "#48cae4",
  "#90e0ef",
  "#7bdff2",
  "#64dfdf",
  "#56cfe1",
];

const PERF_COLORS = [
  "#00ff88",
  "#00d4aa",
  "#00b4d8",
  "#48cae4",
  "#ffd166",
  "#f4a261",
  "#ff6b6b",
  "#e9ecef",
];

const SCORE_COLORS = [
  "#00ff88",
  "#00d4aa",
  "#00b4d8",
  "#ffd166",
  "#f4a261",
  "#6c757d",
];

const AnalyticsRate: React.FC = () => {
  const growthRates = useSelector(selectAnalyticsGrowthRates);
  const performance = useSelector(selectAnalyticsPerformance);
  const scoreDistribution = useSelector(selectAnalyticsScoreDistribution);

  const sectorData = useMemo(
    () =>
      (growthRates || []).slice(0, 8).map((g) => ({
        name: shorten(g.name, 18),
        fullName: g.name,
        value: Number(g.value) || 0,
      })),
    [growthRates]
  );

  const perfData = useMemo(
    () =>
      (performance || [])
        .filter((p) => p.unit === "%")
        .slice(0, 8)
        .map((p) => ({
          name: shorten(p.name, 22),
          fullName: p.name,
          value: Number(p.value) || 0,
        })),
    [performance]
  );

  const scoreData = useMemo(
    () =>
      (scoreDistribution || []).map((s) => ({
        name: s.name,
        value: Number(s.value) || 0,
      })),
    [scoreDistribution]
  );

  return (
    <Stack>
      <Grid>
        <ChartPanel
          title="Pursue density by sector"
          subtitle="Share of Excellent, Strong and Good pairs by company sector"
          exportName="analytics_pursue_density"
          tall
          officeChart={
            sectorData.length
              ? {
                  title: "Pursue density by sector",
                  subtitle:
                    "Share of Excellent, Strong and Good pairs by company sector",
                  kind: "bar",
                  labels: sectorData.map((d) => d.fullName || d.name),
                  values: sectorData.map((d) => d.value),
                  seriesName: "Pursue share",
                  unit: "%",
                }
              : null
          }
        >
          {sectorData.length === 0 ? (
            <ChartEmpty>No pursue density yet</ChartEmpty>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={sectorData}
                margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(203,213,225,0.75)", fontSize: 11 }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={60}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(203,213,225,0.65)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  width={42}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any) => [
                    `${Number(v).toFixed(1)}%`,
                    "Pursue share",
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName || ""
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {sectorData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel
          title="Decision quality"
          subtitle="Yield, coverage, fill rate, confidence and concentration"
          exportName="analytics_decision_quality"
          tall
          officeChart={
            perfData.length
              ? {
                  title: "Decision quality",
                  subtitle:
                    "Yield, coverage, fill rate, confidence and concentration",
                  kind: "bar-horizontal",
                  labels: perfData.map((d) => d.fullName || d.name),
                  values: perfData.map((d) => d.value),
                  seriesName: "Rate",
                  unit: "%",
                }
              : null
          }
        >
          {perfData.length === 0 ? (
            <ChartEmpty>No decision metrics yet</ChartEmpty>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={perfData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "rgba(203,213,225,0.65)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fill: "rgba(203,213,225,0.8)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Rate"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName || ""
                  }
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {perfData.map((_, i) => (
                    <Cell key={i} fill={PERF_COLORS[i % PERF_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </Grid>

      <ChartPanel
        title="Score distribution"
        subtitle="Final score buckets across all scored pairs"
        exportName="analytics_score_distribution"
        officeChart={
          scoreData.length
            ? {
                title: "Score distribution",
                subtitle: "Final score buckets across all scored pairs",
                kind: "bar",
                labels: scoreData.map((d) => d.name),
                values: scoreData.map((d) => d.value),
                seriesName: "Pairs",
              }
            : null
        }
      >
        {scoreData.length === 0 ? (
          <ChartEmpty>No score distribution yet</ChartEmpty>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={scoreData}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(203,213,225,0.75)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(203,213,225,0.65)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: any) => [
                  Number(v).toLocaleString(),
                  "Pairs",
                ]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {scoreData.map((_, i) => (
                  <Cell key={i} fill={SCORE_COLORS[i % SCORE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>
    </Stack>
  );
};

function shorten(text: string, max: number) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default AnalyticsRate;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;
