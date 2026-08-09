// Action Types
export const GET_USER_ROLE_REQUEST = "GET_USER_ROLE_REQUEST";
export const GET_USER_ROLE_SUCCESS = "GET_USER_ROLE_SUCCESS";
export const GET_USER_ROLE_FAILURE = "GET_USER_ROLE_FAILURE";

// User Data Interface
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface UserResponse {
  user: User;
}

// State Interface
export interface UserRoleState {
  loading: boolean;
  user: User | null;
  error: string | null;
}

// Action Interfaces
export interface GetUserRoleRequestAction {
  type: typeof GET_USER_ROLE_REQUEST;
}

export interface GetUserRoleSuccessAction {
  type: typeof GET_USER_ROLE_SUCCESS;
  payload: User;
}

export interface GetUserRoleFailureAction {
  type: typeof GET_USER_ROLE_FAILURE;
  payload: string;
}

export type UserRoleActionTypes =
  | GetUserRoleRequestAction
  | GetUserRoleSuccessAction
  | GetUserRoleFailureAction;