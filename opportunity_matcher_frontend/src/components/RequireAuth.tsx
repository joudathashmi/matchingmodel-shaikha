import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { getUserRoleRequest } from "../store/actions/getUserRoleActions";
import {
  selectUserRole,
  selectUserRoleLoading,
} from "../store/selectors/getUserRoleSelectors";

function hasToken(): boolean {
  return Boolean(localStorage.getItem("token"));
}

/** Requires a logged-in session; loads /users/me once. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const user = useSelector(selectUserRole);
  const loading = useSelector(selectUserRoleLoading);

  useEffect(() => {
    if (hasToken() && !user && !loading) {
      dispatch(getUserRoleRequest());
    }
  }, [dispatch, user, loading]);

  if (!hasToken()) {
    return (
      <Navigate to="/" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
