import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import styled, { css } from "styled-components";
import OpportunityPopup from '../InvestmentOpportunities/Card/CardPopup'
import { Link, useNavigate } from "react-router-dom";
// import Tooltip from "../../common/Tooltip";
import { useDispatch, useSelector } from "react-redux";
import { getSectorCountsRequest } from "../../store/actions/sectorCountsActions";
import { selectSectorCounts, selectSectorCountsLoading } from "../../store/selectors/sectorCountsSelectors";
import { getTopOpportunities } from "../../store/actions/topOpportunitiesActions";
import { selectTopOpportunitiesData, selectTopOpportunitiesLoading, selectTopOpportunitiesError, selectTopOpportunitiesMeta } from "../../store/selectors/topOpportunitiesSelectors";

import { selectCompanyDetails, selectCompanyDetailsError, selectCompanyDetailsLoading } from "../../store/selectors/getCompanyDetailsSelectors";
import { clearCompanyDetails, getCompanyDetailsRequest } from "../../store/actions/getCompanyDetailsActions";
import CompanyDetailPopup from "../CompanyProfile/Cards/CompanyDetailPopup";
import { toastError } from "../../common/toast";
import { AppDispatch } from "../../store";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
// Import the new opportunity details actions and selectors
import { getOpportunityDetailsRequest } from '../../store/actions/opportunityDetailsActions';
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading, selectOpportunityDetailsError
} from '../../store/selectors/opportunityDetailsSelectors';

import OpportunitiesPopup from '../InvestmentOpportunities/Card/CardPopup';
import typography from "../../common/typography";
import { EvidenceStrip, MatchSignalChips } from "../../common/AiSignalChips";
import { truncateText } from "../../common/aiMatchUtils";

const VerdictLine = styled.p`
  margin: 0.65rem 0 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.72);
`;

