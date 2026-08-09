import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import { getCompaniesList, setCompaniesListFilters } from '../../../store/actions/companiesListActions';
import {
  selectCompaniesList,
  selectCompaniesListLoading,
  selectCompaniesListError,
  selectCompaniesListTotal,
  selectCompaniesListTotalPages,
  selectCompaniesListPage,
  selectCompaniesListLimit,
  selectCompaniesListFilters,
} from '../../../store/selectors/companiesListSelectors';

import { toastError, toastSuccess } from "../../../common/toast";
import refreshIcon from '../../../assets/icons/reload.svg'
import exportTableIcon from '../../../assets/Company-profile-icons/export-table.svg'
import tableIcon from '../../../assets/Invest-opportunity-icons/table.svg'
import gridIcon from '../../../assets/Invest-opportunity-icons/grid.svg'

import CompanyGrid from "./CompanyGrid";
import { useTranslation } from "react-i18next";
import { CompanyGridTypes, CompanyTableTypes } from "../CompanyTypes";
import CompanyTable from "../table/CompanyTable";
import CompanyDetailPopup from "./CompanyDetailPopup";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from '../../../store';
import { selectCompanyDetails, selectCompanyDetailsError, selectCompanyDetailsLoading } from "../../../store/selectors/getCompanyDetailsSelectors";
import { clearCompanyDetails, getCompanyDetailsRequest } from "../../../store/actions/getCompanyDetailsActions";

import { dummyCompaniesUrls } from "./dummyCompaniesUrls";
import { CompaniesListFilters, CompaniesListRequest } from "../../../store/types/companiesListTypes";
import typography from "../../../common/typography";
import Pagination from "../../../common/Pagination";

interface CompanyDatasetCardProps {
  filters?: CompaniesListFilters;
}

