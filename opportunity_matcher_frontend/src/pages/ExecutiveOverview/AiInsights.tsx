import React, { useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { AIInsight } from "../../store/types/getExecutiveOverviewAiTypes";
import { titleFromInsightType, confidenceTone, scorePercent } from "../../common/aiMatchUtils";

interface AiInsightsProps {
  insights: AIInsight[];
  engine?: string;
}

const BRIEF_ACTIONS: Record<string, { label: string; path: string }> = {
  pursue_now: { label: "Match Workbench", path: "/match-workbench" },
  flagship_pairing: { label: "Match Workbench", path: "/match-workbench" },
  second_wave: { label: "Match Workbench", path: "/match-workbench" },
  sector_focus: { label: "Discover opportunities", path: "/explore" },
  operating_cadence: { label: "Pursuit", path: "/pursuit" },
};

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.45);
  background: rgba(0, 255, 136, 0.08);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00ff88;
`;

const AiInsights: React.FC<AiInsightsProps> = ({ insights, engine }) => {
  const navigate = useNavigate();
  const briefs = useMemo(() => (insights || []).slice(0, 5), [insights]);

  const [lead, ...rest] = briefs;

  return (
    <Panel>
      <Header>
        <SectionTitle>Insights</SectionTitle>
        <LiveBadge>
          <LiveDot />
          {engine === "live_matching_engine" || !engine ? "Live" : "Live"}
        </LiveBadge>
      </Header>

      {briefs.length === 0 && (
        <EmptyState>No pursue-grade matches available.</EmptyState>
      )}

      {lead && (
        <FeaturedBrief>
          <FeaturedTop>
            <FeaturedTitle>{titleFromInsightType(lead.insightType)}</FeaturedTitle>
            <ScoreChip $tone={toneFor(lead)}>
              {scorePercent(lead.score)}%
            </ScoreChip>
          </FeaturedTop>
          <FeaturedBody>{lead.description}</FeaturedBody>
          <FeaturedActions>
            <PrimaryBtn onClick={() => navigate(actionFor(lead).path)}>
              {actionFor(lead).label}
            </PrimaryBtn>
          </FeaturedActions>
        </FeaturedBrief>
      )}

      {rest.length > 0 && (
        <BriefGrid>
          {rest.map((insight, index) => {
            const action = actionFor(insight);
            return (
              <BriefTile key={`${insight.insightType}-${index}`}>
                <TileTop>
                  <TileLabel>{titleFromInsightType(insight.insightType)}</TileLabel>
                  <ScoreChip $tone={toneFor(insight)} $compact>
                    {scorePercent(insight.score)}%
                  </ScoreChip>
                </TileTop>
                <TileBody>{insight.description}</TileBody>
                <TileAction type="button" onClick={() => navigate(action.path)}>
                  {action.label}
                </TileAction>
              </BriefTile>
            );
          })}
        </BriefGrid>
      )}
    </Panel>
  );
};

function toneFor(insight: AIInsight) {
  return confidenceTone(
    insight.score >= 0.8 ? "High" : insight.score >= 0.55 ? "Medium" : "Low",
    Math.round((insight.score || 0) * 100)
  );
}

function actionFor(insight: AIInsight) {
  const key = (insight.insightType || "").toLowerCase();
  return BRIEF_ACTIONS[key] || { label: "Match Workbench", path: "/match-workbench" };
}

export default AiInsights;

const Panel = styled.section`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  padding: 1.25rem 1.35rem 1.35rem;
`;

const Header = styled.div`
  margin-bottom: 0.9rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
`;

const EmptyState = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.45);
`;

const FeaturedBrief = styled.article`
  position: relative;
  padding: 1rem 1.05rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  margin-bottom: 0.85rem;
`;

const FeaturedTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
`;

const FeaturedTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.96);
`;

const FeaturedBody = styled.p`
  margin: 0 0 0.9rem;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.82);
`;

const FeaturedActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const PrimaryBtn = styled.button`
  border: 1px solid rgba(0, 200, 140, 0.45);
  cursor: pointer;
  border-radius: 6px;
  padding: 0.55rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 650;
  color: #9ef0c8;
  background: rgba(0, 255, 136, 0.08);
`;

const BriefGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BriefTile = styled.article`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.95rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
`;

const TileTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const TileLabel = styled.div`
  color: rgba(255, 255, 255, 0.88);
  font-weight: 650;
  font-size: 0.84rem;
  line-height: 1.3;
`;

const TileBody = styled.p`
  margin: 0;
  flex: 1;
  font-size: 0.86rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
`;

const TileAction = styled.button`
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const ScoreChip = styled.span<{ $tone: "high" | "medium" | "low"; $compact?: boolean }>`
  flex-shrink: 0;
  font-size: ${(p) => (p.$compact ? "0.68rem" : "0.72rem")};
  font-weight: 650;
  padding: ${(p) => (p.$compact ? "0.15rem 0.4rem" : "0.2rem 0.5rem")};
  border-radius: 4px;
  border: 1px solid
    ${(p) =>
      p.$tone === "high"
        ? "rgba(0, 200, 140, 0.45)"
        : p.$tone === "low"
          ? "rgba(255, 120, 100, 0.4)"
          : "rgba(230, 190, 80, 0.4)"};
  color: ${(p) =>
    p.$tone === "high" ? "#9ef0c8" : p.$tone === "low" ? "#ffb4a8" : "#f0d78a"};
  background: rgba(0, 0, 0, 0.2);
`;