export default function MatchedOpportunities() {
  const [pillBtnActiveIndex, setPillBtnActiveIndex] = useState<number[]>([0]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [filterTimeout, setFilterTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    pointerId: number | null;
    locked: "h" | "v" | null;
  } | null>(null);
  const dragXRef = useRef(0);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(0);
  const goRef = useRef<(delta: number) => void>(() => {});
  /** When paging via swipe, land on first/last card of the new page */
  const pageEdgeRef = useRef<"first" | "last" | null>(null);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  // Selectors for top opportunities
  const opportunities = useSelector(selectTopOpportunitiesData);
  const loading = useSelector(selectTopOpportunitiesLoading);
  const error = useSelector(selectTopOpportunitiesError);
  const meta = useSelector(selectTopOpportunitiesMeta);

  // Selectors for sector counts
  const sectorCounts = useSelector(selectSectorCounts);
  const sectorCountsLoading = useSelector(selectSectorCountsLoading);

  const opportunityDetails = useSelector(selectOpportunityDetails);
  const opportunityDetailsLoading = useSelector(selectOpportunityDetailsLoading);
  const opportunityDetailsError = useSelector(selectOpportunityDetailsError);

  useEffect(() => {
    dispatch(getSectorCountsRequest() as any);
  }, [dispatch]);

  useEffect(() => {
    setIsLoading(true);

    dispatch(getTopOpportunities({
      page: currentPage,
      limit,
      sectors: selectedSectors.length > 0 ? selectedSectors : undefined
    }) as any);
  }, [dispatch, currentPage, limit, selectedSectors]);

  useEffect(() => {
    if (!loading) {
      setIsLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!opportunities?.length) {
      setActiveMatchId(null);
      return;
    }
    const edge = pageEdgeRef.current;
    if (edge) {
      pageEdgeRef.current = null;
      const pick =
        edge === "last"
          ? opportunities[opportunities.length - 1]
          : opportunities[0];
      setActiveMatchId(pick.id);
      return;
    }
    const stillThere =
      activeMatchId != null && opportunities.some((o) => o.id === activeMatchId);
    if (!stillThere) {
      setActiveMatchId(opportunities[0].id);
    }
  }, [opportunities, activeMatchId]);

  const activeMatch = useMemo(
    () => opportunities.find((o) => o.id === activeMatchId) || opportunities[0] || null,
    [opportunities, activeMatchId]
  );

  const activeIndex = useMemo(() => {
    if (!activeMatch) return -1;
    return opportunities.findIndex((o) => o.id === activeMatch.id);
  }, [opportunities, activeMatch]);

  const pills = [
    { label: "All sectors", sector: "All" },
    ...sectorCounts.map((s) => ({
      label: s.sector,
      sector: s.sector,
    })),
  ];

  const totalRecords = meta.total;
  const startIndex = useMemo(() => (currentPage - 1) * limit + 1, [currentPage, limit]);
  const totalPages = meta.totalPages;

  const canGoPrev =
    activeIndex > 0 || (activeIndex === 0 && currentPage > 1);
  const canGoNext =
    (activeIndex >= 0 && activeIndex < opportunities.length - 1) ||
    (activeIndex === opportunities.length - 1 && currentPage < totalPages);

  const goToRelativeMatch = useCallback(
    (delta: number) => {
      if (!opportunities.length || activeIndex < 0 || isLoading) return;
      const next = activeIndex + delta;
      if (next >= 0 && next < opportunities.length) {
        setActiveMatchId(opportunities[next].id);
        return;
      }
      if (delta > 0 && currentPage < totalPages) {
        pageEdgeRef.current = "first";
        setCurrentPage((p) => p + 1);
      } else if (delta < 0 && currentPage > 1) {
        pageEdgeRef.current = "last";
        setCurrentPage((p) => p - 1);
      }
    },
    [opportunities, activeIndex, currentPage, totalPages, isLoading]
  );

  goRef.current = goToRelativeMatch;

  // Arrow keys work globally on this page (not only when the deck is focused)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goRef.current(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pointer drag + trackpad horizontal swipe on the match card
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const resetDrag = () => {
      swipeRef.current = null;
      dragXRef.current = 0;
      setIsDragging(false);
      setDragX(0);
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, a, input, textarea, select, [role='button']")) {
        return;
      }
      // Only primary button / touch / pen
      if (e.pointerType === "mouse" && e.button !== 0) return;

      swipeRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
        pointerId: e.pointerId,
        locked: null,
      };
      dragXRef.current = 0;
      setDragX(0);
      setIsDragging(true);
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      deckRef.current?.focus({ preventScroll: true });
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = swipeRef.current;
      if (!s?.active || s.pointerId !== e.pointerId) return;

      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;

      if (!s.locked) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        s.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
        if (s.locked === "v") {
          // Let the page scroll vertically
          resetDrag();
          try {
            stage.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          return;
        }
      }

      if (s.locked !== "h") return;
      e.preventDefault();
      dragXRef.current = dx;
      setDragX(dx);
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = swipeRef.current;
      if (!s?.active || (s.pointerId != null && s.pointerId !== e.pointerId)) {
        return;
      }
      const dx = dragXRef.current;
      const wasHorizontal = s.locked === "h";
      resetDrag();
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!wasHorizontal) return;
      const threshold = 48;
      if (dx <= -threshold) goRef.current(1);
      else if (dx >= threshold) goRef.current(-1);
    };

    const onWheel = (e: WheelEvent) => {
      // Trackpad / mouse horizontal swipe
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) {
        return;
      }
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLockRef.current < 420) return;
      wheelLockRef.current = now;
      goRef.current(e.deltaX > 0 ? 1 : -1);
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove, { passive: false });
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", resetDrag);
    stage.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", resetDrag);
      stage.removeEventListener("wheel", onWheel);
    };
  }, [activeMatch?.id]);

  const handleOpportunitieTitleClick = (opportunity: any) => {
    setSelectedOpportunityId(opportunity.opportunityId);

    dispatch(getOpportunityDetailsRequest(opportunity.opportunityId));
  };

  const handleClosePopup = () => {

    setSelectedOpportunityId(null);
  };

  const handleAiDecisionFilter = (decision: string) => {

  };


  const formatScore = (score: number) => `${Math.round(score * 100)}%`;
  const navigate = useNavigate();
  const handleViewAllClick = () => {
    navigate('/match-workbench');
  }

  const [openPopup, setOpenPopup] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const companyDetails = useSelector(selectCompanyDetails);
  const companyDetailsLoading = useSelector(selectCompanyDetailsLoading);
  const companyDetailsError = useSelector(selectCompanyDetailsError);

  useEffect(() => {
    if (companyDetailsError) {
      toastError(`Failed to load company details: ${companyDetailsError}`);
    }
  }, [companyDetailsError]);

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

  // if (loading && currentPage === 1) {
  //   return <div>Loading opportunities...</div>;
  // }

  const CombinedScoreBar = ({ finalScore, profileScore, productScore, aiScore }: {
    finalScore: number;
    profileScore: number;
    productScore: number;
    aiScore: number;
  }) => {
    const totalScore = finalScore * 100;
    const profileWidth = (profileScore / finalScore) * totalScore;
    const productWidth = (productScore / finalScore) * totalScore;
    const aiWidth = (aiScore / finalScore) * totalScore;

    return (
      <SegmentScoreBar>
        <SegmentWrapper>
          <ScoreBarBackground>
            <ScoreSegment
              variant="profile"
              width={`${profileWidth}%`}
            />
            <ScoreSegment
              variant="product"
              width={`${productWidth}%`}
            />
            <ScoreSegment
              variant="ai"
              width={`${aiWidth}%`}
            />
            <GreySegment width={`${100 - totalScore}%`} />
          </ScoreBarBackground>

          {/* Labels and percentages aligned with bar segments */}
          <LabelsContainer>
            <LabelGroup style={{ width: `${profileWidth}%` }}>
              <SegmentLabel>Profile</SegmentLabel>
              <SegmentPercentage>{formatScore(profileScore)}</SegmentPercentage>
            </LabelGroup>

            <LabelGroup style={{ width: `${productWidth}%` }}>
              <SegmentLabel>Product</SegmentLabel>
              <SegmentPercentage>{formatScore(productScore)}</SegmentPercentage>
            </LabelGroup>

            <LabelGroup style={{ width: `${aiWidth}%` }}>
              <SegmentLabel>AI Similarity</SegmentLabel>
              <SegmentPercentage>{formatScore(aiScore)}</SegmentPercentage>
            </LabelGroup>
          </LabelsContainer>
        </SegmentWrapper>
      </SegmentScoreBar>
    );
  };
  return (
    <ContentGrid>
      <OpportunitiesPanel>
        <PanelHeader>
          <HeaderCopy>
            <PanelTitle>Top matches</PanelTitle>
            <PanelSub>
              {totalRecords > 0
                ? `${totalRecords.toLocaleString()} ranked pairs · swipe or use arrows`
                : "Company-opportunity pairs from the matching engine"}
            </PanelSub>
          </HeaderCopy>
          <BtnPrimary onClick={handleViewAllClick}>Open workbench</BtnPrimary>
        </PanelHeader>

        <SectorRail aria-label="Filter by sector">
          {pills.map((pill, idx) => {
            const active = pillBtnActiveIndex[0] === idx;
            return (
              <SectorLink
                key={pill.sector + idx}
                type="button"
                $active={active}
                disabled={isLoading || sectorCountsLoading}
                onClick={() => {
                  if (isLoading) return;
                  if (idx === 0) {
                    setPillBtnActiveIndex([0]);
                    setSelectedSectors([]);
                  } else {
                    setPillBtnActiveIndex([idx]);
                    setSelectedSectors([pill.sector]);
                  }
                  setCurrentPage(1);
                }}
              >
                {pill.label}
              </SectorLink>
            );
          })}
        </SectorRail>

        {activeMatch && (
          <>
            <DeckChrome>
              <DeckNav>
                <DeckNavBtn
                  type="button"
                  aria-label="Previous match"
                  disabled={!canGoPrev || isLoading}
                  onClick={() => goToRelativeMatch(-1)}
                >
                  Previous
                </DeckNavBtn>
                <DeckIndex>
                  <DeckIndexNum>
                    {activeIndex >= 0 ? startIndex + activeIndex : "-"}
                  </DeckIndexNum>
                  <DeckIndexOf>of {totalRecords || "-"}</DeckIndexOf>
                </DeckIndex>
                <DeckNavBtn
                  type="button"
                  aria-label="Next match"
                  disabled={!canGoNext || isLoading}
                  onClick={() => goToRelativeMatch(1)}
                >
                  Next
                </DeckNavBtn>
              </DeckNav>
              <DeckDots aria-hidden>
                {opportunities.map((o) => (
                  <DeckDot
                    key={o.id}
                    $active={o.id === activeMatch.id}
                    onClick={() => setActiveMatchId(o.id)}
                  />
                ))}
              </DeckDots>
            </DeckChrome>

          <SwipeDeck
            ref={deckRef}
            tabIndex={0}
            role="region"
            aria-label="Match detail. Swipe or use arrow keys to change match."
          >
            <SwipeStage ref={stageRef}>
              <SwipeTrack
                $dragging={isDragging}
                style={{
                  transform: `translateX(${dragX * 0.55}px)`,
                  opacity: 1 - Math.min(Math.abs(dragX) / 420, 0.28),
                }}
              >
                <OpportunityItem key={activeMatch.id}>
                  <OpportunityHeader>
                    <div>
                      <OpportunityTitle>
                        <GradientSpan onClick={() => handleCompanyClick(activeMatch.companyId)}>
                          {activeMatch.companyName}
                        </GradientSpan>
                        {" - "}
                        <WhiteSpan onClick={() => handleOpportunitieTitleClick(activeMatch)}>
                          {activeMatch.opportunityName}
                        </WhiteSpan>
                      </OpportunityTitle>
                      <OpportunitySector>
                        {activeMatch.companySector} · {activeMatch.opportunitySector}
                      </OpportunitySector>
                    </div>
                    <MatchScoreContainer>
                      <MatchScore>{formatScore(activeMatch.finalScore)}</MatchScore>
                    </MatchScoreContainer>
                  </OpportunityHeader>

                  <MatchBreakdownDisplay>
                    <BreakdownHeaderInline>
                      <AiDecision>
                        <DecisionBadge>
                          {activeMatch.decisionTier || activeMatch.aiDecision}
                        </DecisionBadge>
                        <DecisionLabel>
                          {activeMatch.decisionTier ? "Decision tier" : "AI Decision"}
                        </DecisionLabel>
                      </AiDecision>

                      <CombinedScoreBar
                        finalScore={activeMatch.finalScore}
                        profileScore={activeMatch.profileSimilarity}
                        productScore={activeMatch.productSimilarity}
                        aiScore={activeMatch.aiScore}
                      />
                    </BreakdownHeaderInline>
                    <MatchSignalChips
                      decisionTier={activeMatch.decisionTier}
                      confidenceScore={activeMatch.confidenceScore}
                      confidenceLabel={activeMatch.confidenceLabel}
                      evidenceFlag={activeMatch.evidenceFlag}
                      valueChainPosition={activeMatch.valueChainPosition}
                      modelVersion={activeMatch.modelVersion}
                    />
                    {(activeMatch.strengths || activeMatch.risks) && (
                      <EvidenceStrip
                        strengths={activeMatch.strengths}
                        risks={activeMatch.risks}
                        maxLen={160}
                      />
                    )}
                    {!activeMatch.strengths && activeMatch.aiExplanation && (
                      <VerdictLine>
                        {truncateText(
                          Array.isArray(activeMatch.aiExplanation)
                            ? activeMatch.aiExplanation[0]
                            : String(activeMatch.aiExplanation),
                          180
                        )}
                      </VerdictLine>
                    )}
                  </MatchBreakdownDisplay>

                  <OpportunityDetails>
                    <DetailItem>
                      <DetailLabel>Key Demand Drivers</DetailLabel>
                      <DetailValue data-tooltip-id="location-tip" data-tooltip-content={activeMatch.keyDemandDrivers ? activeMatch.keyDemandDrivers : "N/A"}>
                        {activeMatch.keyDemandDrivers ? activeMatch.keyDemandDrivers : "N/A"}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Investment Range</DetailLabel>
                      <DetailValue data-tooltip-id="location-tip" data-tooltip-content={activeMatch.investmentRange ? activeMatch.investmentRange : "N/A"}>
                        {activeMatch.investmentRange ? activeMatch.investmentRange : "N/A"}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Market Size</DetailLabel>
                      <DetailValue data-tooltip-id="location-tip" data-tooltip-content={activeMatch.marketSize ? activeMatch.marketSize : "N/A"}>
                        {activeMatch.marketSize ? activeMatch.marketSize : "N/A"}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Region</DetailLabel>
                      <DetailValue data-tooltip-id="location-tip" data-tooltip-content={activeMatch.region ? activeMatch.region : "N/A"}>
                        {activeMatch.region ? activeMatch.region : "N/A"}
                      </DetailValue>
                    </DetailItem>
                  </OpportunityDetails>
                </OpportunityItem>
              </SwipeTrack>

            </SwipeStage>
          </SwipeDeck>
          </>
        )}
        <Tooltip
          id="location-tip"
          place="top"
          float
          style={{
            maxWidth: "300px",
            wordBreak: "break-word",
            whiteSpace: "normal",
            textAlign: "center"
          }}
        />
      </OpportunitiesPanel>
      {openPopup && (
        <CompanyDetailPopup
          companyId={selectedCompanyId}
          companyDetails={companyDetails}
          loading={companyDetailsLoading}
          error={companyDetailsError}
          onClose={() => setOpenPopup(false)}
        />
      )}


      {selectedOpportunityId && (
        <OpportunitiesPopup
          investment={{
            id: selectedOpportunityId,
            opportunityName:
              opportunityDetails?.opportunity_name ||
              activeMatch?.opportunityName ||
              "",
            opportunitySector: activeMatch?.opportunitySector || "",
            opportunityUrl: "",
            avgSectorSimilarity: 0,
            avgProfileSimilarity: 0,
            avgProductSimilarity: 0,
            avgAiScore: 0,
            avgFinalScore: activeMatch?.finalScore || 0,
            totalCompaniesMatched: 0,
            isBookmarked: false,
            investmentRange: activeMatch?.investmentRange || "",
            jobsCreated: "",
            keyDemandDrivers: activeMatch?.keyDemandDrivers || "",
            gdpImpact: "",
            investmentAppeal: "",
            economicImpact: "",
            marketReadiness: "",
            valueProposition: "",
          }}
          onClose={handleClosePopup}
          detailedData={opportunityDetails || undefined}
          loading={opportunityDetailsLoading}
          error={opportunityDetailsError}
          onOpportunityClick={handleAiDecisionFilter}
          popupType={null}
        />
      )}
    </ContentGrid>
  );
}

