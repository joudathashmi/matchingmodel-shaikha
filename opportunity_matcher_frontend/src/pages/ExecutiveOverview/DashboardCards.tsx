import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from "styled-components";
import KPISection from "./KpiSection";
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
import { LoadingSpinnerWithMessage } from '../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage';
import { ErrorMessage } from '../../common/LoaderSpinner&ErrorLayout/ErrorMessage';

const DashboardCards: React.FC = () => {
  const dispatch = useDispatch();
  const loading = useSelector(selectExecutiveOverviewLoading);
  const error = useSelector(selectExecutiveOverviewError);
  const kpis = useSelector(selectKPIs);
  const keyFindings = useSelector(selectKeyFindings);
  const aiInsights = useSelector(selectAIInsights);
  const heatmapData = useSelector(selectHeatmapData);
  const heatmapMeta = useSelector(selectHeatmapMeta);

  useEffect(() => {
    dispatch(getExecutiveOverviewRequest());
    const timer = window.setInterval(() => {
      dispatch(getExecutiveOverviewRequest());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  const hasData = Array.isArray(kpis) && kpis.length > 0;

  if (loading && !hasData) {
    return <LoadingSpinnerWithMessage message="Loading portfolio..." translateX="100px" />;
  }

  if (error && !hasData) {
    return <ErrorMessage error={error} translateX="100px" />;
  }

  return (
    <MainContent>
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

const Section = styled.section`
  min-width: 0;
  width: 100%;
`;
