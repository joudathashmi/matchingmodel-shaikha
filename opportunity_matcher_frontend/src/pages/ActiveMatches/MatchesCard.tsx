import styled, { css, keyframes } from 'styled-components';
import InfrastructureCard from './InfrastructureCard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSectorCounts } from '../../store/actions/actionSectorActions';
import { selectSectorCounts, selectSectorCountsLoading, selectSectorCountsError } from '../../store/selectors/sectorCountsSelectors';
import { AppDispatch } from '../../store';
import { getCompanies } from '../../store/actions/actionCompanyActions';
import { selectCompanies, selectCompaniesError, selectCompaniesLoading } from '../../store/selectors/actionCompanySelectors';
import { getActiveMatches } from '../../store/actions/filterMatchesActions';
import { LoadingSpinnerWithMessage } from '../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage';
import { ErrorMessage } from '../../common/LoaderSpinner&ErrorLayout/ErrorMessage';
import typography from '../../common/typography';

const MatchesCard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const focusParam = (searchParams.get("focus") || "").toLowerCase();
  const tierParam = (searchParams.get("tier") || "").trim();
  const pursueOnly = focusParam === "pursue";
  const decisionTier = !pursueOnly && tierParam ? tierParam : undefined;
  const deskFocusActive = pursueOnly || Boolean(decisionTier);

  const companies = useSelector(selectCompanies);
  const companiesLoading = useSelector(selectCompaniesLoading);
  const companiesError = useSelector(selectCompaniesError);
  const [companySearch, setCompanySearch] = useState("");

  const sectorCounts = useSelector(selectSectorCounts);
  const loading = useSelector(selectSectorCountsLoading);
  const error = useSelector(selectSectorCountsError);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(0);
  // Desk focus links should not hide lower-score Good/Strong pairs behind 78%.
  const [minValue, setMinValue] = useState(deskFocusActive ? 0 : 78);
  const [maxValue, setMaxValue] = useState(100);

  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<number[]>([]);
  const [selectedAIDecisions, setSelectedAIDecisions] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isDraggingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFilterValuesRef = useRef({
    selectedCompanies: [] as number[],
    selectedSectors: [] as number[],
    selectedAIDecisions: [] as number[],
    minValue: deskFocusActive ? 0 : 78,
    maxValue: 100
  });

  useEffect(() => {
    if (deskFocusActive) {
      setMinValue(0);
      setMaxValue(100);
    }
  }, [deskFocusActive, pursueOnly, decisionTier]);

  const aiDecisions = [
    { id: 1, name: "Yes" },
    { id: 2, name: "No" },
  ];

  useEffect(() => {
    dispatch(getSectorCounts());
    dispatch(getCompanies());
  }, [dispatch]);

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const toggleSelection = (id: number, type: string) => {
    switch (type) {
      case "company":
        setSelectedCompanies((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
        break;
      case "sector":
        setSelectedSectors((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
        break;
      case "aiDecision":
        setSelectedAIDecisions((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
        break;
    }
  };

  const companyNames = companies
    .filter((c) => selectedCompanies.includes(c.id))
    .map((c) => c.company_name);

  const sectorNames = sectorCounts
    .filter((_, idx) => selectedSectors.includes(idx + 1))
    .map((s) => s.sector);

  const aiDecision =
    selectedAIDecisions.length > 0
      ? ["Yes", "No"][selectedAIDecisions[0] - 1]
      : undefined;

  const getSelectedLabels = (
    items: Array<{ id: number; name: string }>,
    selectedIds: number[]
  ) => {
    if (selectedIds.length === 0) return "Select options";
    if (selectedIds.length === items.length) return "All selected";
    if (selectedIds.length > 2) return `${selectedIds.length} selected`;

    return items
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.name)
      .join(", ");
  };

  const handleSliderStart = () => {
    isDraggingRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSliderEnd = () => {
    isDraggingRef.current = false;
    
    const currentValues = { 
      selectedCompanies, 
      selectedSectors, 
      selectedAIDecisions, 
      minValue, 
      maxValue 
    };
    const lastValues = lastFilterValuesRef.current;
    
    const valuesChanged = 
      JSON.stringify(currentValues.selectedCompanies) !== JSON.stringify(lastValues.selectedCompanies) ||
      JSON.stringify(currentValues.selectedSectors) !== JSON.stringify(lastValues.selectedSectors) ||
      JSON.stringify(currentValues.selectedAIDecisions) !== JSON.stringify(lastValues.selectedAIDecisions) ||
      currentValues.minValue !== lastValues.minValue ||
      currentValues.maxValue !== lastValues.maxValue;
    
    if (valuesChanged) {
      applyFilters();
    }
  };

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value <= maxValue) {
      setMinValue(value);
    }
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= minValue) {
      setMaxValue(value);
    }
  };

  const applyFilters = useCallback(() => {
    const companyNames = companies
      .filter((c) => selectedCompanies.includes(c.id))
      .map((c) => c.company_name);

    const sectorNames = sectorCounts
      .filter((_, idx) => selectedSectors.includes(idx + 1))
      .map((s) => s.sector);

    const aiDecision =
      selectedAIDecisions.length > 0
        ? ["Yes", "No"][selectedAIDecisions[0] - 1]
        : undefined;

    lastFilterValuesRef.current = {
      selectedCompanies: [...selectedCompanies],
      selectedSectors: [...selectedSectors],
      selectedAIDecisions: [...selectedAIDecisions],
      minValue,
      maxValue
    };

    dispatch(
      getActiveMatches({
        sectors: sectorNames,
        companies: companyNames,
        ai_decision: aiDecision,
        decision_tier: decisionTier,
        pursue_only: pursueOnly || undefined,
        final_score: {
          min: minValue / 100,
          max: maxValue / 100,
        },
        page: currentPage,
        limit,
      })
    );
  }, [
    selectedCompanies,
    selectedSectors,
    selectedAIDecisions,
    minValue,
    maxValue,
    currentPage,
    limit,
    dispatch,
    companies,
    sectorCounts,
    decisionTier,
    pursueOnly,
  ]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      applyFilters();
    }
  }, [selectedCompanies, selectedSectors, selectedAIDecisions, applyFilters]);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [minValue, maxValue, applyFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCompanies, selectedSectors, selectedAIDecisions, minValue, maxValue]);

  const getLinearPosition = (value: number, min: number, max: number) => {
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (companiesLoading) {
    return <LoadingSpinnerWithMessage message="Loading matches..." translateX="100px" />
  }

  if (companiesError) {
    return <ErrorMessage error={companiesError} translateX="100px" />;
  }

  return (
    <MainContent data-tour="matches-workspace">
      <WorkbenchIntro>
        <WorkbenchTitle>Matches</WorkbenchTitle>
        <WorkbenchSub>
          Ranked company-opportunity pairs. Open a case for evidence, then move deals into Pursuit.
        </WorkbenchSub>
        {(pursueOnly || decisionTier) && (
          <FocusBanner>
            Showing{" "}
            {pursueOnly
              ? "pursue queue (Excellent · Strong · Good)"
              : `${decisionTier} tier`}
            .{" "}
            <FocusClear to="/match-workbench">Clear focus</FocusClear>
          </FocusBanner>
        )}
      </WorkbenchIntro>
      <DropdownSection ref={dropdownRef}>
        
        <FilterGroup>
          <FilterLabel>Companies</FilterLabel>
          <CustomSelect ref={dropdownRef}>
            <SelectBox onClick={() => toggleDropdown("companies")}>
              <span>
                {companiesLoading
                  ? "Loading..."
                  : getSelectedLabels(
                    companies.map((c) => ({ id: c.id, name: c.company_name })),
                    selectedCompanies
                  )}
              </span>
              <ArrowIcon isOpen={activeDropdown === "companies"} />
            </SelectBox>
            {activeDropdown === "companies" && (
              <Dropdown>
                <CompanySearchInput
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Search company…"
                  aria-label="Filter companies in list"
                />
                {companiesLoading && <div>Loading companies...</div>}
                {companiesError && <div style={{ color: "red" }}>{companiesError}</div>}
                {!companiesLoading &&
                  !companiesError &&
                  companies
                    .filter((company) =>
                      company.company_name
                        .toLowerCase()
                        .includes(companySearch.toLowerCase())
                    )
                    .map((company) => (
                      <OptionRow
                        key={company.id}
                        checked={selectedCompanies.includes(company.id)}
                        onClick={() => toggleSelection(company.id, "company")}
                      >
                        <LeftPart>
                          <input
                            type="checkbox"
                            checked={selectedCompanies.includes(company.id)}
                            onChange={() => { }}
                          />
                          <span>{company.company_name}</span>
                        </LeftPart>
                      </OptionRow>
                    ))}
              </Dropdown>
            )}
          </CustomSelect>
        </FilterGroup>

        
        <FilterGroup>
          <FilterLabel>Filter by Sector</FilterLabel>
          <CustomSelect>
            <SelectBox onClick={() => toggleDropdown("sectors")}>
              <span>
                {sectorCounts.length === 0
                  ? "Loading..."
                  : getSelectedLabels(
                    sectorCounts.map((s, idx) => ({ id: idx + 1, name: s.sector })),
                    selectedSectors
                  )}
              </span>
              <ArrowIcon isOpen={activeDropdown === "sectors"} />
            </SelectBox>
            {activeDropdown === "sectors" && (
              <Dropdown>
                {loading && <div>Loading sectors...</div>}
                {error && <div style={{ color: "red" }}>{error}</div>}
                {!loading &&
                  !error &&
                  sectorCounts.map((sector, idx) => (
                    <OptionRow
                      key={idx}
                      checked={selectedSectors.includes(idx + 1)}
                      onClick={() => toggleSelection(idx + 1, "sector")}
                    >
                      <LeftPart>
                        <input
                          type="checkbox"
                          checked={selectedSectors.includes(idx + 1)}
                          onChange={() => { }}
                        />
                        <span>
                          {sector.sector} 
                        </span>
                      </LeftPart>
                    </OptionRow>
                  ))}
              </Dropdown>
            )}
          </CustomSelect>
        </FilterGroup>

        
       
          <FilterGroup>
            <FilterLabel>AI Decision</FilterLabel>
            <CustomSelect>
              <SelectBox onClick={() => toggleDropdown("aiDecisions")}>
                <span>{getSelectedLabels(aiDecisions, selectedAIDecisions)}</span>
                <ArrowIcon isOpen={activeDropdown === "aiDecisions"} />
              </SelectBox>
              {activeDropdown === "aiDecisions" && (
                <Dropdown>
                  {aiDecisions.map((decision) => (
                    <OptionRow
                      key={decision.id}
                      checked={selectedAIDecisions.includes(decision.id)}
                      onClick={() => toggleSelection(decision.id, "aiDecision")}
                    >
                      <LeftPart>
                        <input
                          type="checkbox"
                          checked={selectedAIDecisions.includes(decision.id)}
                          onChange={() => { }}
                        />
                        <span>{decision.name}</span>
                      </LeftPart>
                    </OptionRow>
                  ))}
                </Dropdown>
              )}
            </CustomSelect>
          </FilterGroup>

          <SliderSection>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <FilterLabel >Final Score Range</FilterLabel>
              <Value style={{ color: "white", fontWeight: "600" }}>{minValue}% - {maxValue}%</Value>
            </div>
            <SliderWrapper minValue={minValue}>
              <SliderBackground />
              <SliderHighlight width={maxValue - minValue} style={{ left: `${minValue}%` }} />

              
              <Slider
                type="range"
                min="0"
                max="100"
                value={minValue}
                onChange={handleMinSliderChange}
                onMouseDown={handleSliderStart}
                onMouseUp={handleSliderEnd}
                onTouchStart={handleSliderStart}
                onTouchEnd={handleSliderEnd}
              />

              
              <Slider
                type="range"
                min="0"
                max="100"
                value={maxValue}
                onChange={handleMaxSliderChange}
                onMouseDown={handleSliderStart}
                onMouseUp={handleSliderEnd}
                onTouchStart={handleSliderStart}
                onTouchEnd={handleSliderEnd}
              />
            </SliderWrapper>
            <ValuesRow>
              <Value>0%</Value>
              <Value>100%</Value>
            </ValuesRow>
          </SliderSection>

      
      </DropdownSection>

      <InfrastructureCard
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
      />

    </MainContent>
  );
};

