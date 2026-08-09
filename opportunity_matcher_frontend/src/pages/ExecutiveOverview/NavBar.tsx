import styled from "styled-components";
import { Link, useNavigate, useLocation } from "react-router-dom";
import settingsIcon from "../../assets/icons/settings-01.svg";
import opportunitiesIcon from "../../assets/icons/globe-02.svg";
import companyIcon from "../../assets/icons/analytics-02.svg";
import activeMatchesIcon from "../../assets/icons/target-02.svg";
import discoveryIcon from "../../assets/icons/search-01.svg";
import executiveIcon from "../../assets/icons/factory-02.svg";
import marketIcon from "../../assets/icons/analysis-text-link.svg";
import logoutIcon from "../../assets/icons/logout-05.svg";
import unBookMarkedIcon from "../../assets/Invest-opportunity-icons/bookmark-03.svg";
import { useDispatch, useSelector } from "react-redux";
import {
  logoutFailure,
  logoutRequest,
  logoutSuccess,
} from "../../store/actions/authLogoutActions";
import {
  selectLogoutLoading,
  selectLogoutMessage,
  selectLogoutError,
} from "../../store/selectors/authLogoutSelectors";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import typography from "../../common/typography";
import { AppDispatch } from "../../store";
import { getUserRoleRequest } from "../../store/actions/getUserRoleActions";
import {
  selectUserRole,
  selectRoleLabel,
} from "../../store/selectors/getUserRoleSelectors";

type NavEntry = {
  to: string;
  label: string;
  icon: string;
  active: boolean;
  tourId?: string;
  onClick?: () => void;
};

type MenuBarProps = {
  onNavigate?: () => void;
};

export default function MenuBar({ onNavigate }: MenuBarProps) {
  const location = useLocation();
  const path = location.pathname;
  const isActive = (p: string) => path === p || path.startsWith(p + "/");
  const isPortfolio =
    path === "/portfolio" ||
    path === "/executiveOverview";
  const isWorkbench =
    path === "/match-workbench" ||
    path === "/activeMatches" ||
    path.startsWith("/matches/");
  const isPursuit = path === "/pursuit";
  const isExplore = path === "/explore" || path === "/discoveryEngine";

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const loading = useSelector(selectLogoutLoading);
  const message = useSelector(selectLogoutMessage);
  const error = useSelector(selectLogoutError);
  const user = useSelector(selectUserRole);
  const roleLabelText = useSelector(selectRoleLabel);

  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "U";

  const handleLogout = () => {
    if (loading) return;
    setConfirmLogout(true);
  };

  const confirmLogOff = () => {
    setConfirmLogout(false);
    dispatch(logoutRequest());
  };

  useEffect(() => {
    if (localStorage.getItem("token") && !user) {
      dispatch(getUserRoleRequest());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!message && !error) return;
    // Reset logout banner state, then return to the sign-in screen.
    if (message) dispatch(logoutSuccess(""));
    if (error) dispatch(logoutFailure(""));
    navigate("/");
  }, [message, error, navigate, dispatch]);

  const primary: NavEntry[] = [
    {
      to: "/portfolio",
      label: "Matching overview",
      icon: executiveIcon,
      active: isPortfolio,
      tourId: "nav-portfolio",
    },
    {
      to: "/match-workbench",
      label: "Match Workbench",
      icon: activeMatchesIcon,
      active: isWorkbench,
      tourId: "nav-matches",
    },
    {
      to: "/pursuit",
      label: "Pursuit Pipeline",
      icon: marketIcon,
      active: isPursuit,
      tourId: "nav-pursuit",
    },
    {
      to: "/explore",
      label: "Discover opportunities",
      icon: discoveryIcon,
      active: isExplore,
      tourId: "nav-explore",
    },
  ];

  const catalogs: NavEntry[] = [
    {
      to: "/companyProfile",
      label: "Companies",
      icon: companyIcon,
      active: path === "/companyProfile",
      tourId: "nav-companies",
    },
    {
      to: "/investmentOpportunities",
      label: "Opportunities",
      icon: opportunitiesIcon,
      active: path === "/investmentOpportunities",
      tourId: "nav-opportunities",
    },
    {
      to: "/analytics",
      label: "Analytics",
      icon: marketIcon,
      active: path === "/analytics",
      tourId: "nav-analytics",
    },
    {
      to: "/bookMark",
      label: "Bookmarks",
      icon: unBookMarkedIcon,
      active: path === "/bookMark",
      tourId: "nav-bookmarks",
    },
  ];

  const system: NavEntry[] = [
    {
      to: "/systemSettings",
      label: "Settings",
      icon: settingsIcon,
      active: isActive("/systemSettings"),
      tourId: "nav-settings",
    },
  ];

  const renderItems = (items: NavEntry[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        $active={item.active}
        data-tour={item.tourId}
        onClick={() => onNavigate?.()}
      >
        <IconWell $active={item.active}>
          <NavIcon src={item.icon} alt="" $active={item.active} />
        </IconWell>
        <NavLabel>{item.label}</NavLabel>
      </NavLink>
    ));

  return (
    <Sidebar>
      <BrandBlock>
        <BrandMark aria-hidden>MISA</BrandMark>
        <BrandText>
          <BrandTitle>Investor Attraction</BrandTitle>
          <BrandSub>Officer desk</BrandSub>
        </BrandText>
      </BrandBlock>

      <SidebarContent>
        <NavSection>
          <SectionLabel>Workspace</SectionLabel>
          {renderItems(primary)}
        </NavSection>

        <NavSection>
          <SectionLabel>Catalogs</SectionLabel>
          {renderItems(catalogs)}
        </NavSection>

        <NavSection>
          <SectionLabel>System</SectionLabel>
          {renderItems(system)}
          <LogoutBtn type="button" onClick={handleLogout}>
            <IconWell>
              <NavIcon src={logoutIcon} alt="" />
            </IconWell>
            <NavLabel>{loading ? "Logging out…" : "Logout"}</NavLabel>
          </LogoutBtn>
        </NavSection>
      </SidebarContent>

      <SidebarFooter>
        <UserProfile>
          <UserAvatar>{initials}</UserAvatar>
          <UserInfoText>
            <UserName title={user?.email || displayName}>{displayName}</UserName>
            <UserRole>{roleLabelText}</UserRole>
          </UserInfoText>
        </UserProfile>
      </SidebarFooter>

      {confirmLogout &&
        createPortal(
          <ConfirmOverlay
            role="presentation"
            onClick={() => !loading && setConfirmLogout(false)}
          >
            <ConfirmCard
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirm-title"
              onClick={(e) => e.stopPropagation()}
            >
              <ConfirmTitle id="logout-confirm-title">
                Log off?
              </ConfirmTitle>
              <ConfirmBody>
                Are you sure you want to log off? You will need to sign in again
                to return to the desk.
              </ConfirmBody>
              <ConfirmActions>
                <ConfirmSecondary
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancel
                </ConfirmSecondary>
                <ConfirmPrimary
                  type="button"
                  disabled={loading}
                  onClick={confirmLogOff}
                >
                  {loading ? "Logging out…" : "Log off"}
                </ConfirmPrimary>
              </ConfirmActions>
            </ConfirmCard>
          </ConfirmOverlay>,
          document.body
        )}
    </Sidebar>
  );
}

