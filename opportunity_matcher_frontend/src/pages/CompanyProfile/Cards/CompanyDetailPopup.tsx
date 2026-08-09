import React, { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useDispatch } from "react-redux";
import companyIcon from '../../../assets/Company-profile-icons/building-06.svg';
import opportunitiesIcon from '../../../assets/icons/target-02.svg';
import { CompanyDetails, } from "../../../store/types/getCompanyDetailsTypes";
import { data, Link } from "react-router-dom";
import typography from "../../../common/typography";
import {
  rematchCompanyWithProgress,
  RematchJobStatus,
} from "../../../store/services/rematchCompanyService";
import { getCompanyDetailsRequest } from "../../../store/actions/getCompanyDetailsActions";
import { toastError, toastSuccess } from "../../../common/toast";
import { AppDispatch } from "../../../store";



interface CompanyDetailPopupProps {
  companyId: number | null;
  companyDetails: CompanyDetails | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onCompanyClick?: (company: any) => void;
}

// Helper function to convert API data to your existing format
// In the mapApiDataToUiFormat function, add safe access to properties
const mapApiDataToUiFormat = (companyDetails: CompanyDetails | null) => {
  if (!companyDetails) return null;

  return {
    company: companyDetails.company_name,
    sector: companyDetails.company_sector,
    description: companyDetails.company_profile || "No description available",
    productServices: companyDetails.product_services || "No opportunity data",
    opportunityDesc: `Year Founded: ${companyDetails.year_founded} | Employees: ${companyDetails.number_of_employees?.toLocaleString() || "N/A"}`, // Add optional chaining
    matchReason: [
      `Sector: ${companyDetails.company_sector}`,
      `Founded: ${companyDetails.year_founded}`,
      `Employees: ${companyDetails.number_of_employees?.toLocaleString() || "N/A"}`, // Add optional chaining
      `Revenue: $${companyDetails.revenue_usd?.toLocaleString() || "N/A"} USD`, // Add optional chaining
      companyDetails.presence_in_saudi ? "Presence in Saudi Arabia" : "No presence in Saudi Arabia"
    ],
    link: ""
  };
};
type AiDecisionValue = 'All' | 'Yes' | 'No';


