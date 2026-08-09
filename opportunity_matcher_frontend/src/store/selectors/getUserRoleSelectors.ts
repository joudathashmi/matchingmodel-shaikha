import { RootState } from "../rootReducer";
import { hasRole, primaryRole, roleLabel, ROLES } from "../../common/roles";

export const selectUserRole = (state: RootState) => state.userRole.user;
export const selectUserRoleLoading = (state: RootState) => state.userRole.loading;
export const selectUserRoleError = (state: RootState) => state.userRole.error;
export const selectUserRoles = (state: RootState) => state.userRole.user?.roles || [];

export const selectPrimaryRole = (state: RootState) =>
  primaryRole(state.userRole.user?.roles);

export const selectRoleLabel = (state: RootState) =>
  roleLabel(state.userRole.user?.roles);

export const selectIsAdmin = (state: RootState) =>
  hasRole(state.userRole.user?.roles, [ROLES.ADMIN]);

export const selectIsReviewer = (state: RootState) =>
  hasRole(state.userRole.user?.roles, [ROLES.REVIEWER, ROLES.ADMIN]);

export const selectCanManageUsers = (state: RootState) =>
  hasRole(state.userRole.user?.roles, [ROLES.ADMIN]);

export const selectCanViewTeamPursuits = (state: RootState) =>
  hasRole(state.userRole.user?.roles, [ROLES.REVIEWER, ROLES.ADMIN]);
