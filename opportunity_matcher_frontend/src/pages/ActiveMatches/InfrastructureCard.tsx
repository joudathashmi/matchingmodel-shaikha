import styled, { css } from 'styled-components';
import EnergyCard from './RenewableEnergyCard';
import StrategicAssessmentCard from './StrategicAssessmentCard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import starIcon from '../../assets/icons/star.svg'
import profileMatchIcon from '../../assets/icons/target-02.svg'
import productMatchIcon from '../../assets/icons/energy.svg'
import valuePropositionIcon from '../../assets/icons/presentation-bar-chart-02.svg'
import aiStrategicIcon from '../../assets/icons/chat-bot.svg'
import AiInsightsCard from './Cards/AiInsightsCard';
import { useDispatch, useSelector } from 'react-redux';
import { selectActiveMatchesData, selectActiveMatchesLoading, selectActiveMatchesMeta } from '../../store/selectors/filterMatchesSelectors';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../../store';
import { getActiveMatches } from '../../store/actions/filterMatchesActions';
import { ActiveMatch } from '../../store/types/filterMatchesTypes';
import HeatmapTooltip from "../../common/HeatmapTooltip";
import BookMarkSelectIcon from '../../assets/Invest-opportunity-icons/bookmark-selected.svg'
import BookMarkUnSelectIcon from '../../assets/Invest-opportunity-icons/bookmark-03.svg'
import { toastSuccess } from "../../common/toast";
import { normalizePursuitStatus } from "../../common/pursuitStages";



import { createBookmarkRequest } from '../../store/actions/createBookmarkActions';
import { selectBookmarkLoading, selectBookmarkSuccess } from '../../store/selectors/createBookmarkSelectors';
import { deleteBookmarkRequest } from '../../store/actions/deleteBookmarkActions';
import {
  selectDeleteBookmarkLoading,
  selectDeleteBookmarkSuccess
} from '../../store/selectors/deleteBookmarkSelectors';

import { selectCompanyDetails, selectCompanyDetailsError, selectCompanyDetailsLoading } from "../../store/selectors/getCompanyDetailsSelectors";
import { clearCompanyDetails, getCompanyDetailsRequest } from "../../store/actions/getCompanyDetailsActions";
import CompanyDetailPopup from "../CompanyProfile/Cards/CompanyDetailPopup";

import { getOpportunityDetailsRequest } from '../../store/actions/opportunityDetailsActions';
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading, selectOpportunityDetailsError
} from '../../store/selectors/opportunityDetailsSelectors';
import OpportunitiesPopup from '../InvestmentOpportunities/Card/CardPopup';

import { createMatchAgreementRequest, resetMatchAgreementState } from '../../store/actions/CreateMatchAgreementActions';

import {
  selectMatchAgreementLoading,
  selectMatchAgreementSuccess,
  selectMatchAgreementError,
  selectMatchAgreementData
} from '../../store/selectors/CreateMatchAgreementSelectors';
import { deleteMatchAgreementRequest, deleteMatchAgreementReset } from "../../store/actions/deleteMatchAgreementActions";
import { selectDeleteMatchAgreementLoading, selectDeleteMatchAgreementSuccess, selectDeleteMatchAgreementError } from "../../store/selectors/deleteMatchAgreementSelectors";


import html2pdf from "html2pdf.js";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EngagementPlanPopup from './Cards/EngagementPlanPopup ';
import typography from '../../common/typography';
import { EvidenceStrip, MatchSignalChips } from '../../common/AiSignalChips';
import { confidenceTone } from '../../common/aiMatchUtils';




