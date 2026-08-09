import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import AppShell from "../../components/AppShell";
import GeneralSettings from "./GeneralSettings";
import RoleManagement from "./RoleManagement";
import UserManual from "./UserManual";
import ActiveDirectorySettings from "./ActiveDirectorySettings";
import {
  MatchingSettingsPanel,
  AlertsSettingsPanel,
  IntegrationsSettingsPanel,
  SecuritySettingsPanel,
  ExportSettingsPanel,
  LicensingSettingsPanel,
  AuditLogPanel,
} from "./SettingsFeaturePanels";

import generalIcon from "../../assets/Setting-&-Configuration-icons-svg/General.svg";
import aiMatchingIcon from "../../assets/Setting-&-Configuration-icons-svg/Ai Matching.svg";
import notificationIcon from "../../assets/Setting-&-Configuration-icons-svg/Notification.svg";
import integrationIcon from "../../assets/Setting-&-Configuration-icons-svg/Integration.svg";
import securityIcon from "../../assets/Setting-&-Configuration-icons-svg/Security.svg";
import teamManagementIcon from "../../assets/Setting-&-Configuration-icons-svg/Team Management.svg";
import billingIcon from "../../assets/Setting-&-Configuration-icons-svg/Billing.svg";
import backupExportIcon from "../../assets/Setting-&-Configuration-icons-svg/Backup & Export.svg";
import thumbsUpIcon from "../../assets/Setting-&-Configuration-icons-svg/Thumbsup.svg";
import typography from "../../common/typography";
import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { getUserRoleRequest } from "../../store/actions/getUserRoleActions";
import {
  selectUserRole,
  selectUserRoleLoading,
  selectUserRoleError,
  selectIsAdmin,
  selectRoleLabel,
} from "../../store/selectors/getUserRoleSelectors";
import { AppDispatch } from "../../store";

type SettingItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  adminOnly?: boolean;
  /** Navigate to a dedicated route instead of an inline panel */
  route?: string;
  /** Has an implemented panel */
  ready?: boolean;
};

const SETTINGS: SettingItem[] = [
  {
    id: "user-manual",
    title: "User guide",
    description: "Officer manual for matching, pursuit, analytics, and access",
    icon: generalIcon,
    ready: true,
  },
  {
    id: "general",
    title: "Preferences",
    description: "Language, display, and dashboard defaults",
    icon: generalIcon,
    ready: true,
  },
  {
    id: "ai-matching",
    title: "Matching",
    description: "Score thresholds and workbench display defaults",
    icon: aiMatchingIcon,
    ready: true,
  },
  {
    id: "notifications",
    title: "Alerts",
    description: "Email and in-app notices for new matches",
    icon: notificationIcon,
    ready: true,
  },
  {
    id: "integrations",
    title: "Data connections",
    description: "Company and opportunity data sources",
    icon: integrationIcon,
    ready: true,
  },
  {
    id: "security",
    title: "Access & security",
    description: "Sessions, password policy, and sign-in",
    icon: securityIcon,
    ready: true,
  },
  {
    id: "backup-export",
    title: "Export",
    description: "Download preferences and operational records",
    icon: backupExportIcon,
    ready: true,
  },
  {
    id: "billing",
    title: "Licensing",
    description: "Platform access and usage for your unit",
    icon: billingIcon,
    ready: true,
  },
  {
    id: "role-management",
    title: "Users & roles",
    description: "Add users and assign Officer, Reviewer, or Admin",
    icon: teamManagementIcon,
    adminOnly: true,
    ready: true,
  },
  {
    id: "active-directory",
    title: "Active Directory",
    description: "Prepare SSO / AD parameters for later enterprise sign-in",
    icon: securityIcon,
    adminOnly: true,
    ready: true,
  },
  {
    id: "match-agreement",
    title: "Match decisions",
    description: "Review Agree / Not-a-fit history across the team",
    icon: thumbsUpIcon,
    adminOnly: true,
    ready: true,
    route: "/matchAgreement",
  },
  {
    id: "audit-log",
    title: "Activity log",
    description: "Role changes and match decisions for accountability",
    icon: securityIcon,
    adminOnly: true,
    ready: true,
  },
];

