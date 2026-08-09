import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { selectAnalyticsMarketPredictions } from "../../../store/selectors/analyticsSelectors";
import ChartPanel, { ChartEmpty } from "./ChartPanel";

const MarketInsights: React.FC = () => {
  const marketPredictions = useSelector(selectAnalyticsMarketPredictions) || [];

  return (
    <ChartPanel
      title="Officer brief"
      subtitle="Measured rates from the current matching book"
      exportName="analytics_decision_insights"
    >
      {marketPredictions.length === 0 ? (
        <ChartEmpty>No brief items yet</ChartEmpty>
      ) : (
        <Grid>
          {marketPredictions.map((item, idx) => (
            <Card key={`${item.insightType}-${idx}`}>
              <Score>{Math.round((item.score || 0) * 100)}%</Score>
              <CardTitle>{item.insightType}</CardTitle>
              <CardDesc>{item.description}</CardDesc>
            </Card>
          ))}
        </Grid>
      )}
    </ChartPanel>
  );
};

export default MarketInsights;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
`;

const Card = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 255, 136, 0.22);
  border-radius: 12px;
  padding: 0.9rem 0.95rem;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const Score = styled.div`
  position: absolute;
  top: 0.7rem;
  right: 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #00ff88;
`;

const CardTitle = styled.h4`
  margin: 0;
  padding-right: 3rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.82);
  line-height: 1.45;
  flex: 1;
`;
