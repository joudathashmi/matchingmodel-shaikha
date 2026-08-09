import React, { useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { KPI } from "../../store/types/getExecutiveOverviewAiTypes";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface KPISectionProps {
  kpis: KPI[];
  engine?: string;
}

const KPISection: React.FC<KPISectionProps> = ({ kpis }) => {
  const navigate = useNavigate();
  const { primary, secondary } = useMemo(() => {
    const list = kpis || [];
    const primary = list.filter((k) => k.kind === "primary");
    const secondary = list.filter((k) => k.kind !== "primary");
    // Fallback if API still returns legacy flat KPIs
    if (!primary.length && list.length) {
      return { primary: list.slice(0, 3), secondary: list.slice(3) };
    }
    return { primary, secondary };
  }, [kpis]);

  return (
    <Panel>
      <Header>
        <HeaderCopy>
          <SectionTitle>Matching overview pulse</SectionTitle>
          <SectionSub>Leadership snapshot of this matching run</SectionSub>
        </HeaderCopy>
      </Header>

      <Body>
        <PrimaryGrid>
          {primary.map((kpi) => (
            <PrimaryCard
              key={kpi.name}
              $accent={kpi.accent || "pursue"}
              onClick={() => {
                const name = (kpi.name || "").toLowerCase();
                if (name.includes("excellent")) {
                  navigate("/match-workbench?tier=Excellent");
                } else if (
                  name.includes("pursue") ||
                  name.includes("high confidence")
                ) {
                  navigate("/match-workbench?focus=pursue");
                } else {
                  navigate("/match-workbench");
                }
              }}
              data-tooltip-id="tooltip-pulse"
              data-tooltip-content={kpi.subTitle}
            >
              <PrimaryValue>{formatValue(kpi)}</PrimaryValue>
              <PrimaryName>{kpi.name}</PrimaryName>
              <PrimarySub>{kpi.subTitle}</PrimarySub>
            </PrimaryCard>
          ))}
        </PrimaryGrid>

        {secondary.length > 0 && (
          <SecondaryRow>
            {secondary.map((kpi) => (
              <SecondaryChip
                key={kpi.name}
                data-tooltip-id="tooltip-pulse"
                data-tooltip-content={kpi.subTitle}
              >
                <SecondaryValue>{formatValue(kpi)}</SecondaryValue>
                <SecondaryMeta>
                  <SecondaryName>{kpi.name}</SecondaryName>
                  <SecondarySub>{kpi.subTitle}</SecondarySub>
                </SecondaryMeta>
              </SecondaryChip>
            ))}
          </SecondaryRow>
        )}
      </Body>

      <Tooltip
        id="tooltip-pulse"
        place="top"
        float
        style={{
          maxWidth: "280px",
          whiteSpace: "normal",
          wordWrap: "break-word",
        }}
      />
    </Panel>
  );
};

function formatValue(kpi: KPI): string {
  const v = kpi.value ?? 0;
  if (kpi.unit === "percent") return `${v.toLocaleString("en-US")}%`;
  return v.toLocaleString("en-US");
}

export default KPISection;

const Panel = styled.section`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  padding: 1.25rem 1.35rem 1.35rem;
  box-sizing: border-box;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const HeaderCopy = styled.div`
  min-width: 0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.2rem;
  font-size: 1.05rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
`;

const SectionSub = styled.p`
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.35;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PrimaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const PrimaryCard = styled.button<{ $accent: string }>`
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  padding: 0.95rem 1rem;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(0, 200, 140, 0.45);
    background: rgba(0, 255, 136, 0.05);
  }
`;

const PrimaryValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  color: #9ef0c8;
  margin-bottom: 0.3rem;
`;

const PrimaryName = styled.div`
  font-size: 0.9rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 0.2rem;
`;

const PrimarySub = styled.div`
  font-size: 0.76rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.5);
`;

const SecondaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SecondaryChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
`;

const SecondaryValue = styled.div`
  flex-shrink: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #9ef0c8;
  min-width: 2.5rem;
`;

const SecondaryMeta = styled.div`
  min-width: 0;
`;

const SecondaryName = styled.div`
  font-size: 0.78rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SecondarySub = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