const exportComponentAsPDF = async (element: HTMLElement, fileName: string = "match-report.pdf") => {
  
  const options: any = {
    margin: [10, 10, 10, 10],
    filename: fileName,
    image: {
      type: 'jpeg',
      quality: 0.95
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#1a1a2e', 
      logging: false,
      scrollX: 0,
      scrollY: 0,
      
      onclone: function (clonedDoc: Document, clonedElement: HTMLElement) {
        
        clonedElement.style.backgroundColor = '#1a1a2e';
        clonedElement.style.color = '#ffffff';
        clonedElement.style.padding = '20px';

        
        const cards = clonedElement.querySelectorAll('[data-match-card="true"]');
        cards.forEach((card: Element) => {
          if (card instanceof HTMLElement) {
            card.style.background = '#1a1a2e';
            card.style.border = '2px solid rgba(255, 255, 255, 0.2)';
            card.style.color = '#ffffff';
            card.style.marginBottom = '20px';
          }
        });

        
        const textElements = clonedElement.querySelectorAll('*');
        textElements.forEach((el: Element) => {
          if (el instanceof HTMLElement) {
            el.style.color = '#ffffff';
          }
        });
      }
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    await html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error('PDF generation failed:', error);
    
    await generateSimplePDF(element, fileName);
  }
};


const generateSimplePDF = async (element: HTMLElement, fileName: string) => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#1a1a2e',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(fileName);
  } catch (error) {
    console.error('Fallback PDF generation failed:', error);
    alert('PDF generation failed. Please try again.');
  }
};