export default MatchesCard;

const MainContent = styled.main`
  padding: 1.25rem 1.5rem 2rem;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.01);
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const WorkbenchIntro = styled.div`
  margin: 0 0 1.15rem;
`;
const WorkbenchTitle = styled.h1`
  margin: 0 0 0.35rem 0;
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  color: #ffffff;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;
const WorkbenchSub = styled.p`
  margin: 0;
  max-width: 40rem;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.45;
`;

const FocusBanner = styled.div`
  margin-top: 0.75rem;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 140, 0.3);
  background: rgba(0, 255, 136, 0.08);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.8rem;
  font-weight: 500;
`;

const FocusClear = styled(Link)`
  color: #9ef0c8;
  font-weight: 650;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const DropdownSection = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem 1rem;
  margin: 0 0 1.35rem;
  align-items: end;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

// ===== Inline Label =====
const InlineLabel = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
`;

// Wrapper
const CustomSelect = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

// Select Box (closed state)
const SelectBox = styled.div`
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 6px;
  padding: 0.7rem 0.8rem;
  font-size: ${typography.selectBox.fontSize};
  font-weight: ${typography.selectBox.fontWeight};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;

  @media (min-width: 2560px) {
    padding: 0.9rem 1rem;
    border-radius: 8px;
  }

  @media (min-width: 3840px) {
    padding: 1.1rem 1.2rem;
    border-radius: 10px;
  }

  &:hover {
    border-color: #00ffcc;
  }
`;

