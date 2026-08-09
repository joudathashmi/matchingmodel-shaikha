import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectMustChangePassword } from "../store/selectors/authSelectors";

/**
 * Blocks the rest of the app until a forced first-login password change is done.
 */
export default function RequirePasswordOk({
  children,
}: {
  children: React.ReactNode;
}) {
  const mustChange = useSelector(selectMustChangePassword);
  const location = useLocation();

  if (mustChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}
