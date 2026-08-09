import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { InvestmentGrid, OpportunityDetails, OpportunitieList } from "./Card/CardTypes";
import tableIcon from '../../assets/Invest-opportunity-icons/table.svg'
import gridIcon from '../../assets/Invest-opportunity-icons/grid.svg'
import InvestmentCard from "./Card/InvestmentCard";
import CardPopup from "./Card/CardPopup";
import InvestmentTable from "./Table/InvestmentTable";
import InvestmentFilter from "./InvestmentFilter";
import InvestmentSectors from "./Card/InvestmentSectors";
import MarketIntelligence from "./Card/MarketIntelligense";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InvestmentTableData } from "./Table/TableTypes";
import TablePopup from "./Table/TablePopup";

import { AppDispatch } from "../../store";
import { useDispatch, useSelector } from 'react-redux';
import { getOpportunitiesListRequest, setOpportunitiesFilters } from '../../store/actions/getopportunitiesListActions';
import {
  selectOpportunities,
  selectOpportunitiesLoading,
  selectOpportunitiesError,
  selectOpportunitiesMeta,
  selectOpportunitiesFilters
} from '../../store/selectors/getOpportunitiesListSelectors';

// Import the new opportunity details actions and selectors
import { getOpportunityDetailsRequest } from '../../store/actions/opportunityDetailsActions';
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading, selectOpportunityDetailsError
} from '../../store/selectors/opportunityDetailsSelectors';

// Import bookmark functionality
import { createBookmarkRequest } from '../../store/actions/createBookmarkActions';
import { selectBookmarkLoading, selectBookmarkSuccess } from '../../store/selectors/createBookmarkSelectors';
import { deleteBookmarkRequest } from '../../store/actions/deleteBookmarkActions';
import {
  selectDeleteBookmarkLoading,
  selectDeleteBookmarkSuccess
} from '../../store/selectors/deleteBookmarkSelectors';
import { LoadingSpinnerWithMessage } from '../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage';
import { ErrorMessage } from '../../common/LoaderSpinner&ErrorLayout/ErrorMessage';
import typography from "../../common/typography";

const InvestmentDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<"grid" | "table">("grid");
  const [selectedGrid, setSelectedGrid] = useState<OpportunitieList | null>(null);
  const [selectedTable, setSelectedTable] = useState<OpportunitieList | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const dispatch = useDispatch<AppDispatch>();
  const opportunities = useSelector(selectOpportunities);
  const loading = useSelector(selectOpportunitiesLoading);
  const error = useSelector(selectOpportunitiesError);
  const meta = useSelector(selectOpportunitiesMeta);
  const filters = useSelector(selectOpportunitiesFilters);
  const opportunityDetails = useSelector(selectOpportunityDetails);
  const opportunityDetailsLoading = useSelector(selectOpportunityDetailsLoading);
  const opportunityDetailsError = useSelector(selectOpportunityDetailsError);
  const totalRecords = meta?.total || 0;
  const totalPages = meta?.totalPages || 1;
  const startIndex = meta ? ((meta.page - 1) * meta.limit) + 1 : 0;
  const endIndex = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const currentPageFromMeta = meta?.page || 1;
  const [selectedSort, setSelectedSort] = useState("Sort by Overall Score");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const {
    sectors = [],
    ai_score = { min: 0, max: 1 },
    investment_range = { min: 1, max: 100000000000000 },
    sort_by = "score",
    sort_order = "desc",
    search = "",
  } = filters;

  const stableFilters = useMemo(() => ({
    sectors,
    ai_score,
    investment_range,
    sort_by,
    sort_order,
    search: (search || "").trim(),
  }), [sectors.join(","), ai_score.min, ai_score.max, investment_range.min, investment_range.max, sort_by, sort_order, search]);

  const firstRender = useRef(true);

  useEffect(() => {
    dispatch(getOpportunitiesListRequest({
      page: currentPage,
      limit: pageSize,
      ...stableFilters,
    }));
  }, [dispatch, currentPage, pageSize, stableFilters]);

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPageFromMeta) {
      setCurrentPage(page);
    }
  };

  const handleCardClick = (investment: OpportunitieList) => {
    setSelectedGrid(investment);
    dispatch(getOpportunityDetailsRequest(investment.id));
  };

  const handleTableRowClick = (investment: OpportunitieList) => {
    setSelectedTable(investment);
    dispatch(getOpportunityDetailsRequest(investment.id));
  };

  const handleAiDecisionFilter = (aiDecision: string) => {
    const selectedInvestment = selectedGrid || selectedTable;
    if (selectedInvestment) {
      dispatch(getOpportunityDetailsRequest(selectedInvestment.id, aiDecision));
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { label: "Sort by Overall Score", sort_by: "score", sort_order: "desc" },
    { label: "Sort by Name", sort_by: "name", sort_order: "asc" },
    { label: "Sort by Sector", sort_by: "sector", sort_order: "asc" },
  ];

  const handleSortSelect = (opt: typeof sortOptions[0]) => {
    setSelectedSort(`${opt.label}`);
    setIsSortOpen(false);
    dispatch(setOpportunitiesFilters({
      ...filters,
      sort_by: opt.sort_by,
      sort_order: opt.sort_order,
      page: 1,
    }));
    setCurrentPage(1);
  };
  const handleClearAll = () => {
    dispatch(setOpportunitiesFilters({
      sectors: [],
      ai_score: { min: 0, max: 1 },
      investment_range: { min: 1, max: 1000000000 },
      sort_by: "score",
      sort_order: "desc",
      search: "",
      page: 1,
    }));
    setSelectedSort("Sort by Overall Score");
    setCurrentPage(1);
  };

  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);


  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPageFromMeta - 1);
      let end = Math.min(totalPages - 1, currentPageFromMeta + 1);

      if (currentPageFromMeta <= 3) {
        end = 4;
      } else if (currentPageFromMeta >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const [localBookmarks, setLocalBookmarks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      const bookmarkedIds = opportunities
        .filter(opp => opp.isBookmarked)
        .map(opp => opp.id);

      setLocalBookmarks(new Set(bookmarkedIds));
    }
  }, [opportunities]);

  const handleBookmarkClick = (opportunity: any) => {
    const bookmarkData = {
      entityId: opportunity.id,
      entityType: "opportunity"
    };

    const isCurrentlyBookmarked = localBookmarks.has(opportunity.id);
    const newBookmarks = new Set(localBookmarks);

    if (isCurrentlyBookmarked) {
      newBookmarks.delete(opportunity.id);
    } else {
      newBookmarks.add(opportunity.id);
    }
    setLocalBookmarks(newBookmarks);

    if (isCurrentlyBookmarked) {
      dispatch(deleteBookmarkRequest(bookmarkData));
    } else {
      dispatch(createBookmarkRequest(bookmarkData));
    }
  };

  if (loading) {
    return <LoadingSpinnerWithMessage message="Loading Opportunities..." translateX="100px" />
  }

  if (error) {
    return <ErrorMessage error={error} translateX="100px" />;
  }

  return (
    <DashboardWrapper>
      <ContentHeader>
        <div>
          <PageTitle>Opportunities</PageTitle>
          <PageSubtitle>
            Strategic investment opportunities in Saudi Arabia
          </PageSubtitle>
        </div>

        {/* <Stats>
          <Stat>
            <StatValue id="totalCount">
              {loading ? "..." : totalRecords.toLocaleString()}
            </StatValue>
            <StatLabel>Opportunities</StatLabel>
          </Stat>
          <Stat>
            <StatValue id="avgScore">78</StatValue>
            <StatLabel>Avg Score</StatLabel>
          </Stat>
          <Stat>
            <StatValue id="totalInvestment">2.6B</StatValue>
            <StatLabel>SAR Potential</StatLabel>
          </Stat>
        </Stats> */}
      </ContentHeader>

      <Controls>
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

        <InvestmentFilter clearAll={handleClearAll} />
      </Controls>

      {/* <SortContainer ref={dropdownRef}>
        <SortSelect onClick={() => setIsSortOpen(!isSortOpen)}>
          {selectedSort}
          {isSortOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </SortSelect>
        {isSortOpen && (
          <Dropdown>
            {sortOptions.map((opt, idx) => (
              <OptionRow key={idx} onClick={() => handleSortSelect(opt)}>
                {opt.label}
              </OptionRow>
            ))}
          </Dropdown>
        )}
      </SortContainer> */}

      <InvestmentSectors />

      {/* Show error message if there's an error */}
      {/* {error && (
        <div>
          Error loading opportunities: {error}
        </div>
      )} */}

      {/* Grid with Popup */}
      {activeView === "grid" && (
        <>
          <InvestmentCard
            onBookmark={handleBookmarkClick}
            onSelect={handleCardClick}
            investments={opportunities}
            bookmarks={localBookmarks}
          />
          {selectedGrid && (
            <CardPopup
              investment={selectedGrid}
              onClose={() => setSelectedGrid(null)}
              detailedData={opportunityDetails || undefined}
              loading={opportunityDetailsLoading}
              error={opportunityDetailsError}
              onOpportunityClick={handleAiDecisionFilter}// Pass the handler
            />
          )}
        </>
      )}

      {activeView === "table" && (
        <>
          <InvestmentTable
            data={opportunities}
            onRowClick={handleTableRowClick}
          />
          {selectedTable && (
            <CardPopup
              investment={selectedTable}
              onClose={() => setSelectedTable(null)}
              detailedData={opportunityDetails || undefined}
              loading={opportunityDetailsLoading}
              error={opportunityDetailsError}
              onOpportunityClick={handleAiDecisionFilter} // Pass the handler
            />
          )}
        </>
      )}

      {/* Pagination - Only show if we have data */}
      {totalRecords > 0 && (
        <TablePagination>
          <PaginationInfo>
            {loading ? "Loading..." : `Showing ${startIndex}-${endIndex} of ${totalRecords.toLocaleString()} records`}
          </PaginationInfo>

          <PaginationControls>
            <PaginationButton
              onClick={() => changePage(currentPageFromMeta - 1)}
              disabled={currentPageFromMeta === 1 || loading}
            >
              ← Previous
            </PaginationButton>

            <PageNumbers>
              {generatePageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} style={{ padding: '0.5rem', display: "flex", alignItems: "end" }}>...</span>
                ) : (
                  <PaginationButton
                    key={page}
                    onClick={() => changePage(page as number)}
                    disabled={currentPageFromMeta === page || loading}

                  >
                    {page}
                  </PaginationButton>
                )
              ))}
            </PageNumbers>

            <PaginationButton
              onClick={() => changePage(currentPageFromMeta + 1)}
              disabled={currentPageFromMeta === totalPages || loading}
            >
              Next →
            </PaginationButton>
          </PaginationControls>
        </TablePagination>
      )}
      {/* Show a message when there are no records */}
      {!loading && totalRecords === 0 && !error && (
        <div>
          No investment opportunities found matching your criteria.
        </div>
      )}

      <MarketIntelligence />
    </DashboardWrapper>
  )
}

