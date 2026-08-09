import React, { useState } from "react";
import styled from "styled-components";

import BookMarkSelectIcon from '../../../assets/Invest-opportunity-icons/bookmark-selected.svg'
import BookMarkUnSelectIcon from '../../../assets/Invest-opportunity-icons/bookmark-03.svg'
import { AppDispatch } from '../../../store';

// Import the new opportunity details actions and selectors
import { getOpportunityDetailsRequest } from '../../../store/actions/opportunityDetailsActions';
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading, selectOpportunityDetailsError
} from '../../../store/selectors/opportunityDetailsSelectors';

import OpportunitiesPopup from '../../InvestmentOpportunities/Card/CardPopup';
import { useDispatch, useSelector } from "react-redux";
import typography from "../../../common/typography";
  type PopupType = 'analyze' | 'compare'|null;

interface AIInsightsProps {
  icon?: string;
  title: string;
  text: string;
  opportunity: any
  onBookmarkClick?: (opportunity: any) => void;
  buttonClick?: (opportunityId: number, type: PopupType) => void;

}

const AIInsightsCard: React.FC<AIInsightsProps> = ({ opportunity, icon, title, text, onBookmarkClick ,buttonClick}) => {

  // const dispatch = useDispatch<AppDispatch>();

  // const [selectedTable, setSelectedTable] = useState(null);
  // const [popupType, setPopupType] = useState<PopupType | null>(null); // 'analyze' or 'compare'
  // const [isPopupOpen, setIsPopupOpen] = useState(false);

  // const opportunityDetails = useSelector(selectOpportunityDetails);
  // const opportunityDetailsLoading = useSelector(selectOpportunityDetailsLoading);
  // const opportunityDetailsError = useSelector(selectOpportunityDetailsError);

  
  // const handleButtonClick = (opportunity: any, type: PopupType) => {
  //   dispatch(getOpportunityDetailsRequest(opportunity.id));

  //   // Set popup type if provided, otherwise keep current type
  //   // if (type !== null) {
  //     setPopupType(type);
  //   // }

  //   // Always open the popup
  //   setIsPopupOpen(true);

  // };

  // const handleClosePopup = () => {
  //   setIsPopupOpen(false);
  //   // setPopupType(null);
  // };


  // const handleAiDecisionFilter = (aiDecision: any) => {
  //   // Your implementation
  //   // if (onOpportunityClick) {
  //   //   onOpportunityClick(aiDecision);
  //   // }
  // };
  return (<>
    <AIInsights>
      <InsightTitle>
        <span><img src={icon} alt="" /></span>
        {title}
      </InsightTitle>
      <InsightText>{text}</InsightText>

      <ActionButtons>
        <BtnPrimary onClick={() => buttonClick?.(opportunity.id, null)}>View Full Details</BtnPrimary>
        <BtnSecondary onClick={() => buttonClick?.(opportunity.id, "compare")}>Compare</BtnSecondary>
        <BtnSecondary onClick={() => onBookmarkClick && onBookmarkClick(opportunity)}><Icon src={opportunity.isBookmarked ? BookMarkSelectIcon : BookMarkUnSelectIcon} /></BtnSecondary>
      </ActionButtons>
    </AIInsights>

    {/* {isPopupOpen && (
      <OpportunitiesPopup
        investment={{
          id: 1,
          opportunityName: 'asd',
          opportunitySector: "string",
          opportunityUrl: "string",
          avgSectorSimilarity: 0,
          avgProfileSimilarity: 0,
          avgProductSimilarity: 0,
          avgAiScore: 0,
          avgFinalScore: 0,
          totalCompaniesMatched: 0,
          isBookmarked: false
        }}
        onClose={handleClosePopup}
        detailedData={opportunityDetails || undefined}
        loading={opportunityDetailsLoading}
        error={opportunityDetailsError}
        onOpportunityClick={handleAiDecisionFilter}
        popupType={popupType}
      />
    )} */}
  </>
  );
};

export default AIInsightsCard;


const AIInsights = styled.div`
  background: rgba(71, 123, 195, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.85rem;
  min-height: 180px;     
  
  display: flex;
  flex-direction: column;
  @media (min-width: 2560px) { 
      padding:1.5rem;
  }
`;

const InsightTitle = styled.h4`
  display: flex;
  align-items: center;
  justify-content:center;
  gap: 0.5rem;
  font-size:${typography.Label.fontSize};
  font-weight:${typography.Label.fontWeight};
  color: #00e0b8; 
  padding: 0.5rem 0.75rem;
  margin-top:0;
  margin-bottom:1rem;
  border: 1px solid rgba(0, 224, 184, 0.3);
  border-radius: 8px;
  background: rgba(0, 64, 0, 0.14); 
   @media (min-width: 2560px) { 
      letter-spacing: 1px;
      margin-bottom: 0.55rem;
      img {
        width: 25px;
        height: 25px;
        display: block;         
        object-fit: contain;
  }
  }
  
`;

const InsightText = styled.div`
  font-size:${typography.Value.fontSize};
  font-weight:${typography.Value.fontWeight};
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin-bottom:1rem;
   @media (min-width: 2560px) { 
      line-height: 1.5;
      letter-spacing: 1px;
      margin:1rem 0;
  
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: auto;    
  @media (min-width: 2560px) { 
     margin-top:0.49rem;
  }
`;

const BtnPrimary = styled.button`
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  color: #0a0a0a;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size:${typography.button.fontSize};
  font-weight:${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;

  &:hover {
    transform: translateY(-2px);
  }
  @media (min-width: 2560px) { 
      letter-spacing: 1px;
      padding: 1rem 1.5rem;
  }
`;

const BtnSecondary = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size:${typography.button.fontSize};
  font-weight:${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
   @media (min-width: 2560px) { 
      letter-spacing: 1px;
      padding: 1rem 1.5rem;
  }
`;
const Icon = styled.img`
  height:20px;
  width:20px;
`;