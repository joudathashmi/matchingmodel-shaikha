import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { KPI } from "../../store/types/getExecutiveOverviewAiTypes";
import { readRecentDesk, RecentDeskItem } from "../../common/recentDesk";
import { getMatchAgreementsService } from "../../store/services/getMatchAgreementsService";
import { isActivePursuit, normalizePursuitStatus } from "../../common/pursuitStages";

type Props = {
  kpis: KPI[];
};

function kpiValue(kpis: KPI[], nameRe: RegExp): number | null {
  const hit = (kpis || []).find((k) => nameRe.test(k.name || ""));
  return hit?.value != null ? Number(hit.value) : null;
}

const DeskHomeStrip: React.FC<Props> = ({ kpis }) => {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentDeskItem[]>([]);
  const [pursuitRecent, setPursuitRecent] = useState<RecentDeskItem[]>([]);

  useEffect(() => {
    setRecent(readRecentDesk());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMatchAgreementsService.getMatchAgreements();
        if (cancelled) return;
        const list = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];
        const rows = list
          .filter((a: any) => isActivePursuit(a.status))
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 4)
          .map((a: any) => ({
            kind: "pursuit" as const,
            matchId: a.match.id,
            companyName: a.match.company_name,
            opportunityName: a.match.opportunity_name,
            subtitle: normalizePursuitStatus(a.status) || a.status,
            openedAt: new Date(a.createdAt).getTime(),
          }));
        setPursuitRecent(rows);
      } catch {
        if (!cancelled) setPursuitRecent([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const focus = useMemo(() => {
    const excellent = kpiValue(kpis, /excellent/i);
    const pursue = kpiValue(kpis, /pursue/i);
    const highConf = kpiValue(kpis, /high confidence/i);
    return { excellent, pursue, highConf };
  }, [kpis]);

  const continueItems = useMemo(() => {
    const localMatches = recent.filter((r) => r.kind === "match").slice(0, 3);
    const seen = new Set(localMatches.map((r) => r.matchId));
    const pursuits = pursuitRecent
      .filter((r) => !seen.has(r.matchId))
      .slice(0, 3);
    return [...localMatches, ...pursuits].slice(0, 4);
  }, [recent, pursuitRecent]);

  return (
    <Wrap>
      <Panel>
        <PanelHead>
          <div>
            <PanelTitle>Today's focus</PanelTitle>
            <PanelSub>Start with the highest-value queue for outreach</PanelSub>
          </div>
        </PanelHead>
        <FocusGrid>
          <FocusCard
            type="button"
            onClick={() => navigate("/match-workbench?tier=Excellent")}
          >
            <FocusValue>
              {focus.excellent != null
                ? focus.excellent.toLocaleString("en-US")
                : "—"}
            </FocusValue>
            <FocusLabel>Excellent to review</FocusLabel>
            <FocusHint>Open workbench filtered to Excellent</FocusHint>
          </FocusCard>
          <FocusCard
            type="button"
            onClick={() => navigate("/match-workbench?focus=pursue")}
          >
            <FocusValue>
              {focus.pursue != null ? focus.pursue.toLocaleString("en-US") : "—"}
            </FocusValue>
            <FocusLabel>Pursue queue</FocusLabel>
            <FocusHint>Excellent · Strong · Good</FocusHint>
          </FocusCard>
          <FocusCard
            type="button"
            onClick={() => navigate("/match-workbench?focus=pursue")}
          >
            <FocusValue>
              {focus.highConf != null
                ? focus.highConf.toLocaleString("en-US")
                : "—"}
            </FocusValue>
            <FocusLabel>High confidence</FocusLabel>
            <FocusHint>Prioritise for facilitation this week</FocusHint>
          </FocusCard>
        </FocusGrid>
      </Panel>

      <Panel>
        <PanelHead>
          <div>
            <PanelTitle>Continue where you left off</PanelTitle>
            <PanelSub>Recent match cases and active pursuits</PanelSub>
          </div>
          <HeadLink to="/pursuit">Open pursuit →</HeadLink>
        </PanelHead>
        {continueItems.length === 0 ? (
          <Empty>
            Open a Match Case from the workbench, or start pursuit on a strong
            pair. Recent work will appear here.
          </Empty>
        ) : (
          <ContinueList>
            {continueItems.map((item) => (
              <ContinueItem
                key={`${item.kind}-${item.matchId}`}
                to={`/matches/${item.matchId}`}
              >
                <ContinueKind>
                  {item.kind === "pursuit" ? "Pursuit" : "Match case"}
                </ContinueKind>
                <ContinueName>{item.companyName}</ContinueName>
                <ContinueMeta>
                  {item.opportunityName}
                  {item.subtitle ? ` · ${item.subtitle}` : ""}
                </ContinueMeta>
              </ContinueItem>
            ))}
          </ContinueList>
        )}
      </Panel>
    </Wrap>
  );
};

export default DeskHomeStrip;

const Wrap = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 1rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  padding: 1.15rem 1.25rem 1.25rem;
  min-width: 0;
`;

const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.95rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const PanelTitle = styled.h2`
  margin: 0 0 0.2rem;
  font-size: 1.02rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
`;

const PanelSub = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.35;
`;

const HeadLink = styled(Link)`
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(158, 240, 200, 0.9);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const FocusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FocusCard = styled.button`
  text-align: left;
  appearance: none;
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  padding: 0.85rem 0.9rem;
  font-family: inherit;
  transition: border-color 0.18s ease, background 0.18s ease;

  &:hover {
    border-color: rgba(0, 200, 140, 0.45);
    background: rgba(0, 255, 136, 0.06);
  }
`;

const FocusValue = styled.div`
  font-size: 1.55rem;
  font-weight: 700;
  color: #9ef0c8;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 0.3rem;
`;

const FocusLabel = styled.div`
  font-size: 0.84rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
`;

const FocusHint = styled.div`
  margin-top: 0.2rem;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.42);
  line-height: 1.3;
`;

const Empty = styled.div`
  font-size: 0.84rem;
  color: rgba(255, 255, 255, 0.48);
  line-height: 1.45;
  padding: 0.35rem 0;
`;

const ContinueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const ContinueItem = styled(Link)`
  display: block;
  text-decoration: none;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  padding: 0.7rem 0.8rem;
  transition: border-color 0.18s ease, background 0.18s ease;

  &:hover {
    border-color: rgba(0, 200, 140, 0.4);
    background: rgba(0, 255, 136, 0.05);
  }
`;

const ContinueKind = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(158, 240, 200, 0.8);
  margin-bottom: 0.2rem;
`;

const ContinueName = styled.div`
  font-size: 0.9rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.94);
  line-height: 1.25;
`;

const ContinueMeta = styled.div`
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.35;
`;