export default InvestmentDashboard;

const DashboardWrapper = styled.div`
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
   
    padding: 0 0rem;
  }
`;

const ContentHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    text-align: left;
  }
  
  @media (min-width: 1921px) {
    margin-bottom: 3rem;
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
  max-width: 700px;
  margin: 0;
  line-height: 1.45;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-wrap: wrap; /* responsive fix */
  
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    margin-right:2rem;
  }
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    gap: 1.5rem;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    border-radius: 12px;
  }
`;

const ViewBtn = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active }) =>
    active ? "linear-gradient(45deg, #00ff88, #00b4d8)" : "transparent"};
  border: none;
  color: ${({ active }) =>
    active ? "#0a0a0a" : "rgba(255, 255, 255, 0.7)"};
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;

  /* ✅ Align icon & text in one line */
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${({ active }) =>
    active
      ? "linear-gradient(45deg, #00ff88, #00b4d8)"
      : "rgba(255, 255, 255, 0.15)"};
  }
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;
    gap: 8px;
  }    
`;

const IconImg = styled.img<{ active?: boolean }>`
  width: 14px;
  height: 14px;
  display: block; /* avoid inline gap issues */
    ${({ active }) =>
    active
      ? css`
          filter: brightness(0) saturate(100%); /* black icon */
        `
      : css`
          filter: brightness(0) invert(1); /* white/gray icon */
        `}
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    width: 23px;
    height: 23px;
  }
`;


const SortContainer = styled.div`
  position: relative;
  display:flex;
  justify-content: flex-end; 
`;

const SortSelect = styled.div`
  position: relative;   
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  max-width: 280px;
  box-sizing: border-box;
  
  &:hover {
    border-color: rgba(0, 255, 136, 0.4);
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
  
  @media (min-width: 1921px) {
    max-width: 320px;
    padding: 0.8rem 1.1rem;
    border-radius: 10px;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  width: 100%;
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  z-index: 10;
  overflow: hidden;
  box-sizing: border-box;
`;

const OptionRow = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: white;

  &:hover {
    background: rgba(0, 255, 136, 0.15);
  }
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 1rem 1.25rem;
  }
`;

const Stats = styled.div`
  display: flex;
  gap: 2rem;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.span`
  display: block;
  font-size: ${typography.kpiValue.fontSize};
  font-weight: ${typography.kpiValue.fontWeight};
  color: #9ef0c8;
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.62);
  font-size: ${typography.kpiSubTitle.fontSize};
  font-weight: ${typography.kpiSubTitle.fontWeight};
`;

const TablePagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  /* 4K Responsive Styles */
  @media (min-width: 1921px) {
    gap: 1.5rem;
  }

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
  @media (min-width: 1921px) {
    gap: 0.75rem;
  }
`;

const PaginationButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  margin-top:1rem;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;

  /* 4K Responsive Styles */
  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;;
    border-radius: 12px;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 255, 136, 0.1);
    border-color: #00ff88;
    color: #00ff88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const PageNumbers = styled.div`
  display: flex;
  gap: 0.25rem;

  /* 4K Responsive Styles */
  @media (min-width: 1921px) {
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;