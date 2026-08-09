import { useState, useRef, useEffect } from "react";
import styled, { css } from "styled-components";
import MainCard from "./Cards/MainCard";
import { ChevronDown, ChevronUp } from "lucide-react";

const MainContent = styled.div``;

const ResultsArea = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 700px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
`;

const ResultsContainer = styled.div`
  padding-top: 1rem;
  overflow-y: visible;
  height: auto;
  max-height: none;
  flex: unset;
`;

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 0.5rem 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ResultsCount = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  
  @media (min-width: 2560px) { 
    font-size: 1.3rem;
  }
`;

const SortOptions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

// Custom dropdown wrapper
const DropdownWrapper = styled.div`
  position: relative;
   

`;

const DropdownButton = styled.button`
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @media (min-width: 2560px) { 
    font-size: 1.3rem;
  padding: 1rem 1.3rem;

  }
`;

const DropdownMenu = styled.ul`
  position: absolute;
  top: 110%;
  left: 0;
  width: 100%;
  background: rgba(42, 51, 59, 1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  margin: 0;
  padding: 0.3rem 0;
  list-style: none;
  z-index: 10;
`;

const DropdownItem = styled.li`
  padding: 0.6rem 1rem;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  @media (min-width: 2560px) { 
    font-size: 1.3rem;
  }
`;

const OpportunityGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  padding: 1rem;
`;

interface DiscoveryDashboardProps {
  filters: any;
}

const DiscoveryDasboard: React.FC<DiscoveryDashboardProps> = ({ filters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Match Score (High to Low)");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <MainContent>
      <ResultsArea>
        <ResultsContainer>
          {/* <HeaderBar>
            <ResultsCount>
             
            </ResultsCount>

            <SortOptions>
              <label style={{fontSize:"1.3rem"}}>Sort by:</label>

              <DropdownWrapper ref={dropdownRef}>
                <DropdownButton onClick={() => setIsOpen(!isOpen)}>
                  {selected}
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </DropdownButton>

                {isOpen && (
                  <DropdownMenu>
                    {[
                      "Match Score (High to Low)",
                      "Deadline (Soonest First)",
                      "Investment Size (Largest First)",
                      "Recently Added",
                    ].map((option) => (
                      <DropdownItem
                        key={option}
                        onClick={() => {
                          setSelected(option);
                          setIsOpen(false);
                        }}
                      >
                        {option}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                )}
              </DropdownWrapper>
            </SortOptions>
          </HeaderBar> */}

          <OpportunityGrid>
            <MainCard filters={filters} />
          </OpportunityGrid>
        </ResultsContainer>
      </ResultsArea>
    </MainContent>
  );
};

export default DiscoveryDasboard;
