import React from "react";
import styled from "styled-components";
import {
  confidenceTone,
  humanizeEvidenceFlags,
  scorePercent,
  shortValueChainLabel,
  truncateText,
} from "./aiMatchUtils";

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  width: 100%;
  min-width: 0;
`;

const Chip = styled.span<{ $tone?: "high" | "medium" | "low" | "neutral" | "risk" | "strength" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
  max-width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(p) =>
    p.$tone === "high" &&
    `
    border-color: rgba(0, 200, 140, 0.45);
    color: #9ef0c8;
    background: rgba(0, 200, 140, 0.08);
  `}
  ${(p) =>
    p.$tone === "medium" &&
    `
    border-color: rgba(230, 190, 80, 0.4);
    color: #f0d78a;
    background: rgba(230, 190, 80, 0.08);
  `}
  ${(p) =>
    p.$tone === "low" &&
    `
    border-color: rgba(255, 120, 100, 0.4);
    color: #ffb4a8;
    background: rgba(255, 120, 100, 0.08);
  `}
  ${(p) =>
    p.$tone === "strength" &&
    `
    border-color: rgba(100, 180, 220, 0.4);
    color: #b8e0f5;
  `}
  ${(p) =>
    p.$tone === "risk" &&
    `
    border-color: rgba(220, 140, 100, 0.4);
    color: #f0c4a8;
  `}
`;

const ValueChainNote = styled.p`
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.62);
  word-break: break-word;
`;

const EvidenceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 0;
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const EvidenceBlock = styled.div<{ $kind: "strength" | "risk" }>`
  padding: 0.9rem 1rem;
  border-radius: 10px;
  border: 1px solid
    ${(p) =>
      p.$kind === "strength"
        ? "rgba(100, 180, 220, 0.28)"
        : "rgba(220, 140, 100, 0.28)"};
  background: ${(p) =>
    p.$kind === "strength"
      ? "rgba(100, 180, 220, 0.06)"
      : "rgba(220, 140, 100, 0.06)"};
  min-width: 0;
`;

const EvidenceLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.45rem;
`;

const EvidenceText = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.8);
  word-break: break-word;
`;

export interface MatchSignalProps {
  decisionTier?: string | null;
  confidenceScore?: number | null;
  confidenceLabel?: string | null;
  evidenceFlag?: string | null;
  valueChainPosition?: string | null;
  /** @deprecated Not shown in officer UI */
  modelVersion?: string | null;
  finalScore?: number | null;
}

export const MatchSignalChips: React.FC<MatchSignalProps> = ({
  decisionTier,
  confidenceScore,
  confidenceLabel,
  evidenceFlag,
  valueChainPosition,
  finalScore,
}) => {
  const tone = confidenceTone(confidenceLabel, confidenceScore);
  const conf =
    confidenceLabel ||
    (confidenceScore != null ? `${confidenceScore}% confidence` : null);
  const demotions = humanizeEvidenceFlags(evidenceFlag);
  const roleChip = shortValueChainLabel(valueChainPosition);
  const chainNote =
    valueChainPosition && valueChainPosition.trim().length > 28
      ? truncateText(valueChainPosition, 180)
      : null;

  return (
    <>
      <ChipRow>
        {decisionTier && <Chip $tone={tone}>{decisionTier}</Chip>}
        {conf && (
          <Chip $tone={tone}>
            {confidenceScore != null ? `${confidenceScore}%` : ""}{" "}
            {confidenceLabel || "Confidence"}
          </Chip>
        )}
        {roleChip && <Chip $tone="neutral">{roleChip}</Chip>}
        {demotions.length > 0 && (
          <Chip $tone="risk">
            {demotions.length} demotion reason{demotions.length > 1 ? "s" : ""}
          </Chip>
        )}
        {finalScore != null && !decisionTier && (
          <Chip $tone={tone}>{scorePercent(finalScore)}% match</Chip>
        )}
      </ChipRow>
      {chainNote ? <ValueChainNote>{chainNote}</ValueChainNote> : null}
      {demotions.length > 0 ? (
        <DemotionBox>
          <DemotionLabel>Why this tier</DemotionLabel>
          <DemotionList>
            {demotions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </DemotionList>
        </DemotionBox>
      ) : null}
    </>
  );
};

const DemotionBox = styled.div`
  margin-top: 0.55rem;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(230, 190, 80, 0.35);
  background: rgba(230, 190, 80, 0.07);
`;

const DemotionLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(240, 215, 138, 0.9);
  margin-bottom: 0.3rem;
`;

const DemotionList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.78rem;
  line-height: 1.45;

  li + li {
    margin-top: 0.2rem;
  }
`;

export interface EvidenceStripProps {
  strengths?: string | null;
  risks?: string | null;
  /** @deprecated Full text is always shown; kept for call-site compatibility */
  maxLen?: number;
}

export const EvidenceStrip: React.FC<EvidenceStripProps> = ({
  strengths,
  risks,
}) => {
  const s = (strengths || "").trim();
  const r = (risks || "").trim();
  if (!s && !r) return null;

  return (
    <EvidenceGrid>
      {s && (
        <EvidenceBlock $kind="strength">
          <EvidenceLabel>Top strength</EvidenceLabel>
          <EvidenceText>{s}</EvidenceText>
        </EvidenceBlock>
      )}
      {r && (
        <EvidenceBlock $kind="risk">
          <EvidenceLabel>Key risk</EvidenceLabel>
          <EvidenceText>{r}</EvidenceText>
        </EvidenceBlock>
      )}
    </EvidenceGrid>
  );
};
