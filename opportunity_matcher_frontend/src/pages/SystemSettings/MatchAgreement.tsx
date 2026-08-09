import React, { useEffect, useState } from "react";
import styled from "styled-components";
import AppShell from "../../components/AppShell";
import typography from "../../common/typography";
import MatchAgreementDashboard from "./MatchAgreementDashboard";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { getMatchAgreementsRequest } from '../../store/actions/getMatchAgreementsActions';
import {
    selectMatchAgreements,
    selectMatchAgreementsLoading,
    selectMatchAgreementsError,
} from '../../store/selectors/getMatchAgreementsSelectors';
import { AppDispatch } from "../../store";
import { clearCompanyDetails, getCompanyDetailsRequest } from "../../store/actions/getCompanyDetailsActions";
import { selectCompanyDetails, selectCompanyDetailsError, selectCompanyDetailsLoading } from "../../store/selectors/getCompanyDetailsSelectors";
import { selectOpportunityDetails, selectOpportunityDetailsError, selectOpportunityDetailsLoading } from "../../store/selectors/opportunityDetailsSelectors";
import { getOpportunityDetailsRequest } from "../../store/actions/opportunityDetailsActions";
import CompanyDetailPopup from "../CompanyProfile/Cards/CompanyDetailPopup";
import OpportunitiesPopup from '../InvestmentOpportunities/Card/CardPopup';

const MatchAgreement: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const matchAgreements = useSelector(selectMatchAgreements);
    const loading = useSelector(selectMatchAgreementsLoading);
    const error = useSelector(selectMatchAgreementsError);
    useEffect(() => {
        dispatch(getMatchAgreementsRequest());
    }, [dispatch]);

    const navigate = useNavigate()
    const handleBackClick = () => {
        navigate("/systemSettings")

    };

    type PopupType = 'analyze' | 'compare' | null;
    const [popupType, setPopupType] = useState<PopupType | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [openPopup, setOpenPopup] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const companyDetails = useSelector(selectCompanyDetails);
    const companyDetailsLoading = useSelector(selectCompanyDetailsLoading);
    const companyDetailsError = useSelector(selectCompanyDetailsError);
    useEffect(() => {
        if (selectedCompanyId) {
            dispatch(getCompanyDetailsRequest(selectedCompanyId));
        }
    }, [selectedCompanyId, dispatch]);

    useEffect(() => {
        if (!openPopup) {
            setSelectedCompanyId(null);
            dispatch(clearCompanyDetails());
        }
    }, [openPopup, dispatch]);

    const handleCompanyClick = (companyId: number) => {
        setSelectedCompanyId(companyId);
        setOpenPopup(true);
    };

    const opportunityDetails = useSelector(selectOpportunityDetails);
    const opportunityDetailsLoading = useSelector(selectOpportunityDetailsLoading);
    const opportunityDetailsError = useSelector(selectOpportunityDetailsError);


    const handleButtonClick = (opportunityId: number, type: PopupType) => {
        dispatch(getOpportunityDetailsRequest(opportunityId));
        setPopupType(type);
        setIsPopupOpen(true);

    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
        // setPopupType(null);
    };

    const handleAiDecisionFilter = (aiDecision: any) => {
        // Your implementation
        // if (onOpportunityClick) {
        //   onOpportunityClick(aiDecision);
        // }
    };
    return (
        <AppShell subLabel="Settings">
                <BackButton onClick={handleBackClick}>
                    ← Settings
                </BackButton>
                <TitleBlock>
                  <Title>Match decisions</Title>
                  <Subtitle>
                    Review Agree / Not-a-fit history across the team
                  </Subtitle>
                </TitleBlock>

                <MatchAgreementDashboard
                    matchAgreements={matchAgreements || []} // Provide empty array as fallback
                    loading={loading}
                    error={error}
                    onCompanyClick={handleCompanyClick}
                    onOpportunityClick={handleButtonClick}
                />


                {openPopup && (
                    <CompanyDetailPopup
                        companyId={selectedCompanyId}
                        companyDetails={companyDetails}
                        loading={companyDetailsLoading}
                        error={companyDetailsError}
                        onClose={() => setOpenPopup(false)}
                    />
                )}


                {isPopupOpen && (
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
                            isBookmarked: false,
                            investmentRange: "",
                            jobsCreated: "",
                            keyDemandDrivers: "",
                            gdpImpact: "",
                            investmentAppeal: "",
                            economicImpact: "",
                            marketReadiness: "",
                            valueProposition: ""
                        }}
                        onClose={handleClosePopup}
                        detailedData={opportunityDetails || undefined}
                        loading={opportunityDetailsLoading}
                        error={opportunityDetailsError}
                        onOpportunityClick={handleAiDecisionFilter}
                        popupType={popupType}
                    />
                )}
        </AppShell>
    )
}
export default MatchAgreement;



