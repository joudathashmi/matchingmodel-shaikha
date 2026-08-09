import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { getUserRoleRequest } from "../store/actions/getUserRoleActions";
import {
  selectUserRole,
  selectUserRoleLoading,
  selectUserRoles,
} from "../store/selectors/getUserRoleSelectors";
import { hasRole } from "../common/roles";
import RequireAuth from "./RequireAuth";

/** Requires auth + one of the allowed roles. */
export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <RoleGate roles={roles}>{children}</RoleGate>
    </RequireAuth>
  );
}

function RoleGate({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUserRole);
  const loading = useSelector(selectUserRoleLoading);
  const userRoles = useSelector(selectUserRoles);

  useEffect(() => {
    if (!user && !loading) {
      dispatch(getUserRoleRequest());
    }
  }, [dispatch, user, loading]);

  if (loading || !user) {
    return (
      <div style={{ padding: "2rem", color: "rgba(255,255,255,0.7)" }}>
        Checking access…
      </div>
    );
  }

  if (!hasRole(userRoles, roles)) {
    return <Navigate to="/portfolio" replace />;
  }

  return <>{children}</>;
}
