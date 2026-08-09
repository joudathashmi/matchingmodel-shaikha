import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { selectAnalyticsKpis } from "../../../store/selectors/analyticsSelectors";
import ChartPanel, { ChartEmpty } from "./ChartPanel";

const formatValue = (value: number, unit: string): string => {
  if (unit === "%") return `${Number(value).toLocaleString()}%`;
  if (value >= 1000) return value.toLocaleString();
  return String(value);
};

const AnalyticsValue: React.FC = () => {
  const kpis = useSelector(selectAnalyticsKpis);

  return (
    <ChartPanel
      title="Key figures"
      subtitle="Yield, coverage, backlog and cold companies in the current book"
      exportName="analytics_kpis"
      officeChart={
        kpis?.length
          ? {
              title: "Key figures",
              subtitle:
                "Yield, coverage, backlog and cold companies in the current book",
              kind: "bar",
              labels: kpis.map((k) => k.name),
              values: kpis.map((k) => Number(k.value) || 0),
              seriesName: "Value",
            }
          : null
      }
    >
      {!kpis?.length ? (
        <ChartEmpty>No KPI data yet</ChartEmpty>
      ) : (
        <Grid>
          {kpis.map((kpi) => (
            <Card key={kpi.name}>
              <Value>{formatValue(kpi.value, kpi.unit)}</Value>
              <Label>{kpi.name}</Label>
              <Accent />
            </Card>
          ))}
        </Grid>
      )}
    </ChartPanel>
  );
};

export default AnalyticsValue;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 148px), 1fr));
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
`;

const Card = styled.div`
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.95rem 1rem 1rem;
  min-width: 0;
`;

const Value = styled.div`
  font-size: 1.55rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.15;
`;

const Label = styled.div`
  margin-top: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(203, 213, 225, 0.78);
  line-height: 1.3;
`;

const Accent = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #00ff88 0%, #00b4d8 100%);
`;
