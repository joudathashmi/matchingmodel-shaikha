import React, { useEffect, useState } from "react";
import styled from "styled-components";
import jsPDF from "jspdf";
import { OpportunitieList, OpportunityDetails } from "./CardTypes";
import viewDetailIcon from "../../../assets/icons/google-doc.svg";
import companyIcon from '../../../assets/Company-profile-icons/building-06.svg';
import opportunitiesIcon from '../../../assets/icons/target-02.svg';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Link } from "react-router-dom";
// import { Document, Page, pdfjs } from 'react-pdf';
import typography from "../../../common/typography";
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface CardPopupProps {
  investment: OpportunitieList;
  onClose: () => void;
  detailedData?: OpportunityDetails;
  loading?: boolean;
  error: string | null;
  onOpportunityClick?: (aiDecision: string) => void;
  popupType?: 'analyze' | 'compare' | null;
}
type AiDecisionValue = 'All' | 'Yes' | 'No';
const CardPopup: React.FC<CardPopupProps> = ({ investment, onClose, detailedData,
  error,
  loading, onOpportunityClick, popupType }) => {
  console.log("investment", investment);

  const [activeTab, setActiveTab] = useState<'company' | 'opportunities'>('opportunities');
  const [aiDecision, setAiDecision] = useState('All');
  const [numPages, setNumPages] = useState<number | null>(null);


  const [aiDecisionFilter, setAiDecisionFilter] = useState<'All' | 'Yes' | 'No'>('All');
  const [filteredMatchingOutputs, setFilteredMatchingOutputs] = useState<any[]>([]);


  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  // useEffect(() => {
  //   fetch(
  //     "https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf"
  //   )
  //     .then((res) => {
  //       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  //       return res.arrayBuffer();
  //     })
  //     .then((data) => setPdfData(new Uint8Array(data)))
  //     .catch((err) => {
  //       console.error("Error loading PDF:", err);
  //     });
  // }, []);



  const handlePreview = () => {
    if (inputValue) {
      setIframeSrc(inputValue);
    }
  };
  const handleAiDecisionFilter = (decision: 'All' | 'Yes' | 'No') => {
    setAiDecisionFilter(decision);

    if (decision === 'All') {
      setFilteredMatchingOutputs(detailedData?.matching_outputs || []);
    } else {
      const filtered = detailedData?.matching_outputs?.filter(m => m.ai_decision === decision) || [];
      setFilteredMatchingOutputs(filtered);
    }
  };
  useEffect(() => {
    if (detailedData?.matching_outputs) {
      setFilteredMatchingOutputs(detailedData.matching_outputs);
    }
  }, [detailedData]);

  // Add this function inside your CardPopup component
  const generatePDF = () => {
    const customWidth = 350;
    const customHeight = 257;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [customWidth, customHeight]
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    console.log(`Page size: ${pageWidth}x${pageHeight}mm`);

    // ✅ Background
     doc.setFillColor(255, 255, 255); // White color
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // ✅ Header - Increased width
    doc.setFillColor(255, 255, 255);
    doc.rect(5, 10, pageWidth - 10, 40, "F");

    // ✅ SECTOR BOX - Left side (6cm width, 3cm height)
    const sectorBoxWidth = 120; // 6cm
    const sectorBoxHeight = 15; // 3cm

    // Green background box
    doc.setFillColor(0, 128, 0); // Green color
    doc.rect(10, 15, sectorBoxWidth, sectorBoxHeight, "F");

    // White "SECTOR" text inside box - LEFT ALIGNED
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); // White color
    doc.setFont("helvetica", "bold");
    doc.text("SECTOR", 15, 25); // ✅ Left aligned

    // ✅ SECTOR VALUE - Outside box (right side opposite)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color for value
    doc.setFont("helvetica", "normal");

    const sectorValue = detailedData?.sector || "N/A";
    const sectorValueX = 10 + sectorBoxWidth + 5; // 15mm gap from box
    doc.text(sectorValue, sectorValueX, 25);

    // ✅ FULL WIDTH UNDERLINE FOR SECTOR TITLE (95% width)
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5);
    const sectorUnderlineStartX = 10;
    const sectorUnderlineEndX = 10 + (pageWidth - 20) * 0.98; // 95% of page width
    const sectorUnderlineY = 31; // Below the boxes
    doc.line(sectorUnderlineStartX, sectorUnderlineY, sectorUnderlineEndX, sectorUnderlineY);

    // ✅ INVESTMENT OPPORTUNITY NAME BOX - Below sector box with reduced gap
    const oppBoxWidth = 120; // 6cm
    const oppBoxHeight = 15; // 3cm
    const oppBoxY = 15 + sectorBoxHeight + 2; // Reduced gap to 2mm

    // Green background box
    doc.setFillColor(0, 128, 0); // Green color
    doc.rect(10, oppBoxY, oppBoxWidth, oppBoxHeight, "F");

    // White "INVESTMENT OPPORTUNITY NAME" text inside box - LEFT ALIGNED
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); // White color
    doc.setFont("helvetica", "bold");
    doc.text("INVESTMENT OPPORTUNITY NAME", 15, oppBoxY + 10); // ✅ Left aligned

    // ✅ OPPORTUNITY NAME VALUE - Outside box (right side opposite)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color for value
    doc.setFont("helvetica", "normal");

    const oppName = detailedData?.opportunity_name || "N/A";
    const oppValueX = 10 + oppBoxWidth + 5; // 15mm gap from box
    const oppValueY = oppBoxY + 10;
    doc.text(oppName, oppValueX, oppValueY);

    // ✅ FULL WIDTH UNDERLINE FOR OPPORTUNITY TITLE (95% width)
    // const oppUnderlineY = oppBoxY + 15; // Below the opportunity boxes
    // doc.line(sectorUnderlineStartX, oppUnderlineY, sectorUnderlineEndX, oppUnderlineY);

    // ✅ Description (moved down to accommodate the boxes)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 128, 0); // Green text color
    doc.text("Description", 10, oppBoxY + oppBoxHeight + 20);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0)
    const description = detailedData?.opportunity_description || "N/A";
    const splitDescription = doc.splitTextToSize(description, pageWidth - 20);
    doc.text(splitDescription, 10, oppBoxY + oppBoxHeight + 30);

    let yPosition = oppBoxY + oppBoxHeight + 30 + splitDescription.length * 5 + 2;

    // ✅ Financial Highlights Section (3x2 grid)
    const financialRowHeight = 35;
    const financialColWidth = (pageWidth - 20) / 3;
    const financialColX = [10, 10 + financialColWidth, 10 + financialColWidth * 2];

    const financialFields = [
      { title: "Investment Range", value: detailedData?.investment_range || "N/A" },
      { title: "Key Demand Drivers", value: detailedData?.key_demand_drivers || "N/A" },
      { title: "GDP Impact", value: detailedData?.gdp_impact || "N/A" },
      { title: "Investment Appeal", value: detailedData?.investment_appeal || "N/A" },
      { title: "Jobs Created", value: detailedData?.jobs_created || "N/A" },
      { title: "Economic Impact", value: detailedData?.economic_impact || "N/A" },
    ];

    for (let i = 0; i < financialFields.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = financialColX[col];
      const y = yPosition + row * financialRowHeight;

      // Light green background
      doc.setFillColor(200, 255, 200);
      doc.rect(x - 2, y, financialColWidth - 3, financialRowHeight - 5, "F");

      // Title - LEFT ALIGNED
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 128, 0);
      doc.text(financialFields[i].title, x, y + 10);

      // ✅ CONSISTENT UNDERLINE
      doc.setDrawColor(0, 128, 0);
      doc.setLineWidth(0.8);
      const underlineY = y + 13;
      const underlineStartX = x;
      const underlineEndX = x + financialColWidth - 8;
      doc.line(underlineStartX, underlineY, underlineEndX, underlineY);

      // Value - LEFT ALIGNED
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      let displayValue: string | string[] = financialFields[i].value;

      const splitText = doc.splitTextToSize(displayValue as string, financialColWidth - 8);

      const maxLines = 2;
      let finalDisplayValue: string[];

      if (splitText.length > maxLines) {
        finalDisplayValue = splitText.slice(0, maxLines);
        finalDisplayValue[maxLines - 1] = finalDisplayValue[maxLines - 1].slice(0, -3) + "...";
      } else {
        finalDisplayValue = splitText;
      }

      let valueY = y + 19.2;
      finalDisplayValue.forEach((line: string) => {
        doc.text(line, x, valueY);
        valueY += 5;
      });
    }

    yPosition += financialRowHeight * 2 + 2;

    // ✅ 6 Columns Grid
    const totalMargin = 10;
    const colWidth = (pageWidth - totalMargin) / 6;
    const colX = [5, 5 + colWidth, 5 + colWidth * 2, 5 + colWidth * 3, 5 + colWidth * 4, 5 + colWidth * 5];
    const rowHeight = 90;

    const fields = [
      { title: "Market Readiness", value: detailedData?.market_readiness || "N/A" },
      { title: "Value Proposition", value: detailedData?.value_proposition || "N/A" },
      { title: "Investment Highlights", value: detailedData?.investment_highlights || "N/A" },
      { title: "Key Demand Drivers", value: detailedData?.key_demand_drivers || "N/A" },
      { title: "Key Players", value: detailedData?.key_players || "N/A" },
      { title: "Materials Required", value: detailedData?.materials_required || "N/A" },
    ];

    for (let i = 0; i < fields.length; i++) {
      const x = colX[i];
      const y = yPosition;

      // Box background
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, colWidth, rowHeight, "F");

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 128, 0);

      const titleMaxWidth = colWidth - 6;

      let formattedTitle = fields[i].title;
      if (fields[i].title === "Investment Highlights") {
        formattedTitle = "Investment\nHighlights";
      } else if (fields[i].title === "Value Proposition") {
        formattedTitle = "Value\nProposition";
      } else if (fields[i].title === "Market Readiness") {
        formattedTitle = "Market\nReadiness";
      } else if (fields[i].title === "Key Demand Drivers") {
        formattedTitle = "Key Demand\nDrivers";
      } else if (fields[i].title === "Key Players") {
        formattedTitle = "Key \nPlayers";
      } else if (fields[i].title === "Materials Required") {
        formattedTitle = "Materials\nRequired";
      }

      const splitTitle = doc.splitTextToSize(formattedTitle, titleMaxWidth);

      let titleY = y + 10;
      splitTitle.forEach((titleLine: string, index: number) => {
        doc.text(titleLine, x + 3, titleY);
        titleY += 5;
      });

      // Underline
      doc.setDrawColor(0, 128, 0);
      doc.setLineWidth(0.8);
      const underlineY = titleY - 2;
      doc.line(x + 3, underlineY, x + colWidth - 3, underlineY);

      // Value
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const valueText = fields[i].value;
      const splitValue = doc.splitTextToSize(valueText, colWidth - 8);

      const availableSpace = rowHeight - (underlineY - y) - 8;
      const lineHeight = 4.5;
      const maxLines = Math.floor(availableSpace / lineHeight);

      let displayValue: string[];
      if (splitValue.length > maxLines) {
        displayValue = splitValue.slice(0, maxLines);
      } else {
        displayValue = splitValue;
      }

      let valueY = underlineY + 6;
      displayValue.forEach((line: string) => {
        if (valueY < y + rowHeight - 5) {
          doc.text(line, x + 3, valueY);
          valueY += lineHeight;
        }
      });
    }

    // Update yPosition after the 6-column row
    yPosition += rowHeight + 30;

    // ✅ Save
    doc.save(`${detailedData?.opportunity_name || "N/A"}-report.pdf`);
  };
  const handleAiDecisionClick = (value: AiDecisionValue) => {
    setAiDecision(value);

    if (value === 'All') {
      console.log('All filter clicked - will not pass filter to API');
      // For "All", we don't want to trigger API call or pass any filter
      return;
    }

    onOpportunityClick?.(value);
    console.log('Selected AI Decision:', value);
  };
  ;
  const financials = [
    { label: "Investment Range (SAR)", value: "2000-3500M" },
    { label: "Jobs Created", value: "2000-3500" },
    { label: "IRR Range", value: "15-25%" },
    { label: "GDP Impact (SAR)", value: "10.0B" },
  ]



  if (loading) {
    return (
      <Overlay>
        <PopupContainer>
          <StickyHeader>
            <HeaderContent>
              <LeftCol>
                <Avatar>...</Avatar>
                <InfoBlock>
                  <OpportunityName>Loading...</OpportunityName>
                  <Badge>Loading</Badge>
                </InfoBlock>
              </LeftCol>
              <Divider />
              <MiddleCol>
                <span>Opportunities</span>
                <span>Loading Opportunities...</span>
              </MiddleCol>
            </HeaderContent>
            <CloseButton onClick={onClose}>×</CloseButton>
          </StickyHeader>
          {/* <ContentArea> */}
          {/* Loading content would go here */}
          {/* </ContentArea> */}
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
                  <OpportunityName>Error</OpportunityName>
                  <Badge>Error</Badge>
                </InfoBlock>
              </LeftCol>
              <Divider />
              <MiddleCol>
                <span>Opportunities</span>
                <span>Error loading Opportunities</span>
              </MiddleCol>
            </HeaderContent>
            <CloseButton onClick={onClose}>×</CloseButton>
          </StickyHeader>
          {/* <ContentArea> */}
          {/* Error content would go here */}
          {/* </ContentArea> */}
        </PopupContainer>
      </Overlay>
    );
  }


  return (
    <Overlay>
      <Modal>
        <StickyHeader>
          <HeaderContent>
            <LeftCol>
              <InfoBlock>
                <OpportunityName>{detailedData?.opportunity_name || "Null"}</OpportunityName>
                <Badge> {detailedData?.sector || 'Null'}</Badge>
              </InfoBlock>
              <Button onClick={generatePDF} style={{ marginTop: '20px', backgroundColor: '#007bff', color: 'white' }}>
                📄 Export to PDF
              </Button>
            </LeftCol>
            {/* <Divider /> */}

          </HeaderContent>
          <CloseButton onClick={onClose}>×</CloseButton>
        </StickyHeader>

        <ModalContent>
          <div style={{ marginTop: "1rem" }}>
            {/* <div style={{ marginTop: "1rem" }}> */}
            <DescriptionTitle>Description</DescriptionTitle>
            <DescriptionText> {detailedData?.opportunity_description ? detailedData.opportunity_description : 'N/A'}</DescriptionText>
            {/* </Section> */}
          </div>
          <TabBar>
            <Btn
              active={activeTab === 'opportunities' && popupType !== "compare"}
              onClick={() => setActiveTab('opportunities')}
            >
              <BtnIcon active={activeTab === 'opportunities' && popupType !== "compare"} src={companyIcon} />
              Opportunities Details
            </Btn>
            <Btn
              active={activeTab === 'company' || popupType === "compare"}
              onClick={() => setActiveTab('company')}
            >
              <BtnIcon active={activeTab === 'company' || popupType === "compare"} src={opportunitiesIcon} />
              Matched Companies
            </Btn>
          </TabBar>
          {/* AI Performance Metrics */}
          {activeTab === 'opportunities' && popupType !== "compare" && (
            <>

              <div>

                {/* Column 2 */}
                <Column>
                  <Section>
                    {/* <SectionTitle>Financial Highlights</SectionTitle> */}
                    <Grid>
                      {/* {financials.map((fin, idx) => ( */}
                      <HighlightBox >
                        <MetricBox color={''}>
                          <FinancialLabel>Investment Range (SAR)</FinancialLabel>
                          <FinValue data-tooltip-id="tooltip-Popup" data-tooltip-content={detailedData?.investment_range ? detailedData.investment_range : "N/A"} >
                            {detailedData?.investment_range ? detailedData.investment_range : "N/A"}
                          </FinValue>
                        </MetricBox>
                      </HighlightBox>

                      <HighlightBox >
                        <MetricBox color={''}>
                          <FinancialLabel>Jobs Created</FinancialLabel>
                          <FinValue data-tooltip-id="tooltip-Popup" data-tooltip-content={detailedData?.jobs_created ? detailedData.jobs_created : "N/A"}>
                            {detailedData?.jobs_created ? detailedData.jobs_created : "N/A"}
                          </FinValue>
                        </MetricBox>
                      </HighlightBox>

                      <HighlightBox >
                        <MetricBox color={''}>
                          <FinancialLabel>Key Demand Drivers</FinancialLabel>
                          <FinValue data-tooltip-id="tooltip-Popup" data-tooltip-content={detailedData?.key_demand_drivers ? detailedData.key_demand_drivers : "N/A"}>
                            {detailedData?.key_demand_drivers ? detailedData.key_demand_drivers : "N/A"}
                          </FinValue>
                        </MetricBox>
                      </HighlightBox>

                      <HighlightBox >
                        <MetricBox color={''}>
                          <FinancialLabel>GDP Impact (SAR)</FinancialLabel>
                          <FinValue data-tooltip-id="tooltip-Popup" data-tooltip-content={detailedData?.gdp_impact ? detailedData.gdp_impact : "N/A"}>
                            {detailedData?.gdp_impact ? detailedData.gdp_impact : "N/A"}
                          </FinValue>
                        </MetricBox>
                      </HighlightBox>
                      {/* ))} */}
                    </Grid>
                  </Section>

                  {/* Market Analysis Section */}
                  {/* {investment.marketAnalysis && ( */}

                  {/* )} */}
                </Column>

                {/* Column 1 */}
                <Column>
                  <div>
                    {/* <SectionTitle>5G Network Infrastructure</SectionTitle> */}
                    <MatrixBoxParent>
                      <OneColumnGrid>

                        <Section color={''}>
                          <Label color={'#00ff88'}>Investment Appeal</Label>
                          <Value>{detailedData?.investment_appeal ? detailedData.investment_appeal : "N/A"}</Value>
                        </Section>
                        <Section color={''}>
                          <Label color={'#00b7ffff'}>Economic Impact</Label>
                          <Value>{detailedData?.economic_impact ? detailedData.economic_impact : "N/A"}</Value>
                        </Section>
                        <Section color={''}>
                          <Label color={'#adff55ff'}>Market Readiness</Label>
                          <Value>{detailedData?.market_readiness ? detailedData.market_readiness : "N/A"}</Value>
                        </Section>
                        <Section color={''}>
                          <Label color={'#ffaa00'}>Value Proposition</Label>
                          <Value>{detailedData?.value_proposition ? detailedData.value_proposition : "N/A"}</Value>
                        </Section>

                      </OneColumnGrid>
                    </MatrixBoxParent>
                  </div>


                </Column>


              </div>




              <div style={{ marginTop: "1rem" }}>
                <Section>
                  <SectionTitle>Investment Highlights</SectionTitle>
                  <DescriptionText>{detailedData?.investment_highlights ? detailedData.investment_highlights : 'N/A'}</DescriptionText>
                </Section>

              </div>
              {/* <div style={{ marginTop: "1rem" }}>
                <Section>
                  <SectionTitle>Value Proposition</SectionTitle>
                  <DescriptionText>{detailedData?.value_proposition ? detailedData.value_proposition : 'N/A'}</DescriptionText>
                </Section>
              </div> */}
              <div style={{ marginTop: "1rem" }}>
                <Section>
                  <SectionTitle>Key Demand Drivers</SectionTitle>
                  <DescriptionText>{detailedData?.key_demand_drivers ? detailedData.key_demand_drivers : 'N/A'}</DescriptionText>
                </Section>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <Section>
                  <SectionTitle>Key Players</SectionTitle>
                  <DescriptionText>{detailedData?.key_players ? detailedData.key_players : 'N/A'}</DescriptionText>
                </Section>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <Section>
                  <SectionTitle>Materials Required</SectionTitle>
                  <DescriptionText>{detailedData?.materials_required ? detailedData.materials_required : 'N/A'}</DescriptionText>
                </Section>
              </div>
              {detailedData?.url && (
                <WebsiteBtn>
                  <Website href={detailedData.url} target="_blank" rel="noopener noreferrer">
                    Visit the Opportunity URL by clicking here
                  </Website>
                </WebsiteBtn>
              )}
            </>
          )} {(activeTab === "company" || popupType === "compare") && (<div>
            <FilterContainer>
              <AiDecisionLabel>Filter by AI Decision:</AiDecisionLabel>
              <AiDecisionBtn
                $active={aiDecisionFilter === 'All'}
                onClick={() => handleAiDecisionFilter('All')}
              >
                All ({detailedData?.matching_outputs?.length || 0})
              </AiDecisionBtn>

              <AiDecisionBtn
                $active={aiDecisionFilter === 'Yes'}
                onClick={() => handleAiDecisionFilter('Yes')}
              >
                Yes ({detailedData?.matching_outputs?.filter(m => m.ai_decision === 'Yes').length || 0})
              </AiDecisionBtn>

              <AiDecisionBtn
                $active={aiDecisionFilter === 'No'}
                onClick={() => handleAiDecisionFilter('No')}
              >
                No ({detailedData?.matching_outputs?.filter(m => m.ai_decision === 'No').length || 0})
              </AiDecisionBtn>
            </FilterContainer>

            {/* Display filtered opportunities */}
            <OppContent >
              {filteredMatchingOutputs.map((matching, index) => (
                <ContentContainer key={matching.id || index}>
                  <ContentHeader>
                    <StyledHeading>{matching.company.company_name || 'N/A'}</StyledHeading>
                    <Para style={{ marginTop: "0rem" }}>{matching.company.company_sector || 'N/A'}</Para>
                    <br />
                    <SpansContainer>
                      <BlueSpan>Rank: {matching.rank || 'N/A'}</BlueSpan>
                      <GreenSpan>{Math.round(matching.final_score * 100)}%</GreenSpan>
                      <OrangeSpan>AI: {matching.ai_decision}</OrangeSpan>
                    </SpansContainer>
                  </ContentHeader>
                  <div>
                    <div style={{ marginTop: "0.6rem" }}>Match Reason:</div>
                    <Para style={{ marginTop: "0.3rem" }}>
                      {matching.ai_explanation || 'N/A'}
                    </Para>
                    <OppLink target="_blank"
                      rel="noopener noreferrer"
                      href={matching.company.website_url}>
                      Click to View Company Website
                    </OppLink>
                  </div>
                </ContentContainer>))
              }
            </OppContent>

          </div>)}

          {/* <Button>
            <ViewIcon src={viewDetailIcon} /> View Full Details
          </Button> */}
          {/* <iframe src="https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf" title="Manual" width="100%" height="600px" /> */}

          {/* This is working Preview Container       */}
          {/* <Container>
            <InputRow>
              <UrlInput
                type="text"
                placeholder="Enter PDF URL here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <PreviewButton onClick={handlePreview}>Preview</PreviewButton>
            </InputRow>

            {iframeSrc && (
              <IframeWrapper>
                <iframe src={iframeSrc} title="PDF Preview" />
              </IframeWrapper>
            )}
          </Container> */}

        </ModalContent>
        <Tooltip
          id="tooltip-Popup"
          place="top"
          float
          style={{
            maxWidth: "300px",
            whiteSpace: "normal",
            wordWrap: "break-word",

          }}
        />
      </Modal>
    </Overlay>
  );
};