const SegmentPercentage = styled.div`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: ${typography.SliderNumValue.fontWeight};
  font-weight: bold;
  color: white;
  text-align: center;
`;

const GradientSpan = styled.span`
  cursor: pointer;
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  text-decoration: none;
  
  
  &:hover::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 2px;
    background: linear-gradient(45deg, #00ff88, #00b4d8);
  }
`;

const WhiteSpan = styled.span`
  color: white;
  cursor: pointer;
  position: relative;
  text-decoration: none;
  display: inline; 
  
  
  &:hover {
    background-image: linear-gradient(white, white);
    background-size: 100% 2.5px;
    background-repeat: no-repeat;
    background-position: 0 100%;
  }
  
  &:visited {
    color: white;
  }
`;

const ContentGrid = styled.div`
  
`;

const OpportunitiesPanel = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  padding: 1.25rem 1.35rem 1.35rem;
  box-sizing: border-box;
  width: 100%;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const HeaderCopy = styled.div`
  min-width: 0;
  flex: 1;
`;

const PanelTitle = styled.h2`
  margin: 0 0 0.25rem;
  font-size: 1.35rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.02em;
`;

const PanelSub = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.4;
`;

const BtnPrimary = styled.button`
  background: transparent;
  color: #9ef0c8;
  border: 1px solid rgba(158, 240, 200, 0.35);
  padding: 0.5rem 0.95rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: rgba(158, 240, 200, 0.6);
    background: rgba(0, 255, 136, 0.06);
  }
