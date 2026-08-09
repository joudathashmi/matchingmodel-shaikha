import React from "react";
import styled from "styled-components";
import { OpportunitieList } from "./CardTypes";
import BookMarkSelectIcon from "../../../assets/Invest-opportunity-icons/bookmark-selected.svg";
import BookMarkUnSelectIcon from "../../../assets/Invest-opportunity-icons/bookmark-03.svg";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import typography from "../../../common/typography";

interface InvestmentCardProps {
  onSelect: (investment: OpportunitieList) => void;
  onBookmark: (opportunity: any) => void;
  investments: OpportunitieList[];
  bookmarks: Set<number>;
}

function scorePercent(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value) * 100));
}

function textOrNA(value?: string | null): string {
  const t = (value || "").trim();
  return t || "N/A";
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({
  onSelect,
  onBookmark,
  investments,
  bookmarks,
}) => {
  return (
    <>
      <CardsContainer>
        {investments.map((item) => (
          <Card key={item.id} onClick={() => onSelect(item)}>
            <TitleRow>
              <Title title={item.opportunityName}>{item.opportunityName}</Title>
              <ScoreBadge>
                <ScoreNum>{scorePercent(item.avgFinalScore)}</ScoreNum>
                <ScoreLabel>Score</ScoreLabel>
              </ScoreBadge>
            </TitleRow>

            <Tag>{textOrNA(item.opportunitySector)}</Tag>

            <Metrics>
              <Metric>
                <Label>Investment Range (SAR)</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.investmentRange)}
                >
                  {textOrNA(item.investmentRange)}
                </Value>
              </Metric>
              <Metric>
                <Label>Jobs Created</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.jobsCreated)}
                >
                  {textOrNA(item.jobsCreated)}
                </Value>
              </Metric>
              <Metric>
                <Label>Key Demand Drivers</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.keyDemandDrivers)}
                >
                  {textOrNA(item.keyDemandDrivers)}
                </Value>
              </Metric>
              <Metric>
                <Label>GDP Impact (SAR)</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.gdpImpact)}
                >
                  {textOrNA(item.gdpImpact)}
                </Value>
              </Metric>
            </Metrics>

            <Details>
              <Detail>
                <Label>Investment Appeal</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.investmentAppeal)}
                >
                  {textOrNA(item.investmentAppeal)}
                </Value>
              </Detail>
              <Detail>
                <Label>Economic Impact</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.economicImpact)}
                >
                  {textOrNA(item.economicImpact)}
                </Value>
              </Detail>
              <Detail>
                <Label>Market Readiness</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.marketReadiness)}
                >
                  {textOrNA(item.marketReadiness)}
                </Value>
              </Detail>
              <Detail>
                <Label>Value Proposition</Label>
                <Value
                  data-tooltip-id="tooltip-Investment"
                  data-tooltip-content={textOrNA(item.valueProposition)}
                >
                  {textOrNA(item.valueProposition)}
                </Value>
              </Detail>
            </Details>

            <Actions>
              <PrimaryBtn type="button">View Details</PrimaryBtn>
              <IconBtn
                type="button"
                aria-label="Bookmark"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(item);
                }}
              >
                <SaveIcon
                  src={
                    bookmarks.has(item.id)
                      ? BookMarkSelectIcon
                      : BookMarkUnSelectIcon
                  }
                  alt=""
                />
              </IconBtn>
            </Actions>
          </Card>
        ))}
      </CardsContainer>

      <Tooltip
        id="tooltip-Investment"
        place="top"
        float
        style={{
          maxWidth: "300px",
          whiteSpace: "normal",
          wordWrap: "break-word",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "0.8125rem",
        }}
      />
    </>
  );
};

export default InvestmentCard;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 1.5rem;
  align-items: stretch;
  width: 100%;
  min-width: 0;
`;

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  /* Stretch with the grid row, clip anything that would spill into the next row */
  align-self: stretch;
  min-height: 100%;
  overflow: hidden;
  isolation: isolate;
  padding: 1.25rem;
  border-radius: 14px;
  cursor: pointer;
  color: #ffffff;
  font-family: "DM Sans", sans-serif;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(0, 200, 140, 0.35);
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

const Title = styled.h2`
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  color: #ffffff;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ScoreBadge = styled.div`
  flex-shrink: 0;
  min-width: 3.5rem;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  color: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
`;

const ScoreNum = styled.span`
  font-size: ${typography.overAllPercentage.fontSize};
  font-weight: ${typography.overAllPercentage.fontWeight};
`;

const ScoreLabel = styled.span`
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.75;
`;

const Tag = styled.span`
  align-self: flex-start;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-size: ${typography.datasSubHeading.fontSize};
  font-weight: ${typography.datasSubHeading.fontWeight};
`;

const Label = styled.div`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.35;
  margin-bottom: 0.2rem;
`;

const Value = styled.div`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const Metrics = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
  padding: 0.85rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Metric = styled.div`
  min-width: 0;
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

const Detail = styled.div`
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;

  ${Value} {
    -webkit-line-clamp: 1;
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 0.6rem;
  margin-top: auto;
  flex-shrink: 0;
`;

const PrimaryBtn = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  color: #0a0a0a;
  background: linear-gradient(45deg, #00ff88, #00b4d8);
`;

const IconBtn = styled.button`
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
`;

const SaveIcon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
`;