export default CardPopup;

const MatrixBoxParent = styled.div`
  @media (min-width: 1921px) {
    margin-top: 1.5rem;
  }
`;

// ===== Styled Components =====
const ViewIcon = styled.img`
  height: 15.3px;
  width: 15.2px;
  
  @media (min-width: 1921px) {
    height: 25px;
    width: 25px;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding-top: 2rem;

  @media (max-width: 768px) {
    align-items: stretch;
    overflow-y: auto;
    padding: 0.75rem;
  }
`;

const Modal = styled.div`
  background: rgba(38, 43, 65, 1);
  padding: 1rem;
  border-radius: 16px;
  width: min(950px, calc(100vw - 1.5rem));
  max-width: 100%;
  max-height: 85vh;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  overflow: hidden;
  box-sizing: border-box;
  
  @media (min-width: 1921px) {
    width: min(1500px, calc(100vw - 3rem));
    padding: 1.5rem;
    border-radius: 20px;
  }

  @media (max-width: 768px) {
    border-radius: 12px;
    max-height: 92dvh;
    padding: 0.75rem;
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
  width: 100%;
  box-sizing: border-box;
  position: relative;
  
  @media (min-width: 1921px) {
    padding: 25px 25px 20px 25px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  
  @media (min-width: 1921px) {
    gap: 18px;
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
  margin-left: auto; 
  
  &:hover {
    background: rgba(61, 61, 75, 1);
  }
  
  @media (min-width: 1921px) {
    width: 38px;
    height: 38px;
    border-width: 2.5px;
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

const OpportunityName = styled.h2`
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
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
const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 15px;
  min-width: 0;
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
  
  @media (min-width: 1921px) {
    padding: 25px;
    
    &::-webkit-scrollbar {
      width: 10px;
    }
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 1921px) {
    gap: 2.5rem;
  }
