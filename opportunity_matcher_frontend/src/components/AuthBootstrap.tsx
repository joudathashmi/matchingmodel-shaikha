import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { getUserRoleRequest } from "../store/actions/getUserRoleActions";
import {
  selectUserRole,
  selectUserRoleLoading,
} from "../store/selectors/getUserRoleSelectors";

/** Restore /users/me when a token exists so role gates work on first paint. */
export default function AuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUserRole);
  const loading = useSelector(selectUserRoleLoading);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user && !loading) {
      dispatch(getUserRoleRequest());
    }
  }, [dispatch, user, loading]);

  return null;
}