`;

const SectorRail = styled.div`
  display: flex;
  gap: 0.15rem 1.35rem;
  overflow-x: auto;
  margin-bottom: 1.35rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SectorLink = styled.button<{ $active?: boolean }>`
  appearance: none;
  flex: 0 0 auto;
  border: none;
  background: none;
  padding: 0.15rem 0;
  margin: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  color: ${(p) =>
    p.$active ? "#e8fff4" : "rgba(255, 255, 255, 0.42)"};
  box-shadow: ${(p) =>
    p.$active ? "inset 0 -2px 0 0 rgba(0, 255, 136, 0.85)" : "none"};
  transition: color 0.15s ease;

  &:hover:not(:disabled) {
    color: rgba(255, 255, 255, 0.88);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const DeckChrome = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
`;

const DeckNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

const DeckNavBtn = styled.button`
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: #9ef0c8;
  }

  &:disabled {
    opacity: 0.28;
    cursor: not-allowed;
  }
`;

const DeckIndex = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  min-width: 4.5rem;
  justify-content: center;
`;

const DeckIndexNum = styled.span`
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  letter-spacing: -0.02em;
`;

const DeckIndexOf = styled.span`
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
`;

const DeckDots = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const DeckDot = styled.button<{ $active?: boolean }>`
  width: ${(p) => (p.$active ? "18px" : "6px")};
  height: 6px;
  border-radius: 999px;
  border: none;
  padding: 0;
  cursor: pointer;
  background: ${(p) =>
    p.$active ? "rgba(0, 255, 136, 0.75)" : "rgba(255, 255, 255, 0.22)"};
  transition: width 0.2s ease, background 0.2s ease;