`;

const Column = styled.div`
 margin:1rem 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 1921px) {
    gap: 1.5rem;
  }
`;
const OneColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; 
  gap: 1rem;
  width: 100%;

  @media (min-width: 1921px) {
    gap: 1.5rem;
  }
`;

const Section = styled.div`
  background: rgba(27, 31, 44, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    margin: 0;
    min-height: auto;
  }
  
  @media (min-width: 1921px) {
    padding: 25px;
    border-radius: 16px;
  }
`;
const WebsiteBtn = styled.div`
 
  margin-top:1rem;
  display:flex;
  align-items:center;
  justify-content:center;
  `;
const Website = styled.a`
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  color: #ffffff;
  background: #30a36dff;
  padding:0.5rem 1rem;
  border-radius:50px;
  text-decoration: none;
  @media (min-width: 1921px) {
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
  }

  &:hover {
    color: #8ecbff; 
    text-decoration: underline;
    background: #000000ff;
    
  }
`;

const SectionTitle = styled.h3`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  margin-top:0.03rem;
  margin-bottom: 7px;
  color: rgba(5, 250, 140, 1);
  
  @media (min-width: 1921px) {
    margin-bottom: 10px;
  }
`;

const DescriptionText = styled.p`
  margin: 0;
  flex: 1;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};

`;