const SystemSettings: React.FC = () => {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const user = useSelector(selectUserRole);
  const loading = useSelector(selectUserRoleLoading);
  const error = useSelector(selectUserRoleError);
  const isAdmin = useSelector(selectIsAdmin);
  const roleLabelText = useSelector(selectRoleLabel);

  useEffect(() => {
    dispatch(getUserRoleRequest());
  }, [dispatch]);

  const visibleSettings = useMemo(
    () => SETTINGS.filter((s) => !s.adminOnly || isAdmin),
    [isAdmin]
  );

  const active = visibleSettings.find((s) => s.id === activeSetting) || null;

  const handleSettingClick = (item: SettingItem) => {
    if (item.route) {
      navigate(item.route);
      return;
    }
    setActiveSetting(item.id);
  };

  if (loading) {
    return (
      <AppShell subLabel="Settings">
        <StatusText>Loading settings…</StatusText>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell subLabel="Settings">
        <StatusText>Could not load your account: {error}</StatusText>
      </AppShell>
    );
  }

  return (
    <AppShell subLabel="Settings">
        {!active ? (
          <>
            <PageHeader>
              <PageTitle>Settings</PageTitle>
              <PageSubtitle>
                Configure preferences for the investment matching platform
                {user ? ` · signed in as ${roleLabelText}` : ""}
              </PageSubtitle>
            </PageHeader>

            <SettingsGrid>
              {visibleSettings.map((setting) => (
                <SettingCard
                  key={setting.id}
                  type="button"
                  onClick={() => handleSettingClick(setting)}
                  data-tour={
                    setting.id === "role-management"
                      ? "settings-roles"
                      : setting.id === "general"
                        ? "settings-preferences"
                        : setting.id === "user-manual"
                          ? "settings-manual"
                          : undefined
                  }
                >
                  <CardTop>
                    <CardIcon>
                      <IconImg src={setting.icon} alt="" />
                    </CardIcon>
                    {setting.adminOnly && <AdminBadge>Admin</AdminBadge>}
                  </CardTop>
                  <CardTitle>{setting.title}</CardTitle>
                  <CardDesc>{setting.description}</CardDesc>
                </SettingCard>
              ))}
            </SettingsGrid>
          </>
        ) : (
          <>
            <BackButton type="button" onClick={() => setActiveSetting(null)}>
              ← Settings
            </BackButton>

            <PageHeader>
              <PageTitle>{active.title}</PageTitle>
              <PageSubtitle>{active.description}</PageSubtitle>
            </PageHeader>

            {active.id === "user-manual" && <UserManual />}
            {active.id === "general" && <GeneralSettings />}
            {active.id === "ai-matching" && <MatchingSettingsPanel />}
            {active.id === "notifications" && <AlertsSettingsPanel />}
            {active.id === "integrations" && <IntegrationsSettingsPanel />}
            {active.id === "security" && <SecuritySettingsPanel />}
            {active.id === "backup-export" && <ExportSettingsPanel />}
            {active.id === "billing" && <LicensingSettingsPanel />}
            {active.id === "role-management" && isAdmin && <RoleManagement />}
            {active.id === "active-directory" && isAdmin && (
              <ActiveDirectorySettings />
            )}
            {active.id === "audit-log" && isAdmin && <AuditLogPanel />}
            {!active.ready && (
              <ComingSoon>
                <ComingSoonTitle>{active.title}</ComingSoonTitle>
                <ComingSoonText>
                  This section is not configured yet. Titles and access are in
                  place; controls will be added next.
                </ComingSoonText>
              </ComingSoon>
            )}
          </>
        )}
    </AppShell>
  );
};

export default SystemSettings;

const StatusText = styled.div`
  color: var(--rhq-text-muted);
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
`;

const PageHeader = styled.div`
  margin-bottom: 1.75rem;
  max-width: 52rem;
`;

const PageTitle = styled.h1`
  margin: 0 0 0.4rem;
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  color: var(--rhq-text);
  letter-spacing: -0.01em;
  line-height: 1.2;
`;

const PageSubtitle = styled.p`
  margin: 0;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: var(--rhq-text-muted);
  line-height: 1.45;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  max-width: 1100px;
`;

const SettingCard = styled.button`
  appearance: none;
  text-align: left;
  background: var(--rhq-surface);
  border: 1px solid var(--rhq-border);
  border-radius: 12px;
  padding: 1.25rem 1.2rem 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  cursor: pointer;
  color: inherit;
  font-family: inherit;
  min-height: 168px;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: rgba(0, 255, 136, 0.06);
    border-color: rgba(0, 200, 140, 0.35);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.35rem;
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconImg = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
  pointer-events: none;
`;

const AdminBadge = styled.span`
  flex-shrink: 0;
  background: rgba(0, 255, 136, 0.12);
  color: #9ef0c8;
  border: 1px solid rgba(0, 200, 140, 0.35);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: var(--rhq-text);
  line-height: 1.3;
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: var(--rhq-text-muted);
  line-height: 1.4;
`;

const BackButton = styled.button`
  background: var(--rhq-surface);
  border: 1px solid var(--rhq-border);
  color: var(--rhq-text);
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 1.25rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};

  &:hover {
    border-color: rgba(0, 200, 140, 0.4);
    color: #9ef0c8;
  }
`;

const ComingSoon = styled.div`
  max-width: 40rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const ComingSoonTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: ${typography.smallTitle.fontSize};
  font-weight: ${typography.smallTitle.fontWeight};
  color: #ffffff;
`;

const ComingSoonText = styled.p`
  margin: 0;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.45;
`;