// Dropdown (open state) 
const Dropdown = styled.div`
  position: absolute;
  top: 110%;
  left: 0;
  right: 0;
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 0.3rem;
  z-index: 10;
  max-height: 220px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; 
  scrollbar-width: none;  

  @media (min-width: 2560px) {
    border-radius: 10px;
    margin-top: 0.4rem;
    max-height: 280px;
  }

  @media (min-width: 3840px) {
    border-radius: 12px;
    margin-top: 0.5rem;
    max-height: 350px;
  }
`;

const CompanySearchInput = styled.input`
  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 28, 36, 0.98);
  color: rgba(255, 255, 255, 0.92);
  padding: 0.55rem 0.7rem;
  font-family: inherit;
  font-size: 0.78rem;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

// Each Option row
const OptionRow = styled.div<{ checked: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.8rem;
  cursor: pointer;

  @media (min-width: 2560px) {
    padding: 0.7rem 1rem;
  }

  @media (min-width: 3840px) {
    padding: 0.9rem 1.2rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const LeftPart = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 2560px) {
    gap: 0.7rem;
  }

  @media (min-width: 3840px) {
    gap: 0.9rem;
  }

  input {
    accent-color: #00ff88; 
    
    @media (min-width: 2560px) {
      transform: scale(1.2);
    }

    @media (min-width: 3840px) {
      transform: scale(1.4);
    }
  }
  span{
    font-size: ${typography.selectBoxOptions.fontSize};
    font-weight: ${typography.selectBoxOptions.fontWeight};
  }
`;

