// routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/Login/LoginPage";
import SignupPage from './pages/SignUp/SignupPage';
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
import RequireRole from "./components/RequireRole";
import { ROLES } from "./common/roles";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* IPA spine - any logged-in role */}
      <Route path="/portfolio" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/match-workbench" element={<RequireAuth><MatchesDashboard /></RequireAuth>} />
      <Route path="/matches/:id" element={<RequireAuth><MatchCaseWorkspace /></RequireAuth>} />
      <Route path="/pursuit" element={<RequireAuth><PursuitPipeline /></RequireAuth>} />
      <Route path="/explore" element={<RequireAuth><DiscoveryEngine /></RequireAuth>} />

      {/* Legacy redirects */}
      <Route path="/executiveOverview" element={<Navigate to="/portfolio" replace />} />
      <Route path="/activeMatches" element={<Navigate to="/match-workbench" replace />} />
      <Route path="/discoveryEngine" element={<Navigate to="/explore" replace />} />

      <Route path="/systemSettings" element={<RequireAuth><SystemSettings /></RequireAuth>} />
      <Route path="/companyProfile" element={<RequireAuth><CompanyProfile /></RequireAuth>} />
      <Route path="/investmentOpportunities" element={<RequireAuth><InvestmentOpportunities /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
      <Route path="/bookMark" element={<RequireAuth><BookMark /></RequireAuth>} />
      <Route
        path="/matchAgreement"
        element={
          <RequireRole roles={[ROLES.ADMIN]}>
            <MatchAgreement />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
