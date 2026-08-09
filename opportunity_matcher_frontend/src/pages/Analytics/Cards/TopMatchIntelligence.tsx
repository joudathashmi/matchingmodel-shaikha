import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  selectAnalyticsDecisionTiers,
  selectAnalyticsMeta,
  selectAnalyticsTopMatches,
} from "../../../store/selectors/analyticsSelectors";
import ChartPanel, { ChartEmpty, TOOLTIP_STYLE } from "./ChartPanel";

const TIER_COLOR: Record<string, string> = {
  Excellent: "#00ff88",
  "Excellent Match": "#00ff88",
  Strong: "#00d4aa",
  "Strong Match": "#00d4aa",
  Good: "#00b4d8",
  "Good Match": "#00b4d8",
  Watch: "#ffd166",
  Review: "#f4a261",
  Unscored: "#6c757d",
};

const TopMatchIntelligence: React.FC = () => {
  const topMatches = useSelector(selectAnalyticsTopMatches) || [];
  const decisionTiers = useSelector(selectAnalyticsDecisionTiers) || [];
  const meta = useSelector(selectAnalyticsMeta);

  const mix = useMemo(() => {
    if (decisionTiers.length > 0) {
      return decisionTiers
        .filter((t) => t.value > 0)
        .slice(0, 6)
        .map((t) => ({ name: t.name, value: t.value }));
    }
    const counts: Record<string, number> = {};
    topMatches.forEach((m) => {
      const key = m.insightType || "Watch";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [decisionTiers, topMatches]);

  const totalTierPairs = mix.reduce((a, b) => a + b.value, 0);

  return (
    <Grid>
      <ChartPanel
        title="Decision tier mix"
        subtitle="All scored pairs by decision tier"
        exportName="analytics_tier_mix"
        officeChart={
          mix.length
            ? {
                title: "Decision tier mix",
                subtitle: "All scored pairs by decision tier",
                kind: "doughnut",
                labels: mix.map((m) => m.name),
                values: mix.map((m) => m.value),
                seriesName: "Pairs",
              }
            : null
        }
      >
        {mix.length === 0 ? (
          <ChartEmpty>No tier data yet</ChartEmpty>
        ) : (
          <DonutWrap>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={mix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="rgba(11,18,32,0.8)"
                >
                  {mix.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TIER_COLOR[entry.name] || "#00b4d8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any, n: any) => {
                    const count = Number(v) || 0;
                    const share = totalTierPairs
                      ? ((count / totalTierPairs) * 100).toFixed(1)
                      : "0.0";
                    return [`${count.toLocaleString()} (${share}%)`, String(n)];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <MixLegend>
              {mix.map((m) => (
                <MixItem key={m.name}>
                  <Dot style={{ background: TIER_COLOR[m.name] || "#00b4d8" }} />
                  <span>
                    {m.name} · {m.value.toLocaleString()}
                  </span>
                </MixItem>
              ))}
              {typeof meta?.pursue === "number" ? (
                <PursueNote>
                  {meta.pursue.toLocaleString()} pursue pairs ·{" "}
                  {(meta.excellent || 0).toLocaleString()} Excellent ·{" "}
                  {(meta.highConfidencePursue || 0).toLocaleString()} high-conf
                  pursues
                </PursueNote>
              ) : null}
            </MixLegend>
          </DonutWrap>
        )}
      </ChartPanel>

      <ChartPanel
        title="Top pursue board"
        subtitle="Highest-scoring Excellent and Strong pairs"
        exportName="analytics_top_matches"
        tall
      >
        {topMatches.length === 0 ? (
          <ChartEmpty>No top matches yet</ChartEmpty>
        ) : (
          <List>
            {topMatches.slice(0, 8).map((match, index) => {
              const color = TIER_COLOR[match.insightType] || "#00ff88";
              return (
                <Item key={`${match.companyName}-${index}`}>
                  <Left>
                    <Avatar>{initials(match.companyName)}</Avatar>
                    <Info>
                      <Company>{match.companyName}</Company>
                      <Sector>{match.sector}</Sector>
                      <Desc>{match.description}</Desc>
                    </Info>
                  </Left>
                  <Right>
                    <Badge $color={color}>{match.insightType}</Badge>
                    <Score>{Math.round((match.score || 0) * 100)}%</Score>
                    <Decision>{match.aiDecision}</Decision>
                  </Right>
                </Item>
              );
            })}
          </List>
        )}
      </ChartPanel>
    </Grid>
  );
};

function initials(name: string) {
  const words = String(name || "?").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

export default TopMatchIntelligence;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
  gap: 1rem;
  width: 100%;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const DonutWrap = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const MixLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const MixItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.9);
`;

const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const PursueNote = styled.div`
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: rgba(203, 213, 225, 0.65);
  line-height: 1.35;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const Item = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const Left = styled.div`
  display: flex;
  gap: 0.7rem;
  min-width: 0;
  flex: 1;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
`;

const Info = styled.div`
  min-width: 0;
`;

const Company = styled.div`
  font-size: 0.86rem;
  font-weight: 600;
  color: #fff;
`;

const Sector = styled.div`
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: rgba(0, 255, 136, 0.85);
`;

const Desc = styled.div`
  margin-top: 0.25rem;
  font-size: 0.74rem;
  color: rgba(203, 213, 225, 0.75);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  flex-shrink: 0;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 0.68rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}22`};
  border: 1px solid ${({ $color }) => `${$color}55`};
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  white-space: nowrap;
`;

const Score = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #00ff88;
`;

const Decision = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(203, 213, 225, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
