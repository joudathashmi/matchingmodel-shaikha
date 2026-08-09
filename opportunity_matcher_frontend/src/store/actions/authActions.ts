import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  CLEAR_ERROR,
  User
} from "../types/authTypes";

export const loginRequest = (email: string, password: string) => ({
  type: LOGIN_REQUEST,
  payload: { email, password }
});

export const loginSuccess = (user: User, token: string) => ({
  type: LOGIN_SUCCESS,
  payload: { user, token }
});

export const loginFailure = (error: string) => ({
  type: LOGIN_FAILURE,
  payload: error
});

export const logout = () => ({
  type: LOGOUT
});

export const clearError = () => ({
  type: CLEAR_ERROR
});