const Label = styled.strong<{ color: string }>`
  padding-bottom: 0.10rem;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgba(5, 250, 140, 1);
  
  @media (min-width: 1921px) {
    padding-bottom: 0.15rem;
  }
`;
const Value = styled.span`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: white;
`;
const FinancialLabel = styled.strong`
  color: rgb(0, 255, 136);
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
`;
const FinValue = styled.span`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: white;
  cursor:pointer;
   display: -webkit-box;
  -webkit-line-clamp: 1; 
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

`;


const MetricBox = styled.div<{ color: string }>`
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  @media (min-width: 1921px) {
    padding: 25px;
    border-radius: 10px;
    
  }
`;

const HighlightBox = styled.div`
  // display: flex;
  // flex-direction: column;
  // justify-content: center;
  // height: 64px;
  text-align:center;
  // strong {
  //   font-size: 16px;
  //   display: block;
  // }
  
  // /* 4K Responsiveness */
  // @media (min-width: 1921px) {
  //   height: 100px;
    
  //   strong {
  //     font-size: 1.4rem;
  //   }
  // }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: #00ff888d;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 20px;
  width: 100%;
  
  @media (min-width: 1921px) {
    padding: 15px 25px;
    border-radius: 10px;
    font-size: 1.5rem;
    margin-top: 25px;
    gap: 5px;
  }
`;