`;

const SwipeDeck = styled.div`
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.28);
    border-radius: 12px;
  }
`;

const SwipeNavBtn = styled.button`
  display: none;
  align-self: center;
  width: 36px;
  height: 72px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 200, 140, 0.4);
  }

  &:disabled {
    opacity: 0.28;
    cursor: not-allowed;
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

const SwipeStage = styled.div`
  position: relative;
  overflow: hidden;
  /* Allow vertical page scroll; horizontal gestures are handled in JS */
  touch-action: pan-y;
  cursor: grab;
  border-radius: 12px;
  user-select: none;
  -webkit-user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const SwipeTrack = styled.div<{ $dragging?: boolean }>`
  will-change: transform, opacity;
  transition: ${(p) =>
    p.$dragging ? "none" : "transform 0.28s ease, opacity 0.28s ease"};
`;

const SwipeFooter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0 0.25rem;
`;

const SwipeHint = styled.div`
  font-size: 0.68rem;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
  pointer-events: none;
`;

const SwipeDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.35rem;
`;

const SwipeDot = styled.button<{ $active?: boolean }>`
  width: ${(p) => (p.$active ? "18px" : "7px")};
  height: 7px;
  border: none;
  border-radius: 999px;
  padding: 0;
  cursor: pointer;
  background: ${(p) =>
    p.$active ? "rgba(0, 255, 136, 0.75)" : "rgba(255, 255, 255, 0.22)"};
  transition: width 0.2s ease, background 0.2s ease;
`;

const OpportunityItem = styled.div`
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.15rem 1.25rem 1.1rem;
  margin-bottom: 0;
`;
const OpportunityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;

  > div:first-child {
    min-width: 0;
    flex: 1;
  }
`;

const OpportunityTitle = styled.h4`
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  margin:0 0 0.5rem 0 ;
`;

const OpportunitySector = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: ${typography.datasSubHeading.fontSize};
  font-weight: ${typography.datasSubHeading.fontWeight};
`;

const MatchScoreContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const MatchScore = styled.div`
  color: #9ef0c8;
  font-size: 1.35rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1;
`;

const MatchBreakdownBtn = styled.button`
  position: relative;
  width: 24px;
  height: 24px;
  background: rgba(0, 255, 136, 0.2);
  border: 2px solid rgba(0, 255, 136, 0.4);
  border-radius: 50%;
  color: #00ff88;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 255, 136, 0.3);
    border-color: #00ff88;
    transform: scale(1.1);

    
    div.btn-tooltip {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;

const BtnTooltip = styled.div`
  position: absolute;
  bottom: 98%;
  left: 0.01%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  margin-bottom: 5px;
  border: 1px solid rgba(0, 255, 136, 0.3);
`;

const MatchBreakdownDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.85rem 0.9rem;
  margin: 0.85rem 0;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.16);
  }