const ArrowIcon = styled.span<{ isOpen: boolean }>`
  border: solid rgba(255, 255, 255, 0.7);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: ${props => props.isOpen ? 'rotate(-135deg)' : 'rotate(45deg)'};
  transition: transform 0.3s ease;

  @media (min-width: 2560px) {
    border-width: 0 3px 3px 0;
    padding: 4px;
  }

  @media (min-width: 3840px) {
    border-width: 0 4px 4px 0;
    padding: 5px;
  }
`;

const FilterLabel = styled.span`
  font-size: ${typography.filterLabel.fontSize};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 0.4rem;
  display: block;
  letter-spacing: 0.01em;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 2560px) {
    gap: 0.7rem;
  }

  @media (min-width: 3840px) {
    gap: 0.9rem;
  }
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
`;

const SliderValue = styled.span`
  font-weight: bold;
  color: #00ff88;
`;

// First, define the props interface for SliderWrapper
interface SliderWrapperProps {
  minValue: number;
}

// Update SliderWrapper to accept the minValue prop
const SliderWrapper = styled.div<SliderWrapperProps>`
  position: relative;
  width: 100%;
  height: 16px;
  display: flex;
  align-items: center;

  input[type="range"] {
    position: absolute;
    width: 100%;
    height: 16px;
    -webkit-appearance: none;
    background: transparent;
    outline: none;
    margin: 0;
    cursor: pointer;
    pointer-events: none;
    z-index: 2;
    
    &::-webkit-slider-thumb {
      pointer-events: all;
    }
    
    &::-moz-range-thumb {
      pointer-events: all;
    }
  }
  
  input[type="range"]:first-of-type {
    z-index: ${props => props.minValue > 50 ? 4 : 3};
  }
  
  input[type="range"]:last-of-type {
    z-index: ${props => props.minValue > 50 ? 3 : 4};
  }

  @media (min-width: 2560px) {
    height: 20px;
    
    input[type="range"] {
      height: 20px;
    }
  }

  @media (min-width: 3840px) {
    height: 24px;
    
    input[type="range"] {
      height: 24px;
    }
  }
`;


const SliderBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;

  @media (min-width: 2560px) {
    height: 8px;
    border-radius: 4px;
  }

  @media (min-width: 3840px) {
    height: 10px;
    border-radius: 5px;
  }
`;

const SliderHighlight = styled.div<{ width: number }>`
  position: absolute;
  width: ${({ width }) => width}%;
  height: 4px;
  background: linear-gradient(to right, #00ff88, #00cfff);
  border-radius: 3px;
  z-index: 1;

  @media (min-width: 2560px) {
    height: 8px;
    border-radius: 4px;
  }

  @media (min-width: 3840px) {
    height: 10px;
    border-radius: 5px;
  }
`;

const Slider = styled.input`
  position: absolute;
  width: 100%;
  height: 16px; 
  -webkit-appearance: none;
  background: transparent;
  outline: none;
  z-index: 2;
  margin: 0;
  cursor: pointer;
  
  @media (min-width: 2560px) {
    height: 20px;
  }

  @media (min-width: 3840px) {
    height: 24px;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #00ffcc;
    cursor: pointer;
    position: relative;
    z-index: 3;
    transform: translateY(-50%);
    top: 50%;

    @media (min-width: 2560px) {
      width: 20px;
      height: 20px;
    }

    @media (min-width: 3840px) {
      width: 24px;
      height: 24px;
    }
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    border: none;
    position: relative;
    z-index: 3;

    @media (min-width: 2560px) {
      width: 20px;
      height: 20px;
    }

    @media (min-width: 3840px) {
      width: 24px;
      height: 24px;
    }
  }
  
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: transparent;
    border: none;

    @media (min-width: 2560px) {
      height: 8px;
    }

    @media (min-width: 3840px) {
      height: 10px;
    }
  }
  
  &::-moz-range-track {
    width: 100%;
    height: 6px;
    background: transparent;
    border: none;

    @media (min-width: 2560px) {
      height: 8px;
    }

    @media (min-width: 3840px) {
      height: 10px;
    }
  }
  
  &::-ms-track {
    width: 100%;
    height: 6px;
    background: transparent;
    border: none;
    color: transparent;

    @media (min-width: 2560px) {
      height: 8px;
    }

    @media (min-width: 3840px) {
      height: 10px;
    }
  }
  
  &::-ms-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;

    @media (min-width: 2560px) {
      width: 20px;
      height: 20px;
    }

    @media (min-width: 3840px) {
      width: 24px;
      height: 24px;
    }
  }
  
  &::-ms-fill-lower {
    background: transparent;
  }
  
  &::-ms-fill-upper {
    background: transparent;
  }
`;



const SliderSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-top:0.1rem;
`;



const ValuesRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: clamp(0.6rem, 0.8vw, 1rem);

  @media (min-width: 1921px) {
    margin-top: 1rem;
  }
`;
const TopValuesRow = styled.div`
  
`
const Value = styled.span`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: ${typography.SliderNumValue.fontWeight};
  color: rgba(255, 255, 255, 0.75);

`;