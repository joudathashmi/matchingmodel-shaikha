// routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import Dashboard from "./pages/ExecutiveOverview/ExecutiveOverview";
import MatchesDashboard from "./pages/ActiveMatches/ActiveMatches";
import DiscoveryEngine from "./pages/DiscoveryEngine/DiscoveryEngine";
import SystemSettings from "./pages/SystemSettings/SystemSettings";
import CompanyProfile from "./pages/CompanyProfile/CompanyProfile";
import InvestmentOpportunities from "./pages/InvestmentOpportunities/InvestmentOpportunities";
import Analytics from "./pages/Analytics/Analytics";
import BookMark from "./pages/BookMark/BookMark";
import MatchAgreement from "./pages/SystemSettings/MatchAgreement";
import MatchCaseWorkspace from "./pages/MatchCase/MatchCaseWorkspace";
import PursuitPipeline from "./pages/Pursuit/PursuitPipeline";
import RequireAuth from "./components/RequireAuth";
import RequirePasswordOk from "./components/RequirePasswordOk";
import RequireRole from "./components/RequireRole";
import { ROLES } from "./common/roles";

const withGate = (node: React.ReactNode) => (
  <RequireAuth>
    <RequirePasswordOk>{node}</RequirePasswordOk>
  </RequireAuth>
);

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/change-password"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />
      <Route path="/signup" element={<Navigate to="/" replace />} />

      <Route path="/portfolio" element={withGate(<Dashboard />)} />
      <Route path="/match-workbench" element={withGate(<MatchesDashboard />)} />
      <Route path="/matches/:id" element={withGate(<MatchCaseWorkspace />)} />
      <Route path="/pursuit" element={withGate(<PursuitPipeline />)} />
      <Route path="/explore" element={withGate(<DiscoveryEngine />)} />

      <Route path="/executiveOverview" element={<Navigate to="/portfolio" replace />} />
      <Route path="/activeMatches" element={<Navigate to="/match-workbench" replace />} />
      <Route path="/discoveryEngine" element={<Navigate to="/explore" replace />} />

      <Route path="/systemSettings" element={withGate(<SystemSettings />)} />
      <Route path="/companyProfile" element={withGate(<CompanyProfile />)} />
      <Route
        path="/investmentOpportunities"
        element={withGate(<InvestmentOpportunities />)}
      />
      <Route path="/analytics" element={withGate(<Analytics />)} />
      <Route path="/bookMark" element={withGate(<BookMark />)} />
      <Route
        path="/matchAgreement"
        element={
          <RequireRole roles={[ROLES.ADMIN]}>
            <RequirePasswordOk>
              <MatchAgreement />
            </RequirePasswordOk>
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
