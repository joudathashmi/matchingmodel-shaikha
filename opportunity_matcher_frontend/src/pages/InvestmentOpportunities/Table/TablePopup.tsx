import React from "react";
import styled from "styled-components";
import { InvestmentTableData } from "./TableTypes";
import viewDetailIcon from "../../../assets/icons/google-doc.svg";

interface TablePopupProps {
    data: InvestmentTableData;
    onClose: () => void;
}

const TablePopup: React.FC<TablePopupProps> = ({ data, onClose }) => {
    return (
        <Overlay>
            <Modal>

                <Header>
                    <h2>{data.opportunity}</h2>
                    <CloseBtn onClick={onClose}>✖</CloseBtn>
                </Header>

                <ModalContent>
                    <TwoColumnGrid>
                        {/* Column 1 */}
                        <div>
                            <Section>
                                <SectionTitle>AI Performance Metrics</SectionTitle>
                                <Grid>
                                    <MetricBox color="#00ff88">
                                        <ValueNo color="#00ff88">{data.investmentAppeal}</ValueNo>
                                        <Label>INVESTMENT APPEAL</Label>
                                    </MetricBox>
                                    <MetricBox color="#00b7ffff">
                                        <ValueNo color="#00b7ffff">{data.economicImpact}</ValueNo>
                                        <Label>ECONOMIC IMPACT</Label>
                                    </MetricBox>
                                    <MetricBox color="#adff55ff">
                                        <ValueNo color="#adff55ff">{data.marketReady}</ValueNo>
                                        <Label>MARKET READY</Label>
                                    </MetricBox>
                                    <MetricBox color="#ffaa00">
                                        <ValueNo color="#ffaa00">{data.innovation}</ValueNo>
                                        <Label>INNOVATION</Label>
                                    </MetricBox>
                                </Grid>
                            </Section>

                            <Section>
                                <SectionTitle>Description</SectionTitle>
                                <p>{data.description}</p>
                            </Section>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <Section>
                                <SectionTitle>Over All Score</SectionTitle>
                                <ScoreWrapper>
                                    <ScoreBox>
                                        {data.overallScore}
                                    </ScoreBox>
                                </ScoreWrapper>
                            </Section>
                            <Section>
                                <SectionTitle>Financial Highlights</SectionTitle>
                                <Grid>
                                    <HighlightBox>
                                        <FinValue>{data.investmentSize}</FinValue>
                                        <Label>Investment Size (SAR)</Label>
                                    </HighlightBox>
                                    <HighlightBox>
                                        <FinValue>{data.jobsCreated}</FinValue>
                                        <Label>Jobs Created</Label>
                                    </HighlightBox>
                                </Grid>
                            </Section>

                            {data.sector && (
                                <Section>
                                    <SectionTitle>Sector</SectionTitle>
                                    <FinValue >
                                        {data.sector}
                                    </FinValue>
                                </Section>
                            )}

                            <Button>
                                <ViewIcon src={viewDetailIcon} /> View Full Details
                            </Button>
                        </div>
                    </TwoColumnGrid>
                </ModalContent>
            </Modal>
        </Overlay>
    );
};

export default TablePopup;

const ScoreWrapper = styled.div`
 display:flex;
 justify-content:center;
`;
const ScoreBox = styled.span`
  
 background: linear-gradient(45deg, #00ff88, #00b4d8);
  color: #0e1420;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 3rem;
`;
// ===== Styled Components =====
const ViewIcon = styled.img`
  height: 15.3px;
  width: 15.2px;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  z-index: 999;
  padding-top: 5rem;

  @media (max-width: 768px) {
    margin-top: 14rem;
    align-items: flex-start;
    overflow-y: auto;
    padding: 1rem;
  }
`;

const Modal = styled.div`
  background: #0d1224;
  padding: 1rem;
  border-radius: 16px;
  width: 850px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
`;

const Header = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: #0d1224;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;

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
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const Section = styled.div`
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);

  @media (max-width: 768px) {
    margin: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  color: #00b4d8;
  border-bottom: 1px solid rgba(0, 180, 216, 0.2);
`;

const ValueNo = styled.strong<{ color: string }>`
  padding-bottom: 0.66rem;
  font-size: 2.5rem;
  font-weight: bold;
  color: ${(props) => props.color || "#fff"};
`;

const FinValue = styled.strong`
  color: white;
`;

const Label = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`;

const MetricBox = styled.div<{ color: string }>`
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 8px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  width: 130px;
  height: 120px;
`;

const HighlightBox = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  strong {
    font-size: 16px;
    display: block;
  }
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
`;