`;

const BreakdownHeaderInline = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
`;

const AiDecision = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 70px;
`;

const DecisionBadge = styled.div`
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  color: #0a0a0a;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0, 255, 136, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.6);
  }

  @media (min-width: 2560px) {
    border-radius: 50px;
    padding: 1rem 2rem;
  }
`;

const DecisionLabel = styled.span`
  font-size: ${typography.kpiSubTitle.fontSize};
  font-weight: ${typography.kpiSubTitle.fontWeight};
  padding-left: 0.2rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
`;

interface ScoreSegmentProps {
  width?: string;
  variant: "profile" | "product" | "ai";
}

const variantStyles = {
  profile: css`
    background: linear-gradient(135deg, #4285f4 0%, #1976d2 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  `,
  product: css`
    background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  `,
  ai: css`
    background: linear-gradient(135deg, #00ff88 0%, #00b4d8 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  `,
};

const ScoreBarBackground = styled.div`
  display: flex;
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin: 0.5rem 0;
  
  @media (min-width: 1921px) and (max-width: 2559px) {
    height: 16px;
    border-radius: 8px;
    margin: 0.75rem 0;
  }
  
  @media (min-width: 2560px) {
    height: 20px;
    border-radius: 10px;
    margin: 1rem 0;
  }
  
  @media (min-width: 3840px) {
    height: 24px;
    border-radius: 12px;
    margin: 1.25rem 0;
  }
`;

