import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { selectDiscoverSectorCount, selectDiscoverSectorCountLoading, selectDiscoverSectorCountError } from "../../store/selectors/discoverSectorCountSelectors";
import { getDiscoverSectorCountRequest } from "../../store/actions/discoverSectorCountActions";
import { AppDispatch } from "../../store";
import { getDiscoveryOpportunities } from "../../store/actions/discoverOpportunitiesActions";
import typography from "../../common/typography";

const BUCKET_TO_RANGE_M: Record<string, { min: number; max: number }> = {
  "$1-10M": { min: 1, max: 10 },
  "$10-50M": { min: 10, max: 50 },
  "$50-100M": { min: 50, max: 100 },
  "$100M-1B": { min: 100, max: 1000 },
  "$1B+": { min: 1000, max: 5000 },
};

interface DiscoveryFilterProps {
  onFilterChange?: (filters: any) => void;
}

const DiscoveryFilter: React.FC<DiscoveryFilterProps> = ({ onFilterChange }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const seedSector = searchParams.get("sector") || "";
  const seedBucket = searchParams.get("bucket") || "";
  const seedRange = BUCKET_TO_RANGE_M[seedBucket];

  const [minVal, setMinVal] = useState(seedRange?.min ?? 1);
  const [maxVal, setMaxVal] = useState(seedRange?.max ?? 1000);
  const [minScore, setMinScore] = useState(seedParamsFocusScore(searchParams.get("focus")));
  const [maxScore, setMaxScore] = useState(100);

  const sectorCounts = useSelector(selectDiscoverSectorCount);
  const loadingSectors = useSelector(selectDiscoverSectorCountLoading);
  const errorSectors = useSelector(selectDiscoverSectorCountError);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<{ [key: number]: string[] }>({
    0: seedSector ? [seedSector] : [],
    1: [],
  });

  const isDraggingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFilterValuesRef = useRef({
    minVal: seedRange?.min ?? 1,
    maxVal: seedRange?.max ?? 1000,
    minScore: seedParamsFocusScore(searchParams.get("focus")),
    maxScore: 100,
    selectedValues: { 0: seedSector ? [seedSector] : [], 1: [] as string[] },
  });

  interface SectorItem {
    sector: string;
    count: number;
  }

  const sectorOptions = sectorCounts.map((item: SectorItem) => ({
    value: item.sector,
    label: item.sector,
    count: item.count,
  }));

  const locationOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  const dropdownOptions: { [key: number]: any[] } = {
    0: sectorOptions,
    1: locationOptions,
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = (index: number, val: string) => {
    setSelectedValues((prev) => {
      const current = prev[index] || [];
      const updated = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val];

      return {
        ...prev,
        [index]: updated,
      };
    });
  };

  const applyFilters = useCallback(() => {

     const aiDecisionValue = selectedValues[1] && selectedValues[1].length > 0 
    ? selectedValues[1][0] 
    : undefined; 
    const filters = {
      sectors: selectedValues[0],
      match_score: { min: minScore / 100, max: maxScore / 100 },
      investment_range: { min: minVal * 1_000_000, max: maxVal * 1_000_000 },
      ai_decision: aiDecisionValue,
      page: 1,
      limit: 5,
    };

    lastFilterValuesRef.current = {
      minVal,
      maxVal,
      minScore,
      maxScore,
      selectedValues: {
        ...selectedValues,
        0: [],
        1: []
      }
    };

    dispatch(getDiscoveryOpportunities(filters));

    if (onFilterChange) onFilterChange(filters);
  }, [selectedValues, minVal, maxVal, minScore, maxScore, dispatch, onFilterChange]);

  const handleSliderStart = () => {
    isDraggingRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSliderEnd = () => {
    isDraggingRef.current = false;

    const currentValues = { minVal, maxVal, minScore, maxScore, selectedValues };
    const lastValues = lastFilterValuesRef.current;

    const valuesChanged =
      currentValues.minVal !== lastValues.minVal ||
      currentValues.maxVal !== lastValues.maxVal ||
      currentValues.minScore !== lastValues.minScore ||
      currentValues.maxScore !== lastValues.maxScore ||
      JSON.stringify(currentValues.selectedValues) !== JSON.stringify(lastValues.selectedValues);

    if (valuesChanged) {
      applyFilters();
    }
  };

  useEffect(() => {
    if (!isDraggingRef.current) {
      applyFilters();
    }
  }, [selectedValues, applyFilters]);

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
  }, [minVal, maxVal, minScore, maxScore, applyFilters]);

  useEffect(() => {
    dispatch(getDiscoverSectorCountRequest());
    applyFilters();
  }, [dispatch]);

  const clearAll = () => {
    setSelectedValues({ 0: [], 1: [] });
    setMinVal(1);
    setMaxVal(1000);
    setMinScore(0);
    setMaxScore(100);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <FilterContainer>
      <FilterBar>

        <SliderSection>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Label>Investment Range ($M)</Label>
            <Value style={{ color: "white" }}>${minVal}M - ${maxVal}M</Value>
          </div>

          <SliderWrapper>
            <RangeHighlight
              left={(minVal / 1000) * 100}
              right={(maxVal / 1000) * 100}
            />
            <Range
              type="range"
              min="1"
              max="1000"
              value={minVal}
              onChange={(e) =>
                setMinVal(Math.min(Number(e.target.value), maxVal - 10))
              }
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
            <Range
              type="range"
              min="1"
              max="1000"
              value={maxVal}
              onChange={(e) =>
                setMaxVal(Math.max(Number(e.target.value), minVal + 10))
              }
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
          </SliderWrapper>

          <ValuesRow>
            <Value>$1M</Value>
            <Value>$1000M</Value>
          </ValuesRow>
        </SliderSection>

        
        <SliderSection>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Label>Match Score (%)</Label>
            <Value style={{ color: "white" }}>{minScore}% - {maxScore}%</Value>
          </div>

          <SliderWrapper>
            <RangeHighlight
              left={minScore}
              right={maxScore}
            />
            <Range
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) =>
                setMinScore(Math.min(Number(e.target.value), maxScore - 5))
              }
              onMouseDown={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchStart={handleSliderStart}
              onTouchEnd={handleSliderEnd}
            />
            <Range
              type="range"
              min="0"
              max="100"
              value={maxScore}
              onChange={(e) =>
                setMaxScore(Math.max(Number(e.target.value), minScore + 5))
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

        
        <DropdownSection ref={dropdownRef}>
          {["Sectors", "AI Decision"].map((label, idx) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 0.4rem 0 0",
              }}
              key={idx}
            >
              <SliderSection key={idx}>
                <Label>{label}</Label>
                <CustomSelect>
                  <SelectBox
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  >
                    {selectedValues[idx]?.length > 0
                      ? selectedValues[idx].length <= 2
                        ? selectedValues[idx]
                          .map(val => dropdownOptions[idx].find(opt => opt.value === val)?.label)
                          .filter(Boolean)
                          .join(", ")
                        : `${selectedValues[idx].length} selected`
                      : `Select Options`}
                    {openIndex === idx ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </SelectBox>

                  {openIndex === idx && (
                    <Dropdown>
                      {dropdownOptions[idx].map((opt) => {
                        const isChecked = selectedValues[idx]?.includes(opt.value);
                        return (
                          <OptionRow
                            key={opt.value}
                            checked={isChecked}
                            onClick={() => toggle(idx, opt.value)}
                          >
                            <LeftPart>
                              <CustomCheckbox
                                checked={isChecked}
                                onChange={() => toggle(idx, opt.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <OptionText>{opt.label}</OptionText>
                            </LeftPart>
                          </OptionRow>
                        );
                      })}
                    </Dropdown>
                  )}

                </CustomSelect>
              </SliderSection>
            </div>
          ))}
        </DropdownSection>

        
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100px",
            margin: "1.7rem 1.9rem 0 0rem",
          }}
        >
          <ClearButton onClick={clearAll}>Clear All</ClearButton>
        </div>
      </FilterBar>
    </FilterContainer>
  );
};

