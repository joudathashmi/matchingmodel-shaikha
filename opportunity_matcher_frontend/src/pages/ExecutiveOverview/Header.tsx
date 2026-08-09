import styled, { keyframes } from "styled-components";
import inpIcon from "../../assets/icons/search-01.svg";
import logoImg from "../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { fetchSearchRequest } from "../../store/actions/searchActions";
import {
  selectSearchResults,
  selectSearchLoading,
} from "../../store/selectors/searchSelectors";
import { AppDispatch } from "../../store";

import CompanyDetailPopup from "../CompanyProfile/Cards/CompanyDetailPopup";
import OpportunitiesDetailPopup from "../InvestmentOpportunities/Card/CardPopup";
import { getOpportunityDetailsRequest } from "../../store/actions/opportunityDetailsActions";
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading,
} from "../../store/selectors/opportunityDetailsSelectors";
import {
  selectCompanyDetails,
  selectCompanyDetailsError,
  selectCompanyDetailsLoading,
} from "../../store/selectors/getCompanyDetailsSelectors";
import {
  clearCompanyDetails,
  getCompanyDetailsRequest,
} from "../../store/actions/getCompanyDetailsActions";
import typography from "../../common/typography";

interface HeaderProps {
  subLabel: string;
  onMenuClick?: () => void;
}

interface SearchResult {
  id: number;
  type: string;
  name: string;
  extra: string;
}

const Header: React.FC<HeaderProps> = ({ subLabel, onMenuClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const results = useSelector(selectSearchResults);
  const loading = useSelector(selectSearchLoading);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [showCompanyPopup, setShowCompanyPopup] = useState(false);
  const [showOpportunityPopup, setShowOpportunityPopup] = useState(false);

  const companyDetails = useSelector(selectCompanyDetails);
  const companyLoading = useSelector(selectCompanyDetailsLoading);
  const companyError = useSelector(selectCompanyDetailsError);
  const opportunityDetails = useSelector(selectOpportunityDetails);
  const opportunityLoading = useSelector(selectOpportunityDetailsLoading);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (value.trim().length > 0) {
      setShowDropdown(true);
      searchTimer.current = setTimeout(() => {
        dispatch(fetchSearchRequest(value.trim()));
      }, 220);
    } else {
      setShowDropdown(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setShowDropdown(false);
    setSelectedItem(null);
    setShowCompanyPopup(false);
    setShowOpportunityPopup(false);
    dispatch(clearCompanyDetails());
  };

  const handleItemClick = (item: SearchResult) => {
    setSelectedItem(item);
    setQuery(item.name);
    setShowDropdown(false);

    if (item.type === "company") {
      dispatch(getCompanyDetailsRequest(item.id));
      setShowCompanyPopup(true);
      setShowOpportunityPopup(false);
    } else if (item.type === "opportunity") {
      dispatch(getOpportunityDetailsRequest(item.id));
      setShowOpportunityPopup(true);
      setShowCompanyPopup(false);
    }
  };

  const closePopup = () => {
    setShowCompanyPopup(false);
    setShowOpportunityPopup(false);
    setSelectedItem(null);
    dispatch(clearCompanyDetails());
  };

  const handleCompanyClick = (_company: any) => {};
  const handleAiDecisionFilter = (_aiDecision: string) => {};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        if (query) setShowDropdown(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query]);

  const capitalizeFirst = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      <HeaderBar>
        <LeftCluster>
          {onMenuClick ? (
            <MenuButton type="button" onClick={onMenuClick} aria-label="Open navigation menu">
              <MenuBars aria-hidden>
                <span />
                <span />
                <span />
              </MenuBars>
            </MenuButton>
          ) : null}
          <LogoIcon src={logoImg} alt="Ministry of Investment" />
          {subLabel ? (
            <ContextChip>
              <LiveDot />
              <span>{subLabel}</span>
            </ContextChip>
          ) : null}
        </LeftCluster>

        <SearchShell ref={containerRef}>
          <SearchField>
            <SearchIcon src={inpIcon} alt="" />
            <SearchInput
              ref={inputRef}
              placeholder="Search companies, opportunities, sectors…"
              value={query}
              onChange={handleChange}
              onFocus={() => {
                if (query) setShowDropdown(true);
              }}
            />
            {query ? (
              <ClearBtn type="button" onClick={clearSearch} aria-label="Clear search">
                ×
              </ClearBtn>
            ) : (
              <KbdHint>⌘K</KbdHint>
            )}
          </SearchField>

          {showDropdown && (
            <Dropdown>
              {loading && <DropdownItem $muted>Scanning registry…</DropdownItem>}
              {!loading && results.length === 0 && (
                <DropdownItem $muted>No matches found</DropdownItem>
              )}
              {!loading &&
                results.length > 0 &&
                results.map((r: SearchResult) => (
                  <DropdownItem
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleItemClick(r)}
                  >
                    <TypePill>{capitalizeFirst(r.type)}</TypePill>
                    <ResultText>
                      <ResultName>{r.name}</ResultName>
                      {r.extra ? <ResultMeta>{r.extra}</ResultMeta> : null}
                    </ResultText>
                  </DropdownItem>
                ))}
            </Dropdown>
          )}
        </SearchShell>
      </HeaderBar>

      {showCompanyPopup && selectedItem && (
        <CompanyDetailPopup
          companyId={selectedItem.id}
          onCompanyClick={handleCompanyClick}
          companyDetails={companyDetails as any}
          loading={companyLoading as boolean}
          error={companyError as string | null}
          onClose={closePopup}
        />
      )}

      {showOpportunityPopup && selectedItem && (
        <OpportunitiesDetailPopup
          investment={{
            id: selectedItem.id,
            opportunityName: selectedItem.name,
            opportunitySector: selectedItem.extra || "",
            opportunityUrl: "",
            avgSectorSimilarity: 0,
            avgProfileSimilarity: 0,
            avgProductSimilarity: 0,
            avgAiScore: 0,
            avgFinalScore: 0,
            totalCompaniesMatched: 0,
            isBookmarked: false,
            investmentRange: "",
            jobsCreated: "",
            keyDemandDrivers: "",
            gdpImpact: "",
            investmentAppeal: "",
            economicImpact: "",
            marketReadiness: "",
            valueProposition: "",
          }}
          onClose={closePopup}
          detailedData={opportunityDetails as any}
          loading={opportunityLoading as boolean}
          error={""}
          onOpportunityClick={handleAiDecisionFilter}
        />
      )}
    </>
  );
};