const InfrastructureCard: React.FC<{ currentPage: number; setCurrentPage: (page: number) => void; limit: number }> = ({ currentPage, setCurrentPage, limit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const matches = useSelector(selectActiveMatchesData) ?? [];
  const loading = useSelector(selectActiveMatchesLoading);
  const meta = useSelector(selectActiveMatchesMeta);

  
  const bookmarkLoading = useSelector(selectBookmarkLoading);
  const bookmarkSelectSuccess = useSelector(selectBookmarkSuccess);
  const bookmarkDeleteSuccess = useSelector(selectDeleteBookmarkSuccess);

  const [expandedStates, setExpandedStates] = useState<boolean[]>([]);
  const [localBookmarks, setLocalBookmarks] = useState<Set<number>>(new Set());
  const [tagsExpandedStates, setTagsExpandedStates] = useState<boolean[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  type PopupType = 'analyze' | 'compare' | null;
  const [popupType, setPopupType] = useState<PopupType | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  useEffect(() => {
    const itemsPerMatch = 3;
    // Expand first evidence section by default for each match
    setExpandedStates(
      new Array(matches.length * itemsPerMatch).fill(false).map((_, i) => i % itemsPerMatch === 0)
    );

    setTagsExpandedStates(new Array(matches.length).fill(false));
  }, [matches]);

  useEffect(() => {
    const bookmarkedIds = matches
      .filter(match => match.isBookmarked)
      .map(match => match.opportunityId);
    setLocalBookmarks(new Set(bookmarkedIds));
  }, [matches]);

  const getExpandedStateIndex = (matchIndex: number, itemIndex: number) => {
    return matchIndex * 3 + itemIndex;
  };

  const toggleExpand = (matchIndex: number, itemIndex: number) => {
    const index = getExpandedStateIndex(matchIndex, itemIndex);
    setExpandedStates(prev =>
      prev.map((val, i) => (i === index ? !val : false))
    );
  };

  const toggleTagsExpand = (matchIndex: number) => {
    setTagsExpandedStates(prev =>
      prev.map((expanded, index) =>
        index === matchIndex ? !expanded : expanded
      )
    );
  };

  const handleBookmarkClick = (opportunity: any) => {
    
    const bookmarkData = {
      entityId: opportunity.id,
      entityType: "match"
    };

    
    const newBookmarks = new Set(localBookmarks);
    if (localBookmarks.has(opportunity.opportunityId)) {
      newBookmarks.delete(opportunity.opportunityId);
    } else {
      newBookmarks.add(opportunity.opportunityId);
    }
    setLocalBookmarks(newBookmarks);

    if (localBookmarks.has(opportunity.opportunityId)) {
      dispatch(deleteBookmarkRequest(bookmarkData));
    } else {
      dispatch(createBookmarkRequest(bookmarkData));
    }
  };

  
  const handleExportPDF = async () => {
    if (!contentRef.current) {
      console.error('No content to export');
      return;
    }

    try {
      setPdfLoading(true);
      await exportComponentAsPDF(contentRef.current, `investment-matches-page-${currentPage}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      
    } finally {
      setPdfLoading(false);
    }
  };


  const totalRecords = meta.total;
  const totalPages = meta.totalPages;
  const paginatedMatches = matches;

  const changePage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

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
    
  };

  const handleAiDecisionFilter = (aiDecision: any) => {
    // Your implementation
    // if (onOpportunityClick) {
    //   onOpportunityClick(aiDecision);
    // }
  };
  const [isSuggestPopupOpen, setIsSuggestPopupOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleSuggestEngagement = (match: any) => {
    setSelectedMatch(match);
    setIsSuggestPopupOpen(true);
  };

  const handleCloseSuggestPopup = () => {
    setIsSuggestPopupOpen(false);
    setSelectedMatch(null);
  };

  const MatchAgreementLoading = useSelector(selectMatchAgreementLoading);
  const MatchAgreementSuccess = useSelector(selectMatchAgreementSuccess);
  const MatchAgreementError = useSelector(selectMatchAgreementError);
  const MatchAgreementData = useSelector(selectMatchAgreementData);

  const DeleteMatchAgreementLoading = useSelector(selectDeleteMatchAgreementLoading);
  const DeleteMatchAgreementSuccess = useSelector(selectDeleteMatchAgreementSuccess);
  const DeleteMatchAgreementError = useSelector(selectDeleteMatchAgreementError);

  const isPositiveAgreement = (value: string | null | undefined) =>
    !!value && ["Agreed", "Engage", "PlanShared", "MoU", "Landed", "Hold"].includes(value);

  const isNegativeAgreement = (value: string | null | undefined) =>
    value === "Disagreed" || value === "Rejected";

  const [matchAgreements, setMatchAgreements] = useState<Record<number, string | null>>({});

  useEffect(() => {
    const initialAgreements: Record<number, string | null> = {};
    matches.forEach((match) => {
      initialAgreements[match.id] = match.userAgreement ?? null;
    });
    setMatchAgreements(initialAgreements);
  }, [matches]);

  
  useEffect(() => {
    if (MatchAgreementSuccess && MatchAgreementData) {
      setMatchAgreements(prev => ({
        ...prev,
        [MatchAgreementData.matchId]: MatchAgreementData.status
      }));

      
      dispatch(resetMatchAgreementState());
    }
  }, [MatchAgreementSuccess, MatchAgreementData, dispatch]);

  useEffect(() => {
    if (DeleteMatchAgreementSuccess) {
      dispatch(deleteMatchAgreementReset());
    }

    if (DeleteMatchAgreementError) {
      
      const originalAgreements: Record<number, string | null> = {};
      matches.forEach((match) => {
        originalAgreements[match.id] = match.userAgreement ?? null;
      });
      setMatchAgreements(originalAgreements);
      dispatch(deleteMatchAgreementReset());
    }
  }, [DeleteMatchAgreementSuccess, dispatch]);

  const handleCreateAgreement = (value: "Agreed" | "Disagreed", id: number) => {
    const status = value === "Agreed" ? "Engage" : "Rejected";
    setMatchAgreements((prev) => ({
      ...prev,
      [id]: status,
    }));

    dispatch(
      createMatchAgreementRequest({
        matchId: id,
        status,
      })
    );

    if (value === "Agreed") {
      toastSuccess("Added to Pursuit - open Pursuit Pipeline to track it.");
    } else {
      toastSuccess("Marked as not a fit.");
    }
  };

  const pursuitLabel = (status: string | null | undefined) => {
    const n = normalizePursuitStatus(status);
    if (!n) return null;
    if (n === "PlanShared") return "Plan shared";
    if (n === "Rejected") return "Not a fit";
    return n;
  };


  const handleDeleteMatch = (matchId: number) => {
    setMatchAgreements(prev => ({
      ...prev,
      [matchId]: null
    }));
    dispatch(deleteMatchAgreementRequest({ matchId }));
  };
  const maxCollapsedTags = 2;
  return (
    <PrintStyles>
      {/* PDF Export Button */}
      {/* <ExportButton onClick={handleExportPDF} disabled={pdfLoading}>
        <span>
          📄 {pdfLoading ? 'Generating PDF...' : 'Export Current Page as PDF'}
        </span>
      </ExportButton> */}
      <div ref={contentRef}>
        {paginatedMatches.map((match: ActiveMatch, matchIndex: number) => {
          const items = [
            { icon: profileMatchIcon, title: 'Profile and Product Match', content: match.aiExplanation[0] || '' },
            { icon: productMatchIcon, title: 'Strategic Capability Alignment ', content: match.aiExplanation[1] || '' },
            { icon: valuePropositionIcon, title: 'Value Proposition', content: match.aiExplanation[2] || '' }
          ];
          const areTagsExpanded = tagsExpandedStates[matchIndex] || false;

          const currentAgreement = matchAgreements.hasOwnProperty(match.id)
            ? matchAgreements[match.id]
            : match.userAgreement ?? null;

          const shouldPageBreak = matchIndex > 0 && matchIndex % 2 === 0;
          return (
            <div
              key={matchIndex}
              style={{
                pageBreakBefore: matchIndex === 0 ? "auto" : "always",
                breakBefore: matchIndex === 0 ? "auto" : "page",
              }}
            >
              <MatchCard key={matchIndex} data-match-card="true">
                <MatchHeader>
                  <MatchInfo>
                    <IdentityBlock>
                      <MatchTitle onClick={() => handleCompanyClick(match.companyId)}>
                        <span className="gradient-text">{match.companyName}</span>
                      </MatchTitle>
                      <MatchSubTitle
                        onClick={() => handleButtonClick(match.opportunityId, null)}
                      >
                        {match.opportunityName}
                      </MatchSubTitle>
                      <MatchMeta>{match.opportunitySector}</MatchMeta>
                    </IdentityBlock>

                    <MatchSignalChips
                      decisionTier={match.decisionTier}
                      confidenceScore={match.confidenceScore}
                      confidenceLabel={match.confidenceLabel}
                      evidenceFlag={match.evidenceFlag}
                      valueChainPosition={match.valueChainPosition}
                      modelVersion={match.modelVersion}
                      finalScore={match.finalScore}
                    />

                    <MatchTags expanded={areTagsExpanded}>
                      <Tag>{match.relatedTargetSector}</Tag>
                      {match.relatedSourceSectors
                        .slice(
                          0,
                          areTagsExpanded
                            ? match.relatedSourceSectors.length
                            : maxCollapsedTags
                        )
                        .map((sector, idx) => (
                          <Tag key={idx}>{sector}</Tag>
                        ))}
                      {match.relatedSourceSectors.length > maxCollapsedTags && (
                        <SeeMoreButton onClick={() => toggleTagsExpand(matchIndex)}>
                          {areTagsExpanded
                            ? "See less"
                            : `+${match.relatedSourceSectors.length - maxCollapsedTags} more`}
                        </SeeMoreButton>
                      )}
                    </MatchTags>

                    <EvidenceStrip strengths={match.strengths} risks={match.risks} />

                    {Array.isArray(match.matchReason) &&
                      (match.matchReason as unknown as string[]).length > 0 && (
                        <ReasonSection>
                          <ReasonTitle>Match reason</ReasonTitle>
                          <ReasonList>
                            {(match.matchReason as unknown as string[]).map(
                              (reason, index) => (
                                <ReasonItem key={index}>{reason}</ReasonItem>
                              )
                            )}
                          </ReasonList>
                        </ReasonSection>
                      )}
                  </MatchInfo>

                  <SidePanel>
                    <MatchScoreCard>
                      <ScoreBlock>
                        <ScoreRow>
                          <ScoreTitle>Overall match</ScoreTitle>
                          <GlowingScore
                            style={{
                              color:
                                confidenceTone(
                                  match.confidenceLabel,
                                  match.confidenceScore
                                ) === "low"
                                  ? "#ffb4a8"
                                  : confidenceTone(
                                        match.confidenceLabel,
                                        match.confidenceScore
                                      ) === "medium"
                                    ? "#f0d78a"
                                    : "#9ef0c8",
                            }}
                          >
                            {match.finalScore != null
                              ? Math.round(match.finalScore * 100)
                              : 0}
                            %
                          </GlowingScore>
                        </ScoreRow>
                        <ScoreBar>
                          <ScoreBarFill
                            style={{
                              width: `${
                                match.finalScore != null
                                  ? Math.round(match.finalScore * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </ScoreBar>
                      </ScoreBlock>

                      {isPositiveAgreement(currentAgreement) ? (
                        <PursuitStatusBox>
                          <PursuitStatusText>
                            In Pursuit · {pursuitLabel(currentAgreement)}
                          </PursuitStatusText>
                          <PursuitStatusActions>
                            <Btn
                              variant="primary"
                              style={{ flex: 1 }}
                              onClick={() => navigate("/pursuit")}
                            >
                              Open Pursuit
                            </Btn>
                            <Btn
                              variant="secondary"
                              style={{ flex: 1 }}
                              onClick={() => handleDeleteMatch(match.id)}
                            >
                              Undo
                            </Btn>
                          </PursuitStatusActions>
                        </PursuitStatusBox>
                      ) : isNegativeAgreement(currentAgreement) ? (
                        <PursuitStatusBox $tone="reject">
                          <PursuitStatusText>Marked not a fit</PursuitStatusText>
                          <Btn
                            variant="secondary"
                            style={{ width: "100%" }}
                            onClick={() => handleDeleteMatch(match.id)}
                          >
                            Undo
                          </Btn>
                        </PursuitStatusBox>
                      ) : (
                        <>
                          <Btn
                            variant="primary"
                            style={{ width: "100%" }}
                            onClick={() =>
                              handleCreateAgreement("Agreed", match.id)
                            }
                          >
                            Start pursuit
                          </Btn>
                          <Btn
                            variant="secondary"
                            style={{ width: "100%" }}
                            onClick={() =>
                              handleCreateAgreement("Disagreed", match.id)
                            }
                          >
                            Not a fit
                          </Btn>
                        </>
                      )}

                      <Btn
                        variant="secondary"
                        style={{ width: "100%" }}
                        onClick={() => navigate(`/matches/${match.id}`)}
                      >
                        Open Match Case
                      </Btn>
                      <Btn
                        variant="secondary"
                        style={{ width: "100%" }}
                        onClick={() =>
                          handleSuggestEngagement(match.suggestedPlan)
                        }
                      >
                        Suggest engagement plan
                      </Btn>

                      <MatchScoreButtons>
                        <Btn
                          variant="secondary"
                          style={{ flex: "1 1 0" }}
                          onClick={() =>
                            handleButtonClick(match.opportunityId, "compare")
                          }
                        >
                          Similar Matches
                        </Btn>
                        <Btn
                          variant="icon"
                          style={{ flex: "0 0 42px" }}
                          onClick={() => handleBookmarkClick(match)}
                          disabled={bookmarkLoading}
                          aria-label={
                            bookmarkLoading
                              ? "Adding bookmark..."
                              : "Add to bookmarks"
                          }
                        >
                          <Icon
                            src={
                              localBookmarks.has(match.opportunityId)
                                ? BookMarkSelectIcon
                                : BookMarkUnSelectIcon
                            }
                          />
                        </Btn>
                      </MatchScoreButtons>
                    </MatchScoreCard>
                  </SidePanel>
                </MatchHeader>
                {(match.aiDecision === "Yes" ||
                  (match.decisionTier &&
                    /excellent|strong|good/i.test(match.decisionTier))) ? (
                  <CollapsibleInsights>
                  {items.map((item, itemIndex) => {
                    const expandedIndex = getExpandedStateIndex(matchIndex, itemIndex);
                    const isExpanded = !!expandedStates[expandedIndex];

                    return (
                      <CollapsibleItem
                        key={itemIndex}
                      >
                        <CollapsibleHeader onClick={() => toggleExpand(matchIndex, itemIndex)}>
                          <CollapseLeft>
                            <CollapseIcon src={item.icon} />
                            <CollapseTitle>{item.title}</CollapseTitle>
                          </CollapseLeft>
                          <CollapseRight>
                            <CollapseArrow expanded={!!isExpanded}>▼</CollapseArrow>
                          </CollapseRight>
                        </CollapsibleHeader>

                        <CollapsibleContent expanded={!!isExpanded}>
                          <CollapseText>{item.content}</CollapseText>
                        </CollapsibleContent>
                      </CollapsibleItem>
                    );
                  })}
                </CollapsibleInsights>
                ) : null}
              </MatchCard>
              {
                isSuggestPopupOpen && (
                  <EngagementPlanPopup
                    isOpen={isSuggestPopupOpen}  
                    onClose={handleCloseSuggestPopup}  
                    match={selectedMatch}
                  />
                )
              }

            </div>
          );
        })}
      </div>
      {
        openPopup && (
          <CompanyDetailPopup
            companyId={selectedCompanyId}
            companyDetails={companyDetails}
            loading={companyDetailsLoading}
            error={companyDetailsError}
            onClose={() => setOpenPopup(false)}
          />
        )
      }


      {
        isPopupOpen && (
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
        )
      }
      {
        totalRecords > 0 && (
          <TablePagination className="no-print">
            <PaginationInfo>
              Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalRecords)} of {totalRecords} records
            </PaginationInfo>

            <PaginationControls>
              <PaginationButton onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1 || loading}>← Previous</PaginationButton>

              <PageNumbers>
                {generatePageNumbers().map((page, index) =>
                  page === '...' ? <span key={`ellipsis-${index}`} style={{ padding: '0.5rem' }}>...</span> :
                    <PaginationButton key={page} onClick={() => changePage(page as number)} className={currentPage === page ? 'active' : ''} disabled={currentPage === page || loading}>
                      {page}
                    </PaginationButton>
                )}
              </PageNumbers>

              <PaginationButton onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next →</PaginationButton>
            </PaginationControls>
          </TablePagination>
        )
      }
    </PrintStyles >
  );
};

