import styled from "styled-components";
import CompanyDatasetCard from "./Cards/CompanyDatasetCard";
import MarketIntelligenceCard from "./Cards/MarketIntelligenceCard";
import CompanyFilter from "./CompanyFilter";
import CompanyDetails from "./Cards/CompanyDetails";
import { CompaniesListFilters } from "../../store/types/companiesListTypes";
import { useState } from "react";
import typography from "../../common/typography";



const CompanyDashboard: React.FC = () => {
  const [appliedFilters, setAppliedFilters] = useState<CompaniesListFilters>({});

  const handleFilterChange = (filters: CompaniesListFilters) => {
    setAppliedFilters(filters);
  };

  return (
    <Dashboard>
      <MainContent>
        <PageHeader>
          <PageTitle>Companies</PageTitle>
          <PageSubtitle>
            Company profiles with MENA and Saudi Arabia presence
          </PageSubtitle>
        </PageHeader>

        {/* <TagsWrapper>
          <Tag>MENA Active</Tag>
          <Tag>Saudi Present</Tag>
          <Tag>RHQ Status</Tag>
        </TagsWrapper> */}


        <CompanyFilter onFilterChange={handleFilterChange} />

        <CompanyDatasetCard filters={appliedFilters} />

        <MarketIntelligenceCard />
      </MainContent>
    </Dashboard>

  )
}

export default CompanyDashboard;

const Dashboard = styled.div`
  display: flex;
  flex-direction: column; 
  height: 100%;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0.5rem clamp(0.5rem, 1.5vw, 1rem) 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
`;


const PageHeader = styled.div`
  margin-bottom: 0.5rem;
@media (max-width: 768px) {
  margin-left: 1rem; 
}
`;

const PageTitle = styled.h1`
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  margin: 0 0 0.4rem 0;
  color: #ffffff;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;

const PageSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.62);
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  margin: 0;
  line-height: 1.45;
`;

const Tag = styled.span`
  background-color: rgba(41, 62, 83, 1); 
  color: #ffffff; 
  font-size: 0.85rem;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 8px;
  display: inline-block;
  margin-right: 8px;
  @media (min-width: 2560px) { 
    font-size: 1.4rem;
    padding: 12px 21px;
    border-radius: 12px;
  }
`;

const TagsWrapper = styled.div`
  display: flex;
  gap: 0.6rem;
`;