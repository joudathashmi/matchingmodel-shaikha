import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import Header from "../pages/ExecutiveOverview/Header";
import NavBar from "../pages/ExecutiveOverview/NavBar";

type AppShellProps = {
  children: React.ReactNode;
  subLabel?: string;
  /** Optional band between header and main content (e.g. Explore filters) */
  filterSlot?: React.ReactNode;
};

/**
 * Shared authenticated page chrome: sticky header, collapsible sidebar, scrollable content.
 * Mobile (<=900px): sidebar becomes an off-canvas drawer opened from the header menu.
 */
const AppShell: React.FC<AppShellProps> = ({
  children,
  subLabel = "",
  filterSlot,
}) => {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <Shell $hasFilter={Boolean(filterSlot)}>
      <HeaderWrapper>
        <Header
          subLabel={subLabel}
          onMenuClick={() => setNavOpen(true)}
        />
      </HeaderWrapper>

      <Backdrop
        $open={navOpen}
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />

      <Sidebar $open={navOpen} aria-label="Main navigation">
        <MobileDrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
          <CloseBtn type="button" onClick={() => setNavOpen(false)} aria-label="Close menu">
            ✕
          </CloseBtn>
        </MobileDrawerHeader>
        <NavBar onNavigate={() => setNavOpen(false)} />
      </Sidebar>

      {filterSlot ? <FilterBand>{filterSlot}</FilterBand> : null}

      <Content $hasFilter={Boolean(filterSlot)}>{children}</Content>
    </Shell>
  );
};

export default AppShell;

const MOBILE = "900px";

const Shell = styled.div<{ $hasFilter?: boolean }>`
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  grid-template-rows: ${({ $hasFilter }) =>
    $hasFilter ? "auto auto minmax(0, 1fr)" : "auto minmax(0, 1fr)"};
  height: 100vh;
  height: 100dvh;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  box-sizing: border-box;

  @media (min-width: 2560px) {
    grid-template-columns: 320px minmax(0, 1fr);
  }

  @media (max-width: 1440px) {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  @media (max-width: 1100px) {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  @media (max-width: ${MOBILE}) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: ${({ $hasFilter }) =>
      $hasFilter ? "auto auto minmax(0, 1fr)" : "auto minmax(0, 1fr)"};
  }
`;

const HeaderWrapper = styled.div`
  grid-column: 1 / -1;
  grid-row: 1;
  position: sticky;
  top: 0;
  z-index: 200;
  min-width: 0;
  overflow: visible;
`;

const Backdrop = styled.button<{ $open: boolean }>`
  display: none;

  @media (max-width: ${MOBILE}) {
    display: ${({ $open }) => ($open ? "block" : "none")};
    position: fixed;
    inset: 0;
    border: none;
    padding: 0;
    margin: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 45;
    cursor: pointer;
  }
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  grid-column: 1;
  grid-row: 2 / -1;
  background: var(--rhq-sidebar-bg);
  border-right: 1px solid var(--rhq-border);
  overflow: hidden;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  z-index: 50;

  @media (max-width: ${MOBILE}) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(300px, 86vw);
    grid-column: unset;
    grid-row: unset;
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 12px 0 40px rgba(0, 0, 0, 0.45);
    transform: translateX(${({ $open }) => ($open ? "0" : "-105%")});
    transition: transform 0.22s ease;
  }
`;

const MobileDrawerHeader = styled.div`
  display: none;

  @media (max-width: ${MOBILE}) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(8, 10, 18, 0.98);
  }
`;

const DrawerTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const CloseBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
`;

const FilterBand = styled.div`
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem 0.75rem 0;
  overflow: visible;

  @media (max-width: ${MOBILE}) {
    grid-column: 1;
    grid-row: 2;
    padding: 0.35rem 0.5rem 0;
  }
`;

const Content = styled.main<{ $hasFilter?: boolean }>`
  grid-column: 2;
  grid-row: ${({ $hasFilter }) => ($hasFilter ? 3 : "2 / -1")};
  overflow-x: hidden;
  overflow-y: auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem clamp(0.4rem, 1.2vw, 0.85rem) 1rem;

  @media (max-width: ${MOBILE}) {
    grid-column: 1;
    grid-row: ${({ $hasFilter }) => ($hasFilter ? 3 : "2 / -1")};
    padding: 0.35rem 0.5rem 1.25rem;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ace7ff;
    border-radius: 10px;
  }
`;
