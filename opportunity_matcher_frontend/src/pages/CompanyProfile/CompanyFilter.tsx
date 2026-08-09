import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { setCompaniesListFilters } from "../../store/actions/companiesListActions";
import { selectCompaniesListFilters } from "../../store/selectors/companiesListSelectors";
import { CompaniesListFilters } from "../../store/types/companiesListTypes";
import typography from "../../common/typography";

interface RangeValues {
  min: number;
  max: number;
}

interface CompanyFilterProps {
  onFilterChange?: (filters: CompaniesListFilters) => void;
}

// Mock sector counts - replace with actual data from your API if available
const sectorCounts = [
  { sector: "Financial Services", count: 42 },
  { sector: "Information and Communication Technology", count: 35 },
  { sector: "Professional Services", count: 28 },
  { sector: "Engineering & Construction", count: 31 },
  { sector: "Engineering", count: 25 },
  { sector: "Oil, Gas, Energy & Water", count: 38 },
  { sector: "Industrial & Logistics", count: 29 },
  { sector: "Tourism & Quality of Life & Hospitality", count: 22 },
];

const CompanyFilter: React.FC<CompanyFilterProps> = ({ onFilterChange }) => {
  const dispatch = useDispatch();
  const currentReduxFilters = useSelector(selectCompaniesListFilters);

  // Ensure all properties are defined with default values
  const [localFilters, setLocalFilters] = useState<CompaniesListFilters>({
    sectors: currentReduxFilters.sectors || [],
    company_size: currentReduxFilters.company_size || { min: 1, max: 10000 },
    revenue: currentReduxFilters.revenue || { min: 1, max: 100000000000000 },
    presence_of_company_in_mena: currentReduxFilters.presence_of_company_in_mena || false,
    presence_in_saudi: currentReduxFilters.presence_in_saudi || false,
    rhq_status: currentReduxFilters.rhq_status || "false",
    search: currentReduxFilters.search || "",
  });
  const [searchDraft, setSearchDraft] = useState(currentReduxFilters.search || "");

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const filterOptions = [
    {
      options: sectorCounts.map(item => item.sector),
    },
  ];

  // Apply filters function with useCallback to prevent recreation
  const applyFilters = useCallback(() => {
    const filtersToApply: Partial<CompaniesListFilters> = {
      ...localFilters,
      page: 1,
    };

    if (!localFilters.presence_of_company_in_mena) {
      delete filtersToApply.presence_of_company_in_mena;
    }
    if (!localFilters.presence_in_saudi) {
      delete filtersToApply.presence_in_saudi;
    }
    if (localFilters.rhq_status !== "true") {
      delete filtersToApply.rhq_status;
    }

    if (onFilterChange) {
      onFilterChange(filtersToApply as CompaniesListFilters);
    }

    dispatch(setCompaniesListFilters(filtersToApply as CompaniesListFilters));
  }, [localFilters, onFilterChange, dispatch]);

  // Apply filters with debounce - use a ref to track the timeout
  useEffect(() => {
    // Skip the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(applyFilters, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localFilters, applyFilters]);

  // Update local filters when Redux filters change externally
  useEffect(() => {
    setLocalFilters({
      sectors: currentReduxFilters.sectors || [],
      company_size: currentReduxFilters.company_size || { min: 1, max: 10000 },
      revenue: currentReduxFilters.revenue || { min: 1, max: 100000000000000 },
      presence_of_company_in_mena: currentReduxFilters.presence_of_company_in_mena || false,
      presence_in_saudi: currentReduxFilters.presence_in_saudi || false,
      rhq_status: currentReduxFilters.rhq_status || "false",
      search: currentReduxFilters.search || "",
    });
    setSearchDraft(currentReduxFilters.search || "");
  }, [currentReduxFilters]);

  // Debounce name search separately so typing stays smooth
  useEffect(() => {
    const t = setTimeout(() => {
      setLocalFilters((prev) => {
        const next = (searchDraft || "").trim();
        if ((prev.search || "") === next) return prev;
        return { ...prev, search: next };
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  // Helper function to safely access company_size
  const formatCompanySize = (num: number, includeSuffix: boolean = true): string => {
    if (!num && num !== 0) return '0';
    const formattedNum = num.toLocaleString('en-US');
    return includeSuffix ? `${formattedNum}` : formattedNum;
  };

  const getCompanySize = () => {
    const size = localFilters.company_size || { min: 1, max: 10000 };
    return {
      minFormatted: formatCompanySize(size.min),
      maxFormatted: formatCompanySize(size.max),
      rangeFormatted: `${formatCompanySize(size.min, false)} - ${formatCompanySize(size.max)}`,
      raw: size
    };
  };

  // Helper function to safely access revenue
  const getRevenue = () => {
    return localFilters.revenue || { min: 1, max: 100000000000000 };
  };

  // Helper function to safely access sectors
  const getSectors = () => {
    return localFilters.sectors || [];
  };

  // Toggle sector selection
  const toggleSector = (sector: string) => {
    setLocalFilters(prev => {
      const currentSectors = prev.sectors || [];
      const newSectors = currentSectors.includes(sector)
        ? currentSectors.filter(s => s !== sector)
        : [...currentSectors, sector];

      return { ...prev, sectors: newSectors };
    });
  };

  // Update company size range
  const updateCompanySize = (min: number, max: number) => {
    setLocalFilters(prev => ({
      ...prev,
      company_size: { min, max }
    }));
  };

  // Update revenue range
  const updateRevenue = (min: number, max: number) => {
    setLocalFilters(prev => ({
      ...prev,
      revenue: { min, max }
    }));
  };

  // Toggle boolean filters
  const togglePresenceInMena = () => {
    setLocalFilters(prev => ({
      ...prev,
      presence_of_company_in_mena: !prev.presence_of_company_in_mena
    }));
  };

  const togglePresenceInSaudi = () => {
    setLocalFilters(prev => ({
      ...prev,
      presence_in_saudi: !prev.presence_in_saudi
    }));
  };

  const toggleRhqStatus = () => {
    setLocalFilters(prev => ({
      ...prev,
      rhq_status: prev.rhq_status === "true" ? "false" : "true"
    }));
  };

  const clearAll = () => {
    const emptyFilters: CompaniesListFilters = {
      sectors: [],
      company_size: { min: 1, max: 10000 },
      revenue: { min: 1, max: 100000000000000 },
      presence_of_company_in_mena: false,
      presence_in_saudi: false,
      rhq_status: "false",
      search: "",
    };

    setLocalFilters(emptyFilters);
    setSearchDraft("");
    setOpenIndex(null);
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
        return;
      }

      if (openIndex !== null && dropdownRefs.current[openIndex]) {
        const dropdownElement = dropdownRefs.current[openIndex];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenIndex(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openIndex]);

  const formatNumber = (num: number): string => {
    if (!num && num !== 0) return '$0';

    if (num >= 1000000000) {
      const billions = num / 1000000000;
      return `$${billions >= 10 ? Math.floor(billions).toLocaleString('en-US') : billions.toFixed(1).replace(/\.0$/, '')}B`;
    } else if (num >= 1000000) {
      const millions = num / 1000000;
      return `$${millions >= 10 ? Math.floor(millions).toLocaleString('en-US') : millions.toFixed(1).replace(/\.0$/, '')}M`;
    } else if (num >= 1000) {
      const thousands = num / 1000;
      return `$${thousands >= 10 ? Math.floor(thousands).toLocaleString('en-US') : thousands.toFixed(1).replace(/\.0$/, '')}K`;
    }
    return `$${num.toLocaleString('en-US')}`;
  };

  const getLinearPosition = (value: number, min: number, max: number): number => {
    return ((value - min) / (max - min)) * 100;
  };

  // Helper function to get selected sector display text
  const getSelectedSectorsText = () => {
    const sectors = getSectors();
    if (sectors.length === 0) return "Select Options";
    if (sectors.length <= 2) return sectors.join(", ");
    return `${sectors.length} selected`;
  };


  // Use helper functions to get safe values
  const companySize = getCompanySize();
  const revenue = getRevenue();
  const sectors = getSectors();

  return (
    <>
      <TagsWrapper>
        <Tag
          active={localFilters.presence_of_company_in_mena || false}
          onClick={togglePresenceInMena}
        >
          MENA Active
        </Tag>

        <Tag
          active={localFilters.presence_in_saudi || false}
          onClick={togglePresenceInSaudi}
        >
          Saudi Present
        </Tag>

        <Tag
          active={localFilters.rhq_status === "true"}
          onClick={toggleRhqStatus}
        >
          RHQ Status
        </Tag>
      </TagsWrapper>

      <FilterContainer ref={wrapperRef}>
        <FilterBar>
          <SearchSection>
            <Label>Search companies</Label>
            <NameSearchInput
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Company name or sector…"
              aria-label="Search companies by name"
            />
          </SearchSection>

          <SliderSection>
            <SliderHeader>
              <Label>Company Size</Label>
              <ActiveValue>{companySize.minFormatted} - {companySize.maxFormatted}</ActiveValue>
            </SliderHeader>
            <SliderWrapper>
              <RangeHighlight
                left={(companySize.raw.min / 10000) * 100}
                right={100 - (companySize.raw.max / 10000) * 100}
              />
              <Range
                type="range"
                min="1"
                max="10000"
                value={companySize.raw.min}
                onChange={(e) =>
                  updateCompanySize(
                    Math.min(Number(e.target.value), companySize.raw.max - 1),
                    companySize.raw.max
                  )
                }
              />

              <Range
                type="range"
                min="1"
                max="10000"
                value={companySize.raw.max}
                onChange={(e) =>
                  updateCompanySize(
                    companySize.raw.min,
                    Math.max(Number(e.target.value), companySize.raw.min + 1)
                  )
                }
              />
            </SliderWrapper>

            <ValuesRow>
              <Value>1</Value>
              <Value>10,000</Value>
            </ValuesRow>
          </SliderSection>

          <SliderSection>
            <SliderHeader>
              <Label>Revenue Range</Label>
              <ActiveValue>{formatNumber(revenue.min)} - {formatNumber(revenue.max)}</ActiveValue>
            </SliderHeader>

            <SliderWrapper>
              <RangeHighlight
                left={getLinearPosition(revenue.min, 1, 100000000000000)}
                right={100 - getLinearPosition(revenue.max, 1, 100000000000000)}
              />
              <Range
                type="range"
                min="1"
                max="100000000000000"
                value={revenue.min}
                onChange={(e) =>
                  updateRevenue(
                    Math.min(Number(e.target.value), revenue.max - 1),
                    revenue.max
                  )
                }
              />
              <Range
                type="range"
                min="1"
                max="100000000000000"
                value={revenue.max}
                onChange={(e) =>
                  updateRevenue(
                    revenue.min,
                    Math.max(Number(e.target.value), revenue.min + 1)
                  )
                }
              />
            </SliderWrapper>

            <ValuesRow>
              <Value>{formatNumber(1)}</Value>
              <Value>{formatNumber(100000000000000)}</Value>
            </ValuesRow>
          </SliderSection>

          <DropdownSection>
            <Label>Sectors</Label>
            <CustomSelect>
              <SelectBox onClick={() => setOpenIndex(openIndex === 0 ? null : 0)}>
                <SelectText>
                  {getSelectedSectorsText()}
                </SelectText>
                {openIndex === 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </SelectBox>

              {openIndex === 0 && (
                <Dropdown ref={el => { dropdownRefs.current[0] = el; }}>
                  {sectorCounts.map((sector) => {
                    const isChecked = sectors.includes(sector.sector);
                    return (
                      <OptionRow
                        key={sector.sector}
                        checked={isChecked}
                        onClick={() => toggleSector(sector.sector)}
                      >
                        <LeftPart>
                          <CustomCheckbox
                            checked={isChecked}
                            onChange={() => toggleSector(sector.sector)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <OptionText>{sector.sector}</OptionText>
                        </LeftPart>
                      </OptionRow>
                    );
                  })}
                </Dropdown>
              )}
            </CustomSelect>
          </DropdownSection>

          <ActionsSection>
            <ClearButton onClick={clearAll}>Clear All</ClearButton>
          </ActionsSection>
        </FilterBar>
      </FilterContainer>
    </>
  );
};

export default CompanyFilter;

// Custom checkbox with green background
const CustomCheckbox = styled.input.attrs({ type: "checkbox" })`
  appearance: none;
  width: 11px;
  height: 11px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 1px;
  display: grid;
  place-content: center;
  background: rgba(255, 255, 255, 0.8); 
  cursor: pointer;
  transition: all 0.2s ease;

  &:checked {
    border: 2px solid transparent;
    background:
      linear-gradient(rgba(0, 255, 136, 0.8), rgba(0, 255, 136, 0.8)) padding-box,
      linear-gradient(90deg, #00ff88, #00cfff) border-box;
  }

  &:checked::after {
    content: "✔";
    font-size: 12px;
    font-weight: bold;
    background: linear-gradient(90deg, #000000ff, #000000ff); 
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (min-width: 2560px) {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    
    &:checked::after {
      font-size: 14px;
    }
  }

  @media (min-width: 3840px) {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    
    &:checked::after {
      font-size: 16px;
    }
  }
`;


const Count = styled.span<{ checked: boolean }>`
  font-size: 0.85rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 5px;
  display: inline-block;
  text-align: center;
  background: ${({ checked }) =>
    checked
      ? "linear-gradient(90deg, #00ff88, #00cfff)"
      : "rgba(255,255,255,0.1)"};
  color: ${({ checked }) => (checked ? "#111" : "#fff")};
  transition: all 0.2s ease;
  min-width: 24px;

  @media (min-width: 1921px) {
    font-size: 1.3rem;
    padding: 4px 10px;
    min-width: 30px;
    border-radius: 6px;
  }
`;

const OptionText = styled.span`
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};
  white-space: normal;
  word-break: break-word;
  line-height: 1.3;
  flex: 1;
`;

const Tag = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  background: ${({ active }) =>
    active ? "rgba(0, 255, 136, 0.1)" : "rgba(41, 62, 83, 1)"};
  border: ${({ active }) =>
    active ? "1px solid rgba(0, 255, 136, 0.3)" : "none"};
  color: ${({ active }) => (active ? "#00ff88" : "#ffffff")};
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  padding: ${typography.button.padding};
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;

  @media (min-width: 1921px) {
    padding: ${typography.button.padding};
    border-radius: 12px;
  }
`;

const TagsWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
  width: 100%;
  max-width: 2400px;
  margin: 0 auto;
  padding: 0 clamp(0.75rem, 2vw, 1.5rem);
  box-sizing: border-box;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

const SelectText = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};
  min-width: 0;
`;

const FilterContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: clamp(0.85rem, 1.5vw, 1.25rem);
  margin: clamp(0.75rem, 1.5vw, 1.5rem) auto 0 auto;
  width: min(100%, 2400px);
  max-width: 100%;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: visible;

  @media (max-width: 768px) {
    width: 100%;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

const FilterBar = styled.div`
  display: grid;
  width: 100%;
  gap: clamp(0.85rem, 1.5vw, 1.25rem);
  align-items: end;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;

  @media (max-width: 1280px) {
    grid-column: 1 / -1;
  }
`;

const NameSearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.92);
  padding: 0.55rem 0.7rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.38);
  }

  &:focus {
    border-color: rgba(0, 200, 140, 0.45);
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.08);
  }
`;

const SliderSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`;

const SliderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  min-width: 0;
`;

const Label = styled.span`
  font-size: ${typography.filterLabel.fontSize};
  font-weight: ${typography.filterLabel.fontWeight};
  color: white;
  margin-bottom: 0.45rem;
  display: inline-block;
  white-space: nowrap;
  flex-shrink: 0;

  ${SliderHeader} & {
    margin-bottom: 0;
  }
`;

const ActiveValue = styled.span`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: 600;
  color: #ffffff;
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SliderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
`;

const RangeHighlight = styled.div<{ left: number; right: number }>`
  position: absolute;
  height: 4px;
  background: linear-gradient(to right, #00ff88, #00cfff);
  border-radius: 5px;
  left: ${({ left }) => left}%;
  right: ${({ right }) => right}%;
`;

const Range = styled.input`
  position: absolute;
  top: -7px;
  width: 100%;
  pointer-events: none;
  background: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    pointer-events: all;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #00ffcc;
    cursor: pointer;
    border: none;
  }
`;

const ValuesRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.65rem;
  min-width: 0;
`;

const Value = styled.span`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: ${typography.SliderNumValue.fontWeight};
  color: rgba(255, 255, 255, 0.75);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionsSection = styled.div`
  display: flex;
  align-items: flex-end;
  min-width: 0;

  @media (max-width: 1280px) {
    grid-column: 1 / -1;
  }
`;

const ClearButton = styled.button`
  background: rgba(42, 51, 59, 1);
  color: white;
  border: none;
  padding: 0.7rem 1.1rem;
  border-radius: 6px;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  width: 100%;

  @media (min-width: 1281px) {
    width: auto;
    min-width: 110px;
  }

  &:hover {
    background: rgba(55, 68, 78, 1);
  }
`;

const DropdownSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`;

const CustomSelect = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

const SelectBox = styled.div`
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 6px;
  padding: ${typography.selectBox.padding};
  font-size: ${typography.selectBox.fontSize};
  font-weight: ${typography.selectBox.fontWeight};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    border-color: #00ffcc;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  min-width: min(100%, 280px);
  max-width: min(100vw - 2rem, 420px);
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);

  scrollbar-width: thin;

  @media (max-width: 720px) {
    max-width: 100%;
  }
`;

const OptionRow = styled.div<{ checked: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.9rem;
  cursor: pointer;
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};
  gap: 0.8rem;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const LeftPart = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1;
  min-width: 0;
`;