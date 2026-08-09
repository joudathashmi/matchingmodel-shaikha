// InvestmentTable.tsx
import React from "react";
import styled from "styled-components";
import { OpportunitieList, OpportunityDetails } from "../Card/CardTypes";
import typography from "../../../common/typography";


interface InvestmentTableProps {
  data: OpportunitieList[];
  onRowClick?: (row: OpportunitieList) => void;
}


const InvestmentTable: React.FC<InvestmentTableProps> = ({ data, onRowClick }) => {
  return (
    <TableWrapper>
      <StyledTable>
        <colgroup>
          <col style={{ width: "280px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "150px" }} />
        </colgroup>
        <TableHead>
          <Tr>
            <Th>Opportunity</Th>
            <Th>Sector</Th>
            <Th>Overall Score</Th>
            <Th>Profile</Th>
            <Th>Product</Th>
            <Th>Ai Similarity</Th>
            <Th>Sector</Th>
            <Th>Investment Size</Th>
            <Th>Jobs Created</Th>
          </Tr>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <Tr key={idx} onClick={() => onRowClick?.(row)} style={{ cursor: "pointer" }}>
              <Td first>
                <OpportunityTitle>{row.opportunityName}</OpportunityTitle>
              </Td>
              <Td>
                <SectorBadge bg={''}>{row.opportunitySector}</SectorBadge>
              </Td>
              <Td><ScoreBox>{Math.round(row.avgFinalScore * 100)}</ScoreBox></Td>
              <Td><GreenText>{Math.round(row.avgProfileSimilarity* 100)}</GreenText></Td>
              <Td><BlueText>{Math.round(row.avgProductSimilarity* 100)}</BlueText></Td>
              <Td><LimeText>{Math.round(row.avgAiScore* 100)}</LimeText></Td>
              <Td><OrangeText>{Math.round(row.avgSectorSimilarity* 100)}</OrangeText></Td>
              <Td>
                {/* {row.investmentSize} */}

              </Td>
              <Td>
                {/* {row.jobsCreated} */}

              </Td>
            </Tr>
          ))}
        </TableBody>
      </StyledTable>
    </TableWrapper>
  );
};

export default InvestmentTable;



const TableWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border-left: 2px solid #00b4d8;
  border-right: 2px solid #00b4d8;
  border-bottom: 2px solid #00b4d8;
  background-color: #0b2658ff;
  
  @media (min-width: 1921px) {
    border-radius: 16px;
    border-left-width: 3px;
    border-right-width: 3px;
    border-bottom-width: 3px;
  }
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 900px;
  width: 100%;

  th:first-child, td:first-child {
    width: 180px;         /* Opportunity column */
    white-space: normal;  /* wrap words */
    word-wrap: break-word;
    padding-right:0px;
  }

  th:nth-child(2),
  td:nth-child(2) {
    padding:12px 0px 12px 12px;
  }

  th:nth-child(3),
  td:nth-child(3) {
    padding:12px 0px 12px 3px;
    text-align:center;
  }
  
  th:nth-child(4),
  td:nth-child(4) {
    padding:12px 0px 12px 0px;
    text-align:center;
  }
  
  th:nth-child(5),
  td:nth-child(5) {
    text-align:center;
  }
  
  th:nth-child(6),
  td:nth-child(6) {
    text-align:center;
  }
  
  th:nth-child(7),
  td:nth-child(7) {
    text-align:center;
  }

  th:nth-child(8),
  td:nth-child(8) {
    font-weight:800;
    text-align:center;
  }

  th:nth-child(9),
  td:nth-child(9) {
    font-weight:800;
    text-align:center;
  }
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    min-width: 2100px;
    
    th:first-child, td:first-child {
      width: 240px;
    }
  }
`;

const TableHead = styled.thead`
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    th {
      padding: 16px 15px;
    }
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 13px; /* consistent spacing */
  color: black;
  font-size: ${typography.tableHeader.fontSize};
  font-weight: ${typography.tableHeader.fontWeight};
  white-space: nowrap; 
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 16px 15px;
  }
`;

const TableBody = styled.tbody`
  background-color: #141c2b;
`;

const Tr = styled.tr`
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    border-bottom-width: 3px;
  }
`;

const Td = styled.td<{ first?: boolean }>`
  padding: 14px;
  font-size: ${typography.tableDatas.fontSize};
  font-weight: ${typography.tableDatas.fontWeight};
  color: rgba(255, 255, 255, 0.9);
  vertical-align: center;

  ${({ first }) =>
    first &&
    `
    max-width: 220px;   /* 🔥 limit width */
    word-wrap: break-word;
    white-space: normal; 
  `}
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 18px;
    
    ${({ first }) =>
      first &&
      `
      max-width: 280px;
    `}
  }
`;

const OpportunityTitle = styled.div`
  font-size: ${typography.tableDatas.fontSize};
  font-weight: ${typography.tableDatas.fontWeight};
  margin-bottom: 4px;
  
  @media (min-width: 1921px) {
    margin-bottom: 6px;
  }
`;

const OpportunityDesc = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
`;

const SectorBadge = styled.span<{ bg: string }>`
  color: white;
  font-size: ${typography.tableDatas.fontSize};
  font-weight: ${typography.tableDatas.fontWeight};
  border-radius: 6px;
  display: inline-block;
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    border-radius: 8px;
  }
`;

const ScoreBox = styled.span`
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  color: #0e1420;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
  padding: 6px 10px;
  border-radius: 6px;
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 8px 14px;
    border-radius: 8px;
  }
`;

const OrangeText = styled.span`
  color: #ff9800;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
`;

const GreenText = styled.span`
  color: #00ff88;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
`;

const BlueText = styled.span`
  color: #00b4d8;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
`;

const LimeText = styled.span`
  color: #adff55ff;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
`;
