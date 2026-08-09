import React from "react";
import styled from "styled-components";
import typography from "../../../common/typography";
import {
  normalizeWebsiteUrl,
  websiteDisplayHost,
} from "../../../common/websiteUrl";


const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 1rem;
  margin: 1rem 0;
  width: 100%;
  min-width: 0;

  @media (min-width: 1921px) {
    gap: 1.5rem;
    margin: 1.5rem 0;
  }
`;

const Card = styled.div`
  background: #2A2A3A;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  color: #ffffff;
  position: relative;
  overflow: hidden; 
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #00ff88, #00b4d8);
    
    
    @media (min-width: 1921px) {
      height: 4px;
    }
  }

  @media (min-width: 1921px) {
    border-radius: 20px;
    padding: 1.75rem 2rem;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 2rem;
  align-items: center;
  justify-items: start;

  @media (min-width: 1921px) {
    grid-template-columns: 1fr 1fr; 
    gap: 1.5rem 2.5rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;    
    gap: 1rem;
  }
`;


const Cell = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0; 

  
  @media (min-width: 1921px) {
    gap: 0.25rem;
  }
`;


const Label = styled.div`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};

  color: #D0D0D0;
  margin-bottom: 0.2rem;

  
  @media (min-width: 1921px) {
    margin-bottom: 0.3rem;
  }
`;

const Value = styled.div`
  font-size: ${typography.Value.fontSize};
  color: #FFFFFF;
  font-weight: ${typography.Value.fontWeight};
  white-space: nowrap;       
  overflow: hidden;          
  text-overflow: ellipsis;   

 
`;

const CompanyName = styled(Value)`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  white-space: normal;   
  overflow: visible;     
  text-overflow: unset;  
  word-break: break-word;


`;

const Country = styled(Value)`
  color: #00e676;
  font-weight: ${typography.Value.fontWeight};
  white-space: normal;   
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;

  
`;

const SectorValue = styled(Value)`
  white-space: normal;   
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;

 
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



interface CompanyGridProps {
  companies: any[];
  onCompanyClick?: (company: any) => void;
  // dummyCompaniesUrls?: { website: string }[]; 
  dummyCompaniesUrls: string
}

const CompanyGrid: React.FC<CompanyGridProps> = ({ companies, onCompanyClick, dummyCompaniesUrls }) => {
  const formatRevenue = (value?: number | null) => {
    if (value == null) return "N/A";

    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1) + " B";
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + " M";
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + " K";
    }
    return value.toString();
  };

  return (
    <GridWrapper>
      {companies.map((c, idx) => (
        <Card key={idx} onClick={() => onCompanyClick && onCompanyClick(c.id)}>

          <Cell>
            <Label>Company</Label>
            <CompanyName>{c.company_name}</CompanyName>
          </Cell>
          <div style={{marginTop:"1rem", marginBottom:"1rem"}}>
          <Cell>
            <Label>Sector</Label>
            <SectorValue>{c.company_sector}</SectorValue>
          </Cell>
          </div>
          <CardGrid>



            <Cell>
              <Label>Product / Service</Label>
              <Value>
                {c.product_services
                  ? c.product_services.split(" ").slice(0, 13).join(" ") + (c.product_services.split(" ").length > 15 ? " ..." : "")
                  : "-"}
              </Value>
            </Cell>
            <Cell>
              <Label>Year Founded</Label>
              <Value>{c.year_founded}</Value>
            </Cell>
            <Cell>
              <Label>Website</Label>
              {(() => {
                const href = normalizeWebsiteUrl(c.website_url);
                if (!href) return <Value>-</Value>;
                return (
                  <Website
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={href}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {websiteDisplayHost(c.website_url)}
                  </Website>
                );
              })()}
            </Cell>
            <Cell>
              <Label>Country</Label>
              <Country>{c.global_headquarters}</Country>
            </Cell>

            <Cell>
              <Label>Global Employees</Label>
              <Value>{c.number_of_employees ? c.number_of_employees.toLocaleString() : "N/A"}</Value>
            </Cell>
            <Cell>
              <Label>Revenue</Label>
              <Value>{formatRevenue(c.revenue_usd)}</Value>
            </Cell>
          </CardGrid>
        </Card>
      ))}
    </GridWrapper>
  );
};


export default CompanyGrid;
