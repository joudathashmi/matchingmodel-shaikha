import {
  GET_USER_ROLE_REQUEST,
  GET_USER_ROLE_SUCCESS,
  GET_USER_ROLE_FAILURE,
  User,
} from "../types/getUserRoleTypes";

export const getUserRoleRequest = () => ({
  type: GET_USER_ROLE_REQUEST,
});

export const getUserRoleSuccess = (user: User) => ({
  type: GET_USER_ROLE_SUCCESS,
  payload: user,
});

export const getUserRoleFailure = (error: string) => ({
  type: GET_USER_ROLE_FAILURE,
  payload: error,
});