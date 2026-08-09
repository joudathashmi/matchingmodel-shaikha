import styled from "styled-components";
import typography from "../../../common/typography";

type MatchLevel = "high" | "medium" | "low" | undefined;
interface OpportunityCardProps {
  matchLevel?: MatchLevel;
}
export const OpportunityCard = styled.div<OpportunityCardProps>`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ matchLevel }) => {
    switch (matchLevel) {
      case "high":
        return "linear-gradient(90deg, #00ff88, #00b4d8)";
      case "medium":
        return "linear-gradient(90deg, #ffc107, #ff9800)";
      case "low":
        return "linear-gradient(90deg, #ff6b6b, #e74c3c)";
      default:
        return "transparent";
    }
  }};
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 255, 136, 0.1);
  }
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1.5rem;
`;

export const OpportunityTitle = styled.h3`
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  margin-top:0;
  margin-bottom: 0.3rem;
  line-height: 1.4;
  
  span {
    cursor: pointer;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 100%;
      height: 2px;
      background: white;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    &:hover::after {
      opacity: 1;
    }
  }
  
  span.gradient-text {
    font-size: ${typography.datasHeading.fontSize};
    font-weight: ${typography.datasHeading.fontWeight};
    background: linear-gradient(45deg, #00ff88, #00b4d8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    
    &::after {
      height: 2px;
      background: linear-gradient(45deg, #00ff88, #00b4d8);
      bottom: -3px;
    }
  }
`;

export const OpportunityMeta = styled.h4`
  color: rgba(255, 255, 255, 0.7);
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  margin:0 0 0.3rem 0;
  display: flex;
  align-items: center; 

  a {
    margin-left: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    max-width: 600px;   
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle; 

    &:hover {
      color: #5facffff;
    }
  }

`;

export const OpportunityTags = styled.div`
  margin-top: 0.7rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;  
  overflow-x: auto;
  white-space: normal;

  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Button = styled.button`
  background: #2C3E50;
  padding: 0.4rem 0.5rem;
  color:white;
  border-radius: 12px;
  font-size: ${typography.kpiSubTitle.fontSize};
  font-weight: ${typography.kpiSubTitle.fontWeight};
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor:pointer;
  @media (min-width: 2560px) { 
    padding: 0.85rem 2.9rem;
    border-radius: 20px;

  }
`;
export const ButtonSeeMore = styled.button`
  background: transparent;
  padding: 0.4rem 0.5rem;
  color:lightseagreen;
  border-radius: 12px;
  font-size: ${typography.kpiSubTitle.fontSize};
  font-weight: ${typography.kpiSubTitle.fontWeight};
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor:pointer;
  @media (min-width: 2560px) { 
    padding: 0.85rem 2.9rem;
    border-radius: 20px;

  }
`;

export const MatchIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

export const MatchScore = styled.div`
  font-size: ${typography.overAllPercentage.fontSize};
  font-weight: ${typography.overAllPercentage.fontWeight};
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

`;

export const MatchLabel = styled.div`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgba(255, 255, 255, 0.6);
`;

export const OpportunityDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const DetailItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const DetailLabel = styled.div`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  @media (min-width: 2560px) { 
    letter-spacing: 1px;
    margin-bottom: 0.75rem;
  }
`;

export const DetailValue = styled.div`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: #ffffff;
   display: -webkit-box;
  -webkit-line-clamp: 1; 
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
 
`;

export const MatchBreakdown = styled.div`
  background: rgba(71, 123, 195, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  min-height:180px
  display: flex;
  flex-direction: column;
  @media (min-width: 2560px) { 
      padding:1.5rem;
  }
`;

export const BreakdownTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content:center;
  gap: 0.5rem;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: #00e0b8; 
  padding: 0.5rem 0.75rem;
  margin-bottom:1rem;
  border: 1px solid rgba(0, 224, 184, 0.3);
  border-radius: 8px;
  background: rgba(0, 64, 0, 0.14);
  
  img {
    width: 16px;
    height: 16px;
    display: block;         
    object-fit: contain;
  }
    @media (min-width: 2560px) { 
      letter-spacing: 1px;
      margin-bottom: 1.5rem;
      img {
        width: 25px;
        height: 25px;
        display: block;         
        object-fit: contain;
  }
  }
`;


export const BreakdownItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export const BreakdownLabel = styled.span`
  font-size: ${typography.kpiTitle.fontSize};
  font-weight: ${typography.kpiTitle.fontWeight};
  color: rgba(255, 255, 255, 0.7);

`;

export const BreakdownScore = styled.span`
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
  color: #00ff88;
`;

export const LoaderBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin: 0.25rem 0;
  @media (min-width: 2560px) { 
    border-radius: 2px;
    margin: 0.65rem 0 0.45rem 0;
    
  }
`;

interface ProgressFillProps {
  width: number;
}

export const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  transition: width 0.8s ease;
  width: ${({ width }) => width}%;
`;