export default Header;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.85); }
`;

const HeaderBar = styled.header`
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 0.85rem 1.5rem;
  background: linear-gradient(
    180deg,
    rgba(14, 18, 32, 0.92) 0%,
    rgba(10, 12, 22, 0.88) 100%
  );
  backdrop-filter: blur(22px) saturate(1.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(0, 255, 136, 0.45) 35%,
      rgba(0, 180, 216, 0.45) 65%,
      transparent 100%
    );
    opacity: 0.7;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    padding: 0.85rem 1rem;
  }
`;

const LeftCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

const MenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;

  @media (max-width: 900px) {
    display: inline-flex;
  }
`;

const MenuBars = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 16px;

  span {
    display: block;
    height: 2px;
    width: 100%;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.9);
  }
`;

const LogoIcon = styled.img`
  height: 42px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(0, 255, 136, 0.12));

  @media (max-width: 768px) {
    height: 34px;
  }
`;

const ContextChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: 280px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(0, 255, 136, 0.06);
  border: 1px solid rgba(0, 200, 140, 0.22);
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 1100px) {
    display: none;
  }
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.7);
  animation: ${pulse} 1.8s ease-in-out infinite;
  flex-shrink: 0;
`;

const SearchShell = styled.div`
  position: relative;
  width: min(560px, 100%);
  flex-shrink: 0;
  z-index: 50;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:focus-within {
    background: rgba(0, 255, 136, 0.05);
    border-color: rgba(0, 200, 140, 0.45);
    box-shadow:
      0 0 0 3px rgba(0, 255, 136, 0.08),
      0 8px 28px rgba(0, 180, 216, 0.12);
  }
`;

const SearchInput = styled.input.attrs({ type: "text" })`
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #ffffff;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: 500;
  padding: 0.75rem 2.75rem 0.75rem 2.75rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.38);
    font-weight: 400;
  }
`;

const SearchIcon = styled.img`
  position: absolute;
  left: 0.9rem;
  width: 16px;
  height: 16px;
  opacity: 0.65;
  pointer-events: none;
`;

const ClearBtn = styled.button`
  position: absolute;
  right: 0.55rem;
  width: 1.6rem;
  height: 1.6rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;

  &:hover {
    background: rgba(0, 255, 136, 0.2);
    color: #9ef0c8;
  }
`;

const KbdHint = styled.span`
  position: absolute;
  right: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  pointer-events: none;

  @media (max-width: 720px) {
    display: none;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 0;
  right: 0;
  background: rgba(14, 18, 32, 0.96);
  backdrop-filter: blur(18px);
  color: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 200, 140, 0.2);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.03);
  max-height: 320px;
  overflow-y: auto;
  z-index: 12000;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
`;

const DropdownItem = styled.div<{ $muted?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: ${(p) => (p.$muted ? "default" : "pointer")};
  color: ${(p) =>
    p.$muted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)"};
  transition: background 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(p) =>
      p.$muted ? "transparent" : "rgba(0, 255, 136, 0.08)"};
  }
`;

const TypePill = styled.span`
  flex-shrink: 0;
  margin-top: 0.1rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #9ef0c8;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 200, 140, 0.25);
`;

const ResultText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const ResultName = styled.div`
  font-size: ${typography.Value.fontSize};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.3;
`;

const ResultMeta = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
