import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from "styled-components";
import KPISection from "./KpiSection";
import DeskHomeStrip from "./DeskHomeStrip";
import MatchedOpportunities from "./MatchedOpportunities";
import KeyFindings from "./KeyFindings";
import HeatMap from "./HeatMap";
import AiInsights from "./AiInsights";
import { getExecutiveOverviewRequest } from '../../store/actions/getExecutiveOverviewAiActions';
import {
  selectExecutiveOverviewLoading,
  selectExecutiveOverviewError,
  selectKPIs,
  selectKeyFindings,
  selectAIInsights,
  selectHeatmapData,
  selectHeatmapMeta,
} from '../../store/selectors/getExecutiveOverviewAiSelectors';
import {
  selectUserRole,
  selectRoleLabel,
} from '../../store/selectors/getUserRoleSelectors';
import { LoadingSpinnerWithMessage } from '../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage';
import { ErrorMessage } from '../../common/LoaderSpinner&ErrorLayout/ErrorMessage';

function dayPartGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function displayFirstName(name?: string | null, email?: string | null): string {
  const fromName = (name || "").trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const fromEmail = (email || "").split("@")[0]?.trim();
  if (fromEmail) {
    return fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1);
  }
  return "Officer";
}

const DashboardCards: React.FC = () => {
  const dispatch = useDispatch();
  const loading = useSelector(selectExecutiveOverviewLoading);
  const error = useSelector(selectExecutiveOverviewError);
  const kpis = useSelector(selectKPIs);
  const keyFindings = useSelector(selectKeyFindings);
  const aiInsights = useSelector(selectAIInsights);
  const heatmapData = useSelector(selectHeatmapData);
  const heatmapMeta = useSelector(selectHeatmapMeta);
  const user = useSelector(selectUserRole);
  const roleLabelText = useSelector(selectRoleLabel);

  useEffect(() => {
    dispatch(getExecutiveOverviewRequest());
    const timer = window.setInterval(() => {
      dispatch(getExecutiveOverviewRequest());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  const hasData = Array.isArray(kpis) && kpis.length > 0;

  const welcome = useMemo(() => {
    const first = displayFirstName(user?.name, user?.email);
    const pursue =
      (kpis || []).find((k) => /pursue/i.test(k.name || ""))?.value ?? null;
    return {
      line: `${dayPartGreeting()}, ${first}`,
      sub:
        pursue != null
          ? `${Number(pursue).toLocaleString("en-US")} pairs in the pursue queue · signed in as ${roleLabelText}`
          : `Investor Attraction desk · signed in as ${roleLabelText}`,
    };
  }, [user?.name, user?.email, kpis, roleLabelText]);

  if (loading && !hasData) {
    return <LoadingSpinnerWithMessage message="Loading portfolio..." translateX="100px" />;
  }

  if (error && !hasData) {
    return <ErrorMessage error={error} translateX="100px" />;
  }

  return (
    <MainContent>
      <WelcomeBlock>
        <WelcomeEyebrow>Welcome back</WelcomeEyebrow>
        <WelcomeTitle>{welcome.line}</WelcomeTitle>
        <WelcomeSub>{welcome.sub}</WelcomeSub>
      </WelcomeBlock>

      <Section>
        <DeskHomeStrip kpis={kpis} />
      </Section>

      {/* 1. Pulse - confirms you're on Portfolio */}
      <Section>
        <KPISection kpis={kpis} />
      </Section>

      {/* 2. Decide - ranked matches */}
      <Section>
        <MatchedOpportunities />
      </Section>

      {/* 3. Coverage map */}
      <Section>
        <HeatMap heatmapData={heatmapData} meta={heatmapMeta} />
      </Section>

      {/* 4. Insights */}
      <Section>
        <AiInsights insights={aiInsights} engine="live_matching_engine" />
      </Section>

      {/* 5. Findings */}
      <Section>
        <KeyFindings keyFindings={keyFindings} />
      </Section>
    </MainContent>
  );
};

export default DashboardCards;

const MainContent = styled.main`
  padding: 1.25rem 1.35rem 2.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const WelcomeBlock = styled.header`
  min-width: 0;
  padding: 0.15rem 0.1rem 0.25rem;
`;

const WelcomeEyebrow = styled.div`
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(158, 240, 200, 0.85);
  margin-bottom: 0.35rem;
`;

const WelcomeTitle = styled.h1`
  margin: 0 0 0.35rem;
  font-size: clamp(1.45rem, 2.2vw, 1.85rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.96);
  line-height: 1.15;
`;

const WelcomeSub = styled.p`
  margin: 0;
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.52);
  line-height: 1.4;
`;

const Section = styled.section`
  min-width: 0;
  width: 100%;
`;
