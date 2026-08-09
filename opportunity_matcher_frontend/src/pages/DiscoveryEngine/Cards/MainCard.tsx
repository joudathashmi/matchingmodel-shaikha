import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  selectDiscoveryOpportunitiesData,
  selectDiscoveryOpportunitiesLoading,
  selectDiscoveryOpportunitiesMeta,
} from "../../../store/selectors/discoverOpportunitiesSelectors";
import { getDiscoveryOpportunities } from "../../../store/actions/discoverOpportunitiesActions";

import {
  OpportunityCard,
  CardHeader,
  OpportunityTitle,
  OpportunityMeta,
  OpportunityTags,
  Button,
  ButtonSeeMore,
  MatchIndicator,
  MatchScore,
  MatchLabel,
  OpportunityDetails,
  DetailItem,
  DetailLabel,
  DetailValue,
} from "./DiscoveryCardCommonStyle";

import ProgressBar from "./ProgressBar";
import AIInsightsCard from "./AiInsights";
import AiIcon from "../../../assets/icons/chat-bot.svg";
import { AppDispatch } from "../../../store";
import { selectDiscoverSectorCount } from "../../../store/selectors/discoverSectorCountSelectors";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { EvidenceStrip, MatchSignalChips } from "../../../common/AiSignalChips";

// Import bookmark functionality
import { createBookmarkRequest } from '../../../store/actions/createBookmarkActions';
import { selectBookmarkLoading, selectBookmarkSuccess } from '../../../store/selectors/createBookmarkSelectors';
import { deleteBookmarkRequest } from '../../../store/actions/deleteBookmarkActions';
import {
  selectDeleteBookmarkLoading,
  selectDeleteBookmarkSuccess
} from '../../../store/selectors/deleteBookmarkSelectors';

import { selectCompanyDetails, selectCompanyDetailsError, selectCompanyDetailsLoading } from "../../../store/selectors/getCompanyDetailsSelectors";
import { clearCompanyDetails, getCompanyDetailsRequest } from "../../../store/actions/getCompanyDetailsActions";
import CompanyDetailPopup from "../../CompanyProfile/Cards/CompanyDetailPopup";
// Import the new opportunity details actions and selectors
import { getOpportunityDetailsRequest } from '../../../store/actions/opportunityDetailsActions';
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading, selectOpportunityDetailsError
} from '../../../store/selectors/opportunityDetailsSelectors';
import OpportunitiesPopup from '../../InvestmentOpportunities/Card/CardPopup';
import typography from "../../../common/typography";
import { LoadingSpinnerWithMessage } from "../../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage";
import { ErrorMessage } from "../../../common/LoaderSpinner&ErrorLayout/ErrorMessage";
interface MainCardProps {
  filters: any;
}

const ExploreHeader = styled.div`
  margin: 0 0 1.25rem;
`;

const ExploreTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: -0.02em;
`;

const ExploreSub = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.5);
`;

const RankBadge = styled.span`
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 0.35rem;
`;