const CompanyDatasetCard: React.FC<CompanyDatasetCardProps> = ({ filters = {} }) => {
  const dispatch = useDispatch<AppDispatch>();

  const companiesList = useSelector(selectCompaniesList);
  const loading = useSelector(selectCompaniesListLoading);
  const companiesListError = useSelector(selectCompaniesListError);
  const totalRecords = useSelector(selectCompaniesListTotal);
  const totalPages = useSelector(selectCompaniesListTotalPages);
  const companyDetails = useSelector(selectCompanyDetails);
  const companyDetailsLoading = useSelector(selectCompanyDetailsLoading);
  const companyDetailsError = useSelector(selectCompanyDetailsError);

  const { t } = useTranslation();

  const [activeView, setActiveView] = useState<"grid" | "table">("grid");
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [aiDecision, setAiDecision] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const limit = 10;
  const isInitialMount = useRef(true);
  const filtersRef = useRef(filters);

  

  // Check if filters have actually changed
  const haveFiltersChanged = (newFilters: CompaniesListFilters, oldFilters: CompaniesListFilters) => {
    return JSON.stringify(newFilters) !== JSON.stringify(oldFilters);
  };

  // Fetch data when filters or page changes (LIKE DISCOVERY ENGINE)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsLoading(true);

    // Extract filters from the nested structure to match API expectations
    const apiPayload = {
      ...filters, // This should be the direct filters object, not nested
      page: currentPage,
      limit: limit,
    };

    dispatch(getCompaniesList(apiPayload));
  }, [dispatch, currentPage, limit]);

  // In the filter change effect:
  useEffect(() => {
    if (haveFiltersChanged(filters, filtersRef.current)) {
      filtersRef.current = filters;
      setCurrentPage(1);

      if (!isInitialMount.current) {
        setIsLoading(true);
        const apiPayload = {
          ...filters, // Direct filters object
          page: 1,
          limit: limit,
        };
        dispatch(getCompaniesList(apiPayload));
      }
    }
  }, [filters, dispatch, limit]);

  useEffect(() => {
    if (!loading) setIsLoading(false);
  }, [loading]);

  useEffect(() => {
    if (companyDetailsError) {
      toastError(`Failed to load company details: ${companyDetailsError}`);
    }
  }, [companyDetailsError]);

  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(getCompanyDetailsRequest(selectedCompanyId, aiDecision));
    }
  }, [selectedCompanyId, aiDecision, dispatch]);

  useEffect(() => {
    if (!openPopup) {
      setSelectedCompanyId(null);
      setAiDecision('');
      dispatch(clearCompanyDetails());
    }
  }, [openPopup, dispatch]);

  const handleCompanyClick = (data: number | string) => {
    if (typeof data === 'number') {
      setSelectedCompanyId(data);
      setOpenPopup(true);
      dispatch(getCompanyDetailsRequest(data, aiDecision));
    } else {
      setAiDecision(data);
      setOpenPopup(true);
      if (selectedCompanyId) {
        dispatch(getCompanyDetailsRequest(selectedCompanyId, data));
      }
    }
  };

  

  const handleExportTable = () => {
    console.log("Export table clicked");

    // Prepare CSV content
    const headers = [
      "Company Name",
      "Sector",
      "Product / Services",
      "Year Founded",
      "Website",
      "Country",
      "Global Employees",
      "Revenue"
    ];

    const data = companiesList.map(company => [
      company.company_name || "",
      company.company_sector || "",
      company.product_services || "",
      company.year_founded || "",
      company.website_url || "",
      company.global_headquarters || "",
      company.number_of_employees || "",
      company.revenue_usd || ""
    ]);

    // Create CSV string
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers
    csvContent += headers.join(",") + "\r\n";

    // Add data rows
    data.forEach(row => {
      // Escape fields that might contain commas or quotes
      const escapedRow = row.map(field => {
        if (typeof field === 'string') {
          // Escape quotes by doubling them
          const escapedField = field.replace(/"/g, '""');
          // Wrap in quotes if contains commas, quotes, or newlines
          if (escapedField.includes(',') || escapedField.includes('"') || escapedField.includes('\n')) {
            return `"${escapedField}"`;
          }
          return escapedField;
        }
        return field;
      });
      csvContent += escapedRow.join(",") + "\r\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "companies_export.csv");
    document.body.appendChild(link);

    // Trigger download
    link.click();
    document.body.removeChild(link);

    toastSuccess("CSV exported successfully!");
  };

  const handleShowAllColumns = () => {
    console.log("Show all columns clicked");
  };

  const changePageSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value === "all"
      ? (totalRecords || 100)
      : Number(e.target.value);

    // Update page size without causing infinite loop
    const requestPayload = {
      ...filters,
      page: 1,
      limit: newSize,
    };

    dispatch(getCompaniesList(requestPayload));
    setCurrentPage(1);
  };

  

  const convertToTableTypes = (companies: any[]): any[] => {
    return companies.map(company => ({
      id: company.id || 0,
      company_name: company.company_name || company.name || "Unknown",
      company_sector: company.company_sector || company.sector || "Unknown",
      product_services: company.product_services || "Unknown",
      year_founded: company.year_founded || company.yearFounded || 0,
      website_url: company.website_url || company.website || null,
      global_headquarters: company.global_headquarters || company.country || "Unknown",
      number_of_employees: company.number_of_employees || company.employees || 0,
      revenue_usd: company.revenue_usd || company.revenue || 0,
      presence_of_company_in_mena: company.presence_of_company_in_mena || false,
      presence_in_saudi: company.presence_in_saudi || false,
      rhq_status: company.rhq_status || "",
    }));
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  if (loading || isLoading) return <LoadingText>Loading companies...</LoadingText>;
  if (companiesListError) return <LoadingText>Error loading companies: {companiesListError}</LoadingText>;
  if (!companiesList || companiesList.length === 0) return <LoadingText>No companies available.</LoadingText>;

  return (
    <DataTableSection>
      <DataTableHeader>
        <DataTableTitle>Complete Company Dataset</DataTableTitle>
        <DataTableControls>

          <TableButton onClick={handleExportTable}>
            <Icon src={exportTableIcon} alt="Export" /> Export Table
          </TableButton>

          <SelectBox value={limit} onChange={changePageSize}>
            <option value="10">10 rows</option>
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
            <option value="all">All rows</option>
          </SelectBox>
        </DataTableControls>
      </DataTableHeader>



      <ViewToggle>
        <ViewBtn
          active={activeView === "grid"}
          onClick={() => setActiveView("grid")}
        >
          <IconImg src={gridIcon} alt="Grid View" active={activeView === "grid"} />
          Grid
        </ViewBtn>
        <ViewBtn
          active={activeView === "table"}
          onClick={() => setActiveView("table")}
        >
          <IconImg src={tableIcon} alt="Table View" active={activeView === "table"} />
          Table
        </ViewBtn>
      </ViewToggle>

      {activeView === "grid" && (
        <CompanyGrid
          companies={companiesList}
          onCompanyClick={handleCompanyClick}
          dummyCompaniesUrls=""
        />
      )}

      {activeView === "table" && (
        <CompanyTable
          companie={convertToTableTypes(companiesList)}
          onCompanyClick={handleCompanyClick}
        />
      )}

      {openPopup && (
        <CompanyDetailPopup
          companyId={selectedCompanyId}
          onCompanyClick={handleCompanyClick}
          companyDetails={companyDetails}
          loading={companyDetailsLoading}
          error={companyDetailsError}
          onClose={() => setOpenPopup(false)}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        limit={limit}
        loading={loading || isLoading}
        onPageChange={handlePageChange}
      />
    </DataTableSection>
  );
};

export default CompanyDatasetCard;


const DataTableSection = styled.div`
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  margin: 3rem auto;  
  width: 95%;         
  max-width: 1140px;  

  @media (min-width: 1921px) {
    max-width: 1999px;
    padding: 3rem;
    border-radius: 28px;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin: 2rem auto;
    width: 90%;      
  }
`;

const DataTableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (min-width: 1921px) {
    margin-bottom: 2.5rem;
    gap: 1.5rem;
  }

  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DataTableTitle = styled.h2`
  font-size: ${typography.pageSubTitle.fontSize};
  font-weight: ${typography.pageSubTitle.fontWeight};
  line-height: 1.4;
  color: #ffffff;
  margin: 0;
`;

const DataTableControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (min-width: 1921px) {
    gap: 1.5rem;
  }

  @media (max-width: 1200px) {
    justify-content: center;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TableButton = styled.button`
  display: flex;                
  align-items: center;          
  gap: 0.5rem;                   

  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  color: #00ff88;
  padding: 0.5rem 1rem;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    gap: 0.75rem;
  }

  &:hover {
    background: rgba(0, 255, 136, 0.2);
    border-color: #00ff88;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center; 
  }
`;

const Icon = styled.img`
  height: 13px;
  width: 13px;

  @media (min-width: 1921px) {
    height: 23px;
    width: 23px;
  }
`;

const TableSelect = styled.select`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;
    font-size: 1.1rem;
    border-radius: 12px;
  }

  &:hover,
  &:focus {
    background: rgba(0, 255, 136, 0.1);
    border-color: #00ff88;
    outline: none;
  }

  @media (max-width: 768px) {
    width: 100%;       
    text-align: center;
  }
`;

const TableStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (min-width: 1921px) {
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 1200px) {
    justify-content: center;
  }
`;

const StatChip = styled.div`
  background: rgba(0, 180, 216, 0.1);
  border: 1px solid rgba(0, 180, 216, 0.2);
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;
    font-size: 1.3rem;
    border-radius: 16px;
    gap: 0.75rem;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);

  @media (min-width: 1921px) {
    font-size: 1.3rem;
  }
`;

const StatValue = styled.span<{ color?: string; weight?: number }>`
  color: ${({ color }) => color || "#00b4d8"};
  font-weight: ${({ weight }) => weight || 700};

  @media (min-width: 1921px) {
    font-size: 1.3rem;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  overflow-y: auto;
  max-height: 600px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;

  @media (min-width: 1921px) {
    max-height: 800px;
    border-radius: 16px;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 768px) {
    max-height: 400px;
  }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  @media (min-width: 1921px) {
    font-size: 1.1rem;
  }

  @media (min-width: 1024px) {
    min-width: 1140px;
  }

  @media (min-width: 1921px) {
    @media (min-width: 1024px) {
      min-width: 1500px;
    }
  }
`;



const ViewToggle = styled.div`
  display: flex;
  border-radius: 8px;
  overflow: hidden;

  @media (min-width: 1921px) {
    border-radius: 12px;
  }
`;

const ViewBtn = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active }) =>
    active ? "linear-gradient(45deg, #00ff88, #00b4d8)" : "rgba(255, 255, 255, 0.1)"};
  border: none;
  color: ${({ active }) =>
    active ? "#000" : "rgba(255, 255, 255, 0.7)"};
  font-size: ${typography.button.fontSize};
  font-weight: ${({ active }) => (active ? `${typography.button.fontSize}` : 400)};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;
    gap: 8px;
  }

  &:hover {
    background: ${({ active }) =>
    active
      ? "linear-gradient(45deg, #00ff88, #00b4d8)"
      : "rgba(255, 255, 255, 0.15)"};
  }
  
  &:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    
    @media (min-width: 1921px) {
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
    }
  }
  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    
    @media (min-width: 1921px) {
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
    }
  }
`;

const IconImg = styled.img<{ active?: boolean }>`
  width: 14px;
  height: 14px;
  display: block; 

  @media (min-width: 1921px) {
    width: 18px;
    height: 18px;
  }
  
  ${({ active }) =>
    active
      ? css`
          filter: brightness(0) saturate(100%); 
        `
      : css`
          filter: brightness(0) invert(1); 
        `}
`;

const SelectBox = styled.select`
  background: rgba(42, 51, 59, 1);
  color: white;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-size:${typography.selectBox.fontSize};
  font-weight: ${typography.selectBox.fontWeight};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (min-width: 1921px) {
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
  }

  &:hover {
    border-color: #00ffcc;
  }
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 2rem;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};

  @media (min-width: 1921px) {
    padding: 3rem;
  }
`;