import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Email token reset is disabled until mail is integrated.
 * Send users to the admin-contact password help page instead.
 */
const ResetPasswordPage: React.FC = () => {
  return <Navigate to="/forgot-password" replace />;
};

export default ResetPasswordPage;