export default InfrastructureCard;


const MatchCard = styled.div`
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1.5rem 1.5rem 1.25rem;
  margin-bottom: 1.25rem;
  transition: border-color 0.2s ease, background 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #00ff88, #00b4d8);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.045);
  }
`;
const ExportButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontSize};
  margin: 0 0 1rem auto;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  min-width: 220px;
  justify-content: center;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    
    &::after {
      content: 'Generating PDF...';
    }
    
    span {
      display: none;
    }
  }
  
  span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;



const MatchHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
  gap: 1.5rem;
  align-items: start;
  margin-bottom: 1.15rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 1.15rem;
  }
`;

const MatchInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 240px;
  width: 100%;
`;

const IdentityBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const MatchTitle = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  cursor: pointer;
  display: block;
  line-height: 1.3;
  letter-spacing: -0.01em;

  span.gradient-text {
    background: linear-gradient(45deg, #00ff88, #00b4d8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  span.muted-text {
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
  }
`;

const MatchSubTitle = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: ${typography.datasHeading.fontSize};
  font-weight: 600;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  cursor: pointer;
  display: block;
  line-height: 1.35;

  &:hover {
    color: #ffffff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

const MatchMeta = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  margin: 0.1rem 0 0;
  line-height: 1.3;
`;

interface MatchTagsProps {
  expanded?: boolean;
}

const MatchTags = styled.div<MatchTagsProps>`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin: 0;
`;

const ReasonSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.15rem;
`;

const ReasonTitle = styled.h3`
  margin: 0;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.01em;
`;

const ReasonList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const ReasonItem = styled.li`
  position: relative;
  margin: 0;
  padding: 0 0 0 0.85rem;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.55;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(0, 200, 140, 0.7);
  }
