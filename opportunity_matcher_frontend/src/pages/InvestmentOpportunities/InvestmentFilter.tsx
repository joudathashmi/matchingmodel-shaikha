import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getOpportunitiesSectorCounts } from "../../store/actions/opportunitiesSectorActions";
import { useDispatch, useSelector } from "react-redux";
import { selectOpportunitiesSectorCounts, selectOpportunitiesSectorCountsLoading } from "../../store/selectors/opportunitiesSectorSelectors";
import { setOpportunitiesFilters } from "../../store/actions/getopportunitiesListActions";
import { selectOpportunitiesFilters } from "../../store/selectors/getOpportunitiesListSelectors";
import typography from "../../common/typography";

// ===== Parent Wrapper =====
const FiltersContainer = styled.div`
  width: 100%;
  max-width: 100%;
  padding: 0;
  box-sizing: border-box;
`;

// ===== Bar Layout =====
const FilterBar = styled.div`
  display: grid;
  width: 100%;
  gap: clamp(0.85rem, 1.5vw, 1.25rem);
  align-items: end;
  grid-template-columns: minmax(0, 1fr);

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1200px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  }
`;

const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;

  @media (min-width: 720px) and (max-width: 1199px) {
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

// ===== Slider Section =====
const SliderSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`;

// ===== Label =====
const Label = styled.span`
  font-size: ${typography.filterLabel.fontSize};
  font-weight: ${typography.filterLabel.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 0.5rem;
  display: inline-block;
  white-space: nowrap;
`;

// ===== Slider Wrapper =====
const SliderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    height: 6px;
  }
`;

const RangeHighlight = styled.div<{ left: number; right: number }>`
  position: absolute;
  height: 4px;
  background: linear-gradient(to right, #00ff88, #00cfff);
  border-radius: 5px;
  left: ${({ left }) => left}%;
  width: ${({ left, right }) => right - left}%;
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    height: 6px;
  }
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
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    top: -8px;
    
    &::-webkit-slider-thumb {
      width: 18px;
      height: 18px;
    }
  }
`;

// ===== Value Labels =====
const ValuesRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.6rem;
  
  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    margin-top: 0.8rem;
  }
`;

const Value = styled.span`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: ${typography.SliderNumValue.fontWeight};
  color: rgba(255, 255, 255, 0.75);
`;

const SliderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  min-width: 0;

  ${Label} {
    margin-bottom: 0;
  }
`;

const ActiveValue = styled(Value)`
  color: rgba(255, 255, 255, 0.92);
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ===== Dropdown Section =====
const DropdownSection = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
`;

// Wrapper
const CustomSelect = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

// Select Box (closed state)
const SelectBox = styled.div<{ $disabled?: boolean }>`
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 6px;
  padding: 0.7rem 0.8rem;
  font-size: ${typography.selectBox.fontSize};
  font-weight: ${typography.selectBox.fontWeight};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? 'rgba(255, 255, 255, 0.15)' : '#00ffcc')};
  }

  @media (min-width: 1921px) {
    padding: 0.8rem 1.2rem;
  }
`;

const SelectText = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
  font-size: ${typography.selectBox.fontSize};
  font-weight: ${typography.selectBox.fontWeight};
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
  z-index: 1000;
  max-height: 220px;
  overflow-y: auto;
  
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  @media (min-width: 1921px) {
    margin-top: 0.5rem;
    max-height: 300px;
  }
`;

// Each Option row
const OptionRow = styled.div<{ checked: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};
  gap: 0.8rem;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 1921px) {
    padding: 0.8rem 1.2rem;
  }
`;

const LeftPart = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;

  @media (min-width: 1921px) {
    gap: 0.8rem;
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
    padding: 4px 10px;
    min-width: 30px;
    border-radius: 6px;
  }
`;

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

  /* 4K Responsive Styles */
  @media (min-width: 1921px) {
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

// ===== Clear Button =====
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

  &:hover {
    background: rgba(239, 68, 68, 0.35);
    color: #fff;
  }

  @media (min-width: 720px) and (max-width: 1199px) {
    grid-column: 1 / -1;
  }

  @media (min-width: 1200px) {
    width: auto;
    min-width: 110px;
  }
`;

interface InvestmentFilterProps {
  clearAll: () => void;
}

const InvestmentFilter: React.FC<InvestmentFilterProps> = ({ clearAll }) => {
  const MIN_INVESTMENT = 1;
  const MAX_INVESTMENT = 1000000000;
  const [minVal, setMinVal] = useState(MIN_INVESTMENT);
  const [maxVal, setMaxVal] = useState(MAX_INVESTMENT);
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(1);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const dispatch = useDispatch();
  const sectorCounts = useSelector(selectOpportunitiesSectorCounts);
  const loading = useSelector(selectOpportunitiesSectorCountsLoading);
  const currentFilters = useSelector(selectOpportunitiesFilters);
  const [searchDraft, setSearchDraft] = useState(currentFilters.search || "");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isDraggingRef = useRef(false);

  // Initialize from Redux filters
  useEffect(() => {
    if (currentFilters.investment_range) {
      setMinVal(currentFilters.investment_range.min);
      setMaxVal(currentFilters.investment_range.max);
    }
    if (currentFilters.ai_score) {
      setMinScore(currentFilters.ai_score.min);
      setMaxScore(currentFilters.ai_score.max);
    }
    if (currentFilters.sectors) {
      setSelectedSectors(currentFilters.sectors);
    }
    setSearchDraft(currentFilters.search || "");
  }, [currentFilters]);

  // Update filters when user stops interacting (debounced for sector changes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isDraggingRef.current) {
        dispatch(setOpportunitiesFilters({
          sectors: selectedSectors,
          ai_score: { min: minScore, max: maxScore },
          investment_range: { min: minVal, max: maxVal },
          search: (searchDraft || "").trim(),
          page: 1,
        }));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedSectors, minVal, maxVal, minScore, maxScore, searchDraft, dispatch]);

  useEffect(() => {
    dispatch(getOpportunitiesSectorCounts());
  }, [dispatch]);

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

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev => {
      const newSectors = prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector];

      return newSectors;
    });
  };

  // Handle slider change start
  const handleSliderStart = () => {
    isDraggingRef.current = true;
  };

  // Handle slider change end
  const handleSliderEnd = () => {
    isDraggingRef.current = false;
    dispatch(setOpportunitiesFilters({
      sectors: selectedSectors,
      ai_score: { min: minScore, max: maxScore },
      investment_range: { min: minVal, max: maxVal },
      search: (searchDraft || "").trim(),
      page: 1,
    }));
  };

  // Convert investment value to UI display format ($1 - $1000M)
  const formatInvestmentForUI = (value: number): string => {
  if (value >= 1000000) {

    return `$${Math.floor(value / 1000000).toLocaleString("en-US")}M`;
  }
  
  return `$${value.toLocaleString("en-US")}`;
};


  // Convert score value to UI display format (0-100%)
  const formatScoreForUI = (value: number): number => {
    return Math.round(value * 100);
  };

  // Helper function to get selected sectors display text
  const getSelectedSectorsText = () => {
    if (selectedSectors.length === 0) return "Select Options";
    if (selectedSectors.length <= 2) return selectedSectors.join(", "); // show names for 1 or 2
    return `${selectedSectors.length} selected`; // show count for 3 or more
  };


  return (
    <FiltersContainer ref={wrapperRef}>
      <FilterBar>
        <SearchSection>
          <Label>Search opportunities</Label>
          <NameSearchInput
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Opportunity name or sector…"
            aria-label="Search opportunities by name"
          />
        </SearchSection>

        {/* Investment Range */}
        <SliderSection>
          <SliderHeader>
            <Label>Investment Range</Label>
            <ActiveValue>
              {formatInvestmentForUI(minVal)} - {formatInvestmentForUI(maxVal)}
            </ActiveValue>
          </SliderHeader>

          <SliderWrapper>
            <RangeHighlight
              left={((minVal - MIN_INVESTMENT) / (MAX_INVESTMENT - MIN_INVESTMENT)) * 100}
              right={((maxVal - MIN_INVESTMENT) / (MAX_INVESTMENT - MIN_INVESTMENT)) * 100}
            />
            <Range
              type="range"
              min={MIN_INVESTMENT}
              max={MAX_INVESTMENT}
              value={minVal}
              onChange={(e) =>
                setMinVal(Math.min(Number(e.target.value), maxVal - 1000000))
              }
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
            <Range
              type="range"
              min={MIN_INVESTMENT}
              max={MAX_INVESTMENT}
              value={maxVal}
              onChange={(e) =>
                setMaxVal(Math.max(Number(e.target.value), minVal + 1000000))
              }
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
          </SliderWrapper>

          <ValuesRow>
            <Value>$1</Value>
            <Value>$1,000M</Value>
          </ValuesRow>
        </SliderSection>

        {/* Match Score Range */}
        <SliderSection>
          <SliderHeader>
            <Label>Match Score</Label>
            <ActiveValue>
              {formatScoreForUI(minScore)}% - {formatScoreForUI(maxScore)}%
            </ActiveValue>
          </SliderHeader>

          <SliderWrapper>
            <RangeHighlight
              left={minScore * 100}
              right={maxScore * 100}
            />
            <Range
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={minScore}
              onChange={(e) =>
                setMinScore(Math.min(Number(e.target.value), maxScore - 0.01))
              }
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
            <Range
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={maxScore}
              onChange={(e) =>
                setMaxScore(Math.max(Number(e.target.value), minScore + 0.01))
              }
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

        {/* Sector Dropdown */}
        <DropdownSection>
          <Label>Sectors</Label>
          <CustomSelect>
            <SelectBox
              $disabled={loading}
              onClick={() => !loading && setOpenIndex(openIndex === 0 ? null : 0)}
            >
              <SelectText>
                {getSelectedSectorsText()}
              </SelectText>
              {openIndex === 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </SelectBox>

            {openIndex === 0 && !loading && (
              <Dropdown ref={el => { dropdownRefs.current[0] = el; }}>
                {sectorCounts.map((sector) => {
                  const isChecked = selectedSectors.includes(sector.sector);
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

        {/* Clear All */}
        <ClearButton onClick={clearAll}>Clear All</ClearButton>
      </FilterBar>
    </FiltersContainer>
  );
};

export default InvestmentFilter;