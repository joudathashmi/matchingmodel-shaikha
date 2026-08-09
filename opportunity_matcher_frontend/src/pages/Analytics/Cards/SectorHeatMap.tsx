import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { selectAnalyticsHeatmap } from "../../../store/selectors/analyticsSelectors";
import ChartPanel, { ChartEmpty, TOOLTIP_STYLE } from "./ChartPanel";

const COLORS = [
  "#008631",
  "#00a86b",
  "#00c98a",
  "#00ff88",
  "#1fd655",
  "#3dd68c",
  "#5eead4",
  "#00b4d8",
  "#48cae4",
  "#90e0ef",
];

type NodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
};

const TreemapNode = (props: NodeProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = "", value = 0, index = 0 } =
    props;
  if (width < 2 || height < 2) return null;
  const showLabel = width > 68 && height > 42;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={COLORS[index % COLORS.length]}
        stroke="rgba(11,18,32,0.65)"
        strokeWidth={2}
      />
      {showLabel ? (
        <>
          <text
            x={x + 10}
            y={y + 22}
            fill="#0a0a0a"
            fontSize={12}
            fontWeight={700}
          >
            {name.length > 22 ? `${name.slice(0, 21)}…` : name}
          </text>
          <text x={x + 10} y={y + 40} fill="rgba(10,10,10,0.75)" fontSize={11}>
            {value} pursue
          </text>
        </>
      ) : null}
    </g>
  );
};

const SectorHeatMap: React.FC = () => {
  const heatmapValues = useSelector(selectAnalyticsHeatmap);

  const data = useMemo(
    () =>
      (heatmapValues || []).map((s, index) => ({
        name: String(s.name || "").replace(/ Sector$/i, ""),
        size: Number(s.value) || 0,
        index,
      })),
    [heatmapValues]
  );

  return (
    <ChartPanel
      title="Sector pursue heatmap"
      subtitle="Pursue-grade pair counts by company sector"
      exportName="analytics_sector_heatmap"
      tall
      officeChart={
        data.length
          ? {
              title: "Sector pursue heatmap",
              subtitle: "Pursue-grade pair counts by company sector",
              kind: "bar",
              labels: data.map((d) => d.name),
              values: data.map((d) => d.size),
              seriesName: "Pursue pairs",
            }
          : null
      }
    >
      {data.length === 0 ? (
        <ChartEmpty>No heatmap data yet</ChartEmpty>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={data}
            dataKey="size"
            stroke="rgba(11,18,32,0.5)"
            content={(nodeProps) => <TreemapNode {...nodeProps} />}
            isAnimationActive
          >
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any, _n: any, item: any) => [
                `${Number(v).toLocaleString()} pursue pairs`,
                item?.payload?.name || "Sector",
              ]}
            />
          </Treemap>
        </ResponsiveContainer>
      )}
      <Legend>
        <LegendItem>
          <Swatch style={{ background: "#008631" }} /> Dense
        </LegendItem>
        <LegendItem>
          <Swatch style={{ background: "#00ff88" }} /> Mid
        </LegendItem>
        <LegendItem>
          <Swatch style={{ background: "#90e0ef" }} /> Light
        </LegendItem>
      </Legend>
    </ChartPanel>
  );
};

export default SectorHeatMap;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: rgba(203, 213, 225, 0.75);
`;

const Swatch = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 3px;
`;