`;

const SeeMoreButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #9ef0c8;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: ${typography.kpiSubTitle.fontSize};
  font-weight: ${typography.kpiSubTitle.fontWeight};
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(0, 255, 136, 0.08);
    border-color: rgba(0, 200, 140, 0.35);
  }
`;

const Tag = styled.button`
  background: rgba(255, 255, 255, 0.05);
  padding: 0.28rem 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  font-size: ${typography.kpiSubTitle.fontSize};
  font-weight: ${typography.kpiSubTitle.fontWeight};
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: default;
  font-family: inherit;
`;

const ScoreLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;
const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
interface BtnProps {
  variant?: 'primary' | 'secondary' | 'icon';
  starred?: boolean;
}

const Btn = styled.button<BtnProps>`
  padding: 0.55rem 1.5rem;
  border-radius: 8px;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
  }

  ${({ variant }) =>
    variant === 'primary' &&
    css`
      background: linear-gradient(45deg, #00ff88, #00b4d8);
      color: #0a0a0a;
      border: none;
    `}

  ${({ variant }) =>
    variant === 'secondary' &&
    css`
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `}

  ${({ variant, starred }) =>
    variant === 'icon' &&
    css`
      padding: 0.5rem;
      min-width: 40px;
      font-size: ${typography.button.fontSize};
      font-weight: ${typography.button.fontSize};
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: ${starred
        ? 'rgba(255, 193, 7, 0.2)'
        : 'rgba(255, 255, 255, 0.1)'};
      color: ${starred ? '#ffc107' : '#ffc107'};
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
        border-color: rgba(255, 193, 7, 0.3);
       
      }
    `}
`;
const Icon = styled.img`
  height:20px;
  width:20px;
`;
const ActionSecondary = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;
const CollapsibleInsights = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding-top: 0.15rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;
const CollapsibleItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(0, 255, 136, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }
`;
const CollapsibleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 255, 136, 0.04);
  }
`;
const CollapseLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
`;
const CollapseIcon = styled.img`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.85;
`;

const CollapseTitle = styled.span`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgba(255, 255, 255, 0.9);
`;
const CollapseRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

interface CollapseArrowProps {
  expanded?: boolean;
}

const CollapseArrow = styled.span<CollapseArrowProps>`
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.7rem;
  transition: transform 0.25s ease;
  ${({ expanded }) =>
    expanded &&
    css`
      transform: rotate(180deg);
    `}