const BREAKPOINTS = {
    MOBILE: '768px',
    TABLET: '1024px',
    LAPTOP: '1440px',
    DESKTOP: '1920px',
    QHD: '2560px',
    UHD: '3840px',
    reducedMotion: `@media (prefers-reduced-motion: reduce)`
};

const BackButton = styled.button`
  background: rgba(27, 31, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};

  &:hover {
    background: rgba(39, 44, 64, 0.8);
    border-color: rgba(0, 255, 136, 0.2);
  }

  ${BREAKPOINTS.UHD} {
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    border-radius: 10px;
  }

  ${BREAKPOINTS.MOBILE} {
    padding: 0.625rem 1rem;
    margin-bottom: 1.25rem;
    width: 100%;
    justify-content: center;
  }

  ${BREAKPOINTS.reducedMotion} {
    transition: none;
  }
`;
const DashboardDiv = styled.div` 
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 84px 1fr;
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas: 
      "header"
      "sidebar"
      "content";
    height: auto;
    min-height: 100vh;
  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) and (max-width: ${BREAKPOINTS.TABLET}) {
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) and (max-width: ${BREAKPOINTS.LAPTOP}) {
    grid-template-columns: 220px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) and (max-width: ${BREAKPOINTS.DESKTOP}) {
    grid-template-columns: 250px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) and (max-width: ${BREAKPOINTS.QHD}) {
    grid-template-columns: 300px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    grid-template-columns: 400px 1fr;
    grid-template-rows: auto 1fr;
  }
`;

const HeaderWrapper = styled.div`
  grid-column: 1 / -1;
  grid-row: 1 / 2;
  position: sticky;
  top: 0;
  z-index: 20;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-area: header;
    position: static;
  }
`;

const Sidebar = styled.div`
  grid-column: 1 / 2;
  grid-row: 2 / -1;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-area: sidebar;
    grid-column: 1;
    grid-row: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    max-height: 300px;
  }
`;

const Content = styled.div`
  grid-column: 2 / -1;
  grid-row: 2 / -1;
  overflow-y: auto;
  min-height: 0;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ace7ff;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #8fd3fe;
  }

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-area: content;
    grid-column: 1;
    grid-row: auto;
    padding: 0.75rem;
  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) and (max-width: ${BREAKPOINTS.TABLET}) {
    padding: 0.9rem;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) and (max-width: ${BREAKPOINTS.LAPTOP}) {
    padding: 1rem;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) and (max-width: ${BREAKPOINTS.DESKTOP}) {
    padding: 1.1rem;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) and (max-width: ${BREAKPOINTS.QHD}) {
    padding: 1.25rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 1.5rem;
    
    &::-webkit-scrollbar {
      width: 14px;
    }
  }
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  color: rgba(255, 255, 255, 0.85);

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    height: 150px;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    height: 300px;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffe6e6;
  color: #d32f2f;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem;
  border-left: 4px solid #d32f2f;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    padding: 0.75rem;
    margin: 0.75rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 1.5rem;
    margin: 1.5rem;
  }
`;

const SuccessMessage = styled.div`
  background-color: #e6ffe6;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem;
  border-left: 4px solid #2e7d32;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    padding: 0.75rem;
    margin: 0.75rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 1.5rem;
    margin: 1.5rem;
  }
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    width: 60px;
    height: 60px;
    border-width: 5px;
  }
`;

const TitleBlock = styled.div`
  margin: 0 0 1.5rem;
  max-width: 52rem;
`;

const Title = styled.h1`
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  color: #ffffff;
  margin: 0 0 0.4rem;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.45;
`;