import styled from 'styled-components';
import aiStrategicIcon from '../../assets/icons/chat-bot.svg'

const AiInsights = styled.div`
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 180, 216, 0.1));
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  
  @media (min-width: 1920px) {
    border-radius: 14px;
    padding: 1.75rem;
  }
  
  @media (min-width: 2560px) {
    border-radius: 16px;
    padding: 2rem;
  }
  
  @media (min-width: 3840px) {
    border-radius: 18px;
    padding: 2.5rem;
  }
`;

const InsightTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #00ff88;
  
  @media (min-width: 1920px) {
    gap: 0.6rem;
    margin-bottom: 1.25rem;
    font-size: 1.1rem;
  }
  
  @media (min-width: 2560px) {
    gap: 0.7rem;
    margin-bottom: 1.5rem;
    font-size: 1.6rem;
  }
  
  @media (min-width: 3840px) {
    gap: 0.8rem;
    margin-bottom: 1.75rem;
    font-size: 1.4rem;
  }
`;

const InsightText = styled.p`
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin-bottom: 1rem;
  
  @media (min-width: 1920px) {
    line-height: 1.6;
    margin-bottom: 1.25rem;
    font-size: 1.05rem;
  }
  
  @media (min-width: 2560px) {
    line-height: 1.7;
    margin-bottom: 1.5rem;
    font-size: 1.4rem;
  }
  
  @media (min-width: 3840px) {
    line-height: 1.8;
    margin-bottom: 1.75rem;
    font-size: 1.3rem;
  }
`;

const StrongText = styled.strong`
  font-weight: 700;
  
  @media (min-width: 1920px) {
    font-size: 1.05rem;
  }
  
  @media (min-width: 2560px) {
    font-size: 1.5rem;
  }
  
  @media (min-width: 3840px) {
    font-size: 1.3rem;
  }
`;

const InsightIcon = styled.img`
  @media (min-width: 1920px) {
    width: 1.8rem;
    height: 1.8rem;
  }
  
  @media (min-width: 2560px) {
    width: 2.3rem;
    height: 2.3rem;
  }
  
  @media (min-width: 3840px) {
    width: 2.4rem;
    height: 2.4rem;
  }
`;

const StartegicAssessmentCard: React.FC = () => {
    return (
        <AiInsights>
            <InsightTitle>
                <InsightIcon src={aiStrategicIcon} />
                <span>Strategic Assessment</span>
            </InsightTitle>
            <InsightText>
                <StrongText>Market Opportunity:</StrongText> Strong alignment with Saudi's green energy transition.
                This project offers excellent diversification from your core smart city focus while
                leveraging your analytics capabilities.
            </InsightText>
            <InsightText>
                <StrongText>Partnership Recommendation:</StrongText> Consider strategic partnerships with established
                energy companies to strengthen your bid position and reduce technical risk.
            </InsightText>
        </AiInsights>
    )
}

export default StartegicAssessmentCard;