`;
interface CollapsibleContentProps {
  expanded?: boolean;
}

const CollapsibleContent = styled.div<CollapsibleContentProps>`
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 1rem;

  ${({ expanded }) =>
    expanded &&
    css`
      max-height: 640px;
      padding: 0 1rem 1rem;
    `}
`;

const CollapseText = styled.div`
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.6;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 72ch;
`;

const MatchScoreCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
`;

const ScoreBlock = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.4rem;
`;

const PursuitStatusBox = styled.div<{ $tone?: "reject" }>`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid
    ${(p) =>
      p.$tone === "reject"
        ? "rgba(255, 120, 100, 0.35)"
        : "rgba(0, 200, 140, 0.35)"};
  background: ${(p) =>
    p.$tone === "reject"
      ? "rgba(255, 120, 100, 0.08)"
      : "rgba(0, 255, 136, 0.08)"};
`;

const PursuitStatusText = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
`;

const PursuitStatusActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const MatchScoreButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  width: 100%;
  align-items: stretch;

  /* 4K Ultra HD (3840px+) */
  @media (min-width: 3840px) {
    gap: 1.5rem;
    
    & > button {
      padding: 1rem 2rem;
      font-size: 1.25rem;
      border-radius: 12px;
      min-height: 60px;
    }
    
    & > button:last-child {
      min-width: 60px;
      min-height: 60px;
    }
    
    & > button svg,
    & > button img {
      transform: scale(1.3);
    }
  }

  /* 2K QHD (2560px - 3839px) */
  @media (min-width: 2560px) and (max-width: 3839px) {
    gap: 1.25rem;
    
    & > button {
      padding: 0.875rem 1.75rem;
      font-size: 1.125rem;
      border-radius: 10px;
      min-height: 52px;
    }
    
    & > button:last-child {
      min-width: 52px;
      min-height: 52px;
    }
    
    & > button svg,
    & > button img {
      transform: scale(1.2);
    }
  }

  /* Full HD (1920px - 2559px) */
  @media (min-width: 1920px) and (max-width: 2559px) {
    gap: 1rem;
    
    & > button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      min-height: 48px;
    }
    
    & > button:last-child {
      min-width: 48px;
      min-height: 48px;
    }
    
    & > button svg,
    & > button img {
      transform: scale(1.1);
    }
  }

  /* Desktop (1024px - 1919px) - Default styles */
  @media (min-width: 1024px) and (max-width: 1919px) {
    gap: 0.75rem;
    
    & > button {
      padding: 0.625rem 1.25rem;
      min-height: 42px;
    }
    
    & > button:last-child {
      min-width: 42px;
      min-height: 42px;
    }
  }

  /* Tablet (768px - 1023px) */
  @media (max-width: 1023px) and (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 0.625rem;
    
    & > button {
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      min-height: 40px;
    }
    
    & > button:last-child {
      grid-column: 1 / -1;
      justify-self: center;
      width: 42px;
      min-height: 42px;
      margin-top: 0.25rem;
    }
  }

  /* Mobile (Below 768px) */
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 0.5rem;
    
    & > button {
      width: 100%;
      padding: 0.7rem 1rem;
      font-size: 0.9rem;
      min-height: 44px;
    }
    
    & > button:last-child {
      grid-column: 1;
      width: 44px;
      min-height: 44px;
      justify-self: center;
      margin-top: 0.25rem;
      order: 3; /* Ensure bookmark stays at bottom */
    }
  }

  /* Small Mobile Optimization (Below 480px) */
  @media (max-width: 480px) {
    gap: 0.375rem;
    
    & > button {
      padding: 0.6rem 0.875rem;
      font-size: 0.85rem;
      min-height: 42px;
    }
    
    & > button:last-child {
      width: 42px;
      min-height: 42px;
    }
  }

  /* Ensure consistent button styling */
  & > button {
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    transition: all 0.3s ease;
    
    /* Smooth scaling for icons */
    & svg,
    & img {
      transition: transform 0.3s ease;
    }
  }