const Sidebar = styled.aside`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--rhq-sidebar-bg);

  html[data-theme="dark"] & {
    background: linear-gradient(
      180deg,
      rgba(12, 16, 28, 0.98) 0%,
      rgba(8, 10, 18, 0.98) 100%
    );
  }
`;

const BrandBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.15rem 1rem 1rem;
  border-bottom: 1px solid var(--rhq-border);
`;

const BrandMark = styled.div`
  flex-shrink: 0;
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--rhq-text);
  background: var(--rhq-surface);
  border: 1px solid var(--rhq-border);
`;

const BrandText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const BrandTitle = styled.div`
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--rhq-text);
  line-height: 1.25;
  letter-spacing: -0.01em;
`;

const BrandSub = styled.div`
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--rhq-text-muted);
  line-height: 1.2;
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.7rem 1.25rem;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 4px;
  }
`;

const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 1.35rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--rhq-text-muted);
  padding: 0 0.55rem 0.45rem;
  letter-spacing: 0.02em;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.55rem;
  border-radius: 10px;
  text-decoration: none;
  font-size: ${typography.Value.fontSize};
  font-weight: 500;
  color: ${(p) =>
    p.$active ? "var(--rhq-text)" : "var(--rhq-text-muted)"};
  background: ${(p) =>
    p.$active ? "rgba(0, 255, 136, 0.1)" : "transparent"};
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    color: var(--rhq-text);
    background: ${(p) =>
      p.$active ? "rgba(0, 255, 136, 0.12)" : "var(--rhq-surface)"};
  }

`;

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.55rem;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: ${typography.Value.fontSize};
  font-weight: 500;
  color: var(--rhq-text-muted);
  text-align: left;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    color: var(--rhq-text);
    background: var(--rhq-surface);
  }
`;

const IconWell = styled.span<{ $active?: boolean }>`
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: ${(p) =>
    p.$active ? "rgba(0, 255, 136, 0.12)" : "rgba(255, 255, 255, 0.04)"};
  border: 1px solid
    ${(p) =>
      p.$active ? "rgba(0, 200, 140, 0.28)" : "rgba(255, 255, 255, 0.06)"};
`;

const NavIcon = styled.img<{ $active?: boolean }>`
  width: 15px;
  height: 15px;
  opacity: ${(p) => (p.$active ? 1 : 0.72)};
  filter: ${(p) =>
    p.$active
      ? "brightness(0) saturate(100%) invert(82%) sepia(42%) saturate(459%) hue-rotate(93deg) brightness(101%) contrast(92%)"
      : "none"};
`;

const NavLabel = styled.span`
  font-size: inherit;
  font-weight: inherit;
  line-height: 1.2;
`;

const SidebarFooter = styled.div`
  padding: 0.85rem 0.85rem 1rem;
  border-top: 1px solid var(--rhq-border);
  background: var(--rhq-surface);
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.6rem;
  border-radius: 12px;
  background: var(--rhq-surface);
  border: 1px solid var(--rhq-border);
`;

const UserAvatar = styled.div`
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 6px;
  background: var(--rhq-surface);
  border: 1px solid var(--rhq-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--rhq-text);
  font-size: 0.72rem;
  flex-shrink: 0;
`;

const UserInfoText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.1rem;
`;

const UserName = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--rhq-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(158, 240, 200, 0.75);
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(6, 8, 14, 0.72);
  backdrop-filter: blur(6px);
`;

const ConfirmCard = styled.div`
  width: min(400px, 100%);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(22, 26, 40, 0.98);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
  padding: 1.35rem 1.35rem 1.2rem;
`;

const ConfirmTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.95);
`;

const ConfirmBody = styled.p`
  margin: 0.55rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.62);
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
`;

const ConfirmSecondary = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  border-radius: 8px;
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const ConfirmPrimary = styled.button`
  border: 1px solid rgba(0, 200, 140, 0.45);
  background: rgba(0, 255, 136, 0.12);
  color: #9ef0c8;
  border-radius: 8px;
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 650;
  font-family: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(0, 255, 136, 0.18);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;