const CompanyDetailPopup: React.FC<CompanyDetailPopupProps> = ({
  companyId,
  companyDetails,
  loading,
  error,
  onClose,
  onCompanyClick
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [expanded, setExpanded] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'opportunities'>('company');
  const [informationBtn, setInformationBtn] = useState<'General' | 'MENA' | 'RHQMENA'>('General');
  const [rematching, setRematching] = useState(false);
  const [rematchProgress, setRematchProgress] = useState<RematchJobStatus | null>(
    null
  );

  const [aiDecision, setAiDecision] = useState('All');

  const formatElapsed = (ms: number) => {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleRefreshMatches = async () => {
    if (!companyId || rematching) return;
    setRematching(true);
    setRematchProgress({
      jobId: "",
      status: "queued",
      pct: 0,
      stage: "queued",
      message: "Starting on-demand rematch…",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elapsedMs: 0,
    });
    try {
      const job = await rematchCompanyWithProgress(
        {
          companyId,
          companyName: companyDetails?.company_name,
          fast: false,
          topN: 8,
        },
        (progress) => setRematchProgress(progress)
      );

      if (job.status === "failed" || !job.result?.ok) {
        toastError(job.error || job.message || "Rematch failed");
        return;
      }

      toastSuccess(
        `Refreshed ${job.result?.matchCount ?? 0} matches for ${
          job.companyName || "company"
        }`
      );
      dispatch(getCompanyDetailsRequest(companyId));
      setActiveTab("opportunities");
    } catch (e: any) {
      toastError(
        e?.response?.data?.error ||
          e?.message ||
          "Rematch failed - check backend Python job"
      );
    } finally {
      setRematching(false);
      setTimeout(() => setRematchProgress(null), 1800);
    }
  };

  const handleAiDecisionClick = (value: AiDecisionValue) => {
    setAiDecision(value);

    if (value === 'All') {
      console.log('All filter clicked - will not pass filter to API');
      // For "All", we don't want to trigger API call or pass any filter
      return;
    }

    // onCompanyClick?.(value);
    console.log('Selected AI Decision:', value);
  };

  // Map API data to your UI format
  const data = mapApiDataToUiFormat(companyDetails);

  const [aiDecisionFilter, setAiDecisionFilter] = useState<'All' | 'Yes' | 'No'>('All');
  const [filteredMatchingOutputs, setFilteredMatchingOutputs] = useState<any[]>([]);
  const handleAiDecisionFilter = (decision: 'All' | 'Yes' | 'No') => {
    setAiDecisionFilter(decision);

    if (decision === 'All') {
      setFilteredMatchingOutputs(companyDetails?.matching_outputs || []);
    } else {
      const filtered = companyDetails?.matching_outputs?.filter(m => m.ai_decision === decision) || [];
      setFilteredMatchingOutputs(filtered);
    }
  };
  // Add this useEffect to initialize the filtered data
  useEffect(() => {
    if (companyDetails?.matching_outputs) {
      setFilteredMatchingOutputs(companyDetails.matching_outputs);
    }
  }, [companyDetails]);

  const formatRevenue = (value: number) => {
    if (!value || value === 0) return "N/A";

    const absValue = Math.abs(value);

    // Only Millions & Billions (International format)
    if (absValue >= 1000000000) {
      const billion = value / 1000000000;
      return `${billion.toFixed(1)} B`;
    } else if (absValue >= 1000000) {
      const million = value / 1000000;
      return `${million.toFixed(1)} M`;
    }

    // For numbers less than 1 million, show regular format
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <Overlay>
        <PopupContainer>
          <StickyHeader>
            <HeaderContent>
              <LeftCol>
                <Avatar>...</Avatar>
                <InfoBlock>
                  <CompanyName>Loading...</CompanyName>
                  <Badge>Loading</Badge>
                </InfoBlock>
              </LeftCol>
              <Divider />
              <MiddleCol>
                <span>Companies</span>
                <span>Loading Companies...</span>
              </MiddleCol>
            </HeaderContent>
            <CloseButton onClick={onClose}>×</CloseButton>
          </StickyHeader>
          <ContentArea>
            {/* Loading content would go here */}
          </ContentArea>
        </PopupContainer>
      </Overlay>
    );
  }

  if (error) {
    return (
      <Overlay>
        <PopupContainer>
          <StickyHeader>
            <HeaderContent>
              <LeftCol>
                <Avatar>!</Avatar>
                <InfoBlock>
                  <CompanyName>Error</CompanyName>
                  <Badge>Error</Badge>
                </InfoBlock>
              </LeftCol>
              <Divider />
              <MiddleCol>
                <span>Companies</span>
                <span>Error loading Companies</span>
              </MiddleCol>
            </HeaderContent>
            <CloseButton onClick={onClose}>×</CloseButton>
          </StickyHeader>
          <ContentArea>
            {/* Error content would go here */}
          </ContentArea>
        </PopupContainer>
      </Overlay>
    );
  }

  if (!data) {
    return (
      <Overlay>
        <PopupContainer>
          <StickyHeader>
            <HeaderContent>
              <LeftCol>
                <Avatar>?</Avatar>
                <InfoBlock>
                  <CompanyName>No Data</CompanyName>
                  <Badge>No Data</Badge>
                </InfoBlock>
              </LeftCol>
              <Divider />
              <MiddleCol>
                <span>Companies</span>
                <span>No data available</span>
              </MiddleCol>
            </HeaderContent>
            <CloseButton onClick={onClose}>×</CloseButton>
          </StickyHeader>
          <ContentArea>
            {/* No data content would go here */}
          </ContentArea>
        </PopupContainer>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <PopupContainer>
        <StickyHeader>
          <HeaderContent>
            <LeftCol>
              <Avatar>{data.company?.charAt(0)}</Avatar>
              <InfoBlock>
                <CompanyName>{data.company}</CompanyName>
                <Badge>{data.sector}</Badge>
              </InfoBlock>
            </LeftCol>
            {/* <Divider /> */}

          </HeaderContent>
          <CloseButton onClick={onClose}>×</CloseButton>
        </StickyHeader>

        <ContentArea>
          <MiddleCol>
            <span>Description</span>
            <span>{data.description}</span>
          </MiddleCol>
          <TabBar>
            <Btn
              active={activeTab === 'company'}
              onClick={() => setActiveTab('company')}
            >
              <BtnIcon active={activeTab === 'company'} src={companyIcon} />
              Company Details
            </Btn>
            <Btn
              active={activeTab === 'opportunities'}
              onClick={() => setActiveTab('opportunities')}
            >
              <BtnIcon active={activeTab === 'opportunities'} src={opportunitiesIcon} />
              Matched Opportunities
            </Btn>
          </TabBar>

          {/* <FilterWrapper>
            <FilterBtn active>All</FilterBtn>
            <FilterBtn>Yes</FilterBtn>
            <FilterBtn>No</FilterBtn>
          </FilterWrapper> */}

          {activeTab === 'company' ? (
            <>
              <OpportunityBox>
                {/* <Avatar><BtnIcon src={companyIcon} /> </Avatar> */}
                <span style={{ fontSize: `${typography.datasHeading.fontSize}`, fontWeight: `${typography.datasHeading.fontWeight}`, color: "white", marginBottom: "0.3rem" }}>Products and Services</span>
                <DescriptionText>
                  {companyDetails?.product_services_beautified.map((item, index) => (
                    <div key={index}>
                      <div style={{ marginBottom: "1rem" }}>
                        <strong style={{ fontSize: `${typography.Label.fontSize}`, fontWeight: `${typography.Label.fontWeight}`, color: "#00e676" }}>
                          {item.title}: </strong>
                        <span style={{ fontSize: `${typography.Value.fontSize}`, fontWeight: `${typography.Value.fontWeight}` }}>{item.description}</span>
                      </div>
                    </div>
                  ))}
                </DescriptionText>
              </OpportunityBox>

              {/* <InfoGrid>
                <InfoItem>
                  <Label>Primary Sector</Label>
                  <Badge>{data.sector}</Badge>
                </InfoItem>
              </InfoGrid> */}
              <TabBar>
                <Btn
                  active={informationBtn === 'General'}
                  onClick={() => setInformationBtn('General')}
                >
                  <BtnIcon src={companyIcon} active={informationBtn === 'General'} />
                  General Information
                </Btn>
                <Btn
                  active={informationBtn === 'MENA'}
                  onClick={() => setInformationBtn('MENA')}
                >
                  <BtnIcon
                    active={informationBtn === 'MENA'}
                    src={opportunitiesIcon} />
                  MENA Information
                </Btn>
                <Btn
                  active={informationBtn === 'RHQMENA'}
                  onClick={() => setInformationBtn('RHQMENA')}
                >
                  <BtnIcon
                    active={informationBtn === 'RHQMENA'}
                    src={opportunitiesIcon} />
                  RHQ MENA Information
                </Btn>
              </TabBar>
              {informationBtn === 'General' && (
                <MatchReasonBox>
                  {/* <strong> General Information</strong> */}
                  <ul>
                    <li style={{
                      display: "flex !important",
                      flexDirection: "row",

                    }}>
                      <span >Year Founded: </span>
                      <span>{companyDetails?.year_founded || "N/A"}</span>
                    </li>
                    <li>
                      <span>Legal Structure: </span>
                      <span>{companyDetails?.legal_structure || "N/A"}</span>
                    </li>
                    <li>
                      <span>Type of Entity:</span>
                      <span>{companyDetails?.type_of_entity?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>Status:</span>
                      <span>{companyDetails?.status?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>Control Structure:</span>
                      <span>{companyDetails?.control_structure?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>Ultimate Parent Company:</span>
                      <span>{companyDetails?.ultimate_parent_company || "N/A"}</span>
                    </li>

                    <li>
                      <span>Global Headquarters:</span>
                      <span>{companyDetails?.global_headquarters || "N/A"}</span>
                    </li>
                    <li>
                      <span>Number of Employees:</span>
                      <span>
                        {companyDetails?.number_of_employees
                          ? companyDetails.number_of_employees.toLocaleString()
                          : "N/A"}
                      </span>
                    </li>
                    <li>
                      <span>Number of Locations:</span>
                      <span>{companyDetails?.number_of_locations || "N/A"}</span>
                    </li>

                    <li>
                      <span>Fiscal Year End:</span>
                      <span>{companyDetails?.fiscal_year_end_date || "N/A"}</span>
                    </li>
                    <li>
                      <span>Revenue Local Currency:</span>
                      <span>
                        {companyDetails?.revenue_local_currency
                          ? formatRevenue(companyDetails.revenue_local_currency)
                          : "N/A"}
                      </span>
                    </li>
                    <li>
                      <span>Currency:</span>
                      <span>{companyDetails?.currency || "N/A"}</span>
                    </li>
                    <li>
                      <span>Revenue (USD):</span>
                      <span>${companyDetails?.revenue_usd ? formatRevenue(companyDetails.revenue_usd) : "N/A"}</span>
                    </li>
                    <li>
                      <span>Website:</span>
                      <Website href={companyDetails?.website_url || undefined} target="_blank" rel="noopener noreferrer">
                        {companyDetails?.website_url || "N/A"}</Website>
                    </li>


                  </ul>
                </MatchReasonBox>)}
              {informationBtn === 'MENA' && (
                <MatchReasonBox>
                  {/* <strong> MENA Information</strong> */}
                  <ul>
                    <li>
                      <span>Presence of Parent Company:</span>
                      <span>{companyDetails?.presence_of_parent_company_in_mena ? "Yes" : "No"}</span>
                    </li>
                    <li>
                      <span>Presence of Company in MENA:</span>
                      <span>{companyDetails?.presence_of_company_in_mena ? "Yes" : "No"}</span>
                    </li>
                    <li>
                      <span>Type of Presence:</span>
                      <span>{companyDetails?.type_of_presence?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>MENA Revenue (Local Currency):</span>
                      <span>{companyDetails?.mena_revenue_local_currency?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>KSA Revenue (Local Currency):</span>
                      <span>{companyDetails?.ksa_revenue_local_currency?.toLocaleString() || "N/A"}</span>
                    </li>


                    <li>
                      <span>Presence in Saudi:</span>
                      <span>{companyDetails?.presence_in_saudi ? "Yes" : "No"}</span>
                    </li>
                    <li>
                      <span>Type of Presence Saudi:</span>
                      <span>{companyDetails?.type_of_presence_saudi || "N/A"}</span>
                    </li>
                    <li>
                      <span>Companies Name in MENA:</span>
                      <span>{companyDetails?.companies_name_in_mena || "N/A"}</span>
                    </li>

                    <li>
                      <span>Companies Name in KSA:</span>
                      <span>{companyDetails?.companies_name_in_ksa || "N/A"}</span>
                    </li>
                    <li>
                      <span>Number of Employees Parent:</span>
                      <span>
                        {companyDetails?.number_of_employees_parent
                          ? companyDetails.number_of_employees_parent.toLocaleString()
                          : "N/A"}
                      </span>

                    </li>
                    <li>
                      <span>Number of Employees KSA:</span>
                      <span>
                        {companyDetails?.number_of_employees_ksa
                          ? companyDetails.number_of_employees_ksa.toLocaleString()
                          : "N/A"}
                      </span>

                    </li>
                    <li>
                      <span>Number of Employees MENA:</span>
                      <span>{companyDetails?.number_of_employees_mena?.toLocaleString() || "N/A"}</span>
                    </li>


                    <li>
                      <span style={{ marginRight: "8px", fontWeight: 500 }}>MENA Locations:</span>

                      <TextWrapper>
                        <TruncatedText $expanded={expanded}>
                          {companyDetails?.mena_locations && companyDetails.mena_locations.trim() !== "[]"
                            ? companyDetails.mena_locations.toLocaleString()
                            : "N/A"}
                        </TruncatedText>

                        {companyDetails?.mena_locations &&
                          companyDetails.mena_locations.length > 25 && (
                            <ToggleBtn onClick={() => setExpanded(!expanded)}>
                              {expanded ? "See less" : "See more"}
                            </ToggleBtn>
                          )}
                      </TextWrapper>

                    </li>

                    <li>
                      <span>MENA Notes:</span>
                      <TextWrapper>
                        <TruncatedText $expanded={expandedNotes}>
                          {companyDetails?.mena_notes && companyDetails.mena_notes.trim() !== ""
                            ? companyDetails.mena_notes.toLocaleString()
                            : "N/A"}
                        </TruncatedText>

                        {companyDetails?.mena_notes &&
                          companyDetails.mena_notes.length > 25 && (
                            <ToggleBtn onClick={() => setExpandedNotes(!expandedNotes)}>
                              {expandedNotes ? "See less" : "See more"}
                            </ToggleBtn>
                          )}
                      </TextWrapper>
                    </li>
                    <li>
                      <span>History in MENA:</span>
                      <TextWrapper>
                        <TruncatedText $expanded={expandedHistory}>
                          {companyDetails?.history_in_mena && companyDetails.history_in_mena.trim() !== ""
                            ? companyDetails.history_in_mena
                            : "N/A"}
                        </TruncatedText>

                        {companyDetails?.history_in_mena &&
                          companyDetails.history_in_mena.length > 25 && (
                            <ToggleBtn onClick={() => setExpandedHistory(!expandedHistory)}>
                              {expandedHistory ? "See less" : "See more"}
                            </ToggleBtn>
                          )}
                      </TextWrapper>

                    </li>
                  </ul>
                </MatchReasonBox>)}
              {informationBtn === 'RHQMENA' && (
                <MatchReasonBox>
                  {/* <strong> RHQ MENA Information</strong> */}
                  <ul>
                    <li>
                      <span>RHQ Status:</span>
                      <span>{companyDetails?.rhq_status?.toLowerCase() === "true" ? "Yes" : "No"}</span>
                    </li>
                    <li>
                      <span>RHQ License Status:</span>
                      <span>{companyDetails?.rhq_license_status?.toLowerCase() === "true" ? "Yes" : "No"}</span>
                    </li>
                    <li>
                      <span>RHQ Country:</span>
                      <span>{companyDetails?.rhq_country?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>RHQ City:</span>
                      <span>{companyDetails?.rhq_city?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>RHQ Country Coverage:</span>
                      <span>{companyDetails?.rhq_country_coverage?.toLocaleString() || "N/A"}</span>
                    </li>
                    <li>
                      <span>RHQ Entity Name:</span>
                      <span>{companyDetails?.rhq_entity_name || "N/A"}</span>
                    </li>

                    <li>
                      <span>RHQ in MENA:</span>
                      <span>{companyDetails?.rhq_in_mena ? "Yes" : "No"}</span>
                    </li>
                    <li>
                      <span>RHQ Number of Employees:</span>
                      <span>
                        {companyDetails?.rhq_number_of_employees
                          ? companyDetails.rhq_number_of_employees.toLocaleString()
                          : "N/A"}
                      </span>
                    </li>
                    <li>
                      <span>RHQ Mandatory Activities:</span>
                      <span>{companyDetails?.rhq_mandatory_activities || "N/A"}</span>
                    </li>

                    <li>
                      <span>RHQ Optional Activities:</span>
                      <span>{companyDetails?.rhq_optional_activities || "N/A"}</span>
                    </li>
                  </ul>
                </MatchReasonBox>)}
            </>
          ) : (
            <div>
              <FilterContainer>
                <AiDecisionLabel>Filter by AI Decision:</AiDecisionLabel>
                <AiDecisionBtn
                  $active={aiDecisionFilter === 'All'}
                  onClick={() => handleAiDecisionFilter('All')}
                >
                  All ({companyDetails?.matching_outputs?.length || 0})
                </AiDecisionBtn>

                <AiDecisionBtn
                  $active={aiDecisionFilter === 'Yes'}
                  onClick={() => handleAiDecisionFilter('Yes')}
                >
                  Yes ({companyDetails?.matching_outputs?.filter(m => m.ai_decision === 'Yes').length || 0})
                </AiDecisionBtn>

                <AiDecisionBtn
                  $active={aiDecisionFilter === 'No'}
                  onClick={() => handleAiDecisionFilter('No')}
                >
                  No ({companyDetails?.matching_outputs?.filter(m => m.ai_decision === 'No').length || 0})
                </AiDecisionBtn>

                <RematchBtn
                  type="button"
                  disabled={rematching || !companyId}
                  onClick={handleRefreshMatches}
                  title="Pull this company from the database and re-run matching against opportunities"
                >
                  {rematching ? "Matching…" : "Refresh matches"}
                </RematchBtn>
              </FilterContainer>
              {(rematching || rematchProgress) && rematchProgress && (
                <RematchProgressCard>
                  <RematchProgressHeader>
                    <RematchProgressTitle>
                      {rematchProgress.status === "succeeded"
                        ? "Matches refreshed"
                        : rematchProgress.status === "failed"
                          ? "Rematch failed"
                          : "Matching in progress"}
                    </RematchProgressTitle>
                    <RematchProgressMeta>
                      {Math.round(rematchProgress.pct)}% ·{" "}
                      {formatElapsed(rematchProgress.elapsedMs)}
                    </RematchProgressMeta>
                  </RematchProgressHeader>
                  <RematchTrack aria-hidden>
                    <RematchFill
                      style={{
                        width: `${Math.max(4, Math.min(100, rematchProgress.pct))}%`,
                      }}
                      $pulse={
                        rematchProgress.status === "running" ||
                        rematchProgress.status === "queued"
                      }
                    />
                  </RematchTrack>
                  <RematchStage>
                    <RematchStageLabel>
                      {rematchProgress.stage || "running"}
                    </RematchStageLabel>
                    <span>{rematchProgress.message}</span>
                  </RematchStage>
                </RematchProgressCard>
              )}

              {/* Display filtered opportunities */}
              <OppContent >
                {filteredMatchingOutputs?.map((matching, index) => (
                  <ContentContainer key={matching.id || index}>
                    <ContentHeader>
                      <StyledHeading>{matching.opportunity?.opportunity_name || "N/A"}</StyledHeading>
                      <Para style={{ marginTop: "0rem" }}>{matching.opportunity_sector || "N/A"}</Para>
                      <SpansContainer>
                        <BlueSpan>Rank: {matching.rank || "N/A"}</BlueSpan>
                        <GreenSpan>{Math.round(matching.final_score * 100)}%</GreenSpan>
                        <OrangeSpan>AI: {matching.ai_decision}</OrangeSpan>
                      </SpansContainer>
                    </ContentHeader>
                    <div>
                      <h4 style={{ margin: "0.6rem 0 0 0", fontSize: `${typography.Label.fontSize}`, fontWeight: `${typography.Label.fontWeight}` }}>
                        Match Reason:</h4>
                      <Para style={{ marginTop: "0.3rem" }}>
                        {matching.ai_explanation || "No explanation available"}
                      </Para>
                      <OppLink
                        target="_blank"
                        rel="noopener noreferrer"
                        href={matching.opportunity.url}>
                        Click to View Invest Saudi Opportunity Card
                      </OppLink>
                    </div>
                  </ContentContainer>))
                }
              </OppContent>

            </div>
          )}
          {/* <LinkButton
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Click to view Invest Saudi Opportunity Card
          </LinkButton> */}
        </ContentArea>
      </PopupContainer>
    </Overlay>
  );
};

export default CompanyDetailPopup;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 15, 30, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContainer = styled.div`
  background: rgba(38, 43, 65, 1);
  color: #fff;
  width: min(950px, calc(100vw - 1.5rem));
  max-width: 100%;
  max-height: 89vh;
  max-height: 89dvh;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  
  @media (min-width: 1921px) {
    width: min(1300px, calc(100vw - 3rem));
    max-height: 85vh;
  }

  @media (max-width: 768px) {
    border-radius: 12px;
    max-height: 92dvh;
  }
`;

const StickyHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 15px 20px;
  background: rgba(38, 43, 65, 1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  
  @media (min-width: 1921px) {
    padding: 25px 25px 20px 25px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
  
  @media (min-width: 1921px) {
    gap: 18px;
  }
`;

const ContentArea = styled.div`
  padding: 0 20px 20px 20px;
  overflow-y: auto;
  flex: 1;

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

  scrollbar-width: thin;
  scrollbar-color: #ace7ff rgba(255, 255, 255, 0.06);
  
  @media (min-width: 1921px) {
    padding: 0 25px 25px 25px;
    max-height: calc(75vh - 130px);
    
    &::-webkit-scrollbar {
      width: 10px;
    }
  }
`;

const CompanyName = styled.h2`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  margin: 0;
`;

const Badge = styled.span`
  background: rgba(41, 62, 83, 1);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: ${typography.datasSubHeading.fontSize};
  font-weight: ${typography.datasSubHeading.fontWeight};
  
  @media (min-width: 1921px) {
    padding: 8px 15px;
    border-radius: 10px;
  }
`;

const TabBar = styled.div`
  display: flex;
  margin: 12px 0 29px 0;
  border-radius: 8px;
  overflow: hidden;
  
  @media (min-width: 1921px) {
    margin: 15px 0 39px 0;
    border-radius: 10px;
  }
`;

const Btn = styled.button<{ active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
    margin: 0 0 0 5px;
  background: ${({ active }) =>
    active ? "linear-gradient(to right, #00ff88, #00b4d8)" : "rgba(61, 61, 75, 1)"};
  color: ${({ active }) => (active ? "#000" : "#fff")};
  font-weight: ${typography.button.fontWeight};
  font-size: ${typography.button.fontSize};
  cursor: pointer;
  border: none;
  line-height: 1;
  
  @media (min-width: 1921px) {
    padding: 12px;
    gap: 8px;
  }
`;

const BtnIcon = styled.img<{ active?: boolean }>`
  height: 16px;
  width: 16px;
  object-fit: contain;
  display: inline-block;
  vertical-align: middle;
  ${({ active }) =>
    active &&
    `
    filter: brightness(0) saturate(100%);
  `}
  
  @media (min-width: 1921px) {
    height: 22px;
    width: 22px;
    object-fit: contain;
    display: inline-block;
    vertical-align: middle;
  }
`;

const OpportunityBox = styled.div`
  background: rgba(61, 61, 75, 1);
  padding: 15px;
  border-radius: 10px;
  
  line-height: 1.4;
  display: inline-flex;
  flex-direction: column;
  gap:4px
  margin-top: 0px;
  
  @media (min-width: 1921px) {
    padding: 18px;
    border-radius: 12px;
   
    gap: 12px;
  }
`;

const MatchReasonBox = styled.div`
  margin-top: 20px;
  line-height: 1.5;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 20px;
    color: rgba(255, 255, 255, 0.89);
  }

  li {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 8px 12px;
  }

  li span:first-child {
    font-size: ${typography.Label.fontSize};
    font-weight:  ${typography.Label.fontWeight};
    color: #00e676;
  }

  li span:last-child {
    font-size: ${typography.Value.fontSize};
    font-weight:  ${typography.Value.fontWeight};
  }
    
  @media (min-width: 1921px) {
    margin-top: 25px;
    
    li {
      margin-bottom: 10px;
    }
  }
`;
const Website = styled.a`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: #ffffff;
  text-decoration: none;
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 1921px) {
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
  }

  &:hover {
    color: #8ecbff; 
    text-decoration: underline;
  }
`;

const LinkButton = styled.a`
  margin-top: 20px;
  display: inline-block;
  background: rgba(41, 62, 83, 1);
  color: #00f7ff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
  border: 1px solid #334155;
  
  @media (min-width: 1921px) {
    margin-top: 25px;
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 1.4rem;
  }
`;

const LeftCol = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  @media (min-width: 1921px) {
    gap: 15px;
  }
`;

const MiddleCol = styled.p`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;

  span:first-child {
    font-size: ${typography.Label.fontSize};
    font-weight: ${typography.Label.fontWeight};
    color: white;
  }

  span:last-child {
    font-size: ${typography.Value.fontSize};
    font-weight: ${typography.Value.fontWeight};
    color: #fff;
    
  }
  
  @media (min-width: 1921px) {
    gap: 6px;
    margin-top: 10px;
    
   
  }
`;

const Divider = styled.div`
  width: 2px;
  height: 60px;
  background-color: #00d3a9;
  margin: 0 15px;
  
  @media (min-width: 1921px) {
    height: 70px;
    margin: 0 18px;
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0d1b2a;
  color: #00d3a9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${typography.Label.fontWeight};
  font-size: ${typography.Label.fontSize};
  flex-shrink: 0;
  
  @media (min-width: 1921px) {
    width: 49px;
    height: 49px;
    
  }
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  
  @media (min-width: 1921px) {
    gap: 8px;
  }
`;

const FilterWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px;
  margin: 0.2rem 0;
  
  @media (min-width: 1921px) {
    gap: 10px;
    padding: 12px;
    margin: 0.3rem 0;
  }
`;

const FilterBtn = styled.button<{ active?: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #00d3a9;
  background: ${({ active }) => (active ? "rgba(5, 251, 141, 0.2)" : "rgba(12, 23, 34, 1)")};
  color: ${({ active }) => (active ? "rgba(5, 251, 141, 1)" : "#fff")};
  transition: all 0.2s ease;

  &:hover {
    background: #00d3a9;
    color: #0d1b2a;
  }
  
  @media (min-width: 1921px) {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 1.4rem;
  }
`;

const DescriptionText = styled.p`
  line-height: 1.4;
  color: #fff;
  flex: 1;
  margin:0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  align-items: start;
  margin: 2rem 0;
  
  @media (min-width: 1921px) {
    gap: 15px;
    margin: 2.5rem 0;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:first-child {
    justify-self: start;
  }
  &:not(:first-child) {
    justify-self: end;
  }
  
  @media (min-width: 1921px) {
    gap: 6px;
  }
`;

const Label = styled.div`
  font-size: ${typography.Label.fontSize};
  font-weight:${typography.Label.fontWeight};
  color: #ffffff87;
  
 
`;

const Value = styled.div`
  font-size: ${typography.Value.fontSize};
  font-weight:${typography.Value.fontWeight};
  color: #fff;
`;

const CloseButton = styled.button`
  background: rgba(38, 43, 65, 1);
  border: 2px solid #fff;
  color: #fff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(61, 61, 75, 1);
  }
  
  @media (min-width: 1921px) {
    width: 38px;
    height: 38px;
    border-width: 2.5px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  width: 100%;
`;
const AiDecisionLabel = styled.span`
  font-weight: ${typography.Label.fontWeight};
  font-size: ${typography.Label.fontSize};
`;
interface FilterButtonProps {
  $active: boolean;
}

const AiDecisionBtn = styled.button<FilterButtonProps>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: ${typography.button.fontWeight};
  font-size: ${typography.button.fontSize};
  transition: all 0.2s ease;
  
  background: ${props => props.$active ? "linear-gradient(to right, #00ff88, #00b4d8)" : "rgba(61, 61, 75, 1)"};
  color: ${props => props.$active ? "#000" : "#fff"};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const RematchBtn = styled.button`
  margin-left: auto;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(158, 240, 200, 0.45);
  background: rgba(0, 255, 136, 0.1);
  color: #9ef0c8;
  font-weight: 600;
  font-size: ${typography.button.fontSize};
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 255, 136, 0.18);
    border-color: rgba(158, 240, 200, 0.7);
  }

  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }
`;

const RematchProgressCard = styled.div`
  margin: 0 0 0.9rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(158, 240, 200, 0.28);
  background: rgba(0, 255, 136, 0.06);
`;

const RematchProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
`;

const RematchProgressTitle = styled.div`
  font-size: 0.86rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.92);
`;

const RematchProgressMeta = styled.div`
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgba(158, 240, 200, 0.85);
  white-space: nowrap;
`;

const RematchTrack = styled.div`
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const rematchShimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

const RematchFill = styled.div<{ $pulse?: boolean }>`
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #00ff88, #00b4d8, #00ff88);
  background-size: 200% 100%;
  transition: width 0.45s ease;
  animation: ${(p) =>
    p.$pulse
      ? css`
          ${rematchShimmer} 1.4s linear infinite
        `
      : "none"};
`;

const RematchStage = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem 0.65rem;
  margin-top: 0.55rem;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.4;
`;

const RematchStageLabel = styled.span`
  flex-shrink: 0;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(158, 240, 200, 0.3);
  background: rgba(0, 0, 0, 0.22);
  color: #9ef0c8;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const OppContent = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 400px;
  overflow-y: auto;

`;
const ContentContainer = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  

`;
const ContentHeader = styled.div`
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);

`;
const StyledHeading = styled.p`
  margin: 0 0 7px 0;
  padding: 0;
  font-size:${typography.datasHeading.fontSize};
  font-weight:${typography.datasHeading.fontWeight};
`;

// Styled paragraph with no default margin
const Para = styled.p`
  font-size:${typography.Value.fontSize};
  font-weight:${typography.Value.fontWeight};
  margin:0 0 0.5rem 0;
`;
const SpansContainer = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  border-radius: 6px;
  margin-bottom:1rem
`;

// Individual span with different background colors
const StyledSpan = styled.span`
  padding: 7px 7px;
  border-radius: 15px;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  display: inline-flex;      
  align-items: center;        
  justify-content: center;    
  height: 13px;               
  width: 60px;               
`;

// Specific span with blue background
const BlueSpan = styled(StyledSpan)`
  background-color: #bdbfc0ff;
  color: black;
`;

// Specific span with green background
const GreenSpan = styled(StyledSpan)`
  background-color: #2ecc71;
  color: black;
`;

// Specific span with orange background
const OrangeSpan = styled(StyledSpan)`
  background-color: #22e639ff;
  color: black;
`;
const OppLink = styled.a`
  display: block;
  font-size:${typography.button.fontSize};
  font-weight:${typography.button.fontWeight};
  border: 1px solid #e0e0e0;
  background-color: #a2c3e2ff;
  border-radius: 8px;
  padding: 10px;
  margin: 15px 0;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: #f9f9f9;
    border-color: #c9c9c9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;
const TextWrapper = styled.div`
  max-width: 100%;   
  width: 100%;       
`;
const expand = keyframes`
  from { max-height: 24px; }
  to { max-height: 500px; }
`;

const collapse = keyframes`
  from { max-height: 500px; }
  to { max-height: 24px; }
`;

const TruncatedText = styled.div<{ $expanded: boolean }>`
  overflow: hidden;
  line-height: 1.5;
  word-break: break-word;
  max-width: 100%;

  ${({ $expanded }) =>
    $expanded
      ? css`animation: ${expand} 1s ease forwards;`
      : css`animation: ${collapse} 0.4s ease forwards;`}
`;


const ToggleBtn = styled.button`
  margin-top: 4px;
  background: none;
  border: none;
  color: #007bff; 
  cursor: pointer;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  padding: 0;
`;