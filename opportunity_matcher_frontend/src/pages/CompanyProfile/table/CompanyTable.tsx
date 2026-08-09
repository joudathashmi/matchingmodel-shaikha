import React from "react";
import styled from "styled-components";
import { CompanyTableTypes } from "../CompanyTypes";
import typography from "../../../common/typography";
import {
  normalizeWebsiteUrl,
  websiteDisplayHost,
} from "../../../common/websiteUrl";


interface CellProps {
  padding?: string;
  isFirst?: boolean;
}

// adjust the path

// ✅ define props type
interface CompanyTableProps {
  companie: CompanyTableTypes[];
  onCompanyClick: (companyId: number) => void; // Change to accept ID
}


const CompanyTable: React.FC<CompanyTableProps> = ({ companie, onCompanyClick }) => {
  console.log("companie", companie);

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

  return (
    <TableWrapper>
      <StyledTable>
        <colgroup>
          <col style={{ width: "200px" }} />   {/* Company Name */}
          <col style={{ width: "230px" }} />   {/* Sector */}
          <col style={{ width: "250px" }} />   {/* Product */}
          <col style={{ width: "157.5px" }} />   {/* Year Founded */}
          <col style={{ width: "220px" }} />   {/* Website */}
          <col style={{ width: "160px" }} />   {/* Country */}
          <col style={{ width: "167px" }} />   {/* Employees */}
          <col style={{ width: "120px" }} />   {/* Revenue */}
        </colgroup>
        <TableHead>
          <tr>
            <HeadCell isFirst padding="12px 3px 12px 9px" >Company Name</HeadCell>
            <HeadCell isFirst padding="12px 5px 12px 5px" >Sector</HeadCell>
            <HeadCell isFirst padding="12px 0px 12px 5px" >Product / Services</HeadCell>
            <HeadCell padding="12px 0px 12px 0px">Year Founded</HeadCell>
            <HeadCell isFirst>Website</HeadCell>
            <HeadCell isFirst padding="12px 5px 12px 0px">Country</HeadCell>
            <HeadCell padding="12px 0px 12px 0px">Global Employees</HeadCell>
            <HeadCell>Revenue</HeadCell>
          </tr>
        </TableHead>
        <tbody>
          {companie.map((c: any, idx: number) => (
            <TableRow
              key={idx}
              onClick={() => onCompanyClick(c.id)} // Pass just the ID
              style={{ cursor: "pointer" }}
            >
              <TableCell padding="12px 3px 12px 9px " isFirst>{c.company_name}</TableCell>
              <TableCell padding="12px 5px 12px 5px " isFirst>{c.company_sector}</TableCell>
              <TableCell padding="12px 0px 12px 0px " isFirst>  <CellContent maxWidth="200px">{c.product_services}</CellContent>
                {/* <TooltipWrapper>
                  {c.product_services}
                  <Tooltip>
                    {c.product_services}
                  </Tooltip>
                </TooltipWrapper> */}
              </TableCell>
              <TableCell padding="12px 0px 12px 0px" >{c.year_founded}</TableCell>
              <TableCell
                isFirst
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const href = normalizeWebsiteUrl(
                    c.website_url || c.website
                  );
                  if (!href) {
                    return <Muted>—</Muted>;
                  }
                  return (
                    <WebsiteLink
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={href}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {websiteDisplayHost(href)}
                    </WebsiteLink>
                  );
                })()}
              </TableCell>
              <TableCell isFirst style={{ color: "rgba(5, 234, 160, 1)" }} padding="12px 5px 12px 0px">
                {c.global_headquarters}
              </TableCell>
              <TableCell padding="12px 0px 12px 0px">
                {c.number_of_employees ? c.number_of_employees.toLocaleString("en-US") : "N/A"}
              </TableCell>
              <TableCell>{c.revenue_usd ?formatRevenue(c.revenue_usd): "N/A"}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </StyledTable>
    </TableWrapper>
  );
};

export default CompanyTable;


const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 12px;
  border-left: 2px solid #00b4d8;
  border-right: 2px solid #00b4d8;
  border-bottom: 2px solid #00b4d8;
  margin: 1rem 0;

 
  @media (min-width: 1921px) {
    border-radius: 16px;
    border-left-width: 3px;
    border-right-width: 3px;
    border-bottom-width: 3px;
    margin: 1.5rem 0;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;

  
  @media (min-width: 1921px) {
    border-radius: 12px;
  }
`;

const TableHead = styled.thead`
  background: linear-gradient(90deg, #00ff88, #00b4d8);
  color: black;

  
`;

const HeadCell = styled.th<CellProps>`
  padding: ${(p) => p.padding || "12px 16px"};
  font-size: ${typography.tableHeader.fontSize};
  font-weight: ${typography.tableHeader.fontWeight};
  border-left: 1px solid rgba(255, 255, 255, 0.1);

  
  @media (min-width: 1921px) {
    padding: ${(p) => p.padding || "16px 20px"};
  }

 
  text-align: ${(p) => (p.isFirst ? "left" : "center")};
  vertical-align: middle;

  &:first-child {
    border-left: none;
  }
`;

const TableRow = styled.tr`
  background: rgba(33, 33, 48, 1);
  color: white;

  &:nth-child(even) {
    background: rgba(33, 33, 48, 1);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TableCell = styled.td<CellProps>`
  font-size: ${typography.tableDatas.fontSize};
  font-weight: ${typography.tableDatas.fontWeight};
  padding: ${(p) => p.padding || "12px 16px"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (min-width: 1921px) {
    padding: ${(p) => p.padding || "16px 20px"};
  }

  text-align: ${(p) => (p.isFirst ? "left" : "center")};
  vertical-align: middle;

  &:first-child {
    border-left: none;
  }
`;
const CellContent = styled.div<{ maxWidth?: string }>`
  display: -webkit-box;
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${(p) => p.maxWidth || "100px"};
  
  @media (min-width: 1921px) {
    max-width: ${(p) => p.maxWidth || "300px"};
  }
`;
const TableCellProduct = styled.td<CellProps>`
  padding: ${(p) => p.padding || "12px 16px"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-overflow: ellipsis;

  @media (min-width: 1921px) {
    padding: ${(p) => p.padding || "16px 20px"};
    font-size: 1.43rem;

  }

  text-align: ${(p) => (p.isFirst ? "left" : "center")};
  vertical-align: middle;

  &:first-child {
    border-left: none;
  }
`;
const WebsiteLink = styled.a`
  display: inline-block;
  max-width: 180px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(111, 185, 255, 0.1);
  color: #6fb9ff;
  text-decoration: none;
  font-size: ${typography.tableDatas.fontSize};
  font-weight: ${typography.tableDatas.fontWeight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 1921px) {
    max-width: 220px;
    padding: 6px 10px;
    border-radius: 8px;
  }

  &:hover {
    background: rgba(111, 185, 255, 0.2);
    text-decoration: underline;
  }
`;

const Muted = styled.span`
  color: rgba(255, 255, 255, 0.35);
  font-size: ${typography.tableDatas.fontSize};
`;

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;

  &:hover span {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = styled.span`
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s;
  width: 220px;
  background: #222;
  color: #fff;
  text-align: left;
  padding: 8px 12px;
  border-radius: 6px;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 0;
  font-size: 12px;

  @media (min-width: 1921px) {
    width: 260px;
    padding: 10px 14px;
    border-radius: 8px;
  }
`;