`;

const GlowingScore = styled.div`
  font-size: ${typography.overAllPercentage.fontSize};
  font-weight: ${typography.overAllPercentage.fontWeight};
  color: #9ef0c8;
  letter-spacing: -0.02em;
`;

const ScoreBar = styled.div`
  height: 8px;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
`;

const ScoreBarFill = styled.div`
  height: 100%;
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  border-radius: 999px;
  transition: width 0.25s ease;
`;

const ScoreTitle = styled.div`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: #ccc;
  
`;
const ScoreLine = styled.div`
  width: 97%;
  height: 9px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15); 
  overflow: hidden;
  margin: 0.5rem 0;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: 96%; 
    background: linear-gradient(45deg, #00ff88, #00b4d8);
  }
`;

const ScoreRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const ScoreSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.25rem;
  margin-top: 0.5rem;
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
  font-size: ${typography.paginateRecords.fontSize};
  font-weight: ${typography.paginateRecords.fontWeight};
  color: rgba(255, 255, 255, 0.7);
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
const PrintStyles = styled.div`
  
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      background: #1a1a2e !important;
      padding: 20px !important;
    }
    
    .no-print {
      display: none !important;
    }
    
    
    ${MatchCard} {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      page-break-after: auto !important;
      margin-bottom: 20px !important;
      background: #1a1a2e !important;
      border: 2px solid rgba(255, 255, 255, 0.15) !important;
      padding: 20px !important;
      position: relative;
      overflow: visible !important;
      
      &::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 4px !important;
        background: linear-gradient(90deg, #00ff88, #00b4d8) !important;
      }
    }
    
    
    ${MatchTitle}, ${MatchSubTitle}, ${CollapseTitle} {
      color: #ffffff !important;
    }
    
    .gradient-text {
      background: none !important;
      color: #00ff88 !important;
      -webkit-text-fill-color: #00ff88 !important;
    }
    
    
    ${Btn} {
      display: none !important; 
    }
    
    
    ${ScoreBar}::before {
      background: linear-gradient(45deg, #00ff88, #00b4d8) !important;
    }
    
    ${GlowingScore} {
      color: #00ff88 !important;
      background: none !important;
    }
    
    
    ${MatchHeader} {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
    }
    
    ${MatchScoreCard} {
      background: #2C3E50 !important;
      border: 2px solid rgba(255, 255, 255, 0.15) !important;
      min-width: 250px !important;
    }
    
    
    ${CollapsibleInsights} {
      margin-top: 15px !important;
    }
  }

  
  @media screen {
    background: transparent;
  }
`;