import React, { useMemo, useState } from "react";
import styled, { css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { InsightCard, PanelTitle } from "./ExecutiveCommonStyles";
import { HeatmapData, HeatmapMeta } from "../../store/types/getExecutiveOverviewAiTypes";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import typography from "../../common/typography";

interface HeatMapProps {
  heatmapData: HeatmapData;
  meta?: HeatmapMeta | null;
}

type MetricType = "opportunities" | "pursue" | "coverage";
type IntensityLevel = "none" | "low" | "medium" | "high" | "very-high";

const DEFAULT_BUCKETS = ["$1-10M", "$10-50M", "$50-100M", "$100M-1B", "$1B+"];

const HeatMap: React.FC<HeatMapProps> = ({ heatmapData, meta }) => {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("pursue");

  const investmentRanges = meta?.buckets?.length ? meta.buckets : DEFAULT_BUCKETS;
  const sectors = Object.keys(heatmapData || {});

  const metricValues = useMemo(() => {
    const vals: number[] = [];
    for (const sector of sectors) {
      for (const range of investmentRanges) {
        const cell = heatmapData[sector]?.[range];
        if (!cell) continue;
        vals.push(metricNumber(cell, selectedMetric));
      }
    }
    return vals.filter((v) => v > 0);
  }, [heatmapData, sectors, investmentRanges, selectedMetric]);

  const maxMetric = metricValues.length ? Math.max(...metricValues) : 1;

  const getIntensity = (value: number): IntensityLevel => {
    if (!value || value <= 0) return "none";
    const r = value / maxMetric;
    if (r >= 0.75) return "very-high";
    if (r >= 0.45) return "high";
    if (r >= 0.2) return "medium";
    return "low";
  };

  const displayValue = (cell: any) => {
    if (!cell) return "-";
    switch (selectedMetric) {
      case "opportunities":
        return cell.opportunityCount || 0;
      case "pursue":
        return cell.pursueMatchCount ?? 0;
      case "coverage": {
        const rate = cell.coverageRate;
        if (rate == null || cell.opportunityCount === 0) return "-";
        return `${Math.round(rate * 100)}%`;
      }
      default:
        return cell.pursueMatchCount ?? 0;
    }
  };

  const onCellClick = (sector: string, range: string, cell: any) => {
    if (!cell || cell.opportunityCount === 0) return;
    const params = new URLSearchParams({
      sector,
      bucket: range,
      focus: "pursue",
    });
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <InsightsPanel>
      <InsightCard>
        <HeaderRow>
          <PanelTitle>Coverage</PanelTitle>
        </HeaderRow>

        {meta && (
          <MetaLine>
            {meta.bucketed} / {meta.opportunityTotal} opportunities mapped
            {meta.unspecified ? ` · ${meta.unspecified} unspecified` : ""}
          </MetaLine>
        )}

        <HeatmapMatrixContainer>
          <MatrixControls>
            <MatrixBtn
              active={selectedMetric === "pursue"}
              onClick={() => setSelectedMetric("pursue")}
            >
              Pursue matches
            </MatrixBtn>
            <MatrixBtn
              active={selectedMetric === "opportunities"}
              onClick={() => setSelectedMetric("opportunities")}
            >
              Opportunities
            </MatrixBtn>
            <MatrixBtn
              active={selectedMetric === "coverage"}
              onClick={() => setSelectedMetric("coverage")}
            >
              Coverage %
            </MatrixBtn>
          </MatrixControls>

          <MatrixWrapper>
            <MatrixTable $cols={investmentRanges.length} $rows={Math.max(sectors.length, 1)}>
              <MatrixHeaderCorner />
              {investmentRanges.map((range) => (
                <MatrixColHeader key={range}>{range}</MatrixColHeader>
              ))}

              {sectors.map((sector) => (
                <React.Fragment key={sector}>
                  <MatrixRowHeader title={sector}>{sector}</MatrixRowHeader>
                  {investmentRanges.map((range) => {
                    const cell = heatmapData[sector]?.[range];
                    const value = metricNumber(cell, selectedMetric);
                    const intensity = getIntensity(value);
                    const clickable = !!cell && cell.opportunityCount > 0;

                    return (
                      <MatrixCell
                        key={`${sector}-${range}`}
                        intensity={intensity}
                        $clickable={clickable}
                        onClick={() => onCellClick(sector, range, cell)}
                        data-tooltip-id="tooltip-heatMap"
                        data-tooltip-content={cell?.tooltip || `${sector} · ${range}: empty`}
                      >
                        <CellValue $empty={!clickable}>{displayValue(cell)}</CellValue>
                      </MatrixCell>
                    );
                  })}
                </React.Fragment>
              ))}
            </MatrixTable>
          </MatrixWrapper>

          <MatrixLegend>
            <LegendTitle>Intensity</LegendTitle>
            <LegendScale>
              <LegendItem>
                <LegendSwatch intensity="very-high" />
                <LegendText>High</LegendText>
              </LegendItem>
              <LegendItem>
                <LegendSwatch intensity="high" />
                <LegendText>Med-high</LegendText>
              </LegendItem>
              <LegendItem>
                <LegendSwatch intensity="medium" />
                <LegendText>Medium</LegendText>
              </LegendItem>
              <LegendItem>
                <LegendSwatch intensity="low" />
                <LegendText>Low</LegendText>
              </LegendItem>
              <LegendItem>
                <LegendSwatch intensity="none" />
                <LegendText>None</LegendText>
              </LegendItem>
            </LegendScale>
          </MatrixLegend>
        </HeatmapMatrixContainer>
      </InsightCard>

      <Tooltip
        id="tooltip-heatMap"
        place="top"
        float
        style={{
          maxWidth: "320px",
          whiteSpace: "normal",
          wordWrap: "break-word",
          zIndex: 1000,
        }}
      />
    </InsightsPanel>
  );
};

function metricNumber(cell: any, metric: MetricType): number {
  if (!cell) return 0;
  if (metric === "opportunities") return cell.opportunityCount || 0;
  if (metric === "coverage") return cell.coverageRate != null ? cell.coverageRate : 0;
  return cell.pursueMatchCount || 0;
}

export default HeatMap;

const InsightsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.35rem;
`;

const MetaLine = styled.div`
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
`;

const HeatmapMatrixContainer = styled.div`
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem 1rem 1.1rem;
`;

const MatrixControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 1rem;
`;

const MatrixBtn = styled.button<{ active?: boolean }>`
  background: ${({ active }) => (active ? "rgba(0, 200, 140, 0.18)" : "rgba(255,255,255,0.04)")};
  border: 1px solid ${({ active }) => (active ? "rgba(0, 200, 140, 0.55)" : "rgba(255,255,255,0.12)")};
  border-radius: 6px;
  color: ${({ active }) => (active ? "#9ef0c8" : "rgba(255,255,255,0.7)")};
  padding: 0.45rem 0.75rem;
  font-size: ${typography.button.fontSize};
  font-weight: 600;
  cursor: pointer;
`;

const MatrixWrapper = styled.div`
  overflow-x: auto;
  margin-bottom: 1rem;
`;

const MatrixTable = styled.div<{ $cols: number; $rows: number }>`
  display: grid;
  grid-template-columns: minmax(120px, 160px) repeat(${(p) => p.$cols}, minmax(72px, 1fr));
  grid-template-rows: 36px repeat(${(p) => p.$rows}, minmax(56px, auto));
  gap: 3px;
  min-width: 520px;
`;

const MatrixHeaderCorner = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
`;

const MatrixColHeader = styled.div`
  background: rgba(158, 240, 200, 0.08);
  color: rgba(158, 240, 200, 0.9);
  font-size: 0.72rem;
  font-weight: 650;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  text-align: center;
  padding: 0.25rem;
`;

const MatrixRowHeader = styled.div`
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  line-height: 1.25;
`;

const MatrixCell = styled.div<{ intensity?: IntensityLevel; $clickable?: boolean }>`
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  min-height: 52px;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  border: 1px solid rgba(255, 255, 255, 0.04);

  ${(p) =>
    p.$clickable &&
    css`
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
        z-index: 2;
      }
    `}

  ${({ intensity }) =>
    intensity === "very-high" &&
    css`
      background: #0e6f6a;
    `}
  ${({ intensity }) =>
    intensity === "high" &&
    css`
      background: #1a9b8e;
    `}
  ${({ intensity }) =>
    intensity === "medium" &&
    css`
      background: #3cb8a8;
    `}
  ${({ intensity }) =>
    intensity === "low" &&
    css`
      background: #7fd4c8;
    `}
  ${({ intensity }) =>
    intensity === "none" &&
    css`
      background: rgba(255, 255, 255, 0.04);
    `}
`;

const CellValue = styled.span<{ $empty?: boolean }>`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${(p) => (p.$empty ? "rgba(255,255,255,0.28)" : "#041512")};
`;

const MatrixLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
`;

const LegendTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.7);
`;

const LegendScale = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const LegendSwatch = styled.div<{ intensity?: IntensityLevel }>`
  width: 16px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  ${({ intensity }) =>
    intensity === "very-high" &&
    css`
      background: #0e6f6a;
    `}
  ${({ intensity }) =>
    intensity === "high" &&
    css`
      background: #1a9b8e;
    `}
  ${({ intensity }) =>
    intensity === "medium" &&
    css`
      background: #3cb8a8;
    `}
  ${({ intensity }) =>
    intensity === "low" &&
    css`
      background: #7fd4c8;
    `}
  ${({ intensity }) =>
    intensity === "none" &&
    css`
      background: rgba(255, 255, 255, 0.08);
    `}
`;

const LegendText = styled.span`
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.65);
`;