const MainCard: React.FC<MainCardProps> = ({ filters }) => {
  const dispatch = useDispatch<AppDispatch>();
  const opportunities = useSelector(selectDiscoveryOpportunitiesData);
  const loading = useSelector(selectDiscoveryOpportunitiesLoading);
  const meta = useSelector(selectDiscoveryOpportunitiesMeta);

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const limit = 5;
  const [expandedOpportunities, setExpandedOpportunities] = useState<Set<number>>(new Set());


  const toggleExpanded = (opportunityId: number) => {
    const newExpanded = new Set(expandedOpportunities);
    if (newExpanded.has(opportunityId)) {
      newExpanded.delete(opportunityId);
    } else {
      newExpanded.add(opportunityId);
    }
    setExpandedOpportunities(newExpanded);
  };


  const [localBookmarks, setLocalBookmarks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (opportunities?.length) {
      const bookmarkedIds = opportunities
        .filter((opp) => opp.isBookmarked)
        .map((opp) => opp.id);
      setLocalBookmarks(new Set(bookmarkedIds));
    }
  }, [opportunities]);


  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    const totalPages = meta.totalPages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);
      if (startPage > 2) pages.push('...');
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };


  useEffect(() => {
    if (!filters) return;

    dispatch(
      getDiscoveryOpportunities({
        ...filters,
        page: currentPage,
        limit,
      })
    );
  }, [dispatch, filters, currentPage, limit]);

  useEffect(() => {
    if (!loading) setIsLoading(false);
  }, [loading]);


  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const changePage = (page: number) => {
    if (page >= 1 && page <= meta.totalPages && page !== currentPage) {
      setCurrentPage(page);
      dispatch(getDiscoveryOpportunities({ ...filters, page, limit }));
    }
  };

  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, meta.total || 0);



  const handleBookmarkClick = (opportunity: any) => {

    const bookmarkData = {
      entityId: opportunity.id,
      entityType: "opportunity"
    };


    const newBookmarks = new Set(localBookmarks);
    if (localBookmarks.has(opportunity.id)) {
      newBookmarks.delete(opportunity.id);
    } else {
      newBookmarks.add(opportunity.id);
    }
    setLocalBookmarks(newBookmarks);


    if (localBookmarks.has(opportunity.id)) {
      dispatch(deleteBookmarkRequest(bookmarkData));
    } else {
      dispatch(createBookmarkRequest(bookmarkData));
    }
  };

  const isOpportunityBookmarked = (opportunityId: number) => {
    return localBookmarks.has(opportunityId);
  };

  type PopupType = 'analyze' | 'compare' | null;
  const [popupType, setPopupType] = useState<PopupType | null>(null);
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  // if (loading) return <div>Loading active matches...</div>;
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

  };

  const handleAiDecisionFilter = (aiDecision: any) => {

    // if (onOpportunityClick) {
    //   onOpportunityClick(aiDecision);
    // } 
  };
  if (loading) {
    return <LoadingSpinnerWithMessage message="Loading Discovery Engine..." translateX="100px" />
  }

  if (!opportunities || opportunities.length === 0) {
    return <ErrorMessage error={"No opportunities available."} translateX="100px" />;
  }

  // if (loading || isLoading) return <p>Loading opportunities...</p>;
  // if (!opportunities || opportunities.length === 0) return <p>No opportunities available.</p>;

  return (
    <>
      <ExploreHeader>
        <ExploreTitle>Discover opportunities</ExploreTitle>
        <ExploreSub>
          Research whitespace and ranked company-opportunity candidates for investment promotion.
        </ExploreSub>
      </ExploreHeader>
      {opportunities.map((opportunity, rankIndex) => {
        const matchScorePercent = Math.round(opportunity.avgFinalScore * 100);
        const sectorSimilarityPercent = Math.round(opportunity.avgSectorSimilarity * 100);
        const finalScore = Math.round(opportunity.maxFinalScore * 100);


        const isExpanded = expandedOpportunities.has(opportunity.id);


        const sourceSectorsToShow = isExpanded
          ? opportunity.relatedSourceSectors
          : opportunity.relatedSourceSectors.slice(0, 2);
        const top = opportunity.topCompany;
        return (
          <OpportunityCard key={opportunity.id} matchLevel="high">
            <CardHeader>
              <div>
                <RankBadge>#{(currentPage - 1) * limit + rankIndex + 1}</RankBadge>
                <OpportunityTitle>
                  <span onClick={() => handleButtonClick(opportunity.id, null)}>{opportunity.opportunityName} -{" "}</span>
                  {top && (
                    <span className="gradient-text" onClick={() => handleCompanyClick(top.id)}>{top.name}</span>
                  )}
                </OpportunityTitle>
                <OpportunityMeta>
                  {opportunity.opportunitySector}
                </OpportunityMeta>
                <MatchSignalChips
                  decisionTier={top?.decisionTier}
                  confidenceScore={top?.confidenceScore}
                  confidenceLabel={top?.confidenceLabel}
                  valueChainPosition={top?.valueChainPosition}
                  modelVersion={top?.modelVersion}
                  finalScore={top?.score}
                />
                <OpportunityTags>

                  <Button>{opportunity.relatedTargetSector}</Button>


                  {sourceSectorsToShow.map((sector, idx) => (
                    <Button key={idx}>{sector}</Button>
                  ))}


                  {opportunity.relatedSourceSectors.length > 2 && (
                    <ButtonSeeMore
                      onClick={() => toggleExpanded(opportunity.id)}
                      style={{ background: 'transparent' }}
                    >
                      {isExpanded ? 'See less' : `+${opportunity.relatedSourceSectors.length - 2} more`}
                    </ButtonSeeMore>
                  )}
                </OpportunityTags>
              </div>
              <MatchIndicator>
                <MatchScore>{finalScore}%</MatchScore>
                <MatchLabel>Match Score</MatchLabel>
              </MatchIndicator>
            </CardHeader>

            <EvidenceStrip strengths={top?.strengths} risks={top?.risks} maxLen={180} />

            <OpportunityDetails>
              <DetailItem>
                <DetailLabel>Investment Range</DetailLabel>
                <DetailValue data-tooltip-id="investmentRange-tip" data-tooltip-content={opportunity.investmentRange ? opportunity.investmentRange : "N/A"}>
                  {opportunity.investmentRange ? opportunity.investmentRange : "N/A"}
                </DetailValue>
                <Tooltip id="investmentRange-tip" place="top" float />

              </DetailItem>
              <DetailItem>
                <DetailLabel>Sector Similarity</DetailLabel>
                <DetailValue>{sectorSimilarityPercent}%</DetailValue>
              </DetailItem>
            </OpportunityDetails>

            <BottomSection>
              <ProgressBar
                data={[
                  { label: "Profile", score: Math.round(opportunity.maxProfileSimilarity * 100) },
                  { label: "Product", score: Math.round(opportunity.maxProductSimilarity * 100) },
                  { label: "AI Score", score: Math.round(opportunity.maxAiScore * 100) },
                ]}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <AIInsightsCard
                  opportunity={{
                    ...opportunity,
                    isBookmarked: isOpportunityBookmarked(opportunity.id)
                  }}
                  icon={AiIcon}
                  title="AI Strategic Insight"
                  text={top?.ai_insight || ""}
                  onBookmarkClick={handleBookmarkClick}
                  buttonClick={handleButtonClick}
                />
              </div>
            </BottomSection>
          </OpportunityCard>
        );
      })}

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

      {meta.total > 0 && (
        <TablePagination>
          <PaginationInfo>
            Showing {startIndex}-{endIndex} of {meta.total} records
          </PaginationInfo>

          <PaginationControls>
            <PaginationButton
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              ← Previous
            </PaginationButton>

            <PageNumbers>
              {generatePageNumbers().map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} style={{ padding: '0.5rem' }}>...</span>
                ) : (
                  <PaginationButton
                    key={page}
                    onClick={() => changePage(page as number)}
                    disabled={currentPage === page || loading}
                    className={currentPage === page ? 'active' : ''}
                  >
                    {page}
                  </PaginationButton>
                )
              )}
            </PageNumbers>

            <PaginationButton
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === meta.totalPages || loading}
            >
              Next →
            </PaginationButton>
          </PaginationControls>
        </TablePagination>
      )}
    </>
  );
};

export default MainCard;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  gap: 0.5rem;
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: 0.6rem 1rem;
  border-radius: 6px;
  border: none;
  background: ${({ active }) => (active ? "#0070f3" : "#eee")};
  color: ${({ active }) => (active ? "#fff" : "#333")};
  cursor: pointer;
  &:hover {
    background: ${({ active }) => (active ? "#005bb5" : "#ddd")};
  }
`;

const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TablePagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 1200px) {
    flex-direction: column;
    text-align: center;
  }
`;

const PaginationInfo = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: ${typography.paginateRecords.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const PaginationButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  font-size: ${typography.paginationButtons.fontSize};
  font-weight: ${typography.paginationButtons.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 44px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba(0, 255, 136, 0.1);
    border-color: #00ff88;
    color: #00ff88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.active {
    background: rgba(0, 255, 136, 0.2);
    border-color: #00ff88;
    color: #00ff88;
  }
`;

const PageNumbers = styled.div`
  display: flex;
  gap: 0.25rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;