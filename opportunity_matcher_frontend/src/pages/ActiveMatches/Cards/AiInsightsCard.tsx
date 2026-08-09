import React from "react";
import styled, { css } from "styled-components";
import aiStrategicIcon from '../../../assets/icons/chat-bot.svg'

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
  
  @media (min-width: 1920px) {
    gap: 2rem;
    margin-top: 2rem;
  }
  
  @media (min-width: 2560px) {
    gap: 2.5rem;
    margin-top: 2.5rem;
  }
  
  @media (min-width: 3840px) {
    gap: 3rem;
    margin-top: 3rem;
  }
`;

interface MatchInsightsCardProps {
  ai?: boolean;
}
const MatchInsightsCard = styled.div<MatchInsightsCardProps>`
  margin-bottom: 2rem;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  
  ${({ ai }) =>
    ai &&
    css`
      background: linear-gradient(145deg, rgba(0, 255, 136, 0.08), rgba(0, 180, 216, 0.05));
      border-color: rgba(0, 255, 136, 0.2);
    `}
  
  @media (min-width: 1920px) {
    margin-bottom: 2.5rem;
    border-radius: 12px;
  }
  
  @media (min-width: 2560px) {
    margin-bottom: 3rem;
    border-radius: 14px;
  }
  
  @media (min-width: 3840px) {
    margin-bottom: 3.5rem;
    border-radius: 16px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (min-width: 1920px) {
    margin-bottom: 2.5rem;
    padding-bottom: 1.25rem;
  }
  
  @media (min-width: 2560px) {
    margin-bottom: 3rem;
    padding-bottom: 1.5rem;
  }
  
  @media (min-width: 3840px) {
    margin-bottom: 3.5rem;
    padding-bottom: 1.75rem;
  }
`;

const MatchIcon = styled.img`
  font-size: 2rem;
  margin-right: 1rem;
  
  @media (min-width: 1920px) {
    font-size: 2.25rem;
    margin-right: 1.25rem;
  }
  
  @media (min-width: 2560px) {
    font-size: 2.5rem;
    margin-right: 1.5rem;
  }
  
  @media (min-width: 3840px) {
    font-size: 3rem;
    margin-right: 2rem;
  }
`;

const CardMatchTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
  
  @media (min-width: 1920px) {
    font-size: 1.5rem;
  }
  
  @media (min-width: 2560px) {
    font-size: 1.75rem;
  }
  
  @media (min-width: 3840px) {
    font-size: 2.25rem;
  }
`;

const AiBadge = styled.div`
  background: rgba(239, 68, 68, 0.2);
  color: white;
  border-color: rgba(239, 68, 68, 0.3);
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.2rem;
  white-space: nowrap;
  
  @media (min-width: 1920px) {
    padding: 0.5rem 1rem;
    border-radius: 10px;
    font-size: 1.4rem;
  }
  
  @media (min-width: 2560px) {
    padding: 0.6rem 1.2rem;
    border-radius: 12px;
    font-size: 1.6rem;
  }
  
  @media (min-width: 3840px) {
    padding: 0.75rem 1.5rem;
    border-radius: 14px;
    font-size: 2rem;
  }
`;

const InsightsContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 1.5rem;
  width: 100%;
  min-width: 0;

  @media (min-width: 1920px) {
    gap: 2rem;
  }
  
  @media (min-width: 2560px) {
    gap: 2.5rem;
  }
`;

const InsightBlock = styled.div`
  background: #2C3E50;
  border: 1px solid #4ad092ff;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 136, 0.05);
    border-color: rgba(0, 255, 136, 0.2);
  }
  
  @media (min-width: 1920px) {
   border: 2px solid #4ad092ff;
    border-radius: 14px;
    padding: 1.5rem;
  }
  
  @media (min-width: 2560px) {
    border-radius: 16px;
    padding: 1.75rem;
  }
  
  @media (min-width: 3840px) {
    border-radius: 18px;
    padding: 2.25rem;
  }
`;

const InsightLabel = styled.div`
  color: #00ff88;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (min-width: 1920px) {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  
  @media (min-width: 2560px) {
    font-size: 1.5rem;
    margin-bottom: 1.25rem;
  }
  
  @media (min-width: 3840px) {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    letter-spacing: 0.75px;
  }
`;

const InsightText = styled.div`
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  font-size: 0.9rem;
  
  @media (min-width: 1920px) {
    font-size: 1.4rem;
    line-height: 1.6;
  }
  
  @media (min-width: 2560px) {
    font-size: 1.4rem;
    line-height: 1.4;
  }
  
  @media (min-width: 3840px) {
    font-size: 1.3rem;
    line-height: 1.8;
  }
`;
const AiInsightsCard: React.FC =()=>{

    return(
       <GridContainer>
          {/* <MatchInsightsCard ai> */}
          <MatchInsightsCard >

            {/* <CardHeader>
              <MatchIcon src={aiStrategicIcon} />
              <CardMatchTitle>AI Strategic Insights</CardMatchTitle>
              <AiBadge>Critical</AiBadge>
            </CardHeader> */}
            <InsightsContent>
              <InsightBlock>
                <InsightLabel>Strategic Alignment</InsightLabel>
                <InsightText>
                  Perfect match across all competency areas. Your smart city expertise positions you as a top-tier candidate.
                </InsightText>
              </InsightBlock>
              <InsightBlock>
                <InsightLabel>Competitive Edge</InsightLabel>
                <InsightText>
                  NEOM experience gives you 15% advantage. Highlight
                  sustainable tech integrations.
                </InsightText>
              </InsightBlock>
              <InsightBlock>
                <InsightLabel>Next Action</InsightLabel>
                <InsightText>
                  Immediate application prep recommended. Consider local
                  partnerships.
                </InsightText>
              </InsightBlock>
            </InsightsContent>
          </MatchInsightsCard>
        </GridContainer>
    )
}

export default AiInsightsCard;