const TabBar = styled.div`
  display: flex;
  margin: 16px 0 29px 0;
  border-radius: 8px;
  overflow: hidden;
  
  @media (min-width: 1921px) {
    margin: 15px 0 39px 0;
    border-radius: 10px;
  }
`;

const DescriptionTitle = styled.h3`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  colour: white;
`;

const Btn = styled.button<{ active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: ${({ active }) =>
    active ? "linear-gradient(to right, #00ff88, #00b4d8)" : "rgba(61, 61, 75, 1)"};
  color: ${({ active }) => (active ? "#000" : "#fff")};
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
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


const FilterContainer = styled.div`
  display: flex;
  align-items:center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  width: fit-content;
`;
const AiDecisionLabel = styled.span`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
`;
interface FilterButtonProps {
  $active: boolean;
}

const AiDecisionBtn = styled.button<FilterButtonProps>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  transition: all 0.2s ease;
  
  background: ${props => props.$active ? "linear-gradient(to right, #00ff88, #00b4d8)" : "rgba(61, 61, 75, 1)"};
  color: ${props => props.$active ? "#000" : "#fff"};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;
const OppContent = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 400px;
  overflow-y: auto;

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
  
  @media (min-width: 1921px) {
    padding: 25px;
    
    &::-webkit-scrollbar {
      width: 10px;
    }
  }

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
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
`;

// Styled paragraph with no default margin
const Para = styled.p`
  margin:0%;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
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
  border: 1px solid #e0e0e0;
  background-color: #a2c3e2ff;
  border-radius: 8px;
  padding: 10px;
  margin: 15px 0;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: #f9f9f9;
    border-color: #c9c9c9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const PopupContainer = styled.div`
  background: rgba(38, 43, 65, 1);
  color: #fff;
  width: min(950px, calc(100vw - 1.5rem));
  max-width: 100%;
  max-height: 85vh;
  border-radius: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (min-width: 1921px) {
    width: min(1300px, calc(100vw - 3rem));
    max-height: 75vh;
    border-radius: 16px;
  }

  @media (max-width: 768px) {
    max-height: 92dvh;
    border-radius: 12px;
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
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  flex-shrink: 0;
  
  @media (min-width: 1921px) {
    width: 49px;
    height: 49px;
  }
`;
const MiddleCol = styled.p`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;

  span:first-child {
    font-size: ${typography.smallTitle.fontSize};
    font-weight: ${typography.smallTitle.fontWeight};
    color: #aaa;
  }

  span:last-child {
    font-size: ${typography.smallTitle.fontSize};
    font-weight: ${typography.smallTitle.fontWeight};
    color: #fff;
    
  }
  
  @media (min-width: 1921px) {
    gap: 6px;
    margin-top: 10px;
  }
`;


const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top:1rem
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  outline:none;
`;

const PreviewButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
`;

const IframeWrapper = styled.div`
  width: 100%;
  height: 500px;

  iframe {
    width: 100%;
    height: 100%;
    border: 1px solid #ccc;
  }
`;