const GreySegment = styled.div<{ width: string }>`
  width: ${props => props.width};
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
`;

const FinalScorePercentage = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.25rem;
`;

const BreakdownScoreBar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  width: 100%;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  @media (min-width: 2560px) {
    width: 100%;
    height: 38px;
    border-radius: 24px;

  }
`;

const ScoreSegment = styled.div<ScoreSegmentProps>`
  ${({ variant }) => variant && variantStyles[variant]}
  width: ${({ width }) => width || "0%"};
  height: 100%;
  display: flex;
  flex-direction: column; 
  align-items: center;    
  justify-content: center; 
  position: relative;
  text-align: center;
  color: white;

  &:first-child {
    border-top-left-radius: 14px;
    border-bottom-left-radius: 14px;
  }
  &:last-child {
    border-top-right-radius: 14px;
    border-bottom-right-radius: 14px;
  }
`;

const SegmentScoreBar = styled.div`
  width: 100%;
  max-width: 350px;
  min-width: 0;
  
  @media (min-width: 1921px) and (max-width: 2559px) {
    width: 500px;
  }
  
  @media (min-width: 2560px) {
    width: 700px;
  }
  
  @media (min-width: 3840px) {
    width: 900px;
  }
`;

const SegmentWrapper = styled.div`
  text-align: center;
`;

const SegmentLabel = styled.div`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: ${typography.SliderNumValue.fontWeight};
  color: white;
  margin-bottom: 4px;
  text-align: center;
  white-space: nowrap;
  
  @media (min-width: 1921px) and (max-width: 2559px) {
    margin-bottom: 6px;
  }
  
  @media (min-width: 2560px) {
    margin-bottom: 8px;
  }
  
  @media (min-width: 3840px) {
    margin-bottom: 10px;
  }
`;

const LabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0; 
  
  @media (min-width: 2560px) {
    gap: 0.5rem;
  }
`;

const LabelsContainer = styled.div`
  display: flex;
  width: 100%;
  margin-top: 0.4rem;
  
  @media (min-width: 2560px) {
    margin-top: 1rem;
  }
`;

const OpportunityDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1.25rem;
  margin-top: 0.35rem;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const DetailItem = styled.div`
  color: rgba(255, 255, 255, 0.78);
  padding-left: 0.8rem;
  position: relative;
  margin-bottom: 18px; 

  &::before {
    content: "";
    position: absolute;
    left: 0;                
    top: 0%;               
    width: 2.5px;             
    height: 40px;            
    background-color: #60c9c468;
    border-radius: 2px;     
  }

  @media (min-width: 2560px) {
    margin-bottom: 1rem;
    
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0%;
      width: 3.5px;
      height: 65px;        
      background-color: #60c9c468;
      border-radius: 2px;
    }
  }
`;

const DetailLabel = styled.p`
  margin: 0rem;
  margin-bottom: 0.25rem;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  @media (min-width: 2560px) {
    margin-bottom: 0.5rem;
  }
`;

const DetailValue = styled.p`
  color: #ffffff;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  line-height: 1.2rem; 
  margin-top: 0.25rem; 
  margin-bottom:0;
  display: -webkit-box;
  -webkit-line-clamp: 1; 
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (min-width: 2560px) {
    line-height: 2rem; 
    margin-top: 0.5rem; 
  }
`;