export default DiscoveryFilter;


const FilterContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  padding: 1rem 0rem 1rem 0.8rem;
  margin: 1rem 0rem 0 0.3rem ;
  width: 98%;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 2560px) {
    padding: 1.5rem 0rem 1.5rem 1.2rem;
    margin: 1.5rem 0rem 0 0.5rem;
  }
`;

const FilterBar = styled.div`
  display: flex;
  
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap; 

  @media (max-width: 768px) {
    flex-direction: column; 
    align-items: stretch;
  }

  @media (min-width: 2560px) {
    gap: 1.5rem;
  }
`;

const SliderSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 310px;

  @media (max-width: 768px) {
    width: 100%; 
  }

  @media (min-width: 2560px) {
    max-width: 570px;
  }
`;

const Label = styled.span`
  font-size: ${typography.filterLabel.fontSize};
  font-weight:${typography.filterLabel.fontWeight};
  color: white;
  margin-bottom: clamp(0.4rem, 0.6vw, 0.8rem);
  white-space: nowrap;

  @media (min-width: 2560px) {
    margin-bottom: 0.7rem;
  }
`;

const SliderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  margin-top:0.5rem;

  @media (min-width: 2560px) {
    height: 7px;
  }
`;

const RangeHighlight = styled.div<{ left: number; right: number }>`
  position: absolute;
  height: 4px;
  background: linear-gradient(to right, #00ff88, #00cfff);
  border-radius: 5px;
  left: ${({ left }) => left}%;
  right: ${({ right }) => 100 - right}%;

  @media (min-width: 2560px) {
    height: 7px;
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

  @media (min-width: 2560px) {
    top: -8px;
    
    &::-webkit-slider-thumb {
      width: 19px;
      height: 19px;
    }
  }
`;

const ValuesRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.6rem;

  @media (min-width: 2560px) {
    margin-top: 0.8rem;
  }
`;

const Value = styled.span`
  font-size: ${typography.SliderNumValue.fontSize};
  font-weight: ${typography.SliderNumValue.fontWeight};
  color: rgba(255, 255, 255, 0.75);
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  min-width: 150px;

  &:focus {
    border-color: #00ffcc;
    outline: none;
  }

  @media (max-width: 768px) {
    width: 100%; 
  }

  @media (min-width: 2560px) {
    padding: 0.6rem 1rem;
    font-size: 1.4rem;
    min-width: 200px;
  }
`;

const ClearButton = styled.button`
  background: rgba(42, 51, 59, 1);
  color:white;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 6px;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  @media (max-width: 768px) {
    width: 100%;  
  }

  @media (min-width: 2560px) {
    padding: 1.3rem 1.2rem;
    border-radius: 8px;
  }
`;


const DropdownSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 900px;
  margin:0 0 0 auto;

  > * {
    flex: 1; 
  }

  @media (max-width: 768px) {
    flex-direction: column; 
    align-items: stretch;
  }

  @media (min-width: 2560px) {
    gap: 0.8rem;
    max-width: 1100px;
  }
`;


const InlineLabel = styled.span`
  font-size: 0.90rem;
  font-weight:500
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  
  @media (min-width: 2560px) {
    font-size: 1.5rem;
  }
`;


const CustomSelect = styled.div`
  position: relative;
  min-width: 210px;

  @media (max-width: 768px) {
    flex: 1;          
    min-width: unset; 
  }

  @media (min-width: 2560px) {
    min-width: 350px;
  }
`;


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


const Dropdown = styled.div`
  position: absolute;
  top: 110%;
  left: 0;
  right: 0;
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 0.3rem;
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; 
  scrollbar-width: none;  

  
  @media (min-width: 2560px) {
    margin-top: 0.5rem;
    border-radius: 10px;
    max-height: 280px;
  }
`;


const OptionRow = styled.div<{ checked: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  gap: 0.8rem;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

 
  @media (min-width: 2560px) {
    padding: 0.8rem 1rem;
  }
`;

const LeftPart = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;       
  min-width: 0;  

  input {
    flex-shrink: 0;
  }

  span {
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
  }
`;


const OptionText = styled.span`
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};
`;


const CustomCheckbox = styled.input.attrs({ type: "checkbox" })`
  appearance: none;
  width: 10px;
  height: 10px;
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

function seedParamsFocusScore(focus: string | null): number {
  // Heatmap "pursue" focus → keep strong/excellent band as default
  if (focus === "pursue") return 78;
  return 78